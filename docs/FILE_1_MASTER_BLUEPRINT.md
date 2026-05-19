# AI-NATIVE WHATSAPP SAAS — MASTER BLUEPRINT
# Version: 2.0 (Final — Production Ready)

---

## CONFIRMED ARCHITECTURE DECISIONS

- Hosting: Self-hosted VPS (DigitalOcean / Hetzner / Contabo)
- AI: Multi-provider (OpenRouter, OpenAI, Anthropic, Google, Groq, DeepSeek, Qwen) — SuperAdmin shared key + tenant override
- Payments: Stripe, Razorpay, PhonePe, Paytm, PayPal
- WhatsApp: Meta Tech Provider model (one Meta app, all tenants underneath)
- Numbers: Multiple WhatsApp numbers per tenant (department routing)
- Automation: Visual drag-drop builder at launch
- AI Memory: Short-term (last N messages) + long-term (conversation summaries)
- Language: English only at launch (i18n architecture ready for future)
- White-label: Full SuperAdmin-scoped access for resellers

---

## 0. SYSTEM IDENTITY

This is NOT:
- a chatbot
- a CRM clone
- a basic WhatsApp tool
- an MVP

This IS:
- an AI-native multi-tenant WhatsApp communication operating system
- a white-label SaaS platform
- a visual automation engine
- a multi-provider AI orchestration layer
- a realtime business operations system

The system must feel:
- futuristic and premium
- realtime and intelligent
- enterprise-grade
- emotionally satisfying to use

Benchmark: NOT Chatwoot, Intercom, HubSpot.
Benchmark: THE operating system for AI-first businesses.

---

## 1. TECH STACK (LOCKED)

### Frontend
- Next.js 15 (App Router)
- TypeScript (strict mode)
- TailwindCSS
- shadcn/ui
- Framer Motion
- Zustand (UI state)
- TanStack Query / React Query (server state)
- React Hook Form + Zod (forms + validation)
- Socket.IO client (realtime)
- Monaco Editor (code/HTML editing)

### Backend
- NestJS (modular architecture)
- TypeScript (strict mode)
- Prisma ORM
- PostgreSQL (primary database)
- Redis (cache, queues, sessions, pub/sub)
- BullMQ (job queues)
- Socket.IO (WebSocket gateway)

### AI Layer
- Provider abstraction layer (supports all providers)
- Supported: OpenRouter, OpenAI, Anthropic, Google Gemini, Groq, DeepSeek, Qwen, Ollama
- Streaming responses via SSE
- Short-term memory (last 20 messages)
- Long-term memory (summarized, stored in DB)

### Storage
- S3-compatible (MinIO on VPS or Cloudflare R2)
- Signed URLs for all media access
- Per-tenant path isolation: /tenants/{tenant_id}/

### Infrastructure (VPS)
- Docker + Docker Compose
- Nginx (reverse proxy + SSL termination)
- Certbot (SSL)
- GitHub Actions (CI/CD)
- Sentry (error tracking)
- Prometheus + Grafana (metrics)

### Email
- Resend (primary)
- SMTP fallback
- Per-tenant custom SMTP support

---

## 2. MONOREPO STRUCTURE

```
/apps
  /web          → Next.js dashboard (tenant users)
  /admin        → Next.js superadmin panel
  /api          → NestJS backend
  /worker       → BullMQ workers

/packages
  /ui           → Shared shadcn/ui components
  /database     → Prisma schema + migrations
  /auth         → Auth utilities + JWT helpers
  /ai           → AI provider abstraction layer
  /whatsapp     → Meta Cloud API client
  /billing      → Payment gateway abstractions
  /analytics    → Event tracking utilities
  /notifications → Notification helpers
  /shared       → Types, constants, utilities
  /config       → Environment + config management
  /emails       → Email templates (React Email)
```

---

## 3. USER ROLES & ACCESS MODEL

### Role Hierarchy

```
SUPER_ADMIN
  └── Full platform control
  └── All tenants
  └── Global AI config
  └── Global billing
  └── CMS pages
  └── Meta Tech Provider settings

RESELLER_ADMIN (White-label owner)
  └── Scoped to their instance
  └── Their tenants only
  └── CMS pages for their domain
  └── Their billing/plans
  └── Their branding
  └── Cannot see other resellers

TENANT_OWNER
  └── Full control of their workspace
  └── Team management
  └── Billing
  └── WhatsApp numbers
  └── AI configuration
  └── Automations

TENANT_ADMIN
  └── Everything except billing
  └── Cannot delete workspace

AGENT
  └── Inbox access
  └── Assigned conversations
  └── Cannot change settings

VIEWER
  └── Read-only access
  └── Analytics only
```

### Permission Enforcement Rules
- EVERY API route validates JWT
- EVERY API route extracts and validates tenant_id
- EVERY DB query includes tenant_id filter (no exceptions)
- Role checked AFTER tenant validation
- Feature flags checked AFTER role validation
- Rate limits checked last

---

## 4. MULTI-TENANCY ARCHITECTURE

### Tenant Isolation Rules
- Logical isolation (shared DB, strict tenant_id enforcement)
- Every table has tenant_id column
- Composite indexes: (tenant_id, id), (tenant_id, created_at)
- Prisma middleware enforces tenant scope on every query
- Redis keys namespaced: tenant:{tenant_id}:*
- S3 paths isolated: /tenants/{tenant_id}/
- BullMQ jobs always include tenant_id
- WebSocket rooms: room:tenant:{tenant_id}

### Meta Tech Provider Model
- ONE Meta App owned by SuperAdmin
- All tenants connect their WhatsApp numbers under this app
- SuperAdmin holds: App ID, App Secret, System User Token
- Tenants go through Embedded Signup flow
- After signup: tenant gets their own WABA ID + phone_number_id
- Webhooks route to: POST /webhooks/whatsapp/{tenant_id}
- SuperAdmin can revoke access per tenant

