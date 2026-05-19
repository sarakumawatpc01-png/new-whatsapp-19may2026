# FILE 3 — DYAD MODULE PROMPTS
# AI-Native WhatsApp SaaS Platform
# One prompt per module. Copy-paste into Dyad. Build in strict order.
# Always reference FILE_1_MASTER_BLUEPRINT.md and FILE_2_PRISMA_SCHEMA.prisma.

---

# GLOBAL CONTEXT (paste this at the start of every new Dyad session)

```
You are building an AI-native, multi-tenant WhatsApp SaaS platform.

Architecture decisions locked:
- Monorepo: /apps/web (Next.js 15), /apps/admin (Next.js 15), /apps/api (NestJS), /apps/worker (BullMQ)
- /packages/database has the Prisma schema (FILE_2_PRISMA_SCHEMA.prisma)
- Stack: Next.js 15 App Router, TypeScript strict, TailwindCSS, shadcn/ui, Framer Motion, Zustand, TanStack Query, React Hook Form + Zod, Socket.IO
- Backend: NestJS modular, Prisma, PostgreSQL, Redis, BullMQ, Socket.IO
- Design: Glassmorphism, dark mode primary, CSS variables for theme, Inter font, no bouncy animations
- Every API follows: validate → store → queue → return fast → worker processes → emit WS event
- Every table query includes tenant_id filter
- Every job includes: job_id, tenant_id, idempotency_key

Do not deviate from FILE_2_PRISMA_SCHEMA.prisma table names or relationships.
Do not add features not listed in FILE_1_MASTER_BLUEPRINT.md.
Do not process heavy work in API layer — push to BullMQ queue.
```

---
---

# MODULE 1 — FOUNDATION + MONOREPO SETUP

```
Set up the complete monorepo foundation for the platform.

Create:

1. Root monorepo structure using Turborepo:
   - /apps/web        (Next.js 15, App Router, TypeScript strict)
   - /apps/admin      (Next.js 15, App Router, TypeScript strict)
   - /apps/api        (NestJS 10, TypeScript strict)
   - /apps/worker     (NestJS 10, BullMQ workers only)
   - /packages/database  (Prisma + schema from FILE_2)
   - /packages/ui        (shadcn/ui shared components)
   - /packages/shared    (types, constants, utils)
   - /packages/config    (env validation, config service)
   - /packages/auth      (JWT helpers, guards, decorators)
   - /packages/ai        (AI provider abstraction — stub for now)
   - /packages/whatsapp  (Meta Cloud API client — stub)
   - /packages/billing   (payment gateway abstractions — stub)

2. /packages/config:
   - Uses zod to validate all env vars on startup
   - Throws hard error if required vars missing
   - .env.example with ALL variables documented:
     DATABASE_URL, REDIS_URL, JWT_SECRET, JWT_REFRESH_SECRET,
     META_APP_ID, META_APP_SECRET, META_VERIFY_TOKEN,
     OPENROUTER_API_KEY (and per-provider keys),
     S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY,
     RESEND_API_KEY, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
     NEXTAUTH_SECRET, NEXTAUTH_URL, NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WS_URL,
     SENTRY_DSN, NODE_ENV, PORT

3. /packages/database:
   - Copy FILE_2_PRISMA_SCHEMA.prisma as schema.prisma
   - Export PrismaClient as singleton
   - Add Prisma middleware that enforces tenant_id on all queries (log warning if tenantId missing)

4. Docker Compose (development):
   - postgres:16
   - redis:7-alpine
   - minio (S3)
   - All apps as services with hot-reload

5. Root package.json scripts:
   - dev, build, lint, typecheck, test, db:migrate, db:studio, db:seed

6. GitHub Actions CI:
   - .github/workflows/ci.yml
   - On PR: lint + typecheck + test
   - On main push: build + deploy workflow (SSH to VPS, docker pull + restart)

7. /packages/shared:
   - Standard API response type: { success, data, error, meta }
   - Error codes enum matching FILE_1 section 27
   - Pagination types
   - All Prisma enum re-exports

Use pnpm workspaces. TypeScript strict mode everywhere. No any types.
```

---

# MODULE 2 — AUTH SYSTEM

```
Build the complete authentication system.

Reference: FILE_1 Section 3 (roles), FILE_2 (User, Session, PasswordReset, VerificationToken tables).

Backend — /apps/api/src/modules/auth:

1. AuthModule with:
   - POST /auth/signup
     - Validate email, password (min 8, 1 upper, 1 number), name
     - Hash password (bcrypt, 12 rounds)
     - Create User (role: TENANT_OWNER)
     - Create Tenant (slug from name, status: TRIALING)
     - Create default Subscription (trial, 14 days)
     - Create default FeatureFlags (all enabled for trial)
     - Create OnboardingStep records (connect_whatsapp, invite_team, create_template, launch_campaign)
     - Send verification email (via /packages/notifications)
     - Emit event: auth.signup
     - Return: { user, tenant, accessToken, refreshToken }

   - POST /auth/login
     - Validate credentials
     - Check if email is verified (return specific error if not)
     - Check if user is active
     - Check if tenant is not SUSPENDED/CANCELLED
     - Create Session record
     - Detect new IP → queue suspicious_login_notification job
     - Return: { user, tenant, accessToken, refreshToken }

   - POST /auth/refresh
     - Validate refreshToken (check Session record, not expired, not revoked)
     - Issue new accessToken
     - Rotate refreshToken (revoke old, create new)

   - POST /auth/logout
     - Revoke session (set revokedAt)

   - POST /auth/forgot-password
     - Create PasswordReset record with token (1 hour expiry)
     - Queue: send_password_reset_email job

   - POST /auth/reset-password
     - Validate token + new password
     - Update passwordHash
     - Revoke all existing sessions
     - Mark token as used

   - GET /auth/verify-email?token=
     - Mark emailVerified
     - Mark token as used

   - GET /auth/me
     - Returns current user + tenant info

2. JWT Strategy:
   - Access token: 15 min expiry
   - Refresh token: 30 days expiry
   - Payload: { sub: userId, tenantId, role, sessionId }
   - JwtAuthGuard (validates token)
   - RolesGuard (validates role hierarchy)
   - TenantGuard (validates tenant_id from token matches resource)

3. Decorators:
   - @CurrentUser() — extract user from request
   - @CurrentTenant() — extract tenant from request
   - @Roles(...roles) — role restriction
   - @Public() — bypass auth

Frontend — /apps/web/src/(auth):
1. /signup page:
   - Multi-step form: (1) Email + Password → (2) Name + Company → (3) Email verification notice
   - Zod schema validation
   - React Hook Form
   - Password strength indicator
   - Animated step transitions (Framer Motion)
   - Show error messages inline

2. /login page:
   - Email + password
   - "Remember me" toggle
   - Forgot password link
   - Error states (wrong password, unverified, suspended)

3. /forgot-password and /reset-password pages

4. Auth store (Zustand):
   - { user, tenant, accessToken, isAuthenticated }
   - Persist to localStorage (encrypted)
   - Auto-refresh token 2 min before expiry
   - Clear on logout

5. Axios/fetch interceptor:
   - Add Authorization header to every request
   - On 401 → attempt refresh → retry request → if fails → logout

Security:
- Rate limit login: 5 attempts per 15 min per IP (Redis)
- Rate limit signup: 3 per hour per IP
- All tokens signed with RS256 (generate key pair)
- bcrypt password hashing (cost 12)
- No password in any log or response ever

Design: Match the glassmorphism design system from FILE_1 Section 28.
Animate the auth pages — clean, premium, subtle.
```

