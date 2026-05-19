# AutoPost — Decoupling Handoff & Migration Plan

## Architecture Overview

The AutoPost platform has been migrated from a monolithic Next.js application to a decoupled architecture:
1.  **Frontend**: Next.js 15 (App Router) — purely client-side rendering for authenticated pages.
2.  **Backend**: Express.js — handles all API logic, database access, LinkedIn OAuth, AI integrations, and Cron jobs.

## Migration Status: ✅ COMPLETED

The platform is now fully decoupled and ready for production deployment.

### Phase 4: Frontend Integration & Cleanup (COMPLETED)
- [x] Converted all Server Components to Client Components.
- [x] Replaced all legacy `/api` fetch calls with the centralized `api-client`.
- [x] Integrated `ProtectedRoute` and custom JWT `AuthProvider`.
- [x] Removed the legacy `app/api` directory.
- [x] Standardized all forms and data views to use the Express API.

---

## Infrastructure & API Contract

### Backend API (Express)
- **Base URL**: `http://localhost:3001/api/v1` (Local)
- **Auth**: JWT-based (Header: `Authorization: Bearer <token>`)
- **Main Routes**:
  - `/auth`: Login, Register, Refresh
  - `/posts`: List, Create, Update, Delete, Post Now, Bulk Schedule
  - `/accounts`: List, Connect, Toggle, Disconnect
  - `/schedules`: CRUD for automated schedules
  - `/sources`: CRUD for content sources
  - `/ai`: Generate, Brief, Schedule Plan
  - `/analytics`: Fetch engagement data
  - `/system`: Tasks (Optimize, Sync)

### Frontend (Next.js)
- **State Management**: React `useState` + `useEffect` for data fetching.
- **Authentication**: `AuthProvider` (Client-side) manages JWT and user state.
- **API Communication**: `lib/api-client.ts` (Axios wrapper with interceptors for auth refresh).

---

## Deployment Configuration

### Backend (Render / VPS)
- Set environment variables (see `backend/.env.example`).
- Commands: `npm install && npm run build` -> `npm start`.

### Frontend (Vercel)
- **Environment Variable**: `NEXT_PUBLIC_API_URL` (Point to your Backend API URL).
- Commands: `npm install && npm run build`.

## Critical Post-Migration Tasks
1.  **LinkedIn OAuth**: Update the "Redirect URI" in your LinkedIn Developer Portal to: `https://your-backend-domain.com/api/v1/accounts/callback`.
2.  **CORS**: Ensure the backend `env.FRONTEND_URL` matches your deployed frontend domain.
3.  **Cron**: Update your external cron service (e.g., cron-job.org) to hit `https://your-backend-domain.com/api/v1/cron/daily`.