---

## 5. SYSTEM BOOTSTRAP FLOW

When any dashboard loads, frontend makes ONE call:

```
GET /api/bootstrap
Authorization: Bearer {token}
```

Response includes:
```json
{
  "user": { id, name, email, role },
  "tenant": { id, name, slug, plan, status },
  "featureFlags": { ai_enabled, automation_enabled, ... },
  "limits": { messages_remaining, ai_tokens_remaining, ... },
  "whatsapp": { connected, numbers: [], health },
  "ai": { configured, provider, model },
  "onboarding": { completed, steps: [] },
  "billing": { plan, status, renewal_date },
  "unread": { conversations: 0, notifications: 0 }
}
```

This single call prevents 10+ separate API calls on load.

---

## 6. CORE EVENT-DRIVEN ARCHITECTURE

### The Golden Rule
EVERY significant action follows this exact path:

```
User Action / External Event
        ↓
API receives + validates
        ↓
Store to PostgreSQL (source of truth)
        ↓
Push job to BullMQ queue
        ↓
Return response to client (fast)
        ↓
Worker picks up job
        ↓
Worker processes (AI, automation, send, etc.)
        ↓
Worker updates DB state
        ↓
Worker emits WebSocket event
        ↓
Frontend updates in realtime
```

NO heavy processing in API layer.
NO direct DB calls in workers without tenant validation.
NO silent failures anywhere.

### Standard Event Names
```
auth.signup
auth.login
auth.logout

tenant.created
tenant.suspended
tenant.plan_changed

whatsapp.connected
whatsapp.disconnected
whatsapp.message.received
whatsapp.message.sent
whatsapp.message.delivered
whatsapp.message.read
whatsapp.message.failed

conversation.created
conversation.updated
conversation.assigned
conversation.resolved
conversation.reopened

ai.reply.generated
ai.reply.failed
ai.training.updated

automation.triggered
automation.executed
automation.failed

contact.created
contact.updated
contact.tagged

campaign.created
campaign.launched
campaign.completed

billing.subscription.created
billing.subscription.updated
billing.payment.success
billing.payment.failed
billing.invoice.generated

ticket.created
ticket.updated
ticket.resolved

page.published
page.unpublished
```

---

## 7. WHATSAPP SYSTEM (META TECH PROVIDER)

### Connection Flow (Per Tenant)
```
Tenant clicks "Connect WhatsApp"
        ↓
Frontend opens Meta Embedded Signup popup
        ↓
User logs into Facebook
        ↓
Selects Business Manager
        ↓
Creates/selects WhatsApp Business Account
        ↓
Selects/registers phone number
        ↓
Grants permissions
        ↓
Meta returns: code
        ↓
Backend exchanges code for tokens:
  - access_token
  - waba_id
  - phone_number_id
        ↓
Backend stores (encrypted):
  - waba_id
  - phone_number_id
  - access_token
  - business_name
  - number (formatted)
        ↓
Backend registers webhook for this number
        ↓
Backend sends test message (health check)
        ↓
Status → ACTIVE
        ↓
Emit: whatsapp.connected
        ↓
Frontend shows success + onboarding step complete
```

### Webhook Flow (Incoming Message)
```
Meta sends POST to: /webhooks/whatsapp
        ↓
Validate X-Hub-Signature-256
        ↓
Check idempotency (Redis SET NX with event_id, TTL 24h)
        ↓
If duplicate → return 200 (silent skip)
        ↓
Store raw webhook to webhook_events table
        ↓
Push to queue: whatsapp:webhook
        ↓
Return 200 immediately to Meta
        ↓
--- WORKER ---
        ↓
Parse event type (message / status / reaction)
        ↓
Route to tenant by phone_number_id
        ↓
For message type:
  Store to messages table
  Create/update conversation
  Create/update contact
  Emit WebSocket: whatsapp.message.received
  Push to queue: ai:processing (if AI enabled)
  Push to queue: automation:trigger
        ↓
For status type:
  Update message status (sent/delivered/read/failed)
  Emit WebSocket: whatsapp.message.{status}
```

### Outgoing Message Flow
```
User/AI/Automation sends message
        ↓
POST /api/messages/send
        ↓
Validate + store message (status: pending)
        ↓
Push to queue: whatsapp:outgoing
        ↓
Return optimistic message to frontend
        ↓
--- WORKER ---
        ↓
Call Meta Cloud API: POST /messages
        ↓
On success: update status → sent
        ↓
On failure: retry (max 3) → mark failed
        ↓
Emit WebSocket: whatsapp.message.sent / failed
```

### Multi-Number Architecture
- Each tenant can have N phone numbers
- Each number has its own:
  - inbox
  - AI agent config
  - automation rules
  - templates
  - analytics
  - team assignments
- Routing: incoming webhook → match phone_number_id → route to number's inbox

### Number Health Monitoring
Track per number:
- quality_rating (GREEN / YELLOW / RED from Meta)
- messaging_limit_tier (1K / 10K / 100K / unlimited)
- verified_name
- last_webhook_at
- error_count_24h
- ban_risk_level

---

## 8. AI SYSTEM

### Provider Abstraction Layer
All AI calls go through a unified interface regardless of provider:

```typescript
interface AIProvider {
  name: string
  sendMessage(params: AIRequestParams): Promise<AIResponse>
  streamMessage(params: AIRequestParams): AsyncIterable<string>
  getModels(): Promise<AIModel[]>
  validateKey(key: string): Promise<boolean>
}
```