---

# MODULE 3 — DESIGN SYSTEM + UI SHELL

```
Build the complete UI shell and design system.

Reference: FILE_1 Section 28 (design language), Section 22 (command palette).

1. /packages/ui — Shared design system:
   - Configure TailwindCSS with CSS variables for:
     --background, --foreground, --card, --primary, --secondary,
     --accent, --muted, --border, --ring, --radius
   - 4 themes: dark, light, midnight, corporate
   - 6 accent colors: blue, purple, emerald, orange, rose, cyan
   - Glassmorphism utility classes:
     .glass-panel { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; }
   - Typography scale: Inter font, 32/24/20/18/16/14/12px
   - Mono: JetBrains Mono for IDs and code
   - Animation presets: fade-in, slide-up, scale-in (150-300ms ease-out)
   - Shimmer skeleton loader component
   - All shadcn/ui components installed + customized

2. /apps/web/src/app/(dashboard) layout:
   - Sidebar (collapsible, 240px expanded / 64px collapsed)
     - Logo / workspace name
     - Navigation: Inbox, Contacts, Campaigns, Automations, Analytics, Settings
     - User avatar + name at bottom
     - Collapse toggle
     - Active state highlighting
   - TopBar:
     - Page title (breadcrumb)
     - Quick actions (new conversation, new campaign)
     - Notification bell (badge count)
     - AI copilot button
     - Theme toggle
     - User menu
   - Main content area (flex, scrollable)

3. Navigation items (with icons, from lucide-react):
   - Inbox (MessageSquare)
   - Contacts (Users)
   - Campaigns (Megaphone)
   - Automations (Workflow)
   - Analytics (BarChart3)
   - Templates (FileText)
   - Settings (Settings)
   - (Visible based on feature flags from bootstrap)

4. Command Palette (CMD+K):
   - Trigger: CMD+K / CTRL+K
   - Search input (live filtering)
   - Groups: Navigation, Contacts, Conversations, Actions
   - Keyboard navigation (arrow keys + enter)
   - Results from: static nav items + live API search for contacts/conversations
   - Framer Motion animation (scale + fade)

5. Notification panel (slide-out drawer):
   - Bell icon in topbar
   - Red badge with count
   - List of recent notifications
   - Mark all read
   - Click → navigate to resource
   - Realtime updates via Socket.IO

6. Bootstrap flow:
   - On app load: call GET /api/bootstrap
   - Store result in Zustand bootstrapStore
   - Show loading skeleton on first load
   - Refresh bootstrap on window focus (stale > 5 min)

7. Required states for EVERY UI component:
   - Loading: skeleton shimmer
   - Empty: illustration + guidance text + primary action button
   - Error: icon + message + retry button
   - Disabled: grayed out + tooltip explaining why (plan limit, etc.)

8. Onboarding checklist (shown until all steps complete):
   - Sticky banner or sidebar widget
   - Steps: Connect WhatsApp, Invite team, Create template, Launch first campaign
   - Progress bar
   - Dismiss option

All components must be dark mode first, with light mode support.
No hardcoded colors — only CSS variables.
Use Framer Motion for all transitions.
```

---

# MODULE 4 — WHATSAPP INTEGRATION

```
Build the complete WhatsApp integration system.

Reference: FILE_1 Section 7, FILE_2 (WhatsAppNumber, WebhookEvent tables).

Backend — /apps/api/src/modules/whatsapp:

1. /packages/whatsapp client:
   - WhatsAppClient class wrapping Meta Cloud API
   - Methods:
     - sendTextMessage(phoneNumberId, to, text, replyToId?)
     - sendTemplateMessage(phoneNumberId, to, templateName, language, components)
     - sendMediaMessage(phoneNumberId, to, type, mediaId, caption?)
     - sendInteractiveMessage(phoneNumberId, to, interactive)
     - sendReaction(phoneNumberId, to, messageId, emoji)
     - markAsRead(phoneNumberId, messageId)
     - uploadMedia(phoneNumberId, file, mimeType)
     - getMediaUrl(mediaId, accessToken)
     - getPhoneNumberInfo(phoneNumberId, accessToken)
     - getWABAInfo(wabaId, accessToken)
   - All methods handle rate limiting (queue retry)
   - All methods log requests/responses for debugging

2. Webhook endpoint: POST /webhooks/whatsapp/:tenantId
   - NO auth middleware (Meta sends this)
   - Verify X-Hub-Signature-256 (HMAC-SHA256 using app secret)
   - Idempotency: check WebhookEvent table by wam_id → skip if PROCESSED
   - Store raw payload → WebhookEvent table
   - Push job to whatsapp:webhook queue
   - Return 200 immediately

3. Webhook GET handler: GET /webhooks/whatsapp/:tenantId
   - Hub challenge verification for Meta

4. WhatsApp webhook worker (in /apps/worker):
   - Queue: whatsapp:webhook
   - Parse incoming webhook (messages, statuses, reactions)
   - For new message:
     - Find or create Contact by phone
     - Find or create Conversation
     - Create Message record
     - Update conversation: lastMessageAt, windowOpenAt, windowClosesAt (+24h)
     - Emit WS event: message:new
     - Push job to ai:processing queue (if AI enabled for this number)
     - Push job to automation:execution queue (check triggers)
   - For status update (sent/delivered/read/failed):
     - Update Message.status
     - Emit WS event: message:update

5. REST endpoints:
   - GET /whatsapp/numbers — list tenant's numbers
   - POST /whatsapp/numbers — add number (stores phoneNumberId + accessToken)
   - DELETE /whatsapp/numbers/:id — disconnect
   - GET /whatsapp/numbers/:id/health — quality rating, messaging tier
   - POST /whatsapp/numbers/:id/business-profile — update profile

6. Meta Embedded Signup:
   - GET /whatsapp/embedded-signup/url — returns Meta OAuth URL
   - POST /whatsapp/embedded-signup/callback — exchange code for token, store WABA + phone IDs

Frontend — /apps/web/src/app/(dashboard)/settings/whatsapp:
1. WhatsApp Numbers page:
   - List connected numbers with status badges (ACTIVE/DISCONNECTED/FLAGGED)
   - Quality rating indicator (GREEN/YELLOW/RED)
   - Messaging tier display
   - "Connect New Number" button → Embedded Signup flow (Meta popup)
   - Per-number: settings, disconnect, business profile edit

2. Connection flow (Embedded Signup):
   - Launch Meta popup via FB.init
   - Handle postMessage callback
   - Show progress spinner while verifying
   - Success → show number in list with animation

3. Business Profile editor:
   - About, address, description, email, website, category
   - Avatar upload (to S3)

Every webhook event must be idempotent. Re-processing same event must be safe.
```

---

# MODULE 5 — INBOX (REALTIME CONVERSATION SYSTEM)

