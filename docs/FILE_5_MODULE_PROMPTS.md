# MODULE EXECUTION PROMPTS — MODULES 5 THROUGH 17
# Use these one at a time in Antigravity
# Before each module: paste the Global Context block first
# After each module: run pnpm typecheck before starting next

---

# ═══════════════════════════════════════════════
# GLOBAL CONTEXT — PASTE THIS AT START OF EVERY SESSION
# ═══════════════════════════════════════════════

```
You are building an AI-native multi-tenant WhatsApp SaaS platform.

Before writing any code, read:
- /docs/FILE_1_MASTER_BLUEPRINT.md (system architecture)
- /docs/FILE_4_PATCH.md (corrections + clarifications — takes precedence over FILE_1)
- /docs/FILE_2_PRISMA_SCHEMA.prisma (database — use EXACT field names)

Completed modules: 1 (Foundation), 2 (Auth), 3 (Design System), 4 (WhatsApp)

Rules:
1. Use EXACT field/model names from FILE_2_PRISMA_SCHEMA.prisma
2. Every API route: validate JWT → extract tenant_id → enforce RBAC → process
3. Every DB query includes tenant_id filter
4. All heavy work goes to BullMQ queues — no heavy processing in API layer
5. API responses always: { success, data, error } format
6. Every UI component needs: loading state, empty state, error state
7. Run pnpm typecheck after each module — fix all errors before finishing
8. Do not build features not in the blueprint
```

---

# ═══════════════════════════════════════════════
# MODULE 5 — INBOX SYSTEM
# ═══════════════════════════════════════════════

```
[PASTE GLOBAL CONTEXT FIRST]

Build Module 5 — INBOX SYSTEM.

This is the core product experience. It must feel realtime, fast, and premium.

━━━ BACKEND (apps/api/src/modules/inbox) ━━━

1. Conversations API:
   GET  /inbox/conversations
     - Query params: status, assignedTo, numberId, tag, search, page, limit
     - Returns: paginated list with last message preview
     - Include: contact name/phone, assignedTo agent, unread count, tags
     - Default sort: lastMessageAt DESC

   GET  /inbox/conversations/:id
     - Full conversation with contact, messages (last 50), agent info

   PATCH /inbox/conversations/:id
     - Update: status, assignedToId, aiEnabled, aiPaused
     - Emit WebSocket: conversation:update

   POST /inbox/conversations/:id/assign
     - Assign to agent or unassign
     - Emit WebSocket: conversation:assigned

   POST /inbox/conversations/:id/resolve
     - Set status: RESOLVED, resolvedAt: now
     - Emit WebSocket: conversation:update

   POST /inbox/conversations/:id/reopen
     - Set status: OPEN
     - Emit WebSocket: conversation:update

   POST /inbox/conversations/:id/snooze
     - Body: { until: DateTime }
     - Set snoozedUntil

2. Messages API:
   GET /inbox/conversations/:id/messages
     - Paginated, oldest first
     - Query: before (cursor for pagination)

   POST /inbox/messages/send
     - Body: { conversationId, type, body, mediaUrl? }
     - Store message (status: PENDING, senderType: AGENT)
     - Push to queue: whatsapp:outgoing
     - Return optimistic message immediately

   POST /inbox/conversations/:id/notes
     - Create internal note (isNote: true, not sent to WhatsApp)

3. Typing indicators:
   POST /inbox/conversations/:id/typing
     - Emit WebSocket to conversation room: agent:typing
     - Auto-expire after 3 seconds (Redis TTL)

4. Collision detection:
   GET /inbox/conversations/:id/viewers
     - Returns list of agents currently viewing this conversation
     - Stored in Redis: SET conversation:{id}:viewers, TTL 30s
   POST /inbox/conversations/:id/viewing
     - Register self as viewing (called every 20s from frontend)

━━━ WEBSOCKET GATEWAY (apps/api/src/gateways/inbox.gateway.ts) ━━━

Handle events:
  - Client joins: conversation:{id} room on open
  - Client leaves: conversation:{id} room on close
  - Emit: message:new, message:update, conversation:update,
          conversation:assigned, ai:typing, ai:stream, ai:done,
          agent:typing, notification:new

━━━ FRONTEND (apps/web) ━━━

Replace stub components with full implementations:

1. app/(dashboard)/inbox/page.tsx — 3 column layout:
   [ConversationList 280px] [ChatWindow flex-1] [ContextPanel 320px]
   Mobile: bottom sheet navigation between panels

2. components/inbox/ConversationList.tsx:
   - Search input (debounced 300ms, searches name + phone + last message)
   - Filter tabs: All | Unread | Mine | Unassigned | Resolved
   - Filter dropdown: by number, by tag, by agent
   - Conversation items:
     * Contact avatar (initials, colored by name hash)
     * Contact name + phone
     * Last message preview (truncated 60 chars)
     * Timestamp (relative: "2m ago", "Yesterday", etc.)
     * Unread count badge (red pill)
     * WhatsApp number indicator (small colored dot)
     * AI active indicator (purple sparkle icon)
     * Assigned agent avatar (small, bottom right)
     * Tag chips (max 2 shown, "+N more")
   - Selected conversation: highlighted with accent color
   - Infinite scroll (load more on scroll bottom)
   - Skeleton loading (5 skeleton items on load)
   - Empty state: illustration + "No conversations yet"

3. components/inbox/ChatWindow.tsx:
   Header:
   - Contact name + phone number
   - WhatsApp number used (small label)
   - Assigned agent (click to reassign)
   - Status badge (Open/Pending/Resolved)
   - Action buttons: Assign | Resolve/Reopen | Snooze | More (...)
   - AI toggle (on/off for this conversation)

   Messages area:
   - Message bubbles:
     Inbound: left-aligned, darker glass bg
     Outbound (agent): right-aligned, accent color bg
     Outbound (AI): right-aligned, purple bg + AI badge
     Internal note: full-width, yellow/amber bg, "Note" label
   - Message types rendered:
     text: plain text
     image: thumbnail with click-to-expand
     video: video player
     audio: audio player with waveform
     document: file icon + name + download button
   - Delivery status icons (sent ✓, delivered ✓✓, read ✓✓ blue)
   - Timestamps on each message
   - Date separator (e.g. "Today", "Yesterday", "May 3")
   - AI typing indicator: animated 3 dots with "AI is thinking..."
   - Agent typing indicator: "[Name] is typing..."
   - Scroll to bottom button (appears when scrolled up)
   - Auto-scroll to bottom on new message (only if at bottom)

   Input area:
   - Text input (multiline, grows up to 5 lines)
   - Emoji picker button
   - Attach file button (opens file picker)
   - Template picker button (opens template modal)
   - AI Suggest button (purple, sparkle icon)
   - Send button (disabled when empty, active when text)
   - Character count (WhatsApp limit: 4096)
   - Send on Enter, newline on Shift+Enter

4. components/inbox/ContextPanel.tsx:
   Tab navigation: Contact | AI | Notes | Activity

   Contact tab:
   - Avatar (large initials)
   - Name (editable inline)
   - Phone number
   - Email (editable)
   - Tags (add/remove chips)
   - Lead score (1-100 slider)
   - Pipeline stage (dropdown)
   - Custom fields (key-value display)
   - First seen / Last contacted (dates)
   - Conversations count (link to filter)
   - "View full profile" button

   AI tab:
   - AI on/off toggle for conversation
   - Confidence score of last AI response (progress bar)
   - Suggested replies (3 buttons, click to insert into input)
   - "Summarize conversation" button → shows summary below
   - Sentiment indicator (Positive/Neutral/Negative with emoji)
   - "Handoff to agent" button (stops AI, assigns to current user)

   Notes tab:
   - Add note textarea + save button
   - Notes list (newest first)
   - Author + timestamp per note

   Activity tab:
   - Timeline of: messages, notes, assignments, status changes, automations
   - Sorted newest first
   - Icons per event type

5. Zustand store updates (store/inboxStore.ts):
   State:
   - conversations: Map<id, Conversation>
   - activeConversationId: string | null
   - messages: Map<conversationId, Message[]>
   - typingAgents: Map<conversationId, string[]>
   - aiTyping: Set<conversationId>
   - unreadCounts: Map<conversationId, number>
   Actions:
   - setActiveConversation
   - addMessage (optimistic + real)
   - updateMessage (status updates)
   - setTyping
   - markRead

6. Socket.IO integration:
   - Connect on dashboard load
   - Subscribe to tenant room
   - Subscribe to conversation room on open
   - Handle all events and update store
   - Reconnect with exponential backoff
   - On reconnect: fetch missed messages via REST

━━━ REQUIREMENTS ━━━
- After building run pnpm typecheck
- Fix all errors before finishing
- Zero typecheck errors required
```

