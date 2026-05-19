# PATCH FILE — BLUEPRINT UPDATES & CLARIFICATIONS
# Read this ALONGSIDE FILE_1_MASTER_BLUEPRINT.md
# Where this file conflicts with FILE_1, THIS FILE takes precedence.
# Version: 1.1

---

## PATCH 1 — WHATSAPP TOKEN EXCHANGE (CRITICAL — was missing from FILE_1)

The Embedded Signup flow returns a short-lived `code`, not a token.
You MUST exchange it before storing anything.

### Complete Embedded Signup → Token Exchange Flow

```
FRONTEND:
User clicks "Connect WhatsApp"
        ↓
Load Facebook JS SDK (already in layout)
        ↓
Call: window.FB.login(callback, {
  config_id: NEXT_PUBLIC_META_CONFIG_ID,
  response_type: 'code',
  override_default_response_type: true
})
        ↓
On success, FB returns: { code, wabaId, phoneNumberId }
        ↓
POST /api/whatsapp/connect { code, wabaId, phoneNumberId }

BACKEND:
Receive { code, wabaId, phoneNumberId }
        ↓
STEP 1 — Exchange code for long-lived token:
GET https://graph.facebook.com/oauth/access_token
  ?client_id={META_APP_ID}
  &client_secret={META_APP_SECRET}
  &code={code}
        ↓
Receive: { access_token, token_type }
        ↓
STEP 2 — Encrypt access_token (AES-256) before storing
        ↓
STEP 3 — Subscribe WABA to webhooks:
POST https://graph.facebook.com/v18.0/{wabaId}/subscribed_apps
Headers: Authorization: Bearer {SYSTEM_USER_TOKEN}
        ↓
STEP 4 — Fetch phone number display info:
GET https://graph.facebook.com/v18.0/{phoneNumberId}
  ?fields=display_phone_number,verified_name,quality_rating
Headers: Authorization: Bearer {access_token}
        ↓
STEP 5 — Store in WhatsAppNumber table:
  wabaId, phoneNumberId, accessToken (encrypted),
  displayPhone, verifiedName, qualityRating, status: ACTIVE
        ↓
STEP 6 — Emit WebSocket: whatsapp.connected
        ↓
Return: { success: true, number: { id, displayPhone, status } }
```

### Required Environment Variables (add to .env.example)
```
META_APP_ID=
META_APP_SECRET=
META_VERIFY_TOKEN=your_custom_random_string
META_SYSTEM_USER_TOKEN=
META_CONFIG_ID=
NEXT_PUBLIC_META_APP_ID=
NEXT_PUBLIC_META_CONFIG_ID=
```

### Meta API Version
Always use: `https://graph.facebook.com/v18.0/`
Never hardcode version anywhere — put it in config: `META_API_VERSION=v18.0`

---

## PATCH 2 — CMS / PAGE SYSTEM (replaces vague description in FILE_1)

### Access Control (FINAL — no exceptions)
```
SUPER_ADMIN     → full CMS access (all pages globally)
RESELLER_ADMIN  → CMS access scoped to their instance only
TENANT_OWNER    → NO access
TENANT_ADMIN    → NO access
AGENT           → NO access
VIEWER          → NO access
```

### What the Page System Actually Is
NOT a website builder. NOT a CMS with drag-drop.

It is a **lightweight SEO page manager with raw HTML support**.

Users paste HTML they generate elsewhere. The system stores, serves, and manages SEO metadata.

