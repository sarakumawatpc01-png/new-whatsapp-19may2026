# 🤖 AI Setup & Deployment Guide (For OpenCode AI Agent)

This document provides specific instructions for the AI agent setting up the WhatsApp AI Platform.

## 🎯 Goal
Set up a multi-tenant WhatsApp SaaS platform with zero interference to existing systems on the host VPS.

## 🛠️ Step 1: Isolation & Port Conflict Check
Before running `docker-compose`, check if the following ports are occupied on the host:
- `80`, `443` (Nginx)
- `5432` (Postgres)
- `6379` (Redis)
- `9000`, `9001` (MinIO)
- `3000`, `3001`, `3002` (Apps)

**Action**: If ports are occupied, modify `docker-compose.yml` to use available ports (e.g., `8080`, `8443`, `5433`, etc.).

## 🌐 Step 2: Domain Name Configuration
Ask the user for the following domain names:
1. **Frontend/User Dashboard**: (e.g., `app.example.com`)
2. **Admin Dashboard**: (e.g., `admin.example.com`)
3. **API/Webhook Endpoint**: (e.g., `api.example.com`)

**Action**: Update `nginx/nginx.conf` with these server names and ensure `NEXT_PUBLIC_API_URL` and `FRONTEND_URL` in `.env` files match these domains.

## 🔐 Step 3: SSL Setup
If running on a VPS, use Certbot to generate SSL certificates.
**Action**: Mount the certificates into the `nginx/certs` directory as expected by `docker-compose.yml`.

## 📦 Step 4: Environment Variables
Do not proceed until the following variables are set in the root `.env`:
- `DATABASE_URL` (Point to the internal Docker service: `postgresql://postgres:postgres@postgres:5432/whatsapp_saas`)
- `REDIS_URL` (`redis://redis:6379`)
- `ENCRYPTION_KEY` (32 characters long)
- `JWT_SECRET`
- `NEXTAUTH_SECRET`

## 🚀 Step 5: Execution Sequence
1. Run `./setup.sh` to initialize files and templates.
2. Configure `.env` files.
3. Run `docker-compose build --no-cache`.
4. Run `docker-compose up -d`.
5. Run `pnpm db:migrate` inside the API container to initialize the DB.

## ⚠️ Important Notes
- **Monorepo Structure**: This is a Turborepo. All commands should be run from the root using `pnpm`.
- **Database isolation**: Use the included Postgres container unless the user specifies an external DB.
- **Persistence**: Ensure `volumes` in `docker-compose.yml` are correctly mapped to prevent data loss on container restart.