---

# ═══════════════════════════════════════════════
# MODULE 6 — AI SYSTEM
# ═══════════════════════════════════════════════

```
[PASTE GLOBAL CONTEXT FIRST]

Build Module 6 — AI SYSTEM.

This is your core differentiator. Build it carefully.

━━━ PACKAGES (packages/ai) ━━━

1. Provider abstraction layer (packages/ai/src/providers/):

   Base interface (base.provider.ts):
   interface AIProvider {
     name: string
     sendMessage(params: AIRequestParams): Promise<AIResponse>
     streamMessage(params: AIRequestParams): AsyncIterableIterator<string>
     validateKey(key: string): Promise<boolean>
     listModels(): Promise<AIModel[]>
   }

   interface AIRequestParams {
     messages: { role: 'system'|'user'|'assistant', content: string }[]
     model: string
     maxTokens: number
     temperature: number
     stream: boolean
   }

   Implement one provider file per provider:
   - openrouter.provider.ts (base URL: https://openrouter.ai/api/v1)
   - openai.provider.ts (base URL: https://api.openai.com/v1)
   - anthropic.provider.ts (uses Messages API, different format)
   - google.provider.ts (uses Gemini API)
   - groq.provider.ts (OpenAI-compatible)
   - deepseek.provider.ts (OpenAI-compatible)
   - qwen.provider.ts (OpenAI-compatible via DashScope)
   - ollama.provider.ts (local, base URL from config)

   Factory (ai.factory.ts):
   - getProvider(providerEnum): AIProvider
   - Singleton instances per provider

2. AI Orchestrator (packages/ai/src/orchestrator.ts):

   Main class: AIOrchestrator
   
   Method: async generateReply(context: AIContext): Promise<AIReply>
   
   interface AIContext {
     tenantId: string
     conversationId: string
     numberId: string
     incomingMessage: string
     contact: { name, phone, tags }
     recentMessages: Message[]         // last 20
     conversationSummary: string | null // long-term memory
     tenantConfig: TenantAIConfig
     globalConfig: GlobalAIConfig
   }

   Flow:
   1. resolveConfig(tenantId) — using hierarchy from PATCH 4
   2. checkQuota(tenantId) — tokens remaining?
   3. checkRateLimit(tenantId) — calls per minute?
   4. buildSystemPrompt(config, contact) — compile all instructions
   5. buildMessages(context) — format conversation history
   6. callProvider(config, messages) — stream response
   7. runSafetyCheck(response) — basic moderation
   8. logUsage(tenantId, tokens, cost) — update AIUsageLog
   9. updateConversationSummary(if needed) — trigger if >20 messages

   buildSystemPrompt must compile in this order:
   [Global instructions]
   [Business name and overview]
   [Tone and communication style]
   [Operating hours]
   [Services and pricing]
   [Support rules]
   [Escalation policy]
   [Forbidden topics]
   [Contact context: name, tags]
   [Conversation summary if exists]

━━━ BACKEND (apps/api/src/modules/ai) ━━━

1. AI settings endpoints:
   GET  /ai/config — get tenant AI config
   PUT  /ai/config — update tenant AI config
   GET  /ai/providers — list available providers (non-locked)
   GET  /ai/models?provider= — list models for provider
   POST /ai/test — test current config with sample message

2. AI actions in conversation:
   POST /ai/conversations/:id/suggest
     - Generate 3 reply suggestions for current conversation
     - Returns: string[]

   POST /ai/conversations/:id/summarize
     - Trigger conversation summary generation
     - Returns: string (summary)

   POST /ai/conversations/:id/handoff
     - Set conversation.aiPaused = true
     - Assign to requesting agent
     - Emit: conversation:update

3. Usage stats:
   GET /ai/usage
     - Current month token usage, cost, limit
     - Chart data for last 30 days

━━━ WORKER (apps/worker — ai:processing queue) ━━━

AI processor:
1. Receive job: { tenant_id, conversation_id, message_id, number_id }
2. Load full context (messages, config, summary, contact)
3. Call AIOrchestrator.generateReply()
4. Emit WebSocket: ai:typing (before calling provider)
5. Stream tokens → emit ai:stream per token
6. On complete: store message in DB (senderType: AI)
7. Push to queue: whatsapp:outgoing (to actually send it)
8. Emit: ai:done
9. Check if summary needed (every 20 messages)

━━━ FRONTEND (apps/web) ━━━

1. app/(dashboard)/ai/page.tsx — AI Settings:
   Tabs: Provider | Business Training | Usage

   Provider tab (if not locked by admin):
   - Provider dropdown (shows available providers)
   - API Key input (password type, show/hide toggle)
   - Model dropdown (loaded dynamically from provider)
   - Test connection button
   - "Using platform AI" indicator (when no own key)
   - Locked state UI (when globalConfig.isLocked)

   Business Training tab:
   - Business name, overview (textarea)
   - Tone dropdown: Friendly / Formal / Sales / Custom
   - Operating hours (day-by-day time pickers)
   - Services (dynamic list add/remove)
   - FAQs (add question + answer pairs)
   - Rules (do/don't list)
   - Save button with autosave indicator

   Usage tab:
   - Current period: tokens used / limit (progress bar)
   - Cost this month (in USD)
   - Chart: daily token usage last 30 days
   - Breakdown by: conversation AI, suggestions, summaries

2. AI panel in Inbox (ContextPanel AI tab — replace stub):
   - Already handled in Module 5 — ensure it calls /ai/conversations/:id/suggest
   - Suggested replies load on conversation open
   - Streaming response shows in chat window in realtime

━━━ REQUIREMENTS ━━━
- Streaming must work end-to-end (SSE from provider → WS to browser)
- Provider abstraction must be clean — adding a new provider = 1 file
- Never log or expose decrypted API keys
- Cost calculation: input_tokens * input_price + output_tokens * output_price
- run pnpm typecheck, fix all errors before finishing
```

---

# ═══════════════════════════════════════════════
# MODULE 7 — AI TRAINING SYSTEM
# ═══════════════════════════════════════════════