### Page Fields (exact, no more no less)
```typescript
{
  id: string
  tenantId: string          // scoped to superadmin or reseller
  name: string              // display name e.g. "Pricing Page"
  slug: string              // URL path e.g. "pricing" (no leading slash)
  htmlContent: string       // raw HTML pasted by admin
  metaTitle: string
  metaDescription: string
  ogImage: string | null    // URL
  canonicalUrl: string | null
  robotsIndex: boolean      // default true
  schemaMarkup: string | null  // JSON-LD string
  status: "DRAFT" | "PUBLISHED"
  publishedAt: DateTime | null
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Pages UI (SuperAdmin Panel → Website → Pages)

**Pages List Screen:**
- Table columns: Name | Slug | Status | Published At | Last Modified | Actions
- Top right button: `+ Add Page`
- Row actions: Edit | Duplicate | Delete | Toggle Publish

**Add/Edit Page Screen:**
- Page Name (text input, required)
- Slug (text input, required, auto-format: "About Us" → "about-us")
- Meta Title (text input)
- Meta Description (textarea, max 160 chars with counter)
- OG Image URL (text input)
- Canonical URL (text input, optional)
- Robots (toggle: Index / No Index)
- Schema Markup (optional textarea for JSON-LD)
- HTML Content (Monaco Editor, fullscreen button, syntax highlighting)
- Status toggle: Draft / Published
- Buttons: Save Draft | Publish | Preview

**Preview:**
- Opens sandboxed iframe render
- Device toggles: Desktop / Tablet / Mobile

### Slug Validation Rules
- Auto-format on input: lowercase, spaces → hyphens, strip special chars
- Must be unique per tenant
- Cannot conflict with system routes: login, signup, dashboard, api, admin, webhooks, sitemap.xml, robots.txt
- Max 100 characters

### SEO Automation (fires on every publish)
```
Page published
        ↓
1. Regenerate /sitemap.xml for this domain
2. Update /robots.txt if needed
3. Optionally ping: https://www.google.com/ping?sitemap={sitemapUrl}
4. Invalidate CDN cache for this slug
```

### Dynamic Routes
```
GET /{slug}          → serve published page HTML
GET /sitemap.xml     → auto-generated, all published pages
GET /robots.txt      → dynamic, includes sitemap URL
```

Page HTML served with injected <head> containing:
- Meta tags (from page fields)
- Analytics scripts (from AnalyticsConfig table)
- Branding (favicon, etc.)

### Analytics Config (SuperAdmin/Reseller level — NOT per page)
Configured once, injected into ALL pages for that domain:
```
ga4Id        → injected as gtag script
gtmId        → injected as GTM script
metaPixelId  → injected as fbq script
customHeadJs → injected as-is (sanitized, strip dangerous scripts)
```

### Security (mandatory)
- HTML content sanitized server-side before rendering
- Strip: `<script>` tags that load external malicious URLs
- Allow: inline scripts, Google Analytics, Meta Pixel, GTM
- Pages served with CSP headers
- Pages cannot access platform cookies (different context)
- Iframe preview sandboxed: `sandbox="allow-scripts allow-same-origin"`

---

## PATCH 3 — BILLING STATE MACHINE (replaces vague billing in FILE_1)

### Source of Truth
**Your PostgreSQL database is the source of truth. NOT Stripe. NOT Razorpay.**

After any payment webhook, you update YOUR DB first, then sync with provider.

### Subscription States
```
TRIALING  → ACTIVE        (first payment success)
ACTIVE    → PAST_DUE      (payment fails on renewal)
PAST_DUE  → GRACE_PERIOD  (3 failed retry attempts)
GRACE_PERIOD → SUSPENDED  (grace period ends, 3-7 days)
SUSPENDED → ACTIVE        (payment recovered)
ACTIVE    → CANCELLED     (user cancels — at period end)
ACTIVE    → EXPIRED       (period ends, no renewal)
```

### Payment Webhook Processing (IDEMPOTENT — critical)
```
Webhook received from provider
        ↓
1. Verify signature (provider-specific HMAC)
        ↓
2. Check idempotency:
   - Store event_id in PaymentWebhook table
   - If already processed → return 200, skip
        ↓
3. Store raw webhook payload
        ↓
4. Push to queue: billing:webhook
        ↓
5. Return 200 to provider immediately
        ↓