Supported providers (each implements AIProvider):
- OpenRouter (aggregator — access to 200+ models)
- OpenAI (GPT-4o, GPT-4, etc.)
- Anthropic (Claude 3.5 Sonnet, Claude 3 Opus, etc.)
- Google (Gemini 1.5 Pro, Gemini Flash, etc.)
- Groq (Llama, Mixtral — ultra-fast)
- DeepSeek (DeepSeek-V2, DeepSeek-R1)
- Qwen (Qwen2.5, etc.)
- Ollama (self-hosted models)

### AI Config Hierarchy (CRITICAL)
Resolution order (most specific wins):

```
LEVEL 1: Global defaults (SuperAdmin sets)
  └── default_provider
  └── default_model
  └── global_system_instructions

LEVEL 2: Plan defaults
  └── allowed_providers
  └── allowed_models
  └── monthly_token_budget

LEVEL 3: Tenant config
  └── provider override
  └── model override
  └── tenant API key (if provided)
  └── business_instructions
  └── tone
  └── rules

LEVEL 4: WhatsApp number config
  └── number-specific AI agent
  └── number-specific prompt

LEVEL 5: Conversation context
  └── short-term memory (last 20 messages)
  └── long-term memory (summary)
  └── contact profile
```

### AI Key Management
- SuperAdmin provides global API keys (encrypted in DB)
- Tenants can add their own keys (optional override)
- If tenant has own key → use it (they pay)
- If no tenant key → use SuperAdmin's shared key (platform pays, billed to tenant via usage)
- Keys encrypted at rest using AES-256

### AI Reply Flow (Complete)
```
Incoming message triggers AI
        ↓
Check: ai_enabled for this tenant + number?
        ↓
Check: AI quota remaining?
  If exceeded → block + notify tenant
  If near limit → warn tenant
        ↓
Resolve AI config (hierarchy above)
        ↓
Load context:
  - Last 20 messages (short-term memory)
  - Conversation summary (long-term memory)
  - Contact profile (name, tags, history)
  - Business instructions (tenant AI training)
        ↓
Build system prompt:
  [Global instructions]
  [Business overview]
  [Tone + rules]
  [Contact context]
  [Conversation summary]
  [Recent messages]
        ↓
Check rate limit (per tenant, per minute)
        ↓
Send to AI provider (streaming)
        ↓
Stream tokens → emit WebSocket: ai:stream
        ↓
Run safety/moderation check on complete response
        ↓
If safe: store AI message + send via WhatsApp
        ↓
If unsafe: flag + escalate to human
        ↓
Log: provider, model, tokens_in, tokens_out, cost, latency
        ↓
Update: tenant usage counters
```

### AI Memory System
```
SHORT-TERM MEMORY:
- Last 20 messages of current conversation
- Loaded fresh on every AI call
- Stored in messages table (no separate storage)

LONG-TERM MEMORY:
- Conversation summary generated after every 20 messages
- Or when conversation is resolved
- Stored in conversation_summaries table
- Injected into prompt as [Summary of previous conversation]
- Summary itself generated by AI (cheap/fast model)

CONTACT MEMORY:
- Key facts about contact stored in contact_notes
- AI can add notes via tool calling (future Phase 2)
```

### AI Training System (Per Tenant)
Users can train their AI by providing:
- Business overview (text)
- Tone of voice (dropdown + custom text)
- Operating hours (structured)
- Services + pricing (structured)
- FAQs (Q&A pairs)
- Policies (refund, escalation, support)
- Forbidden topics/replies
- Uploaded documents (PDF, DOCX, TXT — Phase 2 RAG)
- Website URL (Phase 2 scraping)

All training data compiled into a structured system prompt per tenant.

### AI Cost Tracking
Per AI call log:
- tenant_id
- provider
- model
- input_tokens
- output_tokens
- cost_usd (calculated)
- latency_ms
- conversation_id
- created_at

Aggregated daily/monthly per tenant for billing.

---

## 9. AUTOMATION ENGINE (VISUAL BUILDER)

### Architecture
Visual node-based workflow builder.
Each workflow is a directed graph stored as JSON.

### Workflow Data Model
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "name": "Lead Follow-up",
  "trigger": { "type": "message.received", "conditions": {} },
  "nodes": [
    { "id": "n1", "type": "condition", "config": {}, "next": ["n2", "n3"] },
    { "id": "n2", "type": "send_message", "config": {}, "next": ["n3"] },
    { "id": "n3", "type": "ai_reply", "config": {}, "next": [] }
  ],
  "is_active": true
}
```

### Trigger Types
- `message.received` — new incoming WhatsApp message
- `message.keyword` — message contains keyword(s)
- `conversation.created` — new conversation started
- `conversation.unresponsive` — no reply after N hours
- `contact.tag_added` — specific tag added to contact
- `contact.created` — new contact
- `campaign.replied` — reply to a campaign message
- `webhook.received` — external webhook trigger
- `schedule` — time-based (cron)

### Condition Node Types
- Message contains text
- Contact has tag
- Contact field equals value
- Time of day / day of week
- Conversation assigned to agent
- Previous node result value

### Action Node Types
- `send_message` — send WhatsApp text message
- `send_template` — send approved WhatsApp template
- `send_media` — send image/video/document
- `ai_reply` — trigger AI to generate + send reply
- `assign_agent` — assign conversation to agent/team
- `add_tag` — add tag to contact
- `remove_tag` — remove tag
- `update_contact` — update contact field
- `create_ticket` — create support ticket
- `webhook_call` — call external URL
- `send_email` — send email notification
- `delay` — wait N minutes/hours/days
- `condition` — branch based on condition
- `end` — terminate flow

### Execution Flow
```
Trigger event fires
        ↓
Find all active workflows matching trigger + tenant
        ↓
