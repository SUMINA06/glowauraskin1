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
- CORS_ORIGIN=https://YOUR-FRONTEND-URL
- ADMIN_EMAIL
- ADMIN_USERNAME
- ADMIN_PASSWORD
- ADMIN_SETUP_TOKEN

Notes:
- `ADMIN_*` is used to create the first admin user at startup.
- `ADMIN_SETUP_TOKEN` is required to create additional admins via `/api/users/admin/register` in production. Send it as `X-Admin-Setup-Token`.

## 2) Backend service (Express)
Repo path: `backend`
- Build command: `npm install`
- Start command: `npm run start`

Ensure the service has the env vars listed above.

## 3) Frontend service (Vite)
Repo path: `frontend-react`
- Build command: `npm install && npm run build`
- Start command: `npm run start`

Frontend env vars:
- VITE_API_BASE_URL=https://YOUR-BACKEND-URL

## 4) Health checks
- Backend: `GET /api/products` should return data.
- Frontend: open the Railway frontend URL and confirm it loads.

## 5) Safe Browsing recheck
After deploy, request a review via Google Safe Browsing:
https://transparencyreport.google.com/safe-browsing/search
