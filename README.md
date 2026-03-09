# Chama Savings & Loan Platform (MVP)

Minimal full-stack scaffolding for a Chama group savings and lending system.

## Structure

- `backend/`: Node.js + Express API with Prisma ORM and PostgreSQL schema covering members, savings, loans, and repayments.
- `frontend/vite-project/`: React + Vite UI that registers members and records savings with a modern shell ready for future dashboards.

## Backend Setup

1. `cd backend`
2. Copy `.env.example` (not tracked) or edit `.env` with:
   - `DATABASE_URL`: e.g. `postgres://postgres:postgres@localhost:51214/template1?...`
   - `SHADOW_DATABASE_URL`: same credentials pointing to Prisma shadow port.
3. `npm install`
4. Use `npx prisma dev` while developing to spin up the local Postgres emulator (allocates ports 51213-51215).
5. Run migrations with `npx prisma migrate dev --name init` and regenerate clients when the schema changes.
6. Start server with `npm run dev` or `npm start`.

## Frontend Setup

1. `cd frontend/vite-project`
2. `npm install`
3. Set `VITE_API_BASE_URL` in `.env` to point to the backend (defaults to `http://localhost:4000`).
4. Run `npm run dev` to launch Vite dev server and interact with the UI.

## Key Features Implemented

- Prisma models for members, savings, loans, and repayments plus enums for roles and loan statuses.
- Express API endpoints for member registration, listing, savings recording, and live summaries.
- Light auth middleware that can expand into JWT/session flows.
- React UI with registration form, savings recorder, summary cards, and responsive member list.
## Deployment (Railway)

1. Create Railway project and add two services: PostgreSQL (managed) and Node.js.
2. Link backend repo with Railway GitHub integration; configure `npm run start` as the start command.
3. Set environment variables on Railway:
   - `DATABASE_URL` → Railway Postgres connection string.
   - `SHADOW_DATABASE_URL` → required for Prisma migrations (Railway Postgres already provides shadow URL).
   - `PORT` → Railway will provide; default `4000` works via `process.env.PORT`.
4. Add `VITE_API_BASE_URL` to frontend service (if deploying separately) pointing to the Railway backend URL.
5. Run `npx prisma migrate deploy` on Railway post-deploy to sync schema before the app runs.
6. For static frontend hosting (Vite build), add a Railway Static site or use Vercel/Netlify and point to the backend.

## Next Steps

- Implement authentication (JWT) and role-based guards.
- Loan eligibility checks, repayment tracking, and interest bookkeeping.
- Dashboard analytics, reports, and Railway migrations automation.