--- WORKER ---
        ↓
6. Process event based on type:
   payment.success → activate subscription, generate invoice
   payment.failed  → increment retry count, start grace
   subscription.cancelled → schedule cancellation at period end
        ↓
7. Update Subscription.status in DB
        ↓
8. Update TenantFeatureFlag records
        ↓
9. Update usage limits
        ↓
10. Generate invoice if payment success
        ↓
11. Queue notification email
        ↓
12. Emit WebSocket: billing.subscription.updated
```

### Plan Downgrade Flow
```
User selects lower plan
        ↓
DO NOT change plan immediately
        ↓
Set: subscription.pendingPlanId = newPlanId
     subscription.pendingChangeAt = currentPeriodEnd
        ↓
Show user: "Your plan changes on {date}"
        ↓
On period end → apply new plan + limits
```

### Money Rules
- NEVER use floats for money
- Store all amounts in minor units (paise for INR, cents for USD)
- Example: ₹999 stored as 99900
- Display: divide by 100

### Invoice Number Format
```
INV-{YEAR}-{6-digit-sequential}
Example: INV-2025-000042
```
Sequential per tenant, not global.

---

## PATCH 4 — AI CONFIG HIERARCHY (clarification on FILE_1)

### Full Resolution Order (most specific wins)
```
Level 1: GlobalAIConfig (SuperAdmin sets, applies to all)
  └── default_provider
  └── default_model per use case
  └── is_locked (if true, tenants CANNOT override)

Level 2: Plan limits (from Plan table)
  └── allowed_providers
  └── monthly_token_budget
  └── model whitelist

Level 3: TenantAIConfig (tenant sets their own)
  └── provider override (if not locked)
  └── own API key (if not locked)
  └── model override
  └── business_instructions, tone, rules

Level 4: WhatsApp Number config (per number override)
  └── number-specific AI agent
  └── number-specific system prompt

Level 5: Conversation context (runtime, not stored)
  └── last 20 messages (short-term memory)
  └── ConversationSummary (long-term memory)
  └── Contact profile data
```

### Multi-Provider Support (exact providers)
```typescript
enum AIProvider {
  OPENROUTER   // aggregator — 200+ models, use for flexibility
  OPENAI       // GPT-4o, GPT-4o-mini, o1
  ANTHROPIC    // Claude 3.5 Sonnet, Claude 3 Haiku
  GOOGLE       // Gemini 1.5 Pro, Gemini 1.5 Flash
  GROQ         // Llama 3.1, Mixtral — ultra-fast, cheap
  DEEPSEEK     // DeepSeek-V2, DeepSeek-R1
  QWEN         // Qwen2.5-72B
  OLLAMA       // self-hosted models
  CUSTOM       // any OpenAI-compatible endpoint
}
```

### AI Key Resolution Logic
```typescript
function resolveAIConfig(tenantId: string): AIConfig {
  const globalConfig = getGlobalConfig()
  const tenantConfig = getTenantConfig(tenantId)

  if (globalConfig.isLocked) {
    // Tenant CANNOT override anything
    return {
      provider: globalConfig.provider,
      apiKey: decrypt(globalConfig.apiKey),
      model: globalConfig.model,
      // tenant can still set: businessInstructions, tone, rules
    }
  }

  // Tenant has own key → use it (they pay their provider directly)
  if (tenantConfig.apiKeyEncrypted) {
    return {
      provider: tenantConfig.provider,
      apiKey: decrypt(tenantConfig.apiKeyEncrypted),
      model: tenantConfig.model ?? globalConfig.model,
    }
  }

  // No tenant key → use platform's shared key (platform pays, bills tenant)
  return {
    provider: globalConfig.provider,
    apiKey: decrypt(globalConfig.apiKey),
    model: tenantConfig.model ?? globalConfig.model,
  }
}
```

### "Managed by Administrator" UI
When `GlobalAIConfig.isLocked = true`, the tenant AI settings page shows:
```
[🔒 lock icon]
AI configuration is managed by your administrator.
You can still customize your business instructions and tone below.
[Contact support]
```
Tenant can ALWAYS edit: businessInstructions, tone, FAQs, policies
Tenant CANNOT edit when locked: provider, API key, model

---

## PATCH 5 — WHITE-LABEL RESELLER MODEL (clarification)

### What a Reseller Gets
A Reseller is essentially a SuperAdmin scoped to their own instance:

```
RESELLER_ADMIN can:
  ✅ Create/manage their own tenants (sub-tenants)
  ✅ Set their own plans and pricing
  ✅ Collect payments from their tenants
  ✅ Manage CMS pages for their domain
  ✅ Set their own branding
  ✅ Use their own custom domain
  ✅ Configure their own email (custom SMTP)
  ✅ Manage their own AI config (if SuperAdmin allows)