For each matching workflow:
  Push job to queue: automation:execution
        ↓
--- WORKER ---
        ↓
Load workflow graph
        ↓
Execute nodes in order (respecting graph edges)
        ↓
For each node:
  Execute action
  Store result
  Log execution
  On failure: retry or mark failed + continue
        ↓
On delay node: re-queue with delay
        ↓
Store execution log (full trace)
        ↓
Emit: automation.executed
```

### Visual Builder UI
- Canvas-based drag-drop interface
- Node palette (left sidebar)
- Connection drawing (drag between nodes)
- Node configuration panel (right sidebar, click node to edit)
- Zoom/pan controls
- Undo/redo
- Test run button (dry run with sample data)
- Execution history tab (see past runs)
- Active/inactive toggle
- Duplicate workflow

---

## 10. INBOX SYSTEM

### Layout (3-Column)
```
[LEFT: Conversation List] [CENTER: Chat Window] [RIGHT: Contact Panel]
```

### Left Panel — Conversation List
- Search bar (full-text search)
- Filter tabs: All / Unread / Mine / Unassigned / Resolved
- Filter by: WhatsApp number, tag, agent
- Sort: Latest / Oldest / Priority
- Each conversation item shows:
  - Contact name + avatar (initials)
  - Last message preview (truncated)
  - Timestamp
  - Unread count badge
  - WhatsApp number indicator (if multi-number)
  - AI active indicator
  - Assigned agent avatar
  - Tags

### Center Panel — Chat Window
- Message bubbles (WhatsApp-style)
- Message types: text, image, video, audio, document, location, sticker, reaction
- Delivery status icons (sent / delivered / read / failed)
- Timestamps
- AI-generated messages have AI badge
- Internal notes (visible only to team, different styling)
- Typing indicator (when agent typing)
- AI typing indicator (when AI generating)
- Message input area:
  - Text input
  - Emoji picker
  - Attach file button
  - Template picker button
  - AI Suggest button
  - Send button
- Conversation header:
  - Contact name + number
  - WhatsApp number used
  - Assigned agent
  - Status (open/resolved/pending)
  - Assign button
  - Resolve button
  - Reopen button
  - Snooze button
  - More actions menu

### Right Panel — Contact & AI Panel
Tabs:
1. **Contact** tab:
   - Name, phone, email
   - Custom fields
   - Tags (add/remove)
   - Conversations count
   - First seen / Last seen
   - Notes (add note)
   - Activity timeline

2. **AI** tab:
   - AI on/off toggle for this conversation
   - AI confidence score (last message)
   - Suggested replies (click to use)
   - Conversation summary
   - Sentiment indicator

3. **Automations** tab:
   - Active automations for this contact
   - Triggered automations history

### Realtime Behavior
- New messages appear instantly (WebSocket)
- Unread counts update in real time
- Typing indicators shown when agent typing
- Assignment changes reflected immediately
- Multiple agents can view same conversation
- Collision detection: warn if another agent is currently typing

### Human Handoff Flow
```
AI is handling conversation
        ↓
Condition met (low confidence / keyword / manual)
        ↓
AI stops auto-replying
        ↓
Conversation flagged: needs_human
        ↓
Notification sent to available agents
        ↓
Agent assigned (auto or manual)
        ↓
Agent takes over
        ↓
AI suggestions still available (not auto-send)
        ↓
Agent resolves
        ↓
Option: return control to AI
```

---

## 11. CRM SYSTEM

### Contact Model
Fields:
- id, tenant_id
- phone (primary identifier)
- name
- email
- avatar_url
- language preference
- timezone
- lead_score (0-100)
- pipeline_stage
- custom_fields (JSON)
- tags (many-to-many)
- last_contacted_at
- created_at, updated_at

### Contact Features
- Import via CSV (with field mapping + deduplication)
- Export to CSV
- Bulk tag operations
- Bulk assign to pipeline stage
- Smart segments (saved filters)
- AI-generated summary of contact history
- Full activity timeline (messages, notes, automations, payments)
- Custom fields (text, number, date, dropdown, boolean)

### Pipeline / CRM View
- Kanban board view
- Stages configurable per tenant
- Drag contacts between stages
- Stage-based automation triggers
- Revenue tracking per stage (optional)

---

## 12. CAMPAIGN SYSTEM

### Campaign Types
- **Broadcast** — send template message to contact list/segment
- **Drip** — multi-step sequence over time
- **Reminder** — triggered reminders (appointment, payment, etc.)

### Campaign Creation Flow
```
Create Campaign
        ↓
Choose type (broadcast / drip / reminder)
        ↓
Select audience (segment / tag / CSV upload)
        ↓
Select/create WhatsApp template
        ↓
Personalize variables ({{name}}, {{order_id}}, etc.)
        ↓
Schedule (now / future datetime)
        ↓
Preview (sample render)
        ↓
Estimate reach + Meta conversation cost
        ↓
Launch
        ↓
--- WORKER ---
        ↓
Fetch contacts in batches
        ↓
Send via WhatsApp Cloud API (rate-limited: 80/sec max)
        ↓
Track: sent / delivered / read / replied / failed
        ↓
Realtime analytics update
```

### Template Management
- Create templates (text / media / interactive)
- Submit to Meta for approval
- Track approval status (pending / approved / rejected)
- Rejection reason shown with fix guidance
- Template variables with sample values
- Template categories: MARKETING / UTILITY / AUTHENTICATION
- Localization support (multiple languages per template)

---

## 13. BILLING SYSTEM

### Architecture Rule
**Your PostgreSQL DB is the source of truth. NOT Stripe/Razorpay.**

### Subscription State Machine
```
[trialing] → [active] → [past_due] → [grace_period] → [suspended]
                    ↘ [cancelled]
                    ↘ [expired]
