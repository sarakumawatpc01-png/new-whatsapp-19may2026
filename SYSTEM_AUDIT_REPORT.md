# SYSTEM AUDIT REPORT
## AI-Native WhatsApp SaaS — End-to-End Bug & Error Analysis

---

## 🔴 CRITICAL BUGS (System-Breaking)

---

### BUG #1 — AI Queue Job Name Mismatch (AI Auto-Reply Is Completely Dead)

**Location:** `apps/worker/src/processors/whatsapp.processor.ts` line 173 vs `apps/worker/src/processors/ai.processor.ts` line 19

**Problem:**
The WhatsApp processor enqueues AI jobs with the name `"process"`:
```ts
await this.aiQueue.add("process", { ... })
```
But the AI processor `@Process` handler listens for `"processing"`:
```ts
@Process("processing")
async handleAIProcessing(job: Job<any>) { ... }
```

**Impact:** Every single inbound WhatsApp message gets queued for AI processing but **the job is NEVER picked up**. AI auto-reply is completely non-functional. Messages queue up forever, memory/Redis fills up.

**Fix:** Change the enqueue call in `whatsapp.processor.ts` line 173 to `"processing"`:
```ts
await this.aiQueue.add("processing", { ... })
```

---

### BUG #2 — "outgoing" WhatsApp Queue Has No Processor (All Outbound Messages Never Sent)

**Location:** Multiple files enqueue `"outgoing"` jobs:
- `apps/worker/src/processors/ai.processor.ts` line 131
- `apps/worker/src/processors/automation.processor.ts` line 140
- `apps/worker/src/processors/campaign.processor.ts` line 69
- `apps/api/src/modules/inbox/inbox.service.ts` line 151

**Problem:** There is no `@Process("outgoing")` handler anywhere in the worker. The `@Processor("whatsapp")` class only has `@Process("webhook")`. Every message queued as `"outgoing"` silently sits in Redis and is never delivered to Meta's API.

**Impact:** All outbound messages (AI replies, automation messages, campaign sends, agent replies) are stored in DB but **never actually sent to WhatsApp**. Users see sent status in UI but recipients never receive messages.

**Fix:** Add an `@Process("outgoing")` handler inside `WhatsAppProcessor` that calls the Meta API:
```ts
@Process("outgoing")
async handleOutgoing(job: Job<any>) {
  const { tenantId, phoneNumberId, to, type, body } = job.data;
  // fetch number, decrypt token, call Meta API
}
```

---

### BUG #3 — Inbound Messages Never Appear in Real-Time Inbox (WebSocket Gap)

**Location:** `apps/worker/src/processors/whatsapp.processor.ts` — entire flow

**Problem:** When a WhatsApp message arrives:
1. Webhook → stored in DB ✅
2. Queue → processed by worker ✅
3. Worker saves message to DB ✅
4. **Worker NEVER emits `message:new` to WebSocket** ❌

The only `message:new` Socket.IO emissions are in `apps/api/src/modules/inbox/inbox.controller.ts` lines 122 and 135 — which only fire when an **agent** sends a message from the dashboard.

The worker runs in a separate process (`apps/worker`) with no access to `InboxGateway`. There is no Redis Pub/Sub bridge between worker and API gateway. The worker itself even has a comment acknowledging this:
```ts
// Note: InboxGateway is injected at the module level
// We emit via a Redis pub/sub or direct reference
// For now, we can use BullMQ event pattern
```

**Impact:** When a customer sends a message on WhatsApp, agents see nothing in the inbox until they manually refresh the page. Real-time inbox is completely broken for inbound messages.

**Fix:** Implement Redis Pub/Sub in the worker. After saving a message, publish to a Redis channel. The API's InboxGateway subscribes to that channel and emits to connected sockets:
```ts
// In worker after saving message:
await redis.publish(`tenant:${tenantId}:messages`, JSON.stringify({ event: "message:new", data: message }));

// In API InboxGateway:
redis.subscribe(`tenant:${tenantId}:messages`, (msg) => {
  this.server.to(`tenant:${tenantId}`).emit("message:new", JSON.parse(msg));
});
```

