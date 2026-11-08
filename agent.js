require('dotenv').config();
const OpenAI = require('openai');
const axios = require('axios');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const negotiationJsonSchema = {
  name: 'escrow_negotiation_state',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      agent_reply: {
        type: 'string',
        description: 'Your helpful, concise mediator response to the chat participants.',
      },
      agreement_reached: {
        type: 'boolean',
        description:
          'True ONLY when all 5 contract_terms fields are non-null AND both Client and Freelancer have explicitly agreed to lock the deal.',
      },
      contract_terms: {
        type: 'object',
        properties: {
          project_title: {
            type: ['string', 'null'],
            description: 'Short title of the freelance project or null if not yet stated.',
          },
          milestone_description: {
            type: ['string', 'null'],
            description:
              'Concrete deliverable criteria to verify before payout (e.g., GitHub PR/commit requirements), or null.',
          },
          agreed_amount_usd: {
            type: ['number', 'null'],
            description: 'Numeric USD price agreed upon, or null if still negotiating.',
          },
          client_paypal_email: {
            type: ['string', 'null'],
            description: 'Client PayPal Sandbox email to receive the escrow invoice, or null.',
          },
          freelancer_paypal_email: {
            type: ['string', 'null'],
            description: 'Freelancer PayPal Sandbox email to receive the payout, or null.',
          },
        },
        required: [
          'project_title',
          'milestone_description',
          'agreed_amount_usd',
          'client_paypal_email',
          'freelancer_paypal_email',
        ],
        additionalProperties: false,
      },
    },
    required: ['agent_reply', 'agreement_reached', 'contract_terms'],
    additionalProperties: false,
  },
};

const verificationJsonSchema = {
  name: 'deliverable_verification_verdict',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      verified: {
        type: 'boolean',
        description: 'True ONLY if the submitted code/evidence satisfies the agreed milestone_description.',
      },
      confidence_score: {
        type: 'number',
        description: 'Confidence score from 0 to 100 on how well the deliverable meets the contract criteria.',
      },
      audit_summary: {
        type: 'string',
        description: 'Concise technical explanation of why the submission passed or failed the milestone audit.',
      },
      missing_requirements: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of missing items if verified is false, or empty array if verified is true.',
      },
    },
    required: ['verified', 'confidence_score', 'audit_summary', 'missing_requirements'],
    additionalProperties: false,
  },
};

const gridAgentSchema = {
  name: 'ag_grid_studio_command',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      assistant_explanation: {
        type: 'string',
        description: '1-sentence confirmation of how you updated the AG Grid & widgets.',
      },
      status_filter: {
        type: ['string', 'null'],
        description:
          'Filter by status if requested: NEGOTIATING, ESCROW_INVOICED, ESCROW_FUNDED, DELIVERABLE_CHANGES_REQUESTED, PAYOUT_RELEASED, or null for all.',
      },
      invoice_status_filter: {
        type: ['string', 'null'],
        description: 'Filter by invoiceStatus if requested: SENT, PAID, or null for all.',
      },
      sort_by_amount: {
        type: ['string', 'null'],
        description: 'asc, desc, or null.',
      },
      active_widget_mode: {
        type: 'string',
        enum: ['ALL_LEDGER', 'NUDGE_SCOREBOARD', 'ANOMALY_AUDIT_WATCH'],
        description: 'Which custom widget layout preset to activate based on user query.',
      },
    },
    required: [
      'assistant_explanation',
      'status_filter',
      'invoice_status_filter',
      'sort_by_amount',
      'active_widget_mode',
    ],
    additionalProperties: false,
  },
};