```
Build the complete realtime inbox.

Reference: FILE_1 Sections 5, 8, 13, 26, FILE_2 (Conversation, Message, ConversationNote tables).

Backend — /apps/api/src/modules/conversations + messages:

1. Conversations endpoints:
   - GET /conversations
     - Filters: status, assignedTo, inboxId, tags, search, dateRange
     - Pagination (cursor-based)
     - Include: lastMessage, contact, unreadCount, assignedAgent
   - GET /conversations/:id — full conversation with messages
   - PATCH /conversations/:id — update status, assignee, snooze
   - POST /conversations/:id/assign — assign to agent
   - POST /conversations/:id/resolve
   - POST /conversations/:id/reopen
   - POST /conversations/:id/transfer — transfer to different inbox
   - GET /conversations/sync?since=timestamp — for WS reconnect missed events

2. Messages endpoints:
   - GET /conversations/:id/messages — paginated, cursor-based
   - POST /messages/send
     - Validate: check conversation window is open (24h)
     - Store message (status: PENDING)
     - Push to whatsapp:outgoing queue
     - Return message immediately (optimistic)
   - POST /messages/send-template
     - Can send outside 24h window
   - DELETE /messages/:id — soft delete

3. Notes endpoints:
   - POST /conversations/:id/notes
   - GET /conversations/:id/notes
   - DELETE /notes/:id

4. Outgoing message worker (whatsapp:outgoing queue):
   - Call Meta API to send
   - Update message status: SENT
   - On success: store metaMessageId, update sentAt
   - On failure: update status FAILED, store failureReason
   - Emit WS: message:update

5. Socket.IO Gateway (NestJS WebSocket):
   - Authenticate on connect (JWT in handshake)
   - Join rooms: room:tenant:{tenantId}, room:user:{userId}
   - On inbox open: join room:conversation:{id}
   - On inbox close: leave room
   - Events emitted to clients: (see FILE_1 Section 26)
   - Typing indicator: user:typing → broadcast to other agents in same room

Frontend — /apps/web/src/app/(dashboard)/inbox:

1. Three-column layout:
   - Column 1 (320px): Conversation list
     - Tab bar: All / Mine / Unassigned / Bots / Resolved
     - Search input
     - Each item: contact avatar, name, phone, last message preview, time, unread badge, assigned agent
     - Lazy load / virtual scroll for large lists
     - Realtime updates (new conversations rise to top)
   - Column 2 (flex): Chat window
     - Message bubbles (inbound left, outbound right)
     - Message types: text, image (lightbox), video, audio player, document (download), location map, sticker
     - Message status icons (pending/sent/delivered/read)
     - AI typing indicator (animated dots)
     - Streaming AI response (token by token)
     - Quick replies bar at bottom
     - Message input area:
       - Text input (multiline)
       - Emoji picker
       - File attachment
       - Template picker
       - AI draft suggestion button
       - Send button
     - Conversation window warning (expires in Xh Xm)
     - Infinite scroll up (load older messages)
   - Column 3 (280px): Context panel
     - Contact info (name, phone, tags)
     - Conversation details (status, assigned, created)
     - Tags (add/remove)
     - Private notes
     - AI summary
     - Quick actions (resolve, assign, snooze)
     - Related tickets
     - Conversation history (other conversations with same contact)

2. Conversation filters (sidebar):
   - My conversations
   - Unassigned
   - All open
   - By label/tag
   - By inbox
   - Snoozed
   - Resolved

3. Optimistic UI:
   - Message appears immediately on send (pending state)
   - Updates in real time via Socket.IO
   - Rollback on failure with error toast

4. Reconnection handling:
   - Socket.IO auto-reconnect
   - On reconnect: call GET /conversations/sync?since=lastEventTimestamp
   - Apply missed updates to local state

Use TanStack Query for server data.
Use Zustand for UI state (active conversation, filters, typing).
Virtual scroll for message list (windowing for performance).
```

---

# MODULE 6 — AI ENGINE

```
Build the complete AI engine.

Reference: FILE_1 Section 6 (AI Engine Workflow), FILE_1 Section 10 (cost control), FILE_2 (AIConfig, AIMemory, AIUsageLog, AIProviderKey tables).

Backend — /apps/api/src/modules/ai + /packages/ai:

1. /packages/ai — Provider Abstraction Layer:
   - AIProviderFactory (creates correct provider by enum)
   - BaseAIProvider interface:
     - generateReply(messages[], systemPrompt, options): AsyncGenerator<string>  (streaming)
     - generateSummary(messages[]): Promise<string>
     - estimateTokens(text): number
   - Concrete providers:
     - OpenRouterProvider (handles all OpenRouter models)
     - OpenAIProvider
     - AnthropicProvider
     - GoogleProvider (Gemini)
     - GroqProvider
     - DeepSeekProvider
     - QwenProvider
     - OllamaProvider (local, no key needed)
   - Each provider handles its own error mapping → standard AIError

2. AI Config Resolution (hierarchy):
   Priority: NumberConfig > TenantConfig > ResellerDefault > GlobalDefault
   - loadAIConfig(tenantId, numberId?): resolved AIConfig
   - Cached in Redis: key = ai_config:{tenantId}:{numberId?}, TTL 5 min

3. AI Processing Worker (ai:processing queue):
   Input: { tenantId, conversationId, messageId, trigger }

   Steps:
   a. Load resolved AI config
   b. Check AI enabled (featureFlag + config.autoReplyEnabled)
   c. Check quota (AIUsageLog for current month vs plan limit)
      - If exceeded: skip or use fallback model
   d. Load short-term context: last N messages (config.shortTermLimit)
   e. Load long-term memory: latest AIMemory for contact
   f. Load AI training documents (active docs for tenant)
   g. Build system prompt:
      ```
      {businessInstructions}
      
      Context about this customer:
      {longTermSummary}
      
      Knowledge base:
      {trainingDocuments}
      
      Rules:
      - Reply in the same language as customer
      - Keep replies concise (max 3 sentences unless explanation needed)
      - If you cannot answer, say so and offer to connect to a human
      - Never make up information
      ```
   h. Apply auto-reply delay (config.autoReplyDelay seconds — check if agent replied in that window, if so skip)
   i. Send streaming request to provider
   j. Stream tokens → emit WS event: ai:stream {token} to room:conversation:{id}
   k. On completion: store Message (isAiGenerated: true)
   l. Push message to whatsapp:outgoing queue
   m. Store AIUsageLog (tokens, cost estimate, model, latency)
   n. Emit WS event: ai:done
   o. Check if summary needed (messageCount > config.summarizeAfter)
      → Push job to summary:generate queue

4. Summary Worker (summary:generate queue):
   - Load last N messages for contact (since last summary)
   - Call AI: generate 3-paragraph summary of conversation context
   - Store AIMemory record
   - Update conversation.summary

5. REST endpoints:
   - GET /ai/config — get tenant AI config
   - PUT /ai/config — update AI config
   - GET /ai/training-documents — list docs
   - POST /ai/training-documents — create
   - PUT /ai/training-documents/:id
   - DELETE /ai/training-documents/:id
   - POST /ai/test — test current config with a message
   - GET /ai/usage — usage stats for current month
   - POST /ai/conversations/:id/generate — manually trigger AI reply
   - POST /ai/conversations/:id/pause — pause AI for this conversation
   - POST /ai/conversations/:id/resume

6. Human Handoff logic:
   - After AI generates response: check confidence (prompt model to return 0-1 score)
   - If confidence < threshold OR escalation keyword detected:
     - Do NOT send AI reply
     - Set conversation.aiPaused = true, humanTookOver = false (waiting for agent)
     - Emit WS: conversation:needs_attention
     - Send in-app notification to available agents
     - Optionally send configured escalationMessage to customer

Frontend — /apps/web/src/app/(dashboard)/settings/ai:

1. AI Configuration page:
   - Provider selector (radio cards with logos)
   - Model selector (dropdown, filtered by provider)
   - API key input (use platform key or own key toggle)
   - System prompt editor (Monaco Editor, full screen option)
   - Auto-reply toggle + delay slider (0-30 seconds)
   - Confidence threshold slider
   - Escalation keywords (tag input)
   - Escalation message textarea
   - Test panel: type a message → see AI response live

2. Training Documents page:
   - List of documents (name, type, last updated)
   - Add document: name, type selector, content textarea
   - Edit / delete
   - Active/inactive toggle

3. AI Usage widget (on analytics page):
   - Tokens used / total limit (progress bar)
   - Cost estimate this month
   - Requests today/week/month
   - Top models used

Cost control: Block AI call if monthly token quota exceeded. Log to AIUsageLog ALWAYS, even on failure.
Never expose API keys in any response (show last 4 chars only).
```