```

State transitions:
- trialing → active: first payment success
- active → past_due: payment fails
- past_due → grace_period: after 3 failed retries
- grace_period → suspended: grace period ends (3-7 days)
- suspended → active: payment recovered
- active → cancelled: user cancels (at period end)

### Payment Providers
Abstraction layer — same interface for all providers:
```typescript
interface PaymentProvider {
  createCheckoutSession(params): Promise<CheckoutSession>
  createSubscription(params): Promise<Subscription>
  cancelSubscription(id): Promise<void>
  createRefund(params): Promise<Refund>
  verifyWebhook(payload, signature): boolean
  getInvoice(id): Promise<Invoice>
}
```

Supported at launch:
- **Stripe** (global)
- **Razorpay** (India — INR primary)
- **PhonePe** (India UPI)
- **Paytm** (India)
- **PayPal** (global)

SuperAdmin configures which providers are active.
Tenants see only configured + active providers.
Each provider has: enable/disable, sandbox/live toggle, API keys, webhook secret.

### Invoice System
Every invoice includes:
- Invoice number (auto-generated, sequential per tenant)
- Issue date + due date
- Tenant billing details (name, address, GSTIN for India)
- Platform/reseller logo
- Itemized charges:
  - Subscription plan
  - AI token usage (overage if applicable)
  - WhatsApp conversation charges (if usage-based)
- Subtotal, tax (GST/VAT configurable), total
- Payment method used
- Transaction ID
- PDF generation (Puppeteer or PDFKit)
- Auto-email on generation

### Plan Configuration
Each plan defines:
- name, slug, description
- pricing (monthly_inr, monthly_usd, yearly_inr, yearly_usd)
- trial_days
- limits:
  - ai_messages_per_month
  - ai_tokens_per_month
  - whatsapp_conversations_per_month
  - team_seats
  - whatsapp_numbers
  - storage_gb
  - automation_workflows
  - campaign_contacts
  - api_calls_per_day
- features (boolean flags):
  - ai_enabled
  - automation_enabled
  - campaigns_enabled
  - crm_enabled
  - api_access
  - webhook_access
  - custom_branding
  - white_label
  - custom_domain
  - priority_support

### Webhook Processing (Idempotent)
```
Payment webhook received
        ↓
Verify signature (provider-specific)
        ↓
Check idempotency (store event_id in Redis, TTL 72h)
        ↓
If duplicate → return 200, skip
        ↓
Store raw webhook to payment_webhooks table
        ↓
Push to queue: billing:webhook
        ↓
Return 200 to provider
        ↓
--- WORKER ---
        ↓
Process based on event type
        ↓
Update subscription state in DB
        ↓
Update feature flags
        ↓
Update usage limits
        ↓
Generate invoice (if payment success)
        ↓
Queue notification email
        ↓
Emit: billing.subscription.updated
```

---

## 14. SUPERADMIN PANEL

### Purpose
The operational control center for:
- Platform owner (you)
- White-label resellers (scoped to their instance)

### Sidebar Sections
- Dashboard (platform overview)
- Tenants (manage all workspaces)
- Packages & Plans
- Billing & Revenue
- AI Control Center
- Meta / WhatsApp Config
- Website CMS (pages)
- Media Library
- Custom Domains
- Email Settings
- Notifications
- Support Tickets
- Audit Logs
- Feature Flags
- Global Settings
- AI Copilot (floating)

### SuperAdmin Dashboard Widgets
- Total tenants (active / trial / suspended)
- MRR / ARR (realtime)
- New signups (today / week / month)
- AI usage + cost (platform-wide)
- WhatsApp messages (today)
- Payment failures (last 24h)
- Onboarding completion rate
- System health (API / Queue / DB / Redis)
- Active support tickets
- Recent errors (from Sentry)

All widgets: realtime, clickable/drilldown.

### Tenant Management
Per tenant view:
- Name, plan, status, created date
- Usage stats (messages, AI tokens, storage)
- Billing history + invoices
- WhatsApp numbers + health
- Team members
- Onboarding completion
- Error history
- Support tickets
Actions:
- Upgrade/downgrade plan
- Suspend/reactivate
- Impersonate (login as tenant admin)
- Reset quotas
- Add manual invoice
- Issue credit/refund
- Delete (with confirmation + data export)

### AI Control Center
- Global AI provider config (API keys, encrypted)
- Default model per use case
- Lock settings (tenants cannot override)
- Per-plan model access control
- Global token budgets
- Usage analytics (per tenant, per model)
- Cost breakdown

### Meta Tech Provider Config
Fields:
- Meta App ID
- App Secret (encrypted)
- Webhook Verify Token
- System User Token (encrypted)
- Business Manager ID
- Embedded Signup App Config
Each field: help tooltip, copy button, validation status, docs link.

### Website CMS (SuperAdmin + Resellers Only)
#### Page Manager
List view shows:
- Page name
- Slug
- Status (published / draft)
- Published at
- Last modified
- Actions: Edit / Duplicate / Delete / Toggle publish

#### Add / Edit Page
Fields:
- Page Name (required)
- Slug (required, auto-format, unique per tenant/domain)
- Meta Title
- Meta Description
- OG Image URL
- Canonical URL
- Robots (index/noindex toggle)
- Schema Markup (optional JSON-LD textarea)
- HTML Content (Monaco Editor, full-screen mode)
- Published toggle
- Published At (auto-set, displayable)

Preview modes:
- Desktop
- Tablet
- Mobile
(iframe render of HTML in sandboxed environment)

#### Analytics Integration (Global per tenant/reseller)
NOT per-page scripts. Configured once, injected into all pages:
- Google Analytics 4 ID (G-XXXXXXXXXX)
- Google Tag Manager ID (GTM-XXXXXXX)
- Meta Pixel ID
- Custom <head> scripts (sanitized)

#### SEO Automation
After any page publish:
- Auto-regenerate /sitemap.xml
- Auto-update /robots.txt
- Optional: ping Google (https://www.google.com/ping?sitemap=URL)

#### Sitemap
Dynamic endpoint: GET /sitemap.xml
- Lists all published pages for that domain
- Includes: loc, lastmod (published_at), changefreq, priority
- Tenant/reseller specific (domain-aware)

#### Robots.txt
Dynamic: GET /robots.txt
```
User-agent: *
Allow: /
Disallow: /api/
Sitemap: https://{domain}/sitemap.xml
```

#### Security
- HTML content sanitized server-side (DOMPurify equivalent)
- Dangerous scripts stripped
- Pages served from isolated path
- No access to platform cookies from page HTML
- CSP headers on rendered pages

### Media Library
- Upload: images, videos, PDFs, DOCX, SVG, JSON, TXT, AI instruction files
- Folders (create, rename, delete, move)
- Tags per file
- Search by name/tag
- Preview (images inline, others via viewer)
- CDN URL per file (copy button)
- Compression on upload (images)
- Thumbnail generation (images/videos)
- Usage tracking (which pages/emails use this asset)
- Bulk operations (delete, move, tag)

### Custom Domains
- Add domain for reseller's instance
- DNS verification (CNAME or A record)
- SSL auto-provisioned (Let's Encrypt via Nginx)
- Domain status: pending / verified / active / error
- Default domain (platform subdomain as fallback)
- Domain routing: requests to domain → resolve tenant/reseller → serve their content

---

## 15. WHITE-LABEL SYSTEM

### What Resellers Get
- Their own domain (brand.com)
- Their own logo + favicon
- Their own color scheme
- Their own email branding (custom SMTP)
- Their own dashboard title
- Their own landing/marketing pages (CMS)
- Their own plans (they set prices, sell to their sub-tenants)
- Their own billing (they collect payments from tenants)
- Their SuperAdmin panel (scoped)
- Their own support center

### Branding Config (Per Reseller)
- Logo URL (light + dark variant)
- Favicon URL
- Primary color (HEX)
- Secondary color (HEX)
- Accent color (HEX)
- Dashboard title
- Custom CSS override (sanitized)
- Custom fonts (Google Fonts name)

### Branding Injection
On every page load for a reseller's domain:
- Load branding config (cached in Redis, TTL 5min)
- Inject CSS variables
- Replace logo/favicon
- Apply color scheme
- No mention of parent platform (unless reseller allows)

---

## 16. ONBOARDING SYSTEM

### New Tenant Onboarding Flow
```
Signup complete
        ↓