```
[PASTE GLOBAL CONTEXT FIRST]

Build Module 7 — AI TRAINING SYSTEM.

━━━ BACKEND (apps/api/src/modules/ai — extend existing) ━━━

1. FAQ Management:
   GET    /ai/faqs — list all FAQs for tenant
   POST   /ai/faqs — create FAQ { question, answer }
   PUT    /ai/faqs/:id — update FAQ
   DELETE /ai/faqs/:id — delete FAQ

2. Document Management:
   POST   /ai/documents — upload document
     - Accept: PDF, DOCX, TXT (max 10MB)
     - Store file to S3: /tenants/{id}/ai-docs/
     - Save AIDocument record
     - Push to queue: ai:document_process
   GET    /ai/documents — list documents
   DELETE /ai/documents/:id — delete document + S3 file

3. Document processor (worker queue: ai:document_process):
   - Extract text from PDF (use pdf-parse)
   - Extract text from DOCX (use mammoth)
   - Store extracted text in AIDocument.content
   - Set processed: true
   - Rebuild system prompt for tenant

4. System prompt compiler:
   POST /ai/config/compile
   - Takes all training data (config + FAQs + doc content)
   - Compiles into TenantAIConfig.systemPrompt
   - Called after any training data change

5. AI Training wizard:
   POST /ai/onboarding/generate
   - Body: { businessName, industry, services, tone }
   - AI generates: system prompt starter, 5 sample FAQs, escalation rules
   - Returns suggestions for user to review + accept

━━━ FRONTEND (apps/web) ━━━

1. app/(dashboard)/ai/training/page.tsx — AI Training Center:

   Onboarding wizard (shown if no training data yet):
   Step 1: Business basics (name, industry, website)
   Step 2: What does your business do? (services, products)
   Step 3: Tone selection (cards: Friendly/Formal/Sales + preview)
   Step 4: AI generates starter training → review screen
   Step 5: Done! (links to full settings)

   Main training page (after wizard):
   Section: Business Info
   - Business name, overview, website, support email
   
   Section: Hours & Availability
   - Day-by-day hours toggle + time pickers
   - "Outside hours" auto-response toggle + message
   
   Section: FAQs
   - List of Q&A pairs
   - Inline edit (click to edit)
   - Add new FAQ (expanding form)
   - Import FAQ button (paste bulk text, AI parses into Q&A)
   
   Section: Documents
   - Upload zone (drag & drop)
   - File list with status (processing / ready)
   - Delete button per file
   
   Section: Rules & Policies
   - Do's list (dynamic add/remove)
   - Don'ts list (dynamic add/remove)
   - Escalation trigger keywords
   
   Section: Preview & Test
   - Test input box
   - "Test AI" button → calls /ai/test endpoint
   - Shows AI response with system prompt used

2. Compilation indicator:
   - After any save: show "Updating AI..." indicator
   - After compile completes: "AI updated ✓"

━━━ REQUIREMENTS ━━━
- Wizard must feel guided and simple
- Changes must trigger prompt recompilation
- Documents must show processing status
- run pnpm typecheck, zero errors
```

---

# ═══════════════════════════════════════════════
# MODULE 8 — AUTOMATION ENGINE (VISUAL BUILDER)
# ═══════════════════════════════════════════════

```
[PASTE GLOBAL CONTEXT FIRST]

Build Module 8 — AUTOMATION ENGINE.

This is a visual node-based workflow builder.

━━━ DATA MODEL (already in Prisma schema) ━━━

Automation.nodes is JSON with this structure:
{
  "nodes": [
    {
      "id": "uuid",
      "type": "trigger|condition|action",
      "position": { "x": 100, "y": 200 },
      "data": { /* node-specific config */ },
      "connections": ["next-node-id"]
    }
  ]
}

Automation.trigger is JSON:
{
  "type": "message.received|message.keyword|conversation.created|...",
  "config": { /* trigger-specific settings */ }
}

━━━ BACKEND (apps/api/src/modules/automations) ━━━

1. Automation CRUD:
   GET    /automations — list (with run stats)
   POST   /automations — create
   GET    /automations/:id — get with full graph
   PUT    /automations/:id — update
   DELETE /automations/:id — delete
   PATCH  /automations/:id/activate — set status: ACTIVE
   PATCH  /automations/:id/pause — set status: PAUSED
   POST   /automations/:id/test — dry run with sample data

2. Automation executor service:
   class AutomationExecutor {
     async execute(workflowId, triggerData, context)
     async executeNode(node, context, runId)
     async executeCondition(node, context): boolean
     async executeAction(node, context): ActionResult
   }

   Node executors:
   - condition: evaluate expression against context data
   - delay: push re-queue job with delay
   - send_message: push to whatsapp:outgoing queue
   - send_template: push to whatsapp:outgoing queue
   - ai_reply: push to ai:processing queue
   - assign_agent: update conversation.assignedToId
   - add_tag: create ContactTag
   - remove_tag: delete ContactTag
   - update_contact: update Contact fields
   - create_ticket: create Ticket
   - webhook_call: HTTP POST to external URL (timeout 10s)
   - send_email: push to email:send queue

3. Trigger matching service:
   - Called by workers when events occur
   - Finds all ACTIVE automations for tenant matching trigger type
   - Evaluates trigger conditions
   - Dispatches to automation:execution queue

━━━ WORKER (apps/worker — automation:execution queue) ━━━
- Load workflow graph
- Execute nodes in order
- Store execution trace in AutomationRun.executionLog
- Handle retries per node (max 2 retries per node)
- On node failure: mark node failed, continue if non-critical
- Store final status
- Emit: automation:update WebSocket event

━━━ FRONTEND (apps/web) ━━━

1. app/(dashboard)/automations/page.tsx:
   - Table: Name | Status | Trigger | Runs | Success Rate | Last Run | Actions
   - Status badges: Draft (gray) | Active (green) | Paused (yellow)
   - Actions: Edit | Duplicate | Delete | Toggle active
   - "+ Create Automation" button (opens builder)
   - Templates section: pre-built automations to install

2. app/(dashboard)/automations/[id]/page.tsx — Visual Builder:

   Use React Flow (install: reactflow) for the canvas.

   Canvas:
   - Drag-drop nodes from palette
   - Connect nodes by dragging from output port to input port
   - Delete: select node + Delete key
   - Undo/Redo (Ctrl+Z / Ctrl+Y)
   - Zoom in/out, pan
   - Minimap (bottom right)
   - Auto-layout button

   Left palette panel:
   - TRIGGERS section:
     Message Received | Message Keyword | New Conversation |
     No Reply (X hours) | Tag Added | Contact Created |
     Webhook | Schedule
   - CONDITIONS section:
     If/Else | Contains Text | Has Tag | Time Window
   - ACTIONS section:
     Send Message | Send Template | AI Reply | Assign Agent |
     Add Tag | Remove Tag | Update Contact | Create Ticket |
     Call Webhook | Send Email | Delay | End

   Node config panel (right side, appears on node click):
   Each node type shows its specific config fields:
   - send_message: message text input (with variable hints)
   - condition: field selector + operator + value
   - delay: number input + unit (minutes/hours/days)
   - assign_agent: agent selector dropdown
   - add_tag: tag selector
   - webhook_call: URL input + method + headers
   etc.

   Top bar:
   - Automation name (editable)
   - Save button
   - Activate / Pause toggle
   - Test Run button
   - Back to list

   Variable system:
   Users can use variables in text: {{contact.name}}, {{message.body}}, {{contact.phone}}
   Show variable hint popup when typing {{

3. Pre-built templates (shown on new automation):
   - Welcome message on first contact
   - Auto-reply outside business hours
   - Lead qualification flow
   - Appointment reminder
   - Follow-up after no reply (24h)

━━━ REQUIREMENTS ━━━
- React Flow handles the canvas (don't build custom)
- Nodes must be visually distinct by type (different colors)
- Save workflow as JSON on every change (autosave debounced 2s)
- Test run shows execution trace step by step
- run pnpm typecheck, zero errors
```