async function processNegotiationTurn(messages) {
  const transcript = messages
    .map((m) => `${m.sender.toUpperCase()}: ${m.text}`)
    .join('\n');

  const systemPrompt = `
You are PayPact AI, an autonomous negotiation and escrow mediator for freelance software and digital contracts.
Your job is to help the Client and Freelancer agree on 5 mandatory contract parameters:
1. project_title
2. milestone_description (specific technical deliverable to verify before payout)
3. agreed_amount_usd (numeric USD price)
4. client_paypal_email (the client's PayPal Sandbox email to receive the escrow invoice)
5. freelancer_paypal_email (the freelancer's PayPal Sandbox email to receive the payout)

Rules:
- Extract any of the 5 fields mentioned so far into contract_terms (leave missing ones as null).
- If any field is null or price/scope is still being debated, ask clarifying questions and keep agreement_reached = false.
- Set agreement_reached = true ONLY when all 5 fields are non-null AND both parties have clearly agreed to proceed.
`.trim();

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Current Negotiation Transcript:\n${transcript}` },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: negotiationJsonSchema,
    },
    temperature: 0.2,
  });

  return JSON.parse(completion.choices[0].message.content);
}

async function fetchGitHubEvidence(githubUrl) {
  if (!githubUrl) return null;

  try {
    let targetUrl = githubUrl.trim();

    if (
      targetUrl.includes('github.com') &&
      (targetUrl.includes('/pull/') || targetUrl.includes('/commit/')) &&
      !targetUrl.endsWith('.diff')
    ) {
      targetUrl = `${targetUrl}.diff`;
    } else if (targetUrl.includes('github.com') && targetUrl.includes('/blob/')) {
      targetUrl = targetUrl
        .replace('github.com', 'raw.githubusercontent.com')
        .replace('/blob/', '/');
    }

    const response = await axios.get(targetUrl, {
      headers: { 'User-Agent': 'PayPact-AI-Escrow-Auditor' },
      timeout: 8000,
    });

    const content =
      typeof response.data === 'string'
        ? response.data
        : JSON.stringify(response.data, null, 2);

    return content.slice(0, 12000);
  } catch (err) {
    return `Could not auto-fetch URL (${err.message}). Relying on submitted proof payload.`;
  }
}

async function verifyDeliverable(contractTerms, submission) {
  const urlContent = await fetchGitHubEvidence(submission.github_url);

  const systemPrompt = `
You are PayPact AI's Autonomous Escrow Code Auditor.
Your job is to inspect a Freelancer's submitted work against the locked contract milestone.
Rules:
- If the submission implements the core required functionality described in the milestone, set verified = true so the PayPal Payouts API can release their funds.
- Do NOT fail a submission for harmless extra fields (such as timestamps/uptime), code comments, or standard best-practice improvements, as long as the core required fields and endpoints are present.
- Only set verified = false if the required functionality is missing, broken, or a placeholder/TODO.
`.trim();

  const userPayload = `
LOCKED CONTRACT MILESTONE:
- Project Title: ${contractTerms.project_title}
- Required Deliverable: ${contractTerms.milestone_description}
- Escrow Amount: $${contractTerms.agreed_amount_usd} USD

FREELANCER SUBMISSION:
- GitHub / Deliverable URL: ${submission.github_url || 'None provided'}
- Submitted Code / Notes:
${submission.proof_text || 'None provided'}

FETCHED REMOTE REPOSITORY / DIFF CONTENT:
${urlContent || 'No external URL content fetched.'}
`.trim();

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPayload },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: verificationJsonSchema,
    },
    temperature: 0.1,
  });

  return JSON.parse(completion.choices[0].message.content);
}

/**
 * Nudge-Bot: Generates a warm, friendly payment reminder for an unpaid PayPal invoice
 */
async function generateFriendlyNudge(contractTerms, invoice) {
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are PayPact Nudge-Bot, a warm, upbeat, zero-pressure assistant. Draft a short, friendly 2-sentence heads-up to the Client that their PayPal Escrow Invoice is ready whenever they are, so the Freelancer can kick off work. Sound like a helpful teammate, never like a collections report.',
      },
      {
        role: 'user',
        content: `Client Email: ${contractTerms.client_paypal_email}, Project: ${contractTerms.project_title}, Amount: $${contractTerms.agreed_amount_usd} USD, PayPal Invoice #: ${invoice.invoice_number}`,
      },
    ],
    temperature: 0.5,
  });

  return completion.choices[0].message.content.trim();
}

/**
 * Natural-Language AG Grid Studio Agent: Translates user queries into live grid/widget state
 */
async function interpretGridCommand(query) {
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are the AG Grid Studio Finance Agent. Translate the user natural-language query into AG Grid filters, sorting, and widget mode.',
      },
      { role: 'user', content: query },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: gridAgentSchema,
    },
    temperature: 0.1,
  });

  return JSON.parse(completion.choices[0].message.content);
}

module.exports = {
  processNegotiationTurn,
  verifyDeliverable,
  generateFriendlyNudge,
  interpretGridCommand,
};