Dashboard shows Quickstart panel
        ↓
Step 1: Connect WhatsApp number
  - Click "Connect"
  - Embedded Signup
  - On success: ✅ Complete

Step 2: Set up your AI
  - Business name/description
  - Tone selection
  - Operating hours
  - On save: ✅ Complete

Step 3: Upload knowledge
  - Add FAQs (Q&A pairs)
  - Or upload document
  - On add: ✅ Complete

Step 4: Create first automation
  - Pre-built templates shown
  - Click to activate
  - On activate: ✅ Complete

Step 5: Invite your team
  - Email invite input
  - Or skip
  - On invite or skip: ✅ Complete
```

Completion shown as progress bar.
Incomplete steps show action button.
AI assistant guides at each step.

### AI Onboarding Assistant
Floating assistant during onboarding:
- Context-aware (knows which step user is on)
- Answers questions about the platform
- Guides setup ("What should I put in the business description?")
- Diagnoses errors ("Why isn't my WhatsApp connecting?")
- Celebrates completions

---

## 17. NOTIFICATION SYSTEM

### Channels
- In-app (realtime, bell icon)
- Email (via Resend/SMTP)
- WhatsApp (via platform number)

### Notification Types
- New unassigned conversation
- Message from contact (when agent not active)
- Automation failed
- Campaign completed
- AI quota warning (80% / 100%)
- Payment failed
- Subscription renewal reminder
- Onboarding reminder
- WhatsApp quality score drop
- Support ticket update
- Team member invite

### Preferences
Per user:
- Enable/disable each notification type
- Channel preference (in-app / email / both)
- Quiet hours (no notifications between X-Y)

### Notification Queue
- All notifications go through queue: notifications:send
- Batching (group multiple in 5min window)
- Priority levels (critical / normal / info)
- Retry on failure

---

## 18. ANALYTICS SYSTEM

### What's Tracked
- messages_sent (per tenant, per number, per day)
- messages_received
- ai_replies_sent
- ai_tokens_used
- ai_cost_usd
- conversations_created
- conversations_resolved
- avg_response_time_seconds
- campaigns_sent
- campaign_delivery_rate
- campaign_read_rate
- campaign_reply_rate
- automation_triggers
- automation_completions
- contacts_created
- onboarding_completion_rate

### Analytics Pipeline
```
Event occurs anywhere in system
        ↓
Push to queue: analytics:events
        ↓
--- WORKER ---
        ↓
Aggregate into daily summaries
        ↓
Store in analytics_events + analytics_daily tables
        ↓
Update realtime counters in Redis
        ↓