---

# MODULE 7 — AUTOMATION BUILDER

```
Build the visual automation workflow engine.

Reference: FILE_1 Section 7 (Automation Engine Workflow), FILE_2 (Automation, AutomationRun tables).

Backend — /apps/api/src/modules/automations:

1. CRUD endpoints:
   - GET /automations — list (with run stats)
   - POST /automations — create (status: DRAFT by default)
   - GET /automations/:id — full workflow with nodes/edges
   - PUT /automations/:id — update (trigger, nodes, edges, name)
   - DELETE /automations/:id
   - PATCH /automations/:id/status — activate/deactivate
   - GET /automations/:id/runs — paginated run history
   - POST /automations/:id/test — trigger with mock payload

2. Trigger system (event matching):
   - On every relevant event, check active automations with matching trigger
   - Triggers: MESSAGE_RECEIVED, KEYWORD_MATCH, TAG_ADDED, TAG_REMOVED,
     CONTACT_CREATED, INACTIVITY (cron), SCHEDULED (cron), CONVERSATION_ASSIGNED,
     CONVERSATION_RESOLVED, BUTTON_CLICKED, FLOW_SUBMITTED
   - Keyword matching: exact, contains, regex, starts_with
   - Filter conditions: contact fields, tags, time-of-day, conversation status

3. Automation execution worker (automation:execution queue):
   Input: { tenantId, automationId, conversationId, contactId, trigger, payload }

   Flow:
   a. Load automation (nodes + edges graph)
   b. Create AutomationRun record (RUNNING)
   c. Start execution from TRIGGER node
   d. Execute each node in sequence following edges
   e. Store each node result in run.nodeResults
   f. Handle errors per node (retry vs fail-fast based on node config)
   g. On completion: update run status, emit WS: automation:update

4. Node executors (one function per node type):

   SEND_MESSAGE: send text via WhatsApp
   SEND_TEMPLATE: send approved template with variable mapping
   CONDITION: evaluate condition → route to true/false branch
     - Operators: equals, contains, starts_with, is_empty, greater_than, has_tag, field_matches
   WAIT_DELAY: schedule next node via BullMQ delayed job (minutes/hours/days)
   WAIT_UNTIL: wait until specific time (8am, next Monday, etc.)
   ASSIGN_AGENT: assign conversation to agent (round-robin or specific)
   ASSIGN_TAG: add tag to contact
   REMOVE_TAG: remove tag from contact
   UPDATE_CONTACT: update contact field
   CREATE_TICKET: create support ticket
   CALL_WEBHOOK: POST to external URL (with payload template)
   AI_REPLY: trigger AI engine for this conversation
   HUMAN_HANDOFF: pause bot, notify agents
   END_FLOW: stop execution

5. Scheduled trigger worker (automation:scheduled queue):
   - Cron: every minute
   - Find automations with SCHEDULED or INACTIVITY trigger
   - For INACTIVITY: find conversations with no activity since X hours → trigger
   - Push execution jobs for matching records

Frontend — /apps/web/src/app/(dashboard)/automations:

1. Automation list page:
   - Cards: name, trigger type, status badge (ACTIVE/INACTIVE/DRAFT)
   - Stats: total runs, success rate, last run
   - Quick toggle (activate/deactivate)
   - Create / Edit / Delete / Duplicate actions
   - Filter by trigger type, status

2. Visual Builder (/automations/:id/builder):
   Use React Flow (reactflow) for the drag-drop canvas.
   
   Canvas:
   - Infinite canvas, zoom in/out, pan
   - Minimap (bottom-right)
   - Grid background
   - Snap-to-grid

   Left panel — Node library (drag onto canvas):
   - Grouped: Triggers, Actions, Conditions, Flow Control
   - Each node: icon, name, description

   Node types (visual cards on canvas):
   - Each node has: header (icon + type), config summary, input handle, output handle(s)
   - CONDITION node: two output handles (true/false)
   - Colored by category: green=trigger, blue=action, orange=condition, gray=flow

   Right panel — Node configuration (click node to open):
   - TRIGGER: trigger type selector, conditions, filters
   - SEND_MESSAGE: message content (supports variables: {{contact.name}}, {{contact.phone}})
   - SEND_TEMPLATE: template picker, variable mapping
   - CONDITION: field selector, operator, value
   - WAIT_DELAY: delay input (number + unit: minutes/hours/days)
   - ASSIGN_AGENT: agent picker
   - ASSIGN_TAG: tag multi-select
   - CALL_WEBHOOK: URL input, method, headers, body template

   Save: auto-save on node change (debounced 2s)
   Toolbar: Undo, Redo, Zoom controls, Save, Activate/Deactivate

3. Run History (/automations/:id/runs):
   - Table: startedAt, contact, status, duration, triggered by
   - Click row → expand node-by-node execution trace
   - Status: RUNNING (spinner), COMPLETED (green), FAILED (red with error)

Variable system: {{contact.name}}, {{contact.phone}}, {{contact.email}},
{{conversation.id}}, {{message.content}}, {{today}}, {{time}}, {{tenant.name}}
```

---

# MODULE 8 — CRM + CONTACTS