---

### BUG #4 — Encryption Key Inconsistency (Decryption Will Fail Across Services)

**Location:** Multiple services use different key parsing strategies for the **same** `ENCRYPTION_KEY` environment variable.

- `apps/api/src/modules/whatsapp/whatsapp.service.ts` line 16:
  ```ts
  Buffer.from(key, "hex")  // treats key as hex string → 32-byte key
  ```
- `apps/api/src/modules/ai/ai.service.ts` line 361:
  ```ts
  Buffer.from(this.encryptionKey.slice(0, 32))  // treats key as UTF-8 → 32 chars
  ```
- `apps/api/src/modules/admin/system-config.controller.ts` line 7:
  ```ts
  Buffer.from(key || "0".repeat(64), "hex")  // treats key as hex
  ```
- `apps/worker/src/processors/ai.processor.ts` line 256:
  ```ts
  Buffer.from(this.encryptionKey.slice(0, 32), "utf8")  // UTF-8
  ```

**Impact:** A secret (e.g., WhatsApp access token) encrypted by `whatsapp.service.ts` (hex mode) **cannot be decrypted** by `ai.processor.ts` (UTF-8 mode). AI auto-reply will throw a decryption error every time it tries to use the WhatsApp token. Same for any cross-service secret sharing.

**Fix:** Standardize across all services. Pick one approach and use it everywhere:
```ts
// Recommended: consistent hex-encoded 32-byte key
const key = Buffer.from(process.env.ENCRYPTION_KEY!, "hex"); // key must be 64 hex chars
```

---

### BUG #5 — Forgot Password Does Not Send Email

**Location:** `apps/api/src/modules/auth/auth.service.ts` — `forgotPassword()` method

**Problem:** The `forgotPassword()` function creates a reset token in the DB but **never queues or sends any email**. It returns silently with no notification to the user.

```ts
async forgotPassword(email: string) {
  const user = await this.prisma.user.findUnique({ where: { email } });
  if (!user) return;
  const token = randomBytes(32).toString("hex");
  await this.prisma.passwordReset.create({ data: { token, userId: user.id, expiresAt: ... } });
  // ← NO email send here
}
```

**Impact:** Password reset is completely broken. Users click "Forgot Password", see a success message, but never receive an email. They cannot recover their accounts.

**Fix:** Add email queue call after creating the token:
```ts
await this.emailQueue.add("send", {
  to: user.email,
  template: "password-reset",
  data: { resetUrl: `${env.FRONTEND_URL}/reset-password?token=${token}` }
});
```

---

### BUG #6 — Signup Verification Email Never Sent

**Location:** `apps/api/src/modules/auth/auth.service.ts` — `signup()` method

**Problem:** The signup flow creates an `EmailVerification` token in the DB (line 97) but never sends the verification email. There is no email queue call anywhere in the signup function.

**Impact:** New users sign up and are expected to verify their email, but they never receive the verification link. The account cannot be confirmed via email.

**Fix:** Queue the verification email after creating the token.

---

### BUG #7 — Duplicate Campaign Queue Processor (Race Condition / Double Processing)

**Location:** `apps/worker/src/processors/campaigns.processor.ts` AND `apps/worker/src/processors/campaign.processor.ts`

**Problem:** Both files register `@Processor("campaigns")` with `@Process("process-campaign")`. Both are registered in `apps/worker/src/app.module.ts` as providers. BullMQ will assign jobs to both consumers in a round-robin. Some campaign jobs will be processed by one processor, some by the other, and both may attempt to process the same job.

**Impact:** Campaigns may be sent twice to some contacts, or fail unpredictably depending on which processor handles the job.

**Fix:** Delete one of the two files (they appear to be a copy-paste duplicate) and remove its registration from `app.module.ts`.

---

## 🟠 HIGH SEVERITY BUGS