Emit WebSocket for live dashboard updates
```

### SuperAdmin Analytics
- Platform-wide revenue (MRR, ARR, churn)
- Per-tenant profitability (revenue vs AI cost)
- Top tenants by usage
- AI cost margins

### Tenant Analytics
- Conversation volume (chart)
- AI response rate
- Campaign performance
- Team performance (per agent)
- Contact growth

---

## 19. SUPPORT TICKET SYSTEM

### Ticket Model
- id, tenant_id
- title, description
- category (billing / technical / whatsapp / ai / other)
- priority (low / medium / high / critical)
- status (open / in_progress / waiting_customer / resolved / closed)
- assigned_to (agent)
- created_by (user or AI)
- sla_due_at
- resolved_at

### Ticket Flow
```
User submits ticket (or AI auto-creates on repeated failure)
        ↓
Priority auto-assigned (based on category + keywords)
        ↓
SLA timer starts
        ↓
Notification to support team
        ↓
AI generates suggested reply (SuperAdmin copilot)
        ↓
Agent reviews + responds
        ↓
On resolve: CSAT survey sent
```

---

## 20. API + WEBHOOK SYSTEM (TENANT-FACING)

### API Keys
- Tenants can generate API keys (controlled by plan)
- Each key has:
  - name
  - scopes (read:messages, write:messages, read:contacts, etc.)
  - expiry (optional)
  - last_used_at
  - usage count
  - IP whitelist (optional)
- Revoke anytime

### Outbound Webhooks
- Tenants can register webhook endpoints
- Subscribe to events (from standard event list)
- Each delivery: signed with HMAC-SHA256
- Retry on failure (exponential backoff, max 5)
- Replay any failed event
- Webhook logs (200 most recent per endpoint)

### API Rate Limits (Plan-based)
- Free: 100 req/day
- Starter: 1,000 req/day
- Pro: 10,000 req/day
- Enterprise: unlimited

---

## 21. SEARCH SYSTEM

### Global Search (CMD+K)
Searches across:
- Contacts (name, phone, email)
- Conversations (last message content)
- Templates (name, content)
- Automations (name)
- Campaigns (name)

Implementation:
- PostgreSQL full-text search (tsvector)
- Indexed on create/update
- Results ranked by relevance + recency
- Debounced 300ms
- Max 10 results per category

---

## 22. COMMAND PALETTE

Shortcut: CMD+K (Mac) / CTRL+K (Windows/Linux)

Capabilities:
- Navigate to any page
- Search contacts
- Open conversation
- Create new automation
- Launch campaign
- Create ticket
- Jump to settings
- Toggle dark/light mode
- Trigger AI actions

---

## 23. SECURITY ARCHITECTURE

### Layers (in order)
1. Rate limiting (per IP, per tenant)
2. JWT validation
3. Tenant extraction + validation
4. RBAC check
5. Feature flag check
6. Input validation (Zod schemas)
7. Business logic
8. Response sanitization

### Secrets Management
- All secrets encrypted at rest (AES-256)
- Environment variables via Docker secrets / .env files
- API keys never returned in full after creation (show once)
- Audit log on every secret access

### Additional Security
- Helmet.js (security headers)
- CSRF protection
- XSS sanitization on all HTML inputs
- SQL injection prevention via Prisma
- Signed S3 URLs (time-limited)
- Session revocation
- Brute force protection (login rate limiting)
- Suspicious login detection (new IP → email alert)

---

## 24. DEPLOYMENT ARCHITECTURE (VPS)

### Docker Services
```yaml
services:
  nginx:       # Reverse proxy + SSL
  web:         # Next.js frontend (tenant dashboard)
  admin:       # Next.js frontend (superadmin)
  api:         # NestJS backend
  worker:      # BullMQ workers
  postgres:    # PostgreSQL
  redis:       # Redis
  minio:       # S3-compatible storage (if not using R2)
```

### Nginx Config
- Routes /api/* → NestJS
- Routes /* → Next.js
- Routes /superadmin/* → Admin Next.js
- Routes /webhooks/whatsapp/* → NestJS (no auth, signature validation only)
- SSL via Certbot
- Custom domain routing via server_name blocks

### CI/CD (GitHub Actions)
```
Push to main branch
        ↓
Run: lint + typecheck + tests
        ↓
Build Docker images
        ↓
Push to registry (GitHub Container Registry)
        ↓
SSH to VPS
        ↓
Pull new images
        ↓
Run: prisma migrate deploy
        ↓
Restart services (zero-downtime with health checks)
        ↓
Run: health checks
        ↓
Notify (Slack/email on success or failure)
```

### Health Checks
Every service exposes: GET /health
Returns:
- status (ok / degraded / down)
- db (connected / disconnected)
- redis (connected / disconnected)
- queue (running / paused)
- uptime

---

## 25. QUEUE SYSTEM (BULLMQ — COMPLETE DEFINITION)

### Queues + Their Jobs

| Queue | Jobs | Retries | Priority |
|-------|------|---------|----------|
| whatsapp:webhook | process_incoming_webhook | 5 | HIGH |
| whatsapp:outgoing | send_message | 3 | HIGH |
| ai:processing | generate_ai_reply | 3 | MEDIUM |
| automation:execution | execute_workflow | 3 | MEDIUM |
| automation:scheduled | run_scheduled_trigger | 3 | MEDIUM |
| billing:webhook | process_payment_webhook | 5 | HIGH |
| billing:retry | retry_failed_payment | 3 | LOW |
| notifications:send | send_notification | 3 | MEDIUM |
| email:send | send_email | 3 | MEDIUM |
| analytics:events | process_analytics_event | 1 | LOW |
| campaigns:send | send_campaign_batch | 3 | MEDIUM |
| media:process | compress_and_store_media | 2 | LOW |
| summary:generate | generate_conversation_summary | 1 | LOW |

### Every Job Must Include
```json
{
  "job_id": "uuid",
  "tenant_id": "uuid",
  "idempotency_key": "string",
  "payload": {},
  "created_at": "timestamp",
  "attempt": 1
}
```

### Failure Handling
- Max retries reached → move to dead-letter queue
- Dead-letter queue: reviewed by SuperAdmin
- Alert on dead-letter queue growth
- Manual replay available from SuperAdmin panel

---

## 26. REALTIME SYSTEM (SOCKET.IO)

### Connection Flow
```
Frontend connects to Socket.IO
        ↓