```
Build the complete CRM and contacts system.

Reference: FILE_1 Section 9 (CRM layer), FILE_2 (Contact, CustomField, Tag, Deal, Pipeline tables).

Backend — /apps/api/src/modules/contacts + crm:

1. Contacts endpoints:
   - GET /contacts
     - Full-text search (name, phone, email, company)
     - Filters: tags, optStatus, dateRange, hasDeals, customField conditions
     - Sort: createdAt, lastSeenAt, name, totalMessages
     - Pagination (cursor-based)
   - GET /contacts/:id — full profile with conversations, deals, tags, notes
   - POST /contacts — create (check duplicate phone per tenant)
   - PUT /contacts/:id — update
   - DELETE /contacts/:id — soft delete (GDPR: set deletedAt, anonymize PII)
   - POST /contacts/import — bulk import from CSV
   - GET /contacts/export — export CSV (queue job, email when ready)
   - POST /contacts/:id/opt-out — mark OPTED_OUT
   - POST /contacts/:id/opt-in — mark OPTED_IN
   - POST /contacts/:id/block
   - POST /contacts/:id/unblock

2. Tags endpoints:
   - GET /tags
   - POST /tags — { name, color }
   - PUT /tags/:id
   - DELETE /tags/:id — removes from all contacts
   - POST /contacts/:id/tags — add tags to contact
   - DELETE /contacts/:id/tags/:tagId

3. Custom fields endpoints:
   - GET /custom-fields
   - POST /custom-fields — { key, label, fieldType, options }
   - PUT /custom-fields/:id
   - DELETE /custom-fields/:id
   - PATCH /contacts/:id/custom-fields — update contact's custom field values

4. Notes:
   - GET /contacts/:id/notes
   - POST /contacts/:id/notes
   - DELETE /notes/:id

5. CRM — Pipeline + Deals:
   - GET /pipelines — list with stages
   - POST /pipelines
   - PUT /pipelines/:id
   - DELETE /pipelines/:id
   - POST /pipelines/:id/stages
   - PUT /stages/:id
   - DELETE /stages/:id
   - GET /deals — list with filters
   - POST /deals
   - PUT /deals/:id
   - PATCH /deals/:id/stage — move deal to stage
   - DELETE /deals/:id

6. Contact deduplication:
   - On contact create/import: check phone uniqueness per tenant
   - If duplicate: return existing contact or merge option

Frontend — /apps/web/src/app/(dashboard)/contacts:

1. Contacts list page:
   - Table view AND Kanban view (toggle)
   - Table: avatar, name, phone, company, tags, lastSeen, optStatus, conversations count
   - Inline tag editing
   - Bulk actions: tag, export, opt-out, delete
   - Advanced filter builder (field + operator + value, multiple conditions)
   - Quick search bar
   - Import CSV button (drag-drop)
   - Export button

2. Contact profile page (/contacts/:id):
   Three-column layout:
   - Left: Contact card (avatar, name, phone, email, company, tags, optStatus)
     - Edit button → inline edit
     - Custom fields section
     - Add note button
   - Center: Timeline (all interactions chronologically)
     - Conversations (with preview + link)
     - Notes
     - Tag changes
     - Campaigns received
   - Right: Quick actions
     - Send message
     - Add to campaign
     - Add to sequence
     - Create ticket
     - Active deals

3. Custom Fields settings (/settings/custom-fields):
   - List of fields (key, label, type, required)
   - Drag to reorder
   - Add/edit/delete field
   - Field type icons

4. Pipeline/CRM page (/crm):
   - Kanban board (drag-drop between stages)
   - Each card: contact, deal title, value, assigned agent
   - Add deal button (per stage or global)
   - Filter by pipeline, assignee, value range
   - Pipeline settings (manage stages)

5. Tags page (/settings/tags):
   - Color-coded tag list
   - Usage count per tag
   - Create / rename / recolor / delete

Import: Support CSV with column mapping UI.
Export: Push to background job, notify by email when ready.
GDPR delete: Anonymize contact data but preserve analytics counts.
```

---

# MODULE 9 — CAMPAIGNS (BROADCAST)

```
Build the complete broadcast campaign system.

Reference: FILE_1 Section 11 (Campaigns), FILE_2 (Campaign, CampaignRecipient, Template tables).

Backend — /apps/api/src/modules/campaigns + templates:

1. Template endpoints:
   - GET /templates — list by status
   - POST /templates — create draft
   - PUT /templates/:id — update draft
   - DELETE /templates/:id
   - POST /templates/:id/submit — submit to Meta for approval
   - GET /templates/:id/status — poll Meta approval status
   - POST /templates/sync — sync status from Meta (run by cron)

2. Campaign endpoints:
   - GET /campaigns — list with stats
   - POST /campaigns — create draft
   - PUT /campaigns/:id — update
   - DELETE /campaigns/:id (DRAFT only)
   - POST /campaigns/:id/schedule — set scheduledAt
   - POST /campaigns/:id/launch — launch immediately
   - POST /campaigns/:id/pause
   - POST /campaigns/:id/cancel
   - GET /campaigns/:id/analytics — delivery stats, opt-outs, replies
   - GET /campaigns/:id/recipients — paginated list with per-contact status

3. Campaign sending worker (campaigns:send queue):
   Input: { tenantId, campaignId }
   
   Steps:
   a. Load campaign + template + recipients (PENDING)
   b. Check WhatsApp number status
   c. Batch recipients (config.batchSize, default 50)
   d. For each batch:
      - Send template to each contact via Meta API
      - Update CampaignRecipient status per result
      - Delay between batches (config.batchDelay ms, respecting Meta rate limits)
      - On opt-out reply → mark contact OPTED_OUT globally
   e. Update campaign stats (sentCount, deliveredCount, etc.) via increment
   f. On completion: update status COMPLETED, emit WS: analytics:update

4. Scheduled campaign cron:
   - Every minute: find campaigns where scheduledAt <= now AND status = SCHEDULED
   - Push to campaigns:send queue

5. Opt-out handler (in webhook worker):
   - Detect STOP / UNSUBSCRIBE / OPT-OUT keywords in incoming messages
   - Set Contact.optStatus = OPTED_OUT, optedOutAt = now
   - Increment campaign.optOutCount if message is reply to campaign

Frontend — /apps/web/src/app/(dashboard)/campaigns:

1. Campaign list page:
   - Status tabs: All, Draft, Scheduled, Running, Completed, Failed
   - Cards: name, template, status, stats (sent/delivered/read), scheduledAt/completedAt
   - Create campaign button
   - Quick actions: edit, duplicate, cancel, view analytics

2. Campaign builder (/campaigns/new + /campaigns/:id):
   Step 1 — Setup:
   - Campaign name
   - WhatsApp number selector
   - Template selector (approved templates only, with preview)
   - Variable mapping (if template has variables)
   
   Step 2 — Audience:
   - Target type: All contacts, By tags (multi-select), Custom filter, CSV upload
   - Preview: count of recipients
   - Exclude opted-out contacts (auto, cannot disable)
   
   Step 3 — Schedule:
   - Send now OR Schedule for later (datetime picker)
   - Estimated delivery time
   
   Step 4 — Review:
   - Summary of all settings
   - Recipient count
   - Template preview
   - Launch / Schedule button

3. Campaign Analytics (/campaigns/:id/analytics):
   - Funnel chart: Total → Sent → Delivered → Read → Replied
   - Opt-out count + rate
   - Delivery timeline chart (messages over time)
   - Recipients table with individual status

4. Template Manager (/templates):
   - List: name, category, status badge (APPROVED/PENDING/REJECTED)
   - Create template button
   - Template preview pane (WhatsApp-style preview on right)
   
5. Template Builder (/templates/new + /templates/:id):
   - Template name (lowercase_with_underscores)
   - Category: Marketing / Utility / Authentication
   - Language: English (en)
   - Components builder:
     - Header: None / Text / Image / Video / Document
     - Body: textarea with {{1}} variable insertion, character count
     - Footer: optional text
     - Buttons: Quick Reply (up to 3) / Call to Action (URL/Phone)
   - Live WhatsApp-style preview (right panel, updates as you type)
   - Submit for approval button (Meta API call)
   - Status + rejection reason shown

Meta rate limit: 1000 marketing templates per phone per day. Enforce in worker.
Never send to OPTED_OUT contacts. Check at send time, not just at campaign creation.
```

---

# MODULE 10 — BILLING

