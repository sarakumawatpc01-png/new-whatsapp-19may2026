# 🌌 Dyad AI | Next-Gen WhatsApp SaaS Platform

![Dyad Banner](https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop)

Dyad is an **AI-Native, Multi-Tenant WhatsApp SaaS** designed for modern retail brands and agencies. Built with a premium glassmorphism interface, it provides industrial-grade automation, intelligent CRM, and neural-engine AI support.

## 🚀 Key Features

-   **💎 Premium Glassmorphism UI**: High-fidelity design system with frosted glass panels and fluid animations.
-   **🧠 Neural AI Orchestrator**: Multi-model support (OpenAI, Anthropic, Google) with custom RAG (Retrieval Augmented Generation).
-   **🏢 Multi-Tenant Architecture**: Complete data isolation, custom branding, and white-labeling support.
-   **⚡ Visual Automations**: Drag-and-drop conversational workflow builder.
-   **💳 Enterprise Billing**: Native Stripe and Razorpay integration with usage-based billing.
-   **🔐 High Security**: HS256 JWT Auth, AES-256 API key encryption, and audit logging.

## 🏗️ Technical Stack

-   **Frontend**: Next.js 15, Tailwind CSS, Framer Motion, Lucide Icons.
-   **Backend**: NestJS (Node.js), BullMQ (Job Queues), Passport.js (Auth).
-   **Database**: PostgreSQL (Prisma ORM), Redis (Caching & Queues).
-   **Infrastructure**: Turborepo (Monorepo), pnpm, Docker.

## 🤖 AI Setup Guide
If you are using an AI agent (like OpenCode, Bolt, or Lovable) to set up this system, please instruct them to read **`AI_SETUP_GUIDE.md`** first. It contains specific instructions for domain configuration, port isolation, and automated deployment.

## 🛠️ Getting Started

### 1. Environment Configuration
Copy the `.env.example` to `.env` and fill in your secrets:
```bash
cp .env.example .env
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Database Initialization
```bash
# Push schema to database
pnpm db:migrate

# Seed demo accounts (Admin/User)
pnpm db:seed
```

### 4. Start Development
```bash
pnpm dev
```
- **Web App**: `http://localhost:3000`
- **Admin Panel**: `http://localhost:3001`
- **API Service**: `http://localhost:3002`

## 📋 B2C Launch Checklist

Before going live for retail customers, ensure:
1. [ ] **Meta App**: Configure your official WhatsApp Business API credentials.
2. [ ] **Payments**: Connect your Stripe/Razorpay production keys.
3. [ ] **Email**: Set up Resend or SMTP for transactional emails.
4. [ ] **SSL**: Ensure your production domain has SSL (required for Webhooks).
5. [ ] **Redis**: Ensure a production Redis instance is reachable.

## 🔒 Security Policy
This platform implements AES-256 encryption for all sensitive provider keys. Ensure your `ENCRYPTION_KEY` in `.env` is at least 32 characters long and never shared.

---
Built with ❤️ by the Dyad AI Team.