RESELLER_ADMIN cannot:
  ❌ See other resellers' data
  ❌ Access platform-level SuperAdmin panel
  ❌ Change global Meta/WhatsApp config
  ❌ See platform-wide analytics
```

### Domain Routing Logic
```
Request arrives at server
        ↓
Nginx reads Host header
        ↓
If host = platform domain → serve platform
        ↓
If host = custom domain → lookup CustomDomain table
        ↓
Find matching reseller tenant
        ↓
Load reseller's branding config
        ↓
Inject CSS variables + logo + favicon
        ↓
Serve app with reseller context
```

### Branding Injection (runtime, not build time)
On every page load for a reseller domain:
```typescript
// Middleware injects into HTML <head>:
<style>
  :root {
    --primary: {branding.primaryColor};
    --secondary: {branding.secondaryColor};
    --accent: {branding.accentColor};
  }
</style>
<link rel="icon" href="{branding.faviconUrl}" />
```

---

## PATCH 6 — QUEUE DEFINITIONS (missing from FILE_1)

### Complete Queue List with Job Structures

```typescript
// whatsapp:webhook
interface WhatsAppWebhookJob {
  job_id: string
  tenant_id: string
  idempotency_key: string  // Meta's message ID
  payload: object          // raw Meta webhook payload
  received_at: string
}

// whatsapp:outgoing
interface WhatsAppOutgoingJob {
  job_id: string
  tenant_id: string
  idempotency_key: string
  message_id: string       // DB message ID
  phone_number_id: string
  to: string
  type: 'text' | 'template' | 'media' | 'interactive'
  content: object
  access_token_encrypted: string
}

// ai:processing
interface AIProcessingJob {
  job_id: string
  tenant_id: string
  idempotency_key: string
  conversation_id: string
  message_id: string       // the incoming message that triggered AI
  number_id: string
}

// automation:execution
interface AutomationExecutionJob {
  job_id: string
  tenant_id: string
  idempotency_key: string
  workflow_id: string
  trigger_event: string
  trigger_data: object     // conversation_id, contact_id, message_id etc.
}

// billing:webhook
interface BillingWebhookJob {
  job_id: string
  tenant_id: string | null  // null for platform-level events
  idempotency_key: string   // provider event ID
  provider: string
  event_type: string
  payload: object
}

// notifications:send
interface NotificationJob {
  job_id: string
  tenant_id: string
  idempotency_key: string
  user_id: string
  type: string
  title: string
  body: string
  channels: ('in_app' | 'email' | 'whatsapp')[]
  data: object
}

// email:send
interface EmailJob {
  job_id: string
  tenant_id: string
  idempotency_key: string
  to: string
  subject: string
  template: string
  variables: object
  from_name?: string
  from_email?: string
}

// campaigns:send
interface CampaignSendJob {
  job_id: string
  tenant_id: string
  idempotency_key: string
  campaign_id: string
  batch_number: number
  contact_ids: string[]
}

