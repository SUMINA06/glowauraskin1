# Railway Deployment Guide

This project is split into a backend (Express) and a frontend (Vite + React). Deploy them as separate Railway services and a Railway MySQL database.

## 1) Create the MySQL database
- Add a Railway MySQL database.
- Copy the connection values and set them on the backend service.

Required backend env vars:
- DB_HOST
- DB_USER
- DB_PASSWORD
- DB_NAME
- DB_PORT
- JWT_SECRET
- JWT_EXPIRY
- NODE_ENV=production
- FRONTEND_URL=https://YOUR-FRONTEND-URL
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- ADMIN_EMAIL
- ADMIN_USERNAME
- ADMIN_PASSWORD
- ADMIN_SETUP_TOKEN

Notes:
- `ADMIN_*` is used to create the first admin user at startup.
- `ADMIN_SETUP_TOKEN` is required to create additional admins via `/api/users/admin/register` in production. Send it as `X-Admin-Setup-Token`.
- Uploads use Cloudinary in production; no local filesystem storage is used.
- The standard Railway MySQL auto-injected vars `MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, `MYSQLPORT` are also supported as fallbacks.

## 2) Backend service (Express)
Repo path: `backend`
- Build command: `npm install`
- Start command: `npm run start`

Ensure the service has the env vars listed above.

## 3) Frontend service (Vite)
Repo path: `frontend-react`
- Build command: `npm install && npm run build`
- Start command: `npm run start`

After the build, the app is served by `frontend-react/serve.cjs` — a small Node/Express server that:
- Serves the built `dist/` files
- **Proxies `/api` and `/uploads` to the backend** (so the browser only talks to the frontend origin — same-origin, no CORS issues)
- Falls back to `index.html` for client-side routes

### Frontend env vars (runtime)
- `API_PROXY_TARGET` — the **runtime** env var on the frontend service. Set it to the backend's Railway internal URL, e.g. `http://glowauraskin1.railway.internal:8080`.

> Do NOT use `VITE_`-prefixed backend URLs in production. The `VITE_*` proxy target only affects the local `vite dev` server. In production the proxy lives in `serve.cjs`, so only `API_PROXY_TARGET` matters.

### How it works in both environments
`frontend-react/serve.cjs` resolves the backend URL from env vars in this order (first non-empty wins):
1. `API_PROXY_TARGET`
2. `VITE_API_PROXY_TARGET`
3. `VITE_API_BASE_URL`
4. `REACT_APP_API_URL`
5. Default: `http://localhost:3000`

- **Production (Railway):** set `API_PROXY_TARGET` on the frontend service to the backend's internal URL. No other config needed.
- **Local:** run `npm start` with no env vars — it defaults to the local backend at `http://localhost:3000`. To override locally (e.g. a different port or remote backend), copy `.env.local.example` to `.env.local` and set `API_PROXY_TARGET`/`PORT`.
- **Local dev (hot reload):** `npm run dev` uses Vite's dev proxy (`vite.config.js`) which defaults to `http://localhost:3000` too.

## 4) Health checks
- Backend: `GET /api/products` should return data.
- Backend: `GET /health` should return `{ status: "ok" }`.
- Backend: `GET /health` should also confirm `db: "up"`.
- Frontend: open the Railway frontend URL and confirm it loads.
- Frontend: a user-facing page that calls the API (e.g. Home `/`, Shop `/shop`, Login `/login`, Register `/register`) should now work — no "Network Error".

## 5) Safe Browsing recheck
After deploy, request a review via Google Safe Browsing:
https://transparencyreport.google.com/safe-browsing/search
