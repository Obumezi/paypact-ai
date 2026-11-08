require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const {
  getPayPalAccessToken,
  createAndSendEscrowInvoice,
  fundOrCheckEscrowInvoice,
  releaseEscrowPayout,
  remindEscrowInvoice,
} = require('./paypal');
const {
  processNegotiationTurn,
  verifyDeliverable,
  generateFriendlyNudge,
  interpretGridCommand,
} = require('./agent');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory store for escrow deals
const deals = {};

// Stage 1 Route: Verify PayPal Sandbox OAuth Connection & OpenAI Key Presence
app.get('/api/health/paypal', async (req, res) => {
  try {
    const tokenData = await getPayPalAccessToken();
    res.json({
      status: 'success',
      message: 'Connected to PayPal Sandbox successfully!',
      ai_provider: 'OpenAI',
      openai_key_configured: Boolean(process.env.OPENAI_API_KEY),
      scope: tokenData.scope,
      app_id: tokenData.app_id,
      expires_in: tokenData.expires_in,
    });
  } catch (error) {
    console.error('PayPal Auth Error:', error.response?.data || error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to authenticate with PayPal Sandbox',
      details: error.response?.data || error.message,
    });
  }
});

// Stage 2 Route: AI Negotiation + Auto-Escrow Invoicing
app.post('/api/negotiate', async (req, res) => {
  try {
    const { dealId = 'deal-1', sender, text } = req.body;

    if (!sender || !text) {
      return res.status(400).json({
        status: 'error',
        message: 'Both "sender" and "text" are required in the request body.',
      });
    }

    if (!deals[dealId]) {
      deals[dealId] = {
        dealId,
        status: 'NEGOTIATING',
        messages: [],
        contract_terms: null,
        invoice: null,
        verification: null,
        payout: null,
      };
    }

    const deal = deals[dealId];
    deal.messages.push({ sender, text, timestamp: new Date().toISOString() });

    // 1. Run OpenAI Negotiation Engine
    const aiDecision = await processNegotiationTurn(deal.messages);
    deal.contract_terms = aiDecision.contract_terms;

    // 2. Append AI Mediator response to chat transcript
    deal.messages.push({
      sender: 'PayPact AI',
      text: aiDecision.agent_reply,
      timestamp: new Date().toISOString(),
    });

    // 3. When agreement is reached, automatically create & send the PayPal Sandbox Invoice
    if (aiDecision.agreement_reached && !deal.invoice) {
      const invoiceData = await createAndSendEscrowInvoice(aiDecision.contract_terms);
      deal.invoice = invoiceData;
      deal.status = 'ESCROW_INVOICED';
    }

    res.json({
      status: 'success',
      deal,
      ai_decision: aiDecision,
    });
  } catch (error) {
    console.error('Negotiation/Invoice Error:', error.response?.data || error.message);
    res.status(500).json({
      status: 'error',
      message: error.message,
      paypal_details: error.response?.data || null,
    });
  }
});

// Stage 3A Route: Verify or Simulate Client Funding the PayPal Escrow Invoice
app.post('/api/deals/:dealId/fund', async (req, res) => {
  try {
    const deal = deals[req.params.dealId];
    if (!deal || !deal.invoice) {
      return res.status(404).json({
        status: 'error',
        message: 'Deal or Escrow Invoice not found. Negotiate and lock terms first.',
      });
    }

    const paymentStatus = await fundOrCheckEscrowInvoice(
      deal.invoice.invoice_id,
      deal.contract_terms.agreed_amount_usd
    );

    deal.invoice.status = paymentStatus.status;
    deal.invoice.payment_id = paymentStatus.payment_id;
    deal.status = 'ESCROW_FUNDED';

    deal.messages.push({
      sender: 'PayPact AI',
      text: `✅ Escrow Invoice ${deal.invoice.invoice_number} ($${deal.contract_terms.agreed_amount_usd} USD) is now PAID and locked in escrow! Freelancer may now submit their deliverable for AI verification.`,
      timestamp: new Date().toISOString(),
    });

    res.json({
      status: 'success',
      message: 'Escrow funded and confirmed via PayPal Invoicing API!',
      deal,
    });
  } catch (error) {
    console.error('Escrow Funding Error:', error.response?.data || error.message);
    res.status(500).json({
      status: 'error',
      message: error.message,
      paypal_details: error.response?.data || null,
    });
  }
});