```
Build the complete multi-gateway billing system.

Reference: FILE_1 Section 9 (Billing Workflow), FILE_2 (Plan, Subscription, Invoice, Coupon tables).

CRITICAL RULE: Database is ALWAYS source of truth. Never trust gateway state alone.
Subscription state machine: TRIALING → ACTIVE → PAST_DUE → GRACE_PERIOD → CANCELLED

Backend — /apps/api/src/modules/billing:

1. Plan endpoints (public, no auth):
   - GET /plans — list active public plans (with features)
   - GET /plans/:id

2. Subscription endpoints (authenticated):
   - GET /billing/subscription — current subscription details
   - POST /billing/checkout — create checkout session
     - Input: { planId, interval, gateway, couponCode }
     - Return: { checkoutUrl } (redirect to gateway)
   - POST /billing/portal — create customer portal session (Stripe/Razorpay)
   - POST /billing/cancel — set cancelAtPeriodEnd = true
   - POST /billing/reactivate — cancel the cancellation
   - GET /billing/invoices — list invoices
   - GET /billing/invoices/:id — invoice detail + PDF link

3. Gateway webhook handlers (no auth, signature verification only):
   - POST /webhooks/stripe
   - POST /webhooks/razorpay
   - POST /webhooks/paypal
   - Each handler:
     - Verify signature
     - Check idempotency (WebhookEvent table by gateway event ID)
     - Store raw event
     - Push to billing:webhook queue
     - Return 200 immediately

4. Billing webhook worker (billing:webhook queue):
   - Handle these events:
     - payment_intent.succeeded / order.paid:
       → Set subscription ACTIVE, update currentPeriodStart/End
       → Reset usage counters
       → Generate invoice
       → Send receipt email
       → Emit billing.payment.success event
     - invoice.payment_failed / payment failed:
       → Set subscription PAST_DUE
       → Set graceEndsAt = now + 3 days
       → Send payment failed email
       → Schedule billing:retry job
     - customer.subscription.deleted / cancelled:
       → Set subscription CANCELLED
       → Set tenant status CANCELLED
       → Suspend features (update featureFlags)
       → Send cancellation email
     - trial ends:
       → Send upgrade reminder email 3 days before
       → On day 0: set PAST_DUE if no payment
   - billing:retry worker:
     → Check if graceEndsAt passed → set CANCELLED
     → If still in grace: send reminder email

5. /packages/billing — Gateway abstractions:
   - BillingProvider interface:
     - createCheckoutSession(params): Promise<{ checkoutUrl }>
     - createCustomerPortalSession(customerId): Promise<{ url }>
     - constructWebhookEvent(payload, signature): BillingEvent
   - StripeProvider
   - RazorpayProvider
   - PayPalProvider
   - BillingProviderFactory

6. Usage enforcement middleware:
   - On API requests check UsageLog vs plan limits
   - Messages: check monthly messages_sent
   - AI: check monthly ai_tokens
   - Return 429 QUOTA_EXCEEDED if exceeded
   - Cache limit checks in Redis (60 second TTL)

Frontend — /apps/web/src/app/(dashboard)/settings/billing:

1. Billing page:
   - Current plan card: name, price, features, renewal date, status badge
   - Usage meters: messages, AI tokens, contacts, storage (progress bars)
   - Upgrade button (if not on highest plan)
   - Cancel subscription link

2. Pricing page (/pricing — public):
   - Plan comparison table (fetched from /plans)
   - Monthly/Yearly toggle (show savings %)
   - Highlight popular plan
   - Feature comparison grid
   - Gateway selector on checkout

3. Invoice history:
   - Table: date, description, amount, status (PAID/FAILED/VOID)
   - Download PDF button per invoice

4. Upgrade modal (shown when feature is locked):
   - Plan comparison
   - One-click upgrade
   - Gateway selection

SuperAdmin — /apps/admin plan management:
- CRUD plans (globally + per reseller)
- Set limits per plan
- Override tenant subscription
- View all subscriptions + revenue
- Manual invoice generation
```

---

# MODULE 11 — SUPERADMIN PANEL

```
Build the complete SuperAdmin panel (/apps/admin).

Reference: FILE_1 Section 3 (SUPER_ADMIN role), all modules.

This is a separate Next.js app (apps/admin) with its own auth.
Only users with role = SUPER_ADMIN can access.

Backend additions — add to /apps/api/src/modules/admin:
All routes prefixed /admin/* — guarded by SuperAdminGuard.

1. Dashboard: GET /admin/stats
   - Total tenants (active, trialing, suspended, cancelled)
   - MRR, ARR, new MRR this month
   - Total messages today / this month
   - AI token usage + cost
   - Active users
   - Dead letter queue count
   - System health (db, redis, queues)

2. Tenants: GET/POST/PUT/DELETE /admin/tenants
   - List with filters (status, plan, reseller, dateRange)
   - View tenant details (all their settings, users, usage)
   - Impersonate tenant (generate limited JWT for tenant)
   - Override subscription (manually set plan/status)
   - Suspend / unsuspend
   - Delete (with confirmation, cascades)

3. Resellers: GET/POST/PUT/DELETE /admin/resellers
   - CRUD resellers
   - View their tenants
   - Configure branding (logo, colors, domain)
   - Configure SMTP

4. Plans: GET/POST/PUT/DELETE /admin/plans
   - CRUD plans (global + per reseller)
   - Set all limits and feature toggles

5. AI Provider Keys: GET/POST/PUT /admin/ai-keys
   - Manage global API keys per provider
   - Set monthly budget limit
   - View current spend
   - Rotate keys

6. Dead Letter Queue: GET /admin/dead-letter
   - List failed jobs
   - View job payload + error
   - Replay job
   - Discard job

7. Webhook Events: GET /admin/webhook-events
   - List by source + status
   - Replay event

8. System Config: GET/PUT /admin/system-config
   - Key-value settings (Meta app ID/secret, default AI config, etc.)

9. Audit Log: GET /admin/audit-logs
   - Full audit trail with filters

10. Pages/CMS: GET/POST/PUT/DELETE /admin/pages
    - CRUD pages (global)

Frontend — /apps/admin:

1. Dashboard:
   - Stats cards (tenants, MRR, messages, AI usage)
   - Recent signups
   - Dead letter queue alert (red banner if > 0)
   - System health grid

2. Tenants list:
   - Table: name, plan, status, agents, messages, AI tokens, created, reseller
   - Filters + search
   - Row actions: view, impersonate, suspend, delete
   - CSV export

3. Tenant detail page:
   - All info
   - Usage meters
   - Subscription history
   - Override controls
   - Impersonate button

4. Reseller management:
   - List + create/edit
   - Per reseller: their tenants, branding config, plans

5. Plan management:
   - Table of all plans
   - Edit limits inline
   - Create plan wizard

6. AI Provider Keys:
   - Cards per provider
   - Usage progress bars
   - Key rotation

7. Dead Letter Queue:
   - List with error preview
   - Replay / discard actions

8. System Config:
   - Form for all system-level settings

9. CMS Pages:
   - List with slug, status, last edited
   - Monaco editor for HTML content
   - SEO fields
   - Pixel/script injection

Admin panel uses same design system but darker, more data-dense layout.
No end-user feature tour. Pure operations UI.
```

---

# MODULE 12 — CMS + PAGES