---

# ═══════════════════════════════════════════════
# MODULE 9 — CRM + CONTACTS
# ═══════════════════════════════════════════════

```
[PASTE GLOBAL CONTEXT FIRST]

Build Module 9 — CRM + CONTACTS.

━━━ BACKEND (apps/api/src/modules/contacts) ━━━

1. Contacts CRUD:
   GET    /contacts — paginated list with filters
     Filters: search, tags, pipelineStage, leadScore range, 
               optedOut, dateRange, hasConversation
   POST   /contacts — create contact
   GET    /contacts/:id — get with full timeline
   PUT    /contacts/:id — update
   DELETE /contacts/:id — soft delete

2. Contact bulk operations:
   POST /contacts/import
     - Accept: CSV file
     - Map columns to fields (user configures mapping)
     - Deduplicate by phone
     - Return: { imported, skipped, errors }
   GET  /contacts/export
     - Export filtered contacts to CSV
   POST /contacts/bulk-tag
     - Body: { contactIds, tagIds, action: 'add'|'remove' }
   POST /contacts/bulk-stage
     - Body: { contactIds, pipelineStageId }

3. Tags:
   GET    /tags — list all tenant tags
   POST   /tags — create tag { name, color }
   PUT    /tags/:id — update
   DELETE /tags/:id — delete (remove from all contacts)

4. Pipeline stages:
   GET    /pipeline/stages — list (sorted by position)
   POST   /pipeline/stages — create stage
   PUT    /pipeline/stages/:id — update
   DELETE /pipeline/stages/:id — delete (move contacts to Inbox)
   PATCH  /pipeline/stages/reorder — reorder positions

5. Contact timeline:
   GET /contacts/:id/timeline
   Returns sorted events:
   - conversations (created, resolved)
   - messages sent/received
   - tags added/removed
   - pipeline stage changes
   - notes added
   - automations triggered

━━━ FRONTEND (apps/web) ━━━

1. app/(dashboard)/contacts/page.tsx:
   Two views (toggle): Table View | Board View (Kanban)

   Table View:
   - Columns: Avatar | Name | Phone | Tags | Stage | Score | Last Contact | Actions
   - Sort by any column
   - Bulk select (checkbox per row)
   - Bulk actions bar (appears on select): Tag | Change Stage | Export | Delete
   - Search bar (real-time filter)
   - Filter panel (slide in from right):
     Tags, Pipeline Stage, Lead Score, Date range, Has conversations
   - Import button (opens CSV import modal)
   - Export button
   - "+ Add Contact" button

   Kanban/Board View:
   - Columns = pipeline stages
   - Cards: contact name, phone, last message, tags
   - Drag cards between columns
   - Stage totals at top

2. app/(dashboard)/contacts/[id]/page.tsx — Contact Profile:
   Left column:
   - Large avatar (initials)
   - Name (editable)
   - Phone, email, website
   - Lead score (editable slider)
   - Pipeline stage (dropdown)
   - Tags (chips, editable)
   - Custom fields
   - "Start Conversation" button
   - "Send Campaign" button

   Right column (tabs):
   Conversations | Notes | Activity Timeline

3. CSV Import Modal:
   Step 1: Upload CSV file
   Step 2: Map columns (dropdown per column)
   Step 3: Preview (first 5 rows)
   Step 4: Import with progress bar
   Step 5: Results summary

━━━ REQUIREMENTS ━━━
- Opt-out contacts must be visually marked and cannot receive messages
- Custom fields stored in Contact.customFields JSON
- Timeline must be chronological and real-time
- run pnpm typecheck, zero errors
```

---

# ═══════════════════════════════════════════════
# MODULE 10 — CAMPAIGN SYSTEM
# ═══════════════════════════════════════════════

```
[PASTE GLOBAL CONTEXT FIRST]

Build Module 10 — CAMPAIGN SYSTEM.

━━━ BACKEND (apps/api/src/modules/campaigns) ━━━

1. Template Management:
   GET    /templates — list all templates for tenant
   POST   /templates — create template
   GET    /templates/:id — get template
   PUT    /templates/:id — update (only DRAFT status)
   DELETE /templates/:id — delete
   POST   /templates/:id/submit — submit to Meta for approval
   GET    /templates/:id/status — sync approval status from Meta

   Meta template submission:
   POST https://graph.facebook.com/v18.0/{waba_id}/message_templates
   Required: name, category, language, components

2. Campaign Management:
   GET    /campaigns — list with stats
   POST   /campaigns — create campaign
   GET    /campaigns/:id — get with messages stats
   PUT    /campaigns/:id — update (only DRAFT)
   DELETE /campaigns/:id — delete (only DRAFT)
   POST   /campaigns/:id/schedule — set scheduledAt
   POST   /campaigns/:id/launch — start immediately
   POST   /campaigns/:id/pause — pause running campaign
   POST   /campaigns/:id/cancel — cancel

3. Campaign worker (queue: campaigns:send):
   - Receive: { campaign_id, batch_number, contact_ids }
   - For each contact:
     Resolve template variables ({{name}} etc.)
     Push to whatsapp:outgoing queue
     Create CampaignMessage record
   - Rate limit: max 80 messages per second (Meta limit)
   - Batch size: 100 contacts per job
   - Update campaign stats after each batch

4. Audience resolver:
   Resolve audience based on campaign.audienceType:
   - 'all': all non-opted-out contacts
   - 'tag': contacts with specific tag
   - 'segment': contacts matching filter
   - 'csv': contacts from uploaded CSV

━━━ FRONTEND (apps/web) ━━━

1. app/(dashboard)/templates/page.tsx:
   - Table: Name | Category | Language | Status | Created | Actions
   - Status badges: Draft/Pending/Approved/Rejected
   - "+ Create Template" button
   - Filter by status

2. Template Create/Edit page:
   - Name input (lowercase, underscores only — Meta requirement)
   - Category select: MARKETING / UTILITY / AUTHENTICATION
   - Language select
   - Components:
     Header (optional): Text | Image | Video | Document
     Body: textarea with variable inserter {{1}}, {{2}}
     Footer (optional): plain text
     Buttons (optional): Quick Reply | Call to Action
   - Sample values input (for each variable)
   - Preview panel (shows rendered template)
   - Submit for approval button
   - Rejection reason shown (if rejected)

3. app/(dashboard)/campaigns/page.tsx:
   - Table: Name | Type | Status | Recipients | Sent | Delivered | Read | Actions
   - Status: Draft/Scheduled/Running/Paused/Completed
   - "+ Create Campaign" button

4. Campaign creation wizard:
   Step 1: Campaign details (name, type: Broadcast/Drip/Reminder)
   Step 2: Audience (All / Tag / Segment / Upload CSV)
     - Show estimated reach count
   Step 3: Message (select approved template + fill variables)
     - Preview with sample contact data
   Step 4: Schedule (Send now / Schedule for later)
     - Datetime picker
   Step 5: Review & Launch
     - Summary of all settings
     - Estimated delivery time
     - Launch / Schedule button

5. Campaign analytics page (campaigns/[id]/analytics):
   - Funnel: Sent → Delivered → Read → Replied
   - Timeline chart (sends over time)
   - Failed messages with reasons

━━━ REQUIREMENTS ━━━
- Opted-out contacts must be excluded from campaigns
- Meta template name restrictions: lowercase, numbers, underscores only
- Show estimated Meta conversation cost before launch
- run pnpm typecheck, zero errors
```

---

# ═══════════════════════════════════════════════
# MODULE 11 — BILLING SYSTEM
# ═══════════════════════════════════════════════