// Stage 3B Route: AI Deliverable Audit + Automatic PayPal Payout Release
app.post('/api/deals/:dealId/verify-and-payout', async (req, res) => {
  try {
    const deal = deals[req.params.dealId];
    if (!deal || !deal.contract_terms) {
      return res.status(404).json({
        status: 'error',
        message: 'Active deal not found.',
      });
    }

    if (deal.payout) {
      return res.status(400).json({
        status: 'error',
        message: 'Payout has already been released for this deal.',
        deal,
      });
    }

    const { github_url, proof_text } = req.body;

    // 1. Run OpenAI Deliverable Auditor
    const auditResult = await verifyDeliverable(deal.contract_terms, {
      github_url,
      proof_text,
    });

    deal.verification = {
      ...auditResult,
      github_url: github_url || null,
      timestamp: new Date().toISOString(),
    };

    // If verification fails, keep funds in escrow and explain why
    if (!auditResult.verified) {
      deal.status = 'DELIVERABLE_CHANGES_REQUESTED';
      deal.messages.push({
        sender: 'PayPact AI',
        text: `⚠️ Deliverable Audit Failed (${auditResult.confidence_score}% confidence): ${auditResult.audit_summary}. Funds remain safely locked in escrow.`,
        timestamp: new Date().toISOString(),
      });

      return res.json({
        status: 'verification_failed',
        message: 'Deliverable did not pass AI verification. Payout held.',
        audit: auditResult,
        deal,
      });
    }

    // 2. Deliverable Verified! Trigger PayPal Payouts v1 API
    const payoutData = await releaseEscrowPayout(deal.dealId, deal.contract_terms);
    deal.payout = payoutData;
    deal.status = 'PAYOUT_RELEASED';

    deal.messages.push({
      sender: 'PayPact AI',
      text: `🎉 Deliverable Verified (${auditResult.confidence_score}% confidence)! Released $${payoutData.amount_usd} USD to ${payoutData.receiver_email} via PayPal Payouts (Batch ID: ${payoutData.payout_batch_id}).`,
      timestamp: new Date().toISOString(),
    });

    res.json({
      status: 'success',
      message: 'Deliverable verified by AI and PayPal Payout dispatched!',
      audit: auditResult,
      payout: payoutData,
      deal,
    });
  } catch (error) {
    console.error('Verification/Payout Error:', error.response?.data || error.message);
    res.status(500).json({
      status: 'error',
      message: error.message,
      paypal_details: error.response?.data || null,
    });
  }
});

// Get all deals or a single deal
app.get('/api/deals', (req, res) => {
  res.json({ status: 'success', deals: Object.values(deals) });
});

app.get('/api/deals/:dealId', (req, res) => {
  const deal = deals[req.params.dealId];
  if (!deal) {
    return res.status(404).json({ status: 'error', message: 'Deal not found' });
  }
  res.json({ status: 'success', deal });
});

// AG Grid Prize Feature 1: Nudge-Bot (Friendly Unpaid Invoice Reminder + PayPal Remind API)
app.post('/api/deals/:dealId/nudge', async (req, res) => {
  try {
    const deal = deals[req.params.dealId];
    if (!deal || !deal.invoice) {
      return res.status(404).json({ status: 'error', message: 'Deal or Invoice not found.' });
    }

    const friendlyMessage = await generateFriendlyNudge(deal.contract_terms, deal.invoice);

    // Trigger PayPal Invoicing v2 /remind endpoint (non-blocking fallback if sandbox throttles)
    let paypalRemindDispatched = false;
    try {
      await remindEscrowInvoice(
        deal.invoice.invoice_id,
        `Friendly heads-up: ${deal.contract_terms.project_title} Escrow`,
        friendlyMessage
      );
      paypalRemindDispatched = true;
    } catch (remindErr) {
      console.warn('PayPal /remind sandbox note:', remindErr.response?.data || remindErr.message);
    }

    deal.nudge_count = (deal.nudge_count || 0) + 1;
    deal.last_nudge = friendlyMessage;

    deal.messages.push({
      sender: 'PayPact AI',
      text: `👋 Nudge-Bot (to ${deal.contract_terms.client_paypal_email}): "${friendlyMessage}" ${
        paypalRemindDispatched ? '[Sent via PayPal Invoicing Remind API]' : '[Logged to Scoreboard]'
      }`,
      timestamp: new Date().toISOString(),
    });

    res.json({
      status: 'success',
      nudge_message: friendlyMessage,
      paypal_remind_api: paypalRemindDispatched,
      deal,
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// AG Grid Prize Feature 2: Natural-Language Studio Agent for Live Grid & Widget Control
app.post('/api/grid-agent', async (req, res) => {
  try {
    const { query } = req.body;
    const commandSpec = await interpretGridCommand(query || 'Show all deals');
    res.json({ status: 'success', command: commandSpec });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 PayPact AI Server running on http://localhost:${PORT}`);
});