```
Build the page/CMS system.

Reference: FILE_1 (CMS section), FILE_2 (Page table).

Backend — /apps/api/src/modules/pages:

1. Endpoints:
   - GET /pages — list pages for current reseller (or superadmin global)
   - GET /pages/:slug — get page by slug (public, no auth needed)
   - POST /pages — create
   - PUT /pages/:id — update
   - DELETE /pages/:id
   - POST /pages/:id/publish — set status = PUBLISHED, publishedAt = now
   - POST /pages/:id/unpublish
   - GET /sitemap.xml — auto-generated sitemap for reseller domain

2. Page rendering:
   - GET /p/:slug — renders page HTML from database
   - Injects: GA tracking, Meta pixel, custom head/body code
   - Sets SEO meta tags
   - Returns full HTML (server-rendered)

3. Tenant homepage:
   - GET /pages/homepage — returns isHomepage: true page for domain

Frontend — /apps/admin/src/app/pages + /apps/web/src/app/(dashboard)/pages:

SuperAdmin pages manager:
1. Pages list:
   - Table: title, slug, status, publishedAt, views
   - Create / Edit / Delete / Publish / Unpublish

2. Page editor:
   - Title input
   - Slug input (auto-derived from title, editable)
   - Monaco Editor (HTML content) — full screen
   - CSS panel (optional override)
   - SEO panel:
     - Meta title, description, keywords
     - OG image upload
     - Canonical URL
   - Scripts panel:
     - GA Tracking ID
     - Meta Pixel ID
     - Custom <head> code
     - Custom <body> code
   - Preview button (open in new tab)
   - Publish / Save draft button

Tenant (white-label reseller) pages:
- Same UI scoped to reseller
- Can only manage their own domain's pages
- Cannot see SuperAdmin global pages

Slug uniqueness: per reseller_id.
HTML sanitization: allow full HTML (admin-only, trusted users).
Auto-generate /sitemap.xml listing all published pages.
```

---

# MODULE 13 — WHITE-LABEL + CUSTOM DOMAINS

```
Build the white-label and custom domain system.

Reference: FILE_1 Section 4 (Multi-tenancy), FILE_2 (Reseller table).

Backend:

1. Domain resolution middleware (NestJS):
   - On every request: extract host header
   - If host matches a Reseller.customDomain → set req.resellerId
   - If host is main platform domain → resellerId = null (SuperAdmin context)
   - Cache domain → resellerId mapping in Redis (TTL 5 min)

2. Bootstrap endpoint adaptation:
   - GET /bootstrap includes reseller branding:
     { logo, primaryColor, accentColor, theme, hidePoweredBy, customDomain }
   - Frontend applies this to CSS variables on load

3. Reseller endpoints:
   - PUT /admin/resellers/:id/domain — set customDomain, verify DNS
   - GET /admin/resellers/:id/domain/verify — check DNS CNAME record

Frontend:

1. Domain resolution in Next.js:
   - middleware.ts: read x-forwarded-host
   - Pass resellerId to layout via headers/cookies
   - Apply reseller branding CSS variables in root layout

2. Branding system:
   - On bootstrap response: set CSS variables:
     --primary: {reseller.brandingConfig.primaryColor}
     --accent: {reseller.brandingConfig.accentColor}
   - Replace logo with reseller logo
   - Conditionally show "Powered by" badge

3. Reseller branding settings (/admin/resellers/:id/branding):
   - Logo upload
   - Favicon upload
   - Primary + accent color pickers
   - Theme selector (dark/light/midnight/corporate)
   - Hide "Powered by" toggle (feature flag)
   - Custom SMTP settings (for emails from reseller domain)
   - Preview panel (live preview of changes)

4. Custom domain setup wizard:
   - Enter domain
   - Show required DNS records (CNAME)
   - Verify DNS button (checks CNAME resolution)
   - SSL auto-provisioned via Certbot (trigger docker exec certbot)

Nginx template:
- Template config per custom domain
- On domain verify: generate nginx server_name block + SSL config
- Reload nginx (subprocess call from API)

Each reseller is fully isolated — their tenants never see other resellers.
```

---

# MODULE 14 — ANALYTICS

```
Build the analytics system.

Reference: FILE_1 Section 15, FILE_2 (AnalyticsEvent, DailyMetric, AIUsageLog, UsageLog tables).

Backend — /apps/api/src/modules/analytics:

1. Metrics endpoints:
   - GET /analytics/overview — summary cards (messages, conversations, ai_replies, response_time)
   - GET /analytics/messages — volume over time (daily chart data)
   - GET /analytics/conversations — new, resolved, avg resolution time
   - GET /analytics/ai — tokens, cost, auto-reply rate, containment rate, handoff rate
   - GET /analytics/agents — messages per agent, avg response time, CSAT per agent
   - GET /analytics/campaigns — aggregate across all campaigns
   - GET /analytics/contacts — growth over time, opt-out rate
   - All accept: dateRange, granularity (day/week/month), numberId (filter by WA number)

2. Analytics worker (analytics:events queue):
   - On every significant event: store AnalyticsEvent
   - Cron (every hour): aggregate events → DailyMetric records
   - DailyMetric used for all chart queries (fast reads)

3. Real-time counters:
   - Use Redis INCR for live counters: messages_today, active_conversations, ai_running
   - Emit via WS: analytics:update on increment

Frontend — /apps/web/src/app/(dashboard)/analytics:

1. Analytics page with tabs:
   Overview | Inbox | AI | Campaigns | Agents | Contacts

2. Overview tab:
   - 4 stat cards: Total Messages, Open Conversations, AI Auto-replies (%), Avg Response Time
   - Message volume chart (line/bar, daily)
   - Conversations by status (donut)
   - Date range picker (7d / 30d / 90d / custom)

3. Inbox tab:
   - Conversations opened / resolved / pending chart
   - First response time histogram
   - Busiest hours heatmap
   - Per-inbox breakdown

4. AI tab:
   - AI reply rate over time
   - Token usage (stacked by model)
   - Estimated cost
   - Containment rate (% handled by AI vs escalated)
   - Confidence score distribution

5. Campaigns tab:
   - Campaign comparison table
   - Delivery funnel (bar chart per campaign)
   - Opt-out trend

6. Agents tab:
   - Table: agent name, assigned conversations, messages sent, avg first response, CSAT
   - Response time distribution

7. Contacts tab:
   - Contact growth chart
   - Opt-in/opt-out trend
   - New vs returning contacts

Use recharts for all charts.
Export to CSV button on all tables.
All charts support hover tooltips.
Loading: skeleton for each chart independently.
```

---

# MODULE 15 — NOTIFICATIONS + ALERTS