```
[PASTE GLOBAL CONTEXT FIRST]

Build Module 11 — BILLING SYSTEM.

CRITICAL: Read PATCH 3 in FILE_4_PATCH.md carefully before building.
Your DB is source of truth. Money in minor units only.

━━━ BACKEND (apps/api/src/modules/billing) ━━━

1. Plans API (public — no auth):
   GET /billing/plans — list all active public plans

2. Subscription API:
   GET    /billing/subscription — current tenant subscription
   POST   /billing/checkout — create checkout session
     Body: { planId, currency, interval: 'monthly'|'yearly', provider }
     Returns: { checkoutUrl } — redirect user here
   POST   /billing/cancel — cancel at period end
   POST   /billing/change-plan — upgrade/downgrade

3. Invoice API:
   GET /billing/invoices — paginated list
   GET /billing/invoices/:id — single invoice
   GET /billing/invoices/:id/pdf — download PDF
   GET /billing/invoices/:id/receipt — lightweight receipt

4. Usage API:
   GET /billing/usage — current period usage vs limits
   {
     aiTokens: { used, limit, percentage },
     messages: { used, limit, percentage },
     conversations: { used, limit, percentage },
     storage: { used, limit, percentage }
   }

5. Webhook handlers (PUBLIC — signature validated only):
   POST /webhooks/stripe — handle Stripe events
   POST /webhooks/razorpay — handle Razorpay events
   POST /webhooks/paypal — handle PayPal events
   POST /webhooks/phonepe — handle PhonePe events
   POST /webhooks/paytm — handle Paytm events

   All webhook handlers:
   1. Verify signature
   2. Check idempotency (PaymentWebhook table)
   3. Store raw payload
   4. Push to queue: billing:webhook
   5. Return 200

6. Billing worker (queue: billing:webhook):
   Handle events:
   payment.success:
     - Activate/extend subscription
     - Create Invoice + InvoiceItems
     - Create Payment record
     - Update feature flags
     - Reset usage limits
     - Queue: email:send (payment confirmation)
     - Emit: billing:updated

   payment.failed:
     - Increment failure count
     - If count >= 3: set status GRACE_PERIOD
     - Queue notification
     - Queue retry (if provider supports)

   subscription.cancelled:
     - Set cancelAtPeriodEnd = true
     - Queue: email:send (cancellation confirmation)

7. Invoice PDF generator:
   Use: @react-pdf/renderer or pdfkit
   Invoice includes:
   - Platform/reseller logo
   - Invoice number (INV-{YEAR}-{seq})
   - Issue date, due date
   - Tenant billing address (from TenantBranding/settings)
   - Line items from InvoiceItem records
   - Subtotal, tax (rate from settings), total
   - Payment method, transaction ID
   - "Thank you" footer
   Store PDF in S3: /invoices/{tenant_id}/{invoice_id}.pdf

━━━ PAYMENT PROVIDER IMPLEMENTATIONS ━━━

Create: packages/billing/src/providers/

Each provider implements:
interface PaymentProvider {
  createCheckoutSession(params): Promise<{ url: string, sessionId: string }>
  verifyWebhook(payload, signature, secret): boolean
  getSubscriptionStatus(externalId): Promise<SubscriptionStatus>
}

Stripe implementation:
- Use: stripe npm package
- Checkout: stripe.checkout.sessions.create()
- Webhook: stripe.webhooks.constructEvent()

Razorpay implementation:
- Use: razorpay npm package
- Subscription: razorpay.subscriptions.create()
- Webhook: HMAC-SHA256 verification

PayPal, PhonePe, Paytm:
- Stub implementations with TODO comments
- Basic webhook signature verification
- Full implementation can be added per provider docs

━━━ FRONTEND (apps/web) ━━━

1. app/(dashboard)/billing/page.tsx:
   Section: Current Plan
   - Plan name, price, billing interval
   - Trial days remaining (if trialing)
   - Renewal date
   - Status badge
   - Upgrade button | Cancel button

   Section: Usage This Period
   - Progress bars for each limit (AI tokens, messages, storage)
   - Color: green < 70%, yellow 70-90%, red > 90%

   Section: Payment Method
   - Show current payment method (card last 4 / UPI)
   - Update payment method button

   Section: Invoices
   - Table: Invoice # | Date | Amount | Status | Download
   - Paginated

2. Pricing page for upgrades (app/(dashboard)/billing/upgrade):
   - Plan comparison cards
   - Highlight current plan
   - Monthly/Yearly toggle (show savings)
   - INR/USD toggle
   - Feature checkmarks per plan
   - "Upgrade" / "Downgrade" CTA per plan
   - Checkout redirects to provider

3. Invoice PDF download:
   - "Download PDF" button on invoice list row
   - Opens PDF in new tab or triggers download

━━━ REQUIREMENTS ━━━
- NEVER store card details — only tokens from provider
- Invoice sequence must be monotonically increasing per tenant
- Grace period: 3 days before suspension
- Feature flags must be immediately updated on plan change
- run pnpm typecheck, zero errors
```

---

# ═══════════════════════════════════════════════
# MODULE 12 — SUPERADMIN PANEL
# ═══════════════════════════════════════════════

```
[PASTE GLOBAL CONTEXT FIRST]

Build Module 12 — SUPERADMIN PANEL (apps/admin).

━━━ BACKEND (apps/api/src/modules/admin) ━━━
Guard all with: role === SUPER_ADMIN OR role === RESELLER_ADMIN

1. Tenant management:
   GET    /admin/tenants — paginated, searchable, filterable by plan/status
   GET    /admin/tenants/:id — full details
   PUT    /admin/tenants/:id — update
   POST   /admin/tenants/:id/suspend — set status SUSPENDED
   POST   /admin/tenants/:id/activate — set status ACTIVE
   POST   /admin/tenants/:id/impersonate
     - Generate a short-lived impersonation token
     - Log to AuditLog: action IMPERSONATE
     - Return token that works as that tenant's admin
   POST   /admin/tenants/:id/reset-quota — reset usage counters
   POST   /admin/tenants/:id/change-plan — force plan change

2. Plans management:
   GET    /admin/plans — all plans
   POST   /admin/plans — create plan
   PUT    /admin/plans/:id — update plan
   DELETE /admin/plans/:id — archive (set isActive: false)
   POST   /admin/plans/duplicate/:id — clone plan

3. Global AI config:
   GET  /admin/ai-config — get global config (keys masked)
   PUT  /admin/ai-config — update (keys encrypted on save)
   POST /admin/ai-config/test — test global config

4. Payment provider config:
   GET  /admin/payment-providers — list all with status
   PUT  /admin/payment-providers/:provider — update config

5. Analytics (platform-wide, SUPER_ADMIN only):
   GET /admin/analytics/overview
     - Total tenants, MRR, ARR, churn rate
     - New signups (today/week/month)
     - AI usage + cost platform-wide
   GET /admin/analytics/tenants/:id
     - Per-tenant usage, cost, revenue

6. Audit logs:
   GET /admin/audit — paginated, filterable by action/resource/user

7. Support tickets (platform-level):
   GET    /admin/tickets — all tickets across tenants
   GET    /admin/tickets/:id — ticket details
   POST   /admin/tickets/:id/reply — agent reply
   PATCH  /admin/tickets/:id — update status/priority/assignment

8. Feature flags (global):
   GET  /admin/feature-flags — list all global flags
   PUT  /admin/feature-flags/:feature — toggle

━━━ FRONTEND (apps/admin) ━━━

Full Next.js app (separate from apps/web).
Use same packages/ui design system.

1. Layout:
   - Same glassmorphism design system
   - Sidebar with admin sections
   - Topbar with admin user info

2. Sidebar sections:
   Dashboard | Tenants | Plans | Billing | AI Control |
   Meta Config | Website CMS | Media | Domains |
   Payments | Notifications | Tickets | Audit Logs |
   Feature Flags | Settings | AI Copilot

3. Dashboard page:
   Stats cards (realtime):
   - Total Tenants (active/trial/suspended)
   - MRR (current month revenue)
   - New Signups Today
   - AI Cost Today (USD)
   - Active Conversations (platform-wide)
   - Payment Failures (last 24h)

   Charts:
   - Tenant growth (30 days)
   - Revenue trend (6 months)
   - AI usage cost (30 days)

   Alerts section:
   - Tenants with payment failures
   - Tenants with WhatsApp quality warnings
   - Dead-letter queue items

4. Tenant Management page:
   - Data table with all tenants
   - Columns: Name | Plan | Status | Signups | MRR | AI Usage | Health | Actions
   - Search, filter by plan/status
   - Row actions: View | Impersonate | Suspend | Change Plan

5. Tenant Detail page:
   Tabs: Overview | Usage | Billing | WhatsApp | Team | Settings | History

6. Plans page:
   - Plan cards (visual like pricing page)
   - Edit plan button → opens plan editor form
   - Plan editor: all limits + features + pricing

7. AI Control Center:
   - Provider config cards (one per provider)
   - API key inputs (password, show/hide)
   - Lock toggle (prevents tenant override)
   - Model assignment per use case
   - Platform-wide usage chart

8. Meta/WhatsApp Config:
   Fields with help tooltips + docs links:
   - Meta App ID
   - Meta App Secret (password field)
   - Webhook Verify Token
   - System User Token (password field)
   - Business Manager ID
   - Embedded Signup Config ID

9. Payment Providers page:
   - Card per provider (Stripe, Razorpay, PayPal, PhonePe, Paytm)
   - Enable/disable toggle
   - Sandbox/Live toggle
   - API key inputs
   - Webhook URL (copy button — give to provider dashboard)
   - Test button

━━━ REQUIREMENTS ━━━
- Impersonation must be logged in AuditLog always
- API keys shown as: sk-****...****last4 after saving
- SUPER_ADMIN sees everything; RESELLER_ADMIN sees only their scope
- run pnpm typecheck, zero errors
```