Server validates JWT
        ↓
Extract user + tenant
        ↓
Join rooms:
  - room:tenant:{tenant_id}
  - room:user:{user_id}
  - room:conversation:{id} (on inbox open)
```

### Events (Server → Client)

| Event | Payload | Description |
|-------|---------|-------------|
| message:new | {conversation_id, message} | New incoming message |
| message:update | {message_id, status} | Message status changed |
| conversation:update | {conversation} | Conversation state changed |
| conversation:assigned | {conversation_id, agent} | Assignment changed |
| ai:typing | {conversation_id} | AI is generating |
| ai:stream | {conversation_id, token} | AI streaming token |
| ai:done | {conversation_id, message} | AI response complete |
| notification:new | {notification} | New notification |
| analytics:update | {metric, value} | Dashboard counter update |
| automation:update | {workflow_id, status} | Automation run update |
| system:alert | {level, message} | System-level alert |

### Frontend Rules
- Reconnect automatically on disconnect
- On reconnect: fetch missed events via REST API (GET /sync?since=timestamp)
- Deduplicate events by event_id
- Optimistic UI for sent messages (update on server confirmation)

---

## 27. ERROR HANDLING SYSTEM

### Backend Error Format
```json
{
  "success": false,
  "error": {
    "code": "WHATSAPP_SEND_FAILED",
    "message": "Failed to send WhatsApp message",
    "cause": "Meta API rate limit exceeded",
    "suggestion": "Wait 60 seconds and retry",
    "retryable": true,
    "support_id": "err_uuid"
  }
}
```

### Frontend Error Handling
Every error shows:
- Clear message (no technical jargon)
- Probable cause
- Suggested fix
- Retry button (if retryable)
- "Get AI Help" button (opens AI copilot with error context)
- Support ticket option (for critical errors)

### Error Categories
- VALIDATION_ERROR — bad input
- AUTH_ERROR — not authenticated
- PERMISSION_ERROR — not authorized
- NOT_FOUND — resource doesn't exist
- QUOTA_EXCEEDED — plan limit reached
- RATE_LIMITED — too many requests
- EXTERNAL_API_ERROR — Meta/AI/Payment provider failed
- INTERNAL_ERROR — unexpected server error

---

## 28. UI DESIGN SYSTEM

### Design Language
- Glassmorphism panels
- Dark mode as primary
- Light mode: clean, soft, premium
- Accent color system (configurable per tenant/reseller)

### Glass Panel Rules
- background: rgba(255,255,255,0.05) dark / rgba(255,255,255,0.7) light
- backdrop-filter: blur(20px)
- border: 1px solid rgba(255,255,255,0.1)
- border-radius: 16px (cards) / 12px (panels) / 8px (buttons)
- box-shadow: 0 8px 32px rgba(0,0,0,0.2)

### Theme System
Themes: Dark / Light / Midnight / Corporate
Accent colors: Blue / Purple / Emerald / Orange / Rose / Cyan / Custom HEX

All colors via CSS variables — theme switch is instant, no reload.

### Motion Rules
- Micro-interactions: 150-250ms ease-out
- Page transitions: 300ms ease-in-out
- Modal open/close: 200ms (fade + slight scale)
- Skeleton shimmer: 1.5s infinite
- No bouncy animations
- No excessive motion

### Required States (EVERY UI element)
- Loading (skeleton or spinner)
- Empty (with guidance + action)
- Error (with message + retry)
- Success (confirmation feedback)
- Disabled (when not available on plan)

### Typography
- Primary: Inter
- Mono: JetBrains Mono (code blocks, IDs)
- Heading scale: 32/24/20/18/16/14px
- Body: 14px, line-height 1.6
- Muted: 12px

---

## 29. PHASE 1 BUILD PRIORITY (STRICT ORDER)

1. Foundation (monorepo, Docker, DB, env)
2. Auth + Tenant system
3. Design system + UI shell
4. WhatsApp integration (Meta Tech Provider)
5. Inbox system (realtime)
6. AI system (provider abstraction + reply flow)
7. AI training (business profile)
8. Automation builder (visual)
9. CRM + Contacts
10. Campaign system
11. Billing (Stripe + Razorpay first)
12. SuperAdmin panel
13. CMS + Pages system
14. White-label + Custom domains
15. Analytics
16. Notifications
17. API + Webhooks
18. Polish + testing + deployment

## 30. PHASE 2 (AFTER LAUNCH)

- RAG / vector knowledge base (pgvector)
- AI agent marketplace
- Plugin system (Shopify, WooCommerce integrations)
- Multi-region infrastructure
- Advanced AI orchestration (agent-to-agent)
- Mobile app (React Native)
- Advanced compliance (GDPR, SOC2)
- Predictive AI recommendations
- A/B testing framework

---

## FINAL ENGINEERING PRINCIPLES

1. Database is ALWAYS updated before queue jobs are dispatched
2. Queue jobs are ALWAYS idempotent
3. Tenant ID is ALWAYS validated — never trusted from client
4. AI NEVER auto-executes destructive actions
5. Payments NEVER processed synchronously in API
6. Secrets NEVER logged or returned after creation
7. Every background job has a dead-letter fallback
8. Every user-facing error has a human-readable explanation
9. Every screen has loading, empty, and error states
10. Multi-tenancy is enforced at every layer — DB, cache, queues, storage, sockets