```
Build the notification system.

Reference: FILE_1 Section 16, FILE_2 (Notification, NotificationPreference tables).

Backend — /apps/api/src/modules/notifications:

1. Notification endpoints:
   - GET /notifications — paginated list for current user
   - GET /notifications/unread-count
   - POST /notifications/:id/read
   - POST /notifications/read-all
   - GET /notifications/preferences
   - PUT /notifications/preferences — update per type + channel

2. Notification worker (notifications:send queue):
   - Input: { userId, tenantId, type, title, body, actionUrl, data }
   - Load user notification preferences
   - Send via enabled channels:
     - IN_APP: store Notification record + emit WS: notification:new
     - EMAIL: push to email:send queue
     - WHATSAPP: push to whatsapp:outgoing queue (template message)

3. Email worker (email:send queue):
   /packages/emails — React Email templates:
   - welcome.tsx — after signup
   - email_verification.tsx — verify email
   - password_reset.tsx — password reset
   - payment_success.tsx — payment receipt
   - payment_failed.tsx — payment failure alert
   - trial_ending.tsx — trial expires in 3 days
   - campaign_complete.tsx — campaign finished
   - weekly_report.tsx — weekly stats summary
   
   Send via Resend (primary) or fallback to SMTP.
   If reseller has custom SMTP → use their SMTP config.

4. System alerts (SuperAdmin only):
   - Dead letter queue spike
   - AI provider key near budget
   - Tenant past payment deadline
   - WhatsApp number quality drop to RED
   - Meta API errors spike

Frontend:

1. Notification panel (in topbar):
   - Slide-out drawer (right side)
   - Grouped by today / yesterday / older
   - Each notification: icon (by type), title, time, unread dot
   - Click → navigate to actionUrl
   - Mark all read button

2. Notification preferences page (/settings/notifications):
   - Grid: notification type vs channel (IN_APP / EMAIL / WHATSAPP)
   - Toggle per cell
   - Save button

3. In-app alert toasts:
   - Triggered by WS system:alert event
   - Top-right corner
   - Level: info / warning / error
   - Auto-dismiss 5 seconds (errors stay until dismissed)
```

---

# MODULE 16 — API KEYS + WEBHOOKS (DEVELOPER)

```
Build the developer API and webhook system.

Reference: FILE_2 (ApiKey, WebhookEndpoint tables).

Backend — /apps/api/src/modules/developer:

1. API Keys:
   - GET /developer/api-keys — list (show keyPrefix only, never full key)
   - POST /developer/api-keys — generate new key
     - Generate: sk_live_{32 random bytes hex}
     - Store: keyPrefix (first 10 chars), keyHash (bcrypt), permissions
     - Return ONCE: full key (show in modal, never again)
   - DELETE /developer/api-keys/:id — revoke

2. API Key authentication:
   - Middleware: checks Authorization: Bearer sk_live_* header
   - Hashes incoming key, looks up in ApiKey table
   - Sets req.tenant + req.apiKeyId
   - Updates lastUsedAt

3. Webhook Endpoints:
   - GET /developer/webhooks
   - POST /developer/webhooks — { url, events[] }
   - PUT /developer/webhooks/:id
   - DELETE /developer/webhooks/:id
   - POST /developer/webhooks/:id/test — send test event
   - GET /developer/webhooks/:id/deliveries — recent delivery logs

4. Outgoing webhook delivery:
   - On platform events: push to webhook delivery queue
   - Worker: load tenant's webhook endpoints subscribed to this event
   - POST to each URL with HMAC-SHA256 signature header (X-Signature-256)
   - Record delivery: success/failure, response code, latency
   - Retry up to 3 times with exponential backoff
   - Increment failureCount → auto-disable after 10 consecutive failures

5. Public REST API (via API Key auth):
   - GET /api/v1/contacts
   - POST /api/v1/contacts
   - GET /api/v1/conversations
   - POST /api/v1/messages/send
   - GET /api/v1/templates
   - POST /api/v1/campaigns/launch
   - Rate limit: 1000 req/day per API key (plan-based)

Frontend — /apps/web/src/app/(dashboard)/settings/developer:

1. API Keys page:
   - List of keys (name, prefix, created, last used, permissions)
   - Create key button → modal with name + permissions
   - Created key shown ONCE in modal with copy button
   - Revoke button per key

2. Webhook Endpoints page:
   - List of endpoints (url, events, status, last delivery)
   - Add endpoint → url + events multi-select
   - Test webhook button
   - Delivery log per endpoint

3. API Docs link (link to external docs or embedded Swagger/Redoc)
```

---

# MODULE 17 — POLISH + PERFORMANCE + SECURITY

```
Final production hardening pass. This module runs after all others.

1. Performance:
   - Add composite DB indexes to all (tenantId, createdAt) columns
   - Prisma query analysis: identify N+1 queries + add select/include optimizations
   - Redis caching: bootstrap data (5 min), AI config (5 min), plan limits (1 min), contact opt status (30 sec)
   - Next.js: enable React Suspense on all heavy components
   - Infinite scroll: implement windowing (react-window) on conversation list + contact list (>100 items)
   - Image optimization: serve avatars/media via signed S3 URLs with CDN
   - API response gzip compression (NestJS compression middleware)
   - BullMQ: add concurrency limits per queue, monitor queue depth

2. Security hardening:
   - Helmet.js on NestJS: CSP, HSTS, X-Frame-Options
   - CORS: whitelist only known origins
   - Rate limiting: per-IP (default) + per-tenant (API endpoints)
   - Input sanitization: DOMPurify on all HTML inputs
   - SQL injection: verify no raw queries exist (Prisma-only)
   - Secrets: ensure no keys appear in logs (custom NestJS logger filter)
   - JWT: add jti claim, blacklist on logout (Redis set)
   - API keys: bcrypt hash verification on every request (cached 30 sec in Redis)
   - Webhook signatures: verify on ALL incoming webhooks (Meta, Stripe, Razorpay, PayPal)
   - XSS: HTML content from CMS → sanitize before render
   - GDPR: soft delete clears PII fields (name → 'Deleted User', email → null, phone → hashed)

3. Error handling pass:
   - Ensure every API endpoint returns structured error (format from FILE_1 Section 27)
   - Frontend: verify every mutation has error toast + retry
   - Workers: all uncaught exceptions → dead letter queue (never silent failure)
   - Sentry integration: backend (NestJS exception filter) + frontend (Next.js error boundary)

4. Loading states pass:
   - Every page: add Suspense boundary with skeleton
   - Every table: add skeleton rows on initial load
   - Every form: disable submit + show spinner on submit
   - Every modal: add loading state
   - All "feature disabled" states: show lock icon + upgrade tooltip

5. Mobile responsiveness:
   - Dashboard sidebar: collapse to bottom tab bar on mobile
   - Inbox: stack columns (list → chat → context on separate views)
   - Forms: full-width inputs on mobile
   - Tables: horizontal scroll on mobile

6. End-to-end tests (Playwright):
   - Signup flow
   - Login + dashboard load
   - Send WhatsApp message (mock Meta API)
   - Create and activate automation
   - Create and launch campaign (mock)
   - Billing upgrade flow (Stripe test mode)

7. Documentation:
   - /docs/setup.md — local dev setup
   - /docs/deployment.md — VPS deployment step by step
   - /docs/env.md — all environment variables
   - /docs/architecture.md — system overview with diagrams

Run: prisma validate + prisma generate before any test or build step.
Run: tsc --noEmit for full type check on all packages.
```

---

# DYAD SESSION RULES (READ BEFORE EVERY SESSION)

```
Before starting each module:
1. Read /docs/FILE_1_MASTER_BLUEPRINT.md fully
2. Read /packages/database/schema.prisma fully
3. Check existing code to avoid duplicate implementations
4. Never create a table or column not in the Prisma schema
5. Never add a feature not in the Master Blueprint
6. Always add tenant_id to every DB query
7. Always push to queue — never process heavy work in API controller
8. Always use TypeScript strict — no any, no @ts-ignore
9. Always emit WebSocket event after state change
10. Always return structured API response: { success, data, error }

If something is unclear: implement the simpler version and add TODO comment.
Never hallucinate APIs or libraries. If unsure, use what's already in the tech stack.
```