---

# ═══════════════════════════════════════════════
# MODULE 13 — CMS + PAGES SYSTEM
# ═══════════════════════════════════════════════

```
[PASTE GLOBAL CONTEXT FIRST]

Build Module 13 — CMS + PAGES SYSTEM.

CRITICAL: Read PATCH 2 in FILE_4_PATCH.md for exact scope.
This is NOT a website builder. It is a lightweight page manager.

━━━ BACKEND (apps/api/src/modules/cms) ━━━

Guard: role must be SUPER_ADMIN or RESELLER_ADMIN

1. Pages API:
   GET    /cms/pages — list pages for tenant
   POST   /cms/pages — create page
   GET    /cms/pages/:id — get page
   PUT    /cms/pages/:id — update page
   DELETE /cms/pages/:id — delete
   POST   /cms/pages/:id/publish — set status PUBLISHED, publishedAt now
   POST   /cms/pages/:id/unpublish — set status DRAFT
   POST   /cms/pages/:id/duplicate — clone page (status: DRAFT)

2. Public page rendering (NO auth — public routes):
   GET    /{slug} — serve published page
     - Resolve domain → tenant
     - Find page by slug (must be PUBLISHED)
     - Inject meta tags + tracking scripts into HTML
     - Return rendered HTML with proper headers
   GET    /sitemap.xml — dynamic sitemap
     - All published pages for this domain
   GET    /robots.txt — dynamic robots
     - Allow all, Sitemap: {domain}/sitemap.xml

3. Slug validation:
   POST /cms/pages/check-slug — check if slug is available
     - Returns: { available: boolean, suggestion?: string }
     - Block system slugs: login, signup, api, admin, webhooks, etc.

4. Analytics config (per tenant/reseller):
   GET  /cms/analytics-config — get config
   PUT  /cms/analytics-config — update
   Fields: ga4Id, gtmId, metaPixelId, customHeadJs

5. Page version history:
   GET /cms/pages/:id/versions — list versions (last 20)
   POST /cms/pages/:id/versions/:versionId/restore — restore

6. HTML sanitization service:
   - Allow all standard HTML tags + inline styles
   - Allow: Google Analytics scripts, Meta Pixel, GTM
   - Strip: scripts loading from non-whitelisted domains
   - Allow: <script> if src contains: google, facebook, meta, gtag
   - Block: javascript: in href attributes (XSS)

━━━ FRONTEND (apps/admin — CMS section in SuperAdmin panel) ━━━

1. CMS sidebar section in admin panel:
   Pages | Media Library | Domains | Analytics Scripts

2. Pages list (admin/cms/pages):
   Table: Name | Slug | Status | Published At | Modified | Actions
   Actions: Edit | Duplicate | Delete | Toggle Publish
   "+ Add Page" button (top right)

3. Page editor (admin/cms/pages/[id]):
   Two column layout:
   
   Left (editor, 65%):
   - Page Name input
   - Slug input (with availability check, auto-format)
   - HTML Editor (Monaco Editor, full-height)
   - Toolbar: Fullscreen | Format | Find+Replace

   Right (metadata + publish, 35%):
   SEO Card:
   - Meta Title (60 char limit + counter)
   - Meta Description (160 char limit + counter)
   - OG Image URL input
   - Canonical URL input
   - Robots: Index/NoIndex toggle

   Schema Card:
   - JSON-LD textarea

   Publish Card:
   - Status indicator (Draft/Published)
   - Published At date (shown if published)
   - Preview button (opens iframe modal)
   - Save Draft button
   - Publish / Unpublish button

   Version History (collapsible panel):
   - List of saved versions with timestamps
   - Restore button per version
   - Diff view (current vs version)

4. Page preview modal:
   - Sandboxed iframe rendering HTML
   - Device toggle tabs: Desktop | Tablet | Mobile
   - iframe sizes: 1280px | 768px | 375px

5. Analytics Scripts page (admin/cms/analytics):
   - Card for each: Google Analytics | GTM | Meta Pixel | Custom Scripts
   - Input per field
   - Preview of injection code (read-only)
   - Save button
   - "These scripts are injected into all published pages" notice

━━━ REQUIREMENTS ━━━
- Monaco Editor loaded client-side only (dynamic import, ssr: false)
- Slug auto-format: toLowerCase, spaces → hyphens, strip special chars
- System slugs blocked: login, signup, dashboard, api, admin, webhooks, sitemap.xml, robots.txt, _next
- HTML served with: X-Frame-Options: SAMEORIGIN, CSP headers
- Sitemap auto-regenerated on publish/unpublish
- run pnpm typecheck, zero errors
```

---

# ═══════════════════════════════════════════════
# MODULE 14 — WHITE-LABEL + CUSTOM DOMAINS
# ═══════════════════════════════════════════════