---

### BUG #8 — Duplicate AI Processor in API + Worker (Both Listen to Same Queue)

**Location:** `apps/api/src/modules/ai/ai.processor.ts` AND `apps/worker/src/processors/ai.processor.ts`

**Problem:** Both the API process and the Worker process register `@Processor("ai")`. When a `document_process` job is queued, both processes compete to handle it. Only one wins per job, but this is non-deterministic and creates confusion. The API's AI processor handles only `document_process`, the worker handles both `processing` and `document_process`.

**Impact:** Unpredictable document processing. Observability is broken — half the processing happens in the API process, half in the worker. Logs are split across two processes.

**Fix:** Remove `AIProcessor` from `apps/api/src/modules/ai/ai.module.ts` and handle all AI queue processing only in the worker.

---

### BUG #9 — Webhook Tenant Isolation Not Validated

**Location:** `apps/api/src/modules/whatsapp/whatsapp.controller.ts` — `POST /webhooks/whatsapp/:tenantId`

**Problem:** The webhook URL accepts any `tenantId` in the path parameter. The signature is validated against the global `META_APP_SECRET`, but there is **no check that the phone number in the payload actually belongs to that tenant**. The `handleWebhook` call blindly passes whatever `tenantId` is in the URL to the queue.

**Impact:** If an attacker (or misconfigured webhook) sends a valid payload to `/webhooks/whatsapp/{wrong-tenant-id}`, that message gets processed and stored under the wrong tenant. This is a tenant isolation security flaw.

**Fix:** In `whatsapp.processor.ts` `processMessage()`, after finding `waNumber`, verify that `waNumber.tenantId === tenantId`:
```ts
if (waNumber.tenantId !== tenantId) {
  this.logger.error(`Tenant mismatch: expected ${tenantId}, got ${waNumber.tenantId}`);
  return;
}
```

---

### BUG #10 — Rate Limiting Only Applied to `/openapi` Route (Auth Brute Force Possible)

**Location:** `apps/api/src/app.module.ts` lines 66-68

**Problem:**
```ts
consumer.apply(RateLimitMiddleware).forRoutes("openapi");
```
The rate limiter is only applied to the public API routes. The auth routes (`/auth/login`, `/auth/signup`, `/auth/forgot-password`) have zero rate limiting.

**Impact:** Brute force attacks on user passwords, credential stuffing attacks, and email enumeration via forgot-password are all trivially possible.

**Fix:** Apply rate limiting to auth routes specifically, with stricter limits:
```ts
consumer.apply(RateLimitMiddleware).forRoutes("auth", "openapi");
```

---

### BUG #11 — Webhook Job ID Is Random (Not Idempotent)

**Location:** `apps/api/src/modules/whatsapp/whatsapp.service.ts` line 69

**Problem:**
```ts
jobId: `webhook-${Date.now()}-${crypto.randomInt(1000)}`
```
Bull/BullMQ uses `jobId` for deduplication. A random job ID means that if Meta re-delivers the same webhook event (which it does regularly on network issues), a duplicate job is created and processed.

The worker does a DB-level check for existing messages as a fallback, but this is a race condition — two workers could both pass the DB check before either writes.

**Fix:** Use a deterministic job ID based on the Meta event ID:
```ts
const eventId = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.id || `webhook-${Date.now()}`;
jobId: `webhook-${tenantId}-${eventId}`
```

---

### BUG #12 — In-Memory Dedup Set for Webhooks (Resets on Worker Restart)

**Location:** `apps/worker/src/processors/whatsapp.processor.ts` lines 16-17

**Problem:**
```ts
private processedWebhookIds = new Set<string>();
```
This in-memory set is used for deduplication. It resets every time the worker process restarts. During a deployment, scale-out, or crash recovery, duplicate messages will be processed.

**Fix:** Replace with Redis-backed deduplication:
```ts
const alreadyProcessed = await redis.set(`dedup:${msg.id}`, "1", "EX", 86400, "NX");
if (!alreadyProcessed) return; // key already existed
```