// analytics:events
interface AnalyticsEventJob {
  job_id: string
  tenant_id: string
  event: string
  properties: object
  user_id?: string
  occurred_at: string
}
```

### Queue Config (BullMQ)
```typescript
const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
}

// whatsapp:webhook — higher attempts, critical
const webhookJobOptions = { ...defaultJobOptions, attempts: 5 }

// billing:webhook — highest attempts, financial
const billingJobOptions = { ...defaultJobOptions, attempts: 5, priority: 1 }

// analytics — fire and forget, low priority
const analyticsJobOptions = { ...defaultJobOptions, attempts: 1, priority: 10 }
```

---

## PATCH 7 — SOCKET.IO ROOM STRUCTURE (missing from FILE_1)

```typescript
// On connection, user joins these rooms:
socket.join(`tenant:${tenantId}`)           // all tenant events
socket.join(`user:${userId}`)               // personal notifications
// On opening a conversation in inbox:
socket.join(`conversation:${conversationId}`)

// Events emitted by server:
'message:new'        → room: tenant:{id}
'message:update'     → room: tenant:{id}
'conversation:update'→ room: tenant:{id}
'conversation:assigned' → room: tenant:{id}
'ai:typing'          → room: conversation:{id}
'ai:stream'          → room: conversation:{id}  (token by token)
'ai:done'            → room: conversation:{id}
'notification:new'   → room: user:{id}
'analytics:update'   → room: tenant:{id}
'whatsapp:connected' → room: tenant:{id}
'whatsapp:disconnected' → room: tenant:{id}
'billing:updated'    → room: tenant:{id}
```

---

## PATCH 8 — API RESPONSE FORMAT (standard for ALL endpoints)

```typescript
// Success
{
  success: true,
  data: T,
  meta?: {
    page?: number,
    limit?: number,
    total?: number,
    hasMore?: boolean
  }
}

// Error
{
  success: false,
  error: {
    code: string,       // e.g. "WHATSAPP_SEND_FAILED"
    message: string,    // human-readable
    cause?: string,     // technical cause
    suggestion?: string,// what user can do
    retryable: boolean,
    supportId?: string  // for error tracking
  }
}
```

---

## PATCH 9 — MODULES ALREADY COMPLETED

As of current build state, these modules are done:
- ✅ Module 1: Foundation (monorepo, Turborepo, Prisma, Docker, env)
- ✅ Module 2: Auth System (backend + frontend)
- ✅ Module 3: Design System + UI Shell
- ✅ Module 4: WhatsApp Integration (connect, webhook, send, multi-number)

Next to build:
- ⏳ Module 5: Inbox System (realtime 3-column chat)
- ⏳ Module 6: AI System (provider abstraction + auto-reply)
- ⏳ Module 7: AI Training (business profile + FAQs)
- ⏳ Module 8: Automation Engine (visual builder)
- ⏳ Module 9: CRM + Contacts
- ⏳ Module 10: Campaign System
- ⏳ Module 11: Billing System
- ⏳ Module 12: SuperAdmin Panel
- ⏳ Module 13: CMS + Pages System
- ⏳ Module 14: White-label + Custom Domains
- ⏳ Module 15: Analytics
- ⏳ Module 16: Notifications
- ⏳ Module 17: API + Webhooks (tenant-facing)

---

## PATCH 10 — TECHNOLOGY CONFIRMATIONS

These were confirmed decisions (lock these in):
- Meta: Tech Provider model, one Meta app, Embedded Signup for tenants
- AI: Multi-provider with hierarchy (not just OpenRouter)
- Numbers: Multiple per tenant from day 1
- Automation: Visual drag-drop builder (not simple rules)
- Memory: Short-term (last 20 msgs) + long-term summaries (no vector DB yet)
- Language: English only at launch
- Payments: Stripe + Razorpay + PhonePe + Paytm + PayPal
- Hosting: VPS (Docker Compose)
- Resellers: Full SuperAdmin-scoped access to their instance