```
[PASTE GLOBAL CONTEXT FIRST]

Build Module 14 — WHITE-LABEL + CUSTOM DOMAINS.

━━━ BACKEND (apps/api/src/modules/whitelabel) ━━━

1. Branding API (SUPER_ADMIN / RESELLER_ADMIN only):
   GET  /whitelabel/branding — get branding config
   PUT  /whitelabel/branding — update branding
   POST /whitelabel/branding/logo — upload logo
   POST /whitelabel/branding/favicon — upload favicon
   POST /whitelabel/branding/preview — preview CSS variables

2. Domain management:
   GET    /whitelabel/domains — list domains
   POST   /whitelabel/domains — add domain
     Body: { domain: string }
     Returns: { verificationToken, cnameRecord }
   GET    /whitelabel/domains/:id — get domain with DNS instructions
   DELETE /whitelabel/domains/:id — remove domain
   POST   /whitelabel/domains/:id/verify — trigger verification check
     - Do DNS lookup for CNAME record
     - If verified: set status VERIFIED
     - Trigger SSL provisioning (background job)
   GET    /whitelabel/domains/:id/status — check current status

3. Domain resolution middleware (in Nginx + API):
   - Every request: read Host header
   - Lookup CustomDomain table by domain
   - If found: inject tenantId into request context
   - Load branding for that tenant
   - Serve app with branding context

4. CSS variable generation:
   From TenantBranding → generate CSS:
   :root {
     --primary: {primaryColor};
     --secondary: {secondaryColor};
     --accent: {accentColor};
   }
   Serve at: GET /branding/css?tenantId={id}
   Cache in Redis: 5 minutes TTL

5. Email config (SMTP per reseller):
   GET  /whitelabel/email-config — get SMTP settings (password masked)
   PUT  /whitelabel/email-config — update SMTP settings
   POST /whitelabel/email-config/test — send test email

━━━ FRONTEND (apps/admin — White-label section) ━━━

1. Branding page (admin/whitelabel/branding):
   Section: Logos
   - Logo upload (light version)
   - Logo upload (dark version)  
   - Favicon upload
   - Preview on dark/light background

   Section: Colors
   - Primary color picker (hex input + color swatch)
   - Secondary color picker
   - Accent color picker
   - Live preview panel (shows sidebar + button in chosen colors)

   Section: Typography
   - Dashboard title input
   - Custom font name (Google Fonts name)

   Section: Custom CSS
   - Advanced: textarea for CSS overrides (sanitized)
   - Warning: "Advanced users only"

   Save button + "Preview as tenant" button

2. Domains page (admin/whitelabel/domains):
   - List of configured domains with status badges
   - "+ Add Domain" button
   
   Add Domain flow (modal):
   Step 1: Enter domain name
   Step 2: Show DNS instructions:
     "Add a CNAME record:"
     Host: @ or www
     Value: {platform-cname}.yourplatform.com
     Copy button for value
   Step 3: Click "Verify DNS" button
   Step 4: Success → SSL provisioning starts

   Domain status badges: Pending | DNS Verified | SSL Pending | Active | Error

3. Email Config page (admin/whitelabel/email):
   - Provider selector: Resend | SMTP | Platform Default
   - If SMTP: host, port, user, password inputs
   - From Name, From Email
   - Test email button (sends to admin's email)

━━━ REQUIREMENTS ━━━
- Branding changes cached in Redis (TTL 5min)
- Domain verification does real DNS lookup (node:dns module)
- SSL provisioning via Certbot: run shell command (or stub with TODO)
- Custom CSS sanitized (strip: javascript:, expression(), @import)
- run pnpm typecheck, zero errors
```

---

# ═══════════════════════════════════════════════
# MODULE 15 — ANALYTICS
# ═══════════════════════════════════════════════

```
[PASTE GLOBAL CONTEXT FIRST]

Build Module 15 — ANALYTICS.

━━━ BACKEND (apps/api/src/modules/analytics) ━━━

1. Tenant Analytics:
   GET /analytics/overview
   Returns:
   {
     period: "last_30_days",
     conversations: { total, new, resolved, avgResponseTime },
     messages: { sent, received, aiReplies, aiPercentage },
     contacts: { total, new, optedOut },
     campaigns: { sent, delivered, read, replied, deliveryRate, readRate },
     automations: { triggered, completed, failureRate },
     ai: { tokensUsed, cost, messagesHandled }
   }

   GET /analytics/conversations/chart?period=30d
   Returns: daily data points [{ date, created, resolved, messages }]

   GET /analytics/campaigns/:id
   Returns: full campaign funnel + timeline

   GET /analytics/agents
   Returns: per-agent stats (conversations handled, avg response time, resolved)

   GET /analytics/ai/costs
   Returns: daily AI cost chart + model breakdown

2. Analytics event tracking (internal):
   POST /analytics/track (internal only, not exposed to tenants)
   Track events from all system actions

3. Real-time counters (served from Redis):
   GET /analytics/realtime
   {
     activeConversations: number,
     onlineAgents: number,
     messagesLast1h: number,
     aiRepliesLast1h: number
   }

━━━ WORKER (analytics:events queue) ━━━
- Aggregate events into AnalyticsDailyRollup
- Update per-day counters (increment, not replace)
- Flush Redis real-time counters every minute

━━━ FRONTEND (apps/web) ━━━

1. app/(dashboard)/analytics/page.tsx:

   Period selector: Last 7 days | Last 30 days | Last 90 days | Custom range

   Row 1 — Key metrics (stat cards):
   - Total Conversations | New Contacts | Messages Sent | AI Reply Rate

   Row 2 — Charts:
   - Conversations over time (line chart)
   - Message volume (bar chart)

   Row 3 — Detailed tables:
   - Top automations (by trigger count)
   - Campaign performance table
   - Agent performance table

   Row 4 — AI Analytics:
   - AI cost this period
   - Tokens used vs limit (progress)
   - Model usage breakdown (pie chart)

   All charts use: recharts (already in packages/ui)
   Loading: skeleton placeholders while fetching
   Empty state: "No data for this period"

━━━ REQUIREMENTS ━━━
- Charts must be responsive
- Date range picker uses react-day-picker
- All numbers formatted with locale (e.g. 1,234 not 1234)
- run pnpm typecheck, zero errors
```

---

# ═══════════════════════════════════════════════
# MODULE 16 — NOTIFICATIONS
# ═══════════════════════════════════════════════

```
[PASTE GLOBAL CONTEXT FIRST]

Build Module 16 — NOTIFICATIONS.

━━━ BACKEND (apps/api/src/modules/notifications) ━━━

1. Notification API:
   GET    /notifications — paginated list for current user
     Query: read=true|false, type, page
   PATCH  /notifications/:id/read — mark single read
   POST   /notifications/read-all — mark all read
   DELETE /notifications/:id — delete
   GET    /notifications/count — unread count (for badge)

2. Notification preferences:
   GET  /notifications/preferences — get user preferences
   PUT  /notifications/preferences — update preferences
   Per type: inApp, email, whatsapp toggles

3. Notification creator (internal service):
   class NotificationService {
     async notify(params: {
       tenantId: string
       userId: string
       type: string
       title: string
       body: string
       data?: object
       channels: Channel[]
     })
   }

   Dispatches to queue: notifications:send

━━━ WORKER (notifications:send queue) ━━━
1. Load user preferences for this notification type
2. Determine which channels to use
3. For in_app: create Notification record, emit WebSocket
4. For email: push to email:send queue
5. For whatsapp: push to whatsapp:outgoing queue

━━━ EMAIL SYSTEM (packages/emails) ━━━
Create React Email templates for:
- Welcome email (after signup)
- Email verification
- Password reset
- Payment confirmation
- Payment failed
- Trial ending reminder (3 days before)
- Subscription cancelled

Each template: professional, uses TenantBranding for logo/colors

━━━ FRONTEND (apps/web) ━━━

1. Notification bell (in Topbar — already stubbed):
   - Badge with unread count
   - Click → dropdown/panel slides in from right
   
   Notification panel:
   - "Notifications" header + "Mark all read" button
   - List of notifications (newest first)
   - Each item: icon, title, body (truncated), time (relative)
   - Unread items: slightly highlighted background
   - Click item: mark read + navigate if has link
   - "View all" link → /notifications page

2. app/(dashboard)/notifications/page.tsx:
   - Full notification list
   - Filter tabs: All | Unread | Read
   - Filter by type
   - Bulk select + mark read

3. Notification preferences (in settings):
   - Table: Notification Type | In-App | Email | WhatsApp
   - Toggle per cell
   - Save button

━━━ NOTIFICATION TYPES AND DEFAULTS ━━━
Type                      In-App  Email  WhatsApp
new_conversation          true    false  false
message_unassigned        true    true   false
ai_quota_warning          true    true   false
ai_quota_exceeded         true    true   true
payment_failed            true    true   true
payment_success           true    true   false
subscription_renewal      true    true   false
trial_ending              true    true   false
whatsapp_quality_drop     true    true   false
campaign_completed        true    false  false
automation_failed         true    false  false

━━━ REQUIREMENTS ━━━
- Real-time delivery via Socket.IO (not polling)
- Email uses Resend (or SMTP if reseller configured custom)
- run pnpm typecheck, zero errors
```

