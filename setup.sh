#!/bin/bash

# ══════════════════════════════════════════════
# Dyad AI | VPS Setup & Deployment Script
# ══════════════════════════════════════════════

set -e

echo "🚀 Starting Dyad AI Setup..."

# ── 1. Check Requirements ──────────────────────
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v20+."
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm@9
fi

# ── 2. Environment Configuration ───────────────
echo "🔧 Configuring environment files..."

# Root .env
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created root .env"
fi

# Sub-apps .env
APPS=("apps/api" "apps/web" "apps/admin" "apps/worker")
for APP in "${APPS[@]}"; do
    if [ ! -f "$APP/.env" ]; then
        if [ -f "$APP/.env.example" ]; then
            cp "$APP/.env.example" "$APP/.env"
            echo "✅ Created $APP/.env"
        fi
    fi
done

# ── 3. Install Dependencies ────────────────────
echo "📥 Installing dependencies (this may take a few minutes)..."
pnpm install

# ── 4. Database Setup ──────────────────────────
echo "🗄️ Initializing database schema..."
pnpm db:migrate || echo "⚠️ Database migration failed. Ensure DATABASE_URL in .env is correct."

# ── 5. Finished ────────────────────────────────
echo "══════════════════════════════════════════════"
echo "✅ Setup Complete!"
echo ""
echo "To start the system, you have two options:"
echo ""
echo "Option A: Using Docker (Recommended for VPS)"
echo "   docker-compose up -d"
echo ""
echo "Option B: Using PM2 (Standard Node.js Process Manager)"
echo "   npm install -g pm2"
echo "   pnpm dev"
echo ""
echo "Please check your .env files to ensure all API keys are set."
echo "══════════════════════════════════════════════"
