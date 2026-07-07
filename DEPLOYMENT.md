# Deployment: GitHub Pages + Render (with local auth stack)

Previously: static site on GitHub Pages, AI frontend on Netlify, backend on Render, auth on Supabase Cloud.

Now: auth runs in your own Docker stack (Postgres + GoTrue + PostgREST + Kong). The app code is unchanged; only URLs/keys point at your hosted auth API.

## Architecture

| Component | Host | URL example |
|-----------|------|-------------|
| Landing + login | GitHub Pages | `https://www.aiper.space` |
| AI frontend | Netlify (or GitHub Pages subpath) | `https://your-app.netlify.app` |
| AI backend | Render Web Service | `https://your-api.onrender.com` |
| Auth + DB | Render / VPS (Docker) | `https://your-auth.onrender.com` |

## 1) Local (development)

```powershell
cd ai_document_intelligence
Copy-Item .env.example .env
docker compose down -v
docker compose up -d
```

- Landing: http://localhost:8080/login.html
- AI app: http://localhost:5173
- Auth API: http://localhost:54321

## 2) Deploy auth stack (production)

Run the auth services (`db`, `auth`, `rest`, `kong`, `db-init`) on a host with a persistent disk.

**Option A — VPS / Railway / Fly.io:** use `ai_document_intelligence/docker-compose.yml` but only start auth services:

```bash
docker compose up -d db auth rest kong db-init
```

Put Caddy/nginx in front of Kong port 8000 with HTTPS, e.g. `https://auth.aiper.space`.

**Option B — Render:** create a Web Service from repo root using `ai_document_intelligence/docker/Dockerfile.auth` (see below). Attach a Render **Persistent Disk** for Postgres data. Set env vars from `.env.example` plus:

- `API_EXTERNAL_URL=https://your-auth.onrender.com`
- `SITE_URL=https://www.aiper.space`
- `ADDITIONAL_REDIRECT_URLS=https://www.aiper.space/*,https://your-app.netlify.app/*`

Generate a strong `POSTGRES_PASSWORD` and `JWT_SECRET`. If you change `JWT_SECRET`, generate new anon/service JWT keys signed with that secret (or keep the demo anon key only for dev).

## 3) GitHub Pages (landing site)

1. Push repo to GitHub; enable Pages on the branch that contains `index.html`, `login.html`, etc.
2. Edit `supabase-config.js`:
   - `PROD_SUPABASE_URL` = your public auth URL (Kong), e.g. `https://auth.aiper.space`
   - `PROD_ANON_KEY` = anon JWT (same as local demo key if JWT_SECRET unchanged)
   - `PROD_SITE_URL` = `https://www.aiper.space`
3. Edit `features-config.js`:
   - Set production `AIPER_FEATURES_APP_ORIGIN` to your Netlify AI app URL.

## 4) Netlify (AI frontend)

In Netlify **Site settings → Environment variables** (build time):

| Variable | Value |
|----------|--------|
| `VITE_SUPABASE_URL` | `https://auth.aiper.space` (your Kong URL) |
| `VITE_SUPABASE_ANON_KEY` | same anon key as `supabase-config.js` |
| `VITE_API_URL` | `https://your-api.onrender.com` |
| `VITE_FEATURES_ALLOWED_EMAILS` | allowed emails (comma-separated) |

Redeploy after changing env vars.

## 5) Render (AI backend)

Existing setup still works:

- Root directory: `ai_document_intelligence/backend`
- Docker or Python build
- Env: `OPENAI_API_KEY`, `LLM_PROVIDER`, etc.
- `PORT` is set automatically by Render

No Supabase env vars needed on the backend.

## 6) Auth redirect URLs

In your auth stack env, `GOTRUE_URI_ALLOW_LIST` / `ADDITIONAL_REDIRECT_URLS` must include:

- Your GitHub Pages origin (`https://www.aiper.space/*`)
- Your Netlify app origin (`https://your-app.netlify.app/*`)

## Email verification

Local Docker uses `ENABLE_EMAIL_AUTOCONFIRM=true` (instant signup).

For production, set `ENABLE_EMAIL_AUTOCONFIRM=false` and configure SMTP on the `auth` service (`GOTRUE_SMTP_*` vars) if you want real verification emails like Supabase Cloud.

## Checklist after deploy

1. Register on production login page
2. Dashboard loads
3. “Try feature” opens Netlify app while logged in
4. Custom templates persist after refresh (PostgREST + `user_templates` table)