---

# ═══════════════════════════════════════════════
# MODULE 17 — API + WEBHOOKS (TENANT-FACING)
# ═══════════════════════════════════════════════

```
[PASTE GLOBAL CONTEXT FIRST]

Build Module 17 — API + WEBHOOKS (tenant-facing developer system).

━━━ BACKEND (apps/api/src/modules/developer) ━━━

1. API Key Management:
   GET    /developer/api-keys — list keys (hashed, not full)
   POST   /developer/api-keys — create key
     Body: { name, scopes[], expiresAt? }
     Returns: { key: "wsa_live_xxxx" } ← ONLY TIME FULL KEY IS SHOWN
     Store: keyHash (bcrypt), keyPreview (first 8 chars)
   DELETE /developer/api-keys/:id — revoke
   PATCH  /developer/api-keys/:id — update name/scopes

2. API Key authentication:
   Create ApiKeyAuthGuard:
   - Check Authorization: Bearer wsa_live_xxxx header
   - Hash the key + lookup in ApiKey table
   - Verify not revoked, not expired
   - Extract tenantId from ApiKey.tenantId
   - Validate scope for the route

3. Webhook endpoints:
   GET    /developer/webhooks — list endpoints
   POST   /developer/webhooks — create endpoint
     Body: { url, events[], description? }
     Auto-generate: secret (random 32 bytes hex)
     Returns: { endpoint, secret } ← ONLY TIME SECRET SHOWN
   PUT    /developer/webhooks/:id — update events/url
   DELETE /developer/webhooks/:id — delete
   GET    /developer/webhooks/:id/deliveries — list recent deliveries
   POST   /developer/webhooks/:id/test — send test event
   POST   /developer/webhooks/:id/deliveries/:deliveryId/retry — retry failed

4. Webhook dispatcher (called by system events):
   class WebhookDispatcher {
     async dispatch(tenantId: string, event: string, payload: object) {
       // Find all active endpoints for tenant + event
       // For each endpoint:
       //   Create WebhookDelivery record
       //   Push to queue (internal — not bullmq outgoing)
       //   Sign payload: HMAC-SHA256(secret, JSON.stringify(payload))
       //   Set header: X-Webhook-Signature: sha256={signature}
     }
   }

5. Webhook delivery worker:
   - POST to endpoint URL
   - Timeout: 10 seconds
   - On success (2xx): mark delivered
   - On failure: retry (backoff: 1min, 5min, 30min, 2h)
   - After 5 failures: mark permanently failed

6. Public REST API (for external developers using API keys):
   These routes accept API key auth:
   
   GET  /v1/contacts — list contacts
   POST /v1/contacts — create contact
   
   GET  /v1/conversations — list conversations
   GET  /v1/conversations/:id — get conversation
   
   POST /v1/messages/send — send WhatsApp message
     Body: { to, type, content, numberId }
   
   GET  /v1/templates — list approved templates

━━━ FRONTEND (apps/web) ━━━

1. app/(dashboard)/settings/api/page.tsx:

   Section: API Keys
   - Table: Name | Scopes | Created | Last Used | Expires | Actions
   - "+ Create API Key" button

   Create API Key modal:
   - Name input
   - Scopes checkboxes (grouped by resource)
   - Expiry: Never | 30 days | 90 days | 1 year
   - Create button
   
   After creation:
   - Show full key ONCE: "wsa_live_xxxxxxxxxxxx"
   - "Copy" button
   - Warning: "This key won't be shown again. Save it now."
   - Close button

2. app/(dashboard)/settings/webhooks/page.tsx:

   Section: Webhook Endpoints
   - Table: URL | Events | Status | Success Rate | Last Called | Actions
   - "+ Add Webhook" button

   Add Webhook modal:
   - URL input
   - Events (multi-select checkboxes grouped by category)
   
   After creation:
   - Show signing secret ONCE
   - Copy button + warning

   Endpoint detail panel (click row):
   - Delivery logs table (last 200)
   - Status: success/failed | timestamp | response code
   - Retry button per delivery
   - Test endpoint button

3. API Documentation link:
   - "View API Docs" link (links to /docs or external docs site)
   - Estimated from: plan limits table

━━━ AVAILABLE EVENTS (for webhook subscriptions) ━━━
conversation.created | conversation.resolved | conversation.assigned
message.received | message.sent
contact.created | contact.updated | contact.opted_out
campaign.completed | campaign.failed
automation.triggered | automation.completed | automation.failed
payment.success | payment.failed
ticket.created | ticket.resolved
ai.reply.generated

━━━ REQUIREMENTS ━━━
- API key prefix: wsa_live_ (production) or wsa_test_ (sandbox)
- Keys hashed with bcrypt before storage
- Webhook secret shown ONLY once on creation
- Scope system: fine-grained (read:contacts, write:contacts, etc.)
- Plan controls API access (check TenantFeatureFlag: api_access)
- run pnpm typecheck, zero errors
```

---

# ═══════════════════════════════════════════════
# FINAL POLISH — RUN AFTER ALL MODULES COMPLETE
# ═══════════════════════════════════════════════

```
[PASTE GLOBAL CONTEXT FIRST]

All 17 modules are built. Now do final production hardening:

1. Run full audit:
   pnpm typecheck — must show 0 errors
   pnpm lint — fix all lint errors
   pnpm build — must complete without errors

2. Check for these common issues and fix all:
   - Any hardcoded secrets or API keys in code (replace with env vars)
   - Any TODO comments that are blockers (not nice-to-haves)
   - Any console.log() calls in production code (remove or replace with logger)
   - Any missing loading states on async operations
   - Any missing error states on data fetches
   - Any API routes missing tenant_id validation
   - Any DB queries missing WHERE tenant_id = clause

3. Add these missing pieces if not already done:
   - 404 page (apps/web/app/not-found.tsx)
   - Error boundary (apps/web/app/error.tsx)
   - Loading page (apps/web/app/loading.tsx)
   - Global error handler in NestJS (exception filter)
   - Health check endpoint: GET /health returning { status, db, redis, queue }

4. Docker Compose final:
   Ensure docker-compose.yml has all services:
   nginx, web, admin, api, worker, postgres, redis, minio
   With proper: restart policies, health checks, volume mounts

5. Environment validation:
   Ensure packages/config/env.ts validates ALL required variables
   App must fail fast with clear error if any required env var is missing

Final check:
pnpm build && echo "BUILD SUCCESSFUL"
```
