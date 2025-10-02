# Environment Variables Setup Guide

This guide will help you get all the necessary environment variables for v0.diy.

## ✅ Quick Start (5 minutes)

### 1. AUTH_SECRET ✓
**Already configured!** Generated value: `kYgbRP3RlXXAnFoXk2tLwnj5wxBs0FLTLr/Kg7FB23A=`

### 2. POSTGRES_URL (Required)

Choose ONE of these options:

#### Option A: Neon (Recommended - Free Forever)
1. Go to https://neon.tech
2. Click "Sign up" (use GitHub/Google)
3. Click "Create a project"
4. Copy the connection string from the dashboard
5. Paste it in `.env.local`:
   ```bash
   POSTGRES_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
   ```

#### Option B: Local Docker (For Development)
```bash
# Run this command:
docker run -d \
  --name v0diy-postgres \
  -e POSTGRES_PASSWORD=mypassword \
  -e POSTGRES_DB=v0diy \
  -p 5432:5432 \
  postgres:16-alpine

# Then add to .env.local:
POSTGRES_URL=postgresql://postgres:mypassword@localhost:5432/v0diy
```

#### Option C: Supabase (Free Tier)
1. Go to https://supabase.com
2. Create a new project
3. Go to Settings → Database
4. Copy "Connection string" (Session mode)
5. Replace `[YOUR-PASSWORD]` with your password

### 3. V0_API_KEY (Required for v0.dev provider)

1. Go to https://v0.dev/chat/settings/keys
2. Click "Create new API key"
3. Copy the key (starts with `v0_sk_`)
4. Add to `.env.local`:
   ```bash
   V0_API_KEY=v0_sk_your_key_here
   ```

## 🚀 Run Database Migrations

After setting up POSTGRES_URL, run:

```bash
pnpm db:migrate
```

## 🔧 Optional Provider Setup

### Ollama (Local)
No API key needed! Just install Ollama:
```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3.2
```

### LM Studio (Local)
1. Download from https://lmstudio.ai
2. Load a model
3. Start server on port 1234

### Ollama Cloud
1. Sign up at https://docs.ollama.com/cloud
2. Get API key
3. Add to `.env.local`:
   ```bash
   OLLAMA_CLOUD_API_KEY=your_key_here
   ```

### Meta Llama API
1. Get access at https://llama.developer.meta.com
2. Add to `.env.local`:
   ```bash
   LLAMA_API_KEY=your_key_here
   ```

## 🐛 Troubleshooting

### Hydration Error
If you see a hydration error, disable browser extensions temporarily (especially region/location selectors).

### Database Connection Error
Make sure POSTGRES_URL is valid and not the placeholder value.

### Provider Not Working
Check that you've:
1. Saved preferences in the provider selector
2. Added required API keys
3. Started local services (Ollama, LM Studio) if using them

## ✅ Final Checklist

- [ ] `AUTH_SECRET` is set ✓ (already done)
- [ ] `POSTGRES_URL` is set to a valid database
- [ ] `V0_API_KEY` is set (from v0.dev)
- [ ] Run `pnpm db:migrate`
- [ ] Run `pnpm dev`
- [ ] Visit http://localhost:3001
- [ ] Provider selector visible on homepage

## 💡 Quick Test

1. Visit http://localhost:3001
2. Look for provider selector above the chat input
3. Try selecting different providers
4. Click settings icon to configure API keys