---

### BUG #13 — No "outgoing" Message in DB Before Sending (Status Tracking Broken for AI Replies)

**Location:** `apps/worker/src/processors/ai.processor.ts` lines 75-90

**Problem:** The AI processor creates a message in DB with `status: SENT`, then queues an `"outgoing"` job. But since the `"outgoing"` job has no processor (Bug #2), the message is never actually sent. The DB record shows `SENT` but the message was never delivered. Even if the outgoing processor is fixed, the status update flow is wrong — it should be `PENDING` → `SENT` → `DELIVERED` based on Meta status callbacks.

**Fix:** Create the message as `PENDING`, then update to `SENT` when the outgoing processor successfully calls Meta API, then update to `DELIVERED`/`READ` on status webhook.

---

## 🟡 MEDIUM SEVERITY BUGS

---

### BUG #14 — AI Cost Logging Is Always Zero

**Location:** `apps/worker/src/processors/ai.processor.ts` line 105

**Problem:**
```ts
costUsd: 0,  // hardcoded zero
latencyMs: 0, // hardcoded zero
```
AI cost tracking stores `0` for every request. The system has a full cost tracking schema (`AIUsageLog`) but it's never actually populated with real data.

**Impact:** The billing and analytics dashboards show `$0.00` for all AI usage. Tenants can over-consume AI with no cost tracking. SuperAdmin cannot see actual platform AI costs.

**Fix:** Calculate cost based on model pricing. Add a pricing table per model in the AI package and compute: `cost = (inputTokens * inputRate + outputTokens * outputRate)`. Track `latencyMs` using `Date.now()` before and after the API call.

---

### BUG #15 — Document Processing Extracts No Real Content (Fake Placeholder Text)

**Location:** `apps/worker/src/processors/ai.processor.ts` lines 162-167

**Problem:**
```ts
content = `Extracted text from ${doc.name} (${doc.fileUrl}). The system is fully operational.`;
```
When an uploaded document (PDF, DOCX, etc.) is processed for RAG, if there's no pre-existing `content` field, it just sets a fake placeholder string instead of actually parsing the file.

**Impact:** The entire RAG/knowledge base feature doesn't work. Tenants upload documents expecting the AI to learn from them, but the AI receives only a fake string. Document-based Q&A is completely non-functional.

**Fix:** Use a real document parsing library. For PDFs use `pdf-parse`, for DOCX use `mammoth`. Download the file from S3 URL and extract text:
```ts
import pdfParse from "pdf-parse";
const response = await axios.get(doc.fileUrl, { responseType: "arraybuffer" });
const parsed = await pdfParse(Buffer.from(response.data));
content = parsed.text;
```

---

### BUG #16 — Confidence Scoring Makes a Second AI API Call for Every Message

**Location:** `packages/ai/src/orchestrator.ts` — `scoreConfidence()` method

**Problem:** After generating every AI reply, the orchestrator makes a **second API call** to score the confidence of the first response. This doubles the AI cost for every single message and adds significant latency.

**Impact:** 2× API costs. Increased response latency (2 sequential API calls per message). For high-volume tenants, this is financially significant.

**Fix:** Either remove confidence scoring from the hot path and make it optional, or use a lightweight local heuristic instead of a second API call.

---

### BUG #17 — Stripe Webhook Signature Bypassed in Development

**Location:** `apps/api/src/modules/billing/webhooks.controller.ts` lines 26-28

**Problem:**
```ts
if (env.STRIPE_WEBHOOK_SECRET === "whsec_placeholder") {
  verified = true;  // bypass signature verification
}
```
If the `STRIPE_WEBHOOK_SECRET` environment variable is set to the placeholder value (as it is in the `.env.example`), Stripe webhook signature verification is completely bypassed. Any HTTP request can trigger subscription activations, cancellations, or plan upgrades.

**Impact:** If this config makes it to production (which it might, since `.env.example` has the placeholder), attackers can fake payment events to activate premium subscriptions without paying.

**Fix:** Remove the bypass entirely. Throw an error if the webhook secret is a placeholder value.

---

### BUG #18 — `META_API_VERSION` Config vs Hardcoded Mismatch

**Location:** `apps/api/src/modules/whatsapp/whatsapp.service.ts` line 11 vs `packages/config/src/env.ts` line 26

**Problem:**
```ts
// whatsapp.service.ts
const META_API_VERSION = "v19.0"; // hardcoded

// env.ts default
META_API_VERSION: z.string().default("v18.0")
```
The service hardcodes `v19.0` and ignores the configurable `META_API_VERSION` environment variable. There's a mismatch between the hardcoded version and the env schema default.

**Fix:** Use `getEnv().META_API_VERSION` in the service instead of the hardcoded string.

---

### BUG #19 — WhatsApp Phone Number Registration PIN Is Hardcoded

**Location:** `apps/api/src/modules/whatsapp/whatsapp.service.ts` line 89

**Problem:**
```ts
pin: "000000"
```
The phone number registration step sends `"000000"` as the two-step verification PIN. This will fail for any WhatsApp Business number that has two-step verification enabled with a custom PIN.

**Fix:** Make the PIN configurable via tenant settings or the WhatsApp connection flow. Alternatively, skip registration if already registered (which the code does try to do via try/catch).

---

### BUG #20 — No WebSocket Event Emitted After AI Reply Is Sent

**Location:** `apps/worker/src/processors/ai.processor.ts`

**Problem:** After the AI generates a reply and saves it to the DB, no WebSocket event is emitted to update the frontend. This is the same root cause as Bug #3 — the worker has no WebSocket access and no Redis Pub/Sub bridge.

**Impact:** After AI responds to a customer, the agent's inbox doesn't update in real-time. The AI reply only appears after a manual refresh.

**Fix:** Same fix as Bug #3 — implement Redis Pub/Sub bridge.

---

### BUG #21 — Razorpay Webhook Event ID Is Non-Unique

**Location:** `apps/api/src/modules/billing/webhooks.controller.ts` line 56

**Problem:**
```ts
const eventId = payload.account_id + "_" + payload.created_at;
```
Razorpay doesn't have a unique event ID per webhook delivery. Using `account_id + created_at` is not unique — multiple events at the same timestamp from the same account will be treated as duplicates, or rapid events with the same timestamp will be deduplicated incorrectly.

**Fix:** Use Razorpay's `payload.payload.payment.entity.id` or the full event object hash as the idempotency key.

---

### BUG #22 — JWT Strategy Config/Runtime Mismatch (`JWT_SECRET` vs RSA Key)

**Location:** `apps/api/src/modules/auth/jwt.strategy.ts`

**Problem:** The `env.ts` schema requires both `JWT_PUBLIC_KEY` and `JWT_PRIVATE_KEY` (RSA key pair), but `jwt.strategy.ts` only uses `JWT_SECRET` (symmetric HMAC key). Similarly, `packages/auth/src/auth.ts` likely uses `JWT_SECRET` for signing. The RSA key pair fields in the schema are required but never used.

**Impact:** Either the app fails to start (if RSA keys aren't provided and the schema enforces them), or the RSA key fields are unused dead config. Current auth uses symmetric signing, which means `JWT_PUBLIC_KEY` and `JWT_PRIVATE_KEY` being required in the Zod schema will prevent the app from starting without them.

**Fix:** Either remove `JWT_PUBLIC_KEY` / `JWT_PRIVATE_KEY` from the schema (marking them optional), or implement RSA signing consistently.

---

## 🟢 LOW SEVERITY / QUALITY ISSUES

---

### BUG #23 — In-Memory Webhook Dedup Set Memory Leak

**Location:** `apps/worker/src/processors/whatsapp.processor.ts` lines 82-85

**Problem:** The code attempts to bound the in-memory Set at 10,000 entries by deleting one entry when full. However, `Set.values().next().value` is not guaranteed to return the oldest entry (Sets maintain insertion order, but deleting oldest requires tracking insertion). In practice this works, but the eviction logic is fragile.

**Fix:** Replace with Redis TTL-based dedup (see Bug #12 fix).

---

### BUG #24 — AI Prohibited Content Filter Is Too Aggressive

**Location:** `packages/ai/src/orchestrator.ts` — `containsProhibitedContent()` line 176

**Problem:**
```ts
const prohibited = ["password", "credit card", "ssn", "social security"];
```
If a user legitimately asks "How do I reset my password?" or "Do you accept credit card payments?", the AI response mentioning those words will be blocked and replaced with a generic safety message.

**Fix:** Match on context, not just word presence. Use a more targeted approach like checking the source (is the AI exposing a real password/card number, or just mentioning the concept).

---

### BUG #25 — `trial-plan` Subscription Created With Hardcoded Plan ID

**Location:** `apps/api/src/modules/auth/auth.service.ts` line 56

**Problem:**
```ts
planId: "trial-plan"
```
The signup flow creates a subscription with `planId: "trial-plan"`, a hardcoded string. If no plan with this ID exists in the database (which it won't in a fresh install), this will throw a foreign key constraint violation.

**Fix:** Look up the trial plan by a `isTrial: true` flag or a `slug: "trial"` field, or create the trial plan as part of the database seed.

---

### BUG #26 — No Retry Logic for Failed Campaign Messages

**Location:** `apps/worker/src/processors/campaigns.processor.ts`

**Problem:** When a campaign message fails to send (Meta API error), the status is updated to `FAILED` but there is no retry mechanism. The campaign just marks individual messages as failed and moves on.

**Fix:** Add a configurable retry count per message with exponential backoff using BullMQ's built-in retry options.

---

### BUG #27 — Automation `send_message` Action Missing `numberId`

**Location:** `apps/worker/src/processors/automation.processor.ts` — `send_message` case

**Problem:**
```ts
await this.whatsappQueue.add("outgoing", {
  tenantId: context.tenantId,
  to: context.contact?.phone || context.from,
  type: "TEXT",
  body: this.replaceVariables(node.data.text, context),
  // ← NO numberId/phoneNumberId
});
```
The outgoing job has no `numberId` or `phoneNumberId`. Even when the outgoing processor is fixed (Bug #2), it won't know which WhatsApp number to send from.

**Fix:** Pass `numberId: context.numberId` in the automation outgoing queue payload.

---

### BUG #28 — Content Security Policy (CSP) Not Configured

**Location:** `apps/api/src/main.ts`

**Problem:** Helmet is not used. There are no CSP headers, X-Frame-Options, or other security headers set. The API is accessible from any origin (CORS wildcard `origin: "*"` in the WebSocket gateway).

**Fix:** Add Helmet with appropriate CSP configuration. Restrict WebSocket CORS to known frontend origins.

---

### BUG #29 — No Validation on Automation Node Webhook URL

**Location:** `apps/worker/src/processors/automation.processor.ts` — `webhook_call` case

**Problem:**
```ts
const response = await axios.post(node.data.url, { ... });
```
No validation on `node.data.url`. An automation could be configured to send internal network requests (SSRF), e.g., targeting `http://169.254.169.254/` (AWS metadata service) or internal services.

**Fix:** Validate the URL is public (not RFC-1918 private ranges, not localhost, not metadata endpoints).

---

### BUG #30 — Document File Processing Only Works for Plain Text URLs

**Location:** `apps/api/src/modules/ai/ai.processor.ts` (API version) lines 27-32

**Problem:**
```ts
const response = await axios.get(doc.fileUrl);
text = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
```
This only works if the URL returns plain text. For S3 pre-signed URLs returning binary PDF data, `axios.get` will return binary and `JSON.stringify` produces garbage. No PDF, DOCX, or binary format parsing is implemented here either.

**Fix:** Same as Bug #15 — implement real document parsing.

---

## SUMMARY TABLE

| # | Severity | Area | Issue |
|---|----------|------|-------|
| 1 | 🔴 CRITICAL | AI | Queue job name mismatch — AI replies never execute |
| 2 | 🔴 CRITICAL | WhatsApp | No `outgoing` queue processor — messages never sent |
| 3 | 🔴 CRITICAL | Realtime | No WebSocket emission from worker — inbox dead |
| 4 | 🔴 CRITICAL | Security | Encryption key inconsistency — cross-service decryption fails |
| 5 | 🔴 CRITICAL | Auth | Forgot password never sends email |
| 6 | 🔴 CRITICAL | Auth | Signup verification email never sent |
| 7 | 🔴 CRITICAL | Campaigns | Duplicate queue processor — double message sends |
| 8 | 🟠 HIGH | AI | Duplicate AI processor in API + Worker |
| 9 | 🟠 HIGH | Security | Webhook tenant isolation not validated |
| 10 | 🟠 HIGH | Security | Rate limiting missing on auth routes |
| 11 | 🟠 HIGH | WhatsApp | Webhook job ID is random — dedup broken |
| 12 | 🟠 HIGH | WhatsApp | In-memory dedup resets on restart |
| 13 | 🟠 HIGH | Messaging | Message status tracking incorrect |
| 14 | 🟡 MEDIUM | Billing | AI cost always logged as $0 |
| 15 | 🟡 MEDIUM | RAG | Document processing inserts fake placeholder text |
| 16 | 🟡 MEDIUM | AI | Confidence scoring doubles API cost per message |
| 17 | 🟡 MEDIUM | Billing | Stripe webhook signature bypassable |
| 18 | 🟡 MEDIUM | WhatsApp | API version hardcoded, ignores env var |
| 19 | 🟡 MEDIUM | WhatsApp | Phone registration uses hardcoded PIN |
| 20 | 🟡 MEDIUM | Realtime | No WebSocket event after AI reply |
| 21 | 🟡 MEDIUM | Billing | Razorpay idempotency key non-unique |
| 22 | 🟡 MEDIUM | Auth | JWT strategy / env schema mismatch |
| 23 | 🟢 LOW | Worker | Dedup set eviction logic fragile |
| 24 | 🟢 LOW | AI | Prohibited content filter too aggressive |
| 25 | 🟢 LOW | Auth | Hardcoded `trial-plan` ID will break on fresh DB |
| 26 | 🟢 LOW | Campaigns | No retry for failed campaign messages |
| 27 | 🟢 LOW | Automation | Missing `numberId` in send_message action |
| 28 | 🟢 LOW | Security | No CSP / security headers |
| 29 | 🟢 LOW | Security | SSRF via automation webhook URL |
| 30 | 🟢 LOW | RAG | Binary document parsing broken |

---

## RECOMMENDED FIX ORDER

**Do these first — system won't work at all without them:**
1. Fix queue job name: `"process"` → `"processing"` (Bug #1)
2. Add `@Process("outgoing")` handler in WhatsApp processor (Bug #2)
3. Add Redis Pub/Sub bridge for WebSocket events (Bug #3)
4. Standardize encryption key parsing across all services (Bug #4)
5. Add email send in `forgotPassword()` and `signup()` (Bugs #5, #6)
6. Delete duplicate campaigns processor file (Bug #7)

**Then fix these for production safety:**
7. Remove API-side AI processor, consolidate in worker (Bug #8)
8. Add phone-number-to-tenant validation in webhook (Bug #9)
9. Apply rate limiting to auth routes (Bug #10)
10. Use deterministic webhook job ID based on Meta event ID (Bug #11)
11. Replace in-memory dedup with Redis SET NX (Bug #12)
12. Fix message status flow to PENDING → SENT → DELIVERED (Bug #13)
13. Remove Stripe signature bypass (Bug #17)
14. Implement real document text extraction (Bug #15)
