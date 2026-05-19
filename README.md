# 🚀 InkPost — Enterprise LinkedIn Neural Syndication Platform

InkPost is a high-performance, enterprise-grade operating system designed for professional content creators and digital agencies to scale, optimize, and automate LinkedIn publishing. Built upon a **fully decoupled architecture**, it combines a blazing-fast **Next.js 15 Single-Page Application (SPA)** client dashboard with a robust, secured **Express.js 5 REST API Gateway**, backed by **MongoDB Atlas** and intelligent **OpenCode Free Cloud AI** orchestrations.

---

## 🌟 Premium Features & Technical Highlights

- **⚡ Fully Decoupled Architecture**: Complete separation of concerns. Pure client-side browser SPA paired with a stateless backend API layer.
- **🤖 OpenCode AI Integration**: Free, high-speed neural processing pipeline with 8 AI agents — auto-generating niche semantic hashtags, polishing copy style, planning publication schedules, pre-publish quality checks, and interactive briefs.
- **🔒 Strict Content Quality Gate**: Fail-closed AI verification system that checks posts for formatting errors, truncation, and placeholders before sending them live.
- **🔄 Official LinkedIn REST API**: Native implementation of the latest official LinkedIn Community Management Posts API (`LinkedIn-Version: 202604`, protocol `2.0.0`) with fully automated token refreshing.
- **⏰ Multi-Tier Background Scheduler**: Three independent `node-cron` tasks — retry failed posts every 2 min, process schedules every 15 min, and batch operations at user-configured times.
- **🌍 Timezone-Aware Scheduling**: Frontend detects browser timezone and sends it with every scheduling request; backend stores it alongside local times for accurate UTC conversion.

---

## 🗺️ Decoupled System Architecture

```txt
┌─────────────────────────────────┐       REST API / JWT       ┌─────────────────────────────────┐
│     Client-Side Next.js SPA     │ ─────────────────────────> │   Express.js 5 API Gateway      │
│  (Pure Client-Side Components)  │ <───────────────────────── │      (Port 3001 REST Services)  │
└─────────────────────────────────┘      JSON Responses        └─────────────────────────────────┘
                 │                                                              │
                 ▼                                                              ▼
 ┌───────────────────────────────┐                            ┌──────────────────────────────────┐
 │    Local Token Storage        │                            │   External Service Orchestrator  │
 │  (Access: Memory | Ref: Local)│                            │ (LinkedIn OAuth / OpenCode AI)   │
 └───────────────────────────────┘                            └──────────────────────────────────┘
                                                                                │
                                                                                ▼
                                                              ┌──────────────────────────────────┐
                                                              │       Persistent DB Cache        │
                                                              │    (MongoClient Cached Pool)     │
                                                              └──────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Architecture Layer | Core Technologies | Primary Responsibilities |
| :--- | :--- | :--- |
| **Frontend Dashboard** | Next.js 15.3 (React 19), Lucide React, Recharts | User experience, live analytical graphs, forms, and client authentication. |
| **API gateway** | Express.js 5, TypeScript, JWT, Cors, Helmet, express-rate-limit | REST endpoint management, security controls, rate limiting, and route protection. |
| **Persistence Cache** | MongoDB Atlas, MongoClient singleton pool caching | High-speed cache for schedules, client settings, posts, and session tokens. |
| **Neural Automation** | OpenCode AI APIs (nemotron-3-super-free, ring-2.6-1t-free, minimax-m2.5-free) | Copy refinement, hashtag optimization, pre-publish quality gate, brief intelligence. |
| **API Integration** | LinkedIn Community Management Posts API (`202604`) | Secure OAuth 2.0 authorization flows and LinkedIn network syndication. |

---

## 🚀 Getting Started

Follow these steps to launch InkPost locally or prepare it for production deployment.

### 1. Repository Setup & Dependencies
Clone the repository and install standard Node packages in the root directory:
```bash
npm install
```

### 2. Configure Environment Configurations
Create a `.env` configuration file in the project's root folder for the frontend, and another `.env` in the `backend/` directory for the API gateway.

#### 🌍 Frontend Environment Configurations (`.env`)
```ini
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

#### ⚙️ Backend Environment Configurations (`backend/.env`)
```ini
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/inkpost
JWT_SECRET=your-jwt-secret-change-me-32-chars-min
JWT_REFRESH_SECRET=your-refresh-secret-change-me-32-chars-min
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
CRON_SECRET=your-secure-cron-secret-key
OPENCODE_API_KEY=your-opencode-zen-api-key-optional
BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
PORT=3001
NODE_ENV=development
ALLOW_REGISTRATION=true
```

### 3. Seed Database & Admin Credentials
Seed the database with default admin credentials (`arvind` / `f4lc0n`) and create indexes:
```bash
npm run db:seed
```

### 4. Start Development Servers
Run the platform in parallel developer modes.

*   **Start the Express API gateway**:
    ```bash
    cd backend
    npm install
    npm run dev
    ```
*   **Start the Next.js frontend SPA** (from the root directory):
    ```bash
    npm run dev
    ```
    *Access the client control panel at: `http://localhost:3000`*

---

## ⚡ Core CLI Command Cheat Sheet

```bash
npm run dev           # Start Next.js frontend client-side SPA (Port 3000)
npm run build         # Compile production Next.js SPA bundle
npm run lint          # Run Next.js code linter and conventions checker
npm test              # Run unit & integration tests across 16 suites (Vitest)
npm run test:watch    # Run Vitest suite in automatic watch mode
npm run db:seed       # Seed default user account and initialize database indexes
npm run db:cleanup    # Cleanup utility for posts (removes old/failed entries)
```

---

## ⏳ Background Tasks & Cron Pipeline

InkPost manages background processing via three independent `node-cron` tasks:

1.  **Retry Failed Posts** (`*/2 * * * *`): Automatically retries failed posts that haven't exceeded the max 3 retry limit.
2.  **Fast Pipeline** (`*/15 * * * *`): Processes active schedules (creates new posts from templates), publishes the next due post, and retries any failed posts.
3.  **Slow Pipeline** (user-configured times): Batch-optimizes hashtags on queued posts and syncs analytics for recently posted items.

### Publishing Pipeline
Each post goes through: auto-tag injection → pre-publish AI quality check (fail-closed, up to 2 auto-fix retries) → LinkedIn execute → status/audit updates. On any failure, the post is set for retry in 2 minutes.

### Retry Model
- Max 3 retries per post
- Retry interval: 2 minutes from failure
- Inline AI fix attempted once on LinkedIn API errors via `fixPost` agent

---

## 🔒 Security & Developer Conventions

- **Pure SPA Boundary**: All pages are `"use client"` React files wrapping routes via `ProtectedRoute`. No Server Components are allowed.
- **Zero Monolithic coupling**: No direct MongoDB connections or secret credentials exist in Next.js code. The frontend accesses resources purely via JSON REST queries.
- **Clean Test Execution**: 98 tests across 16 suites pass cleanly via Vitest + JSDOM. The `tests/` directory is gitignored and must not be committed to clean source controls.
- **Token Isolation**: Access tokens exist purely in active JS runtime memory. Refresh tokens are isolated in browser LocalStorage.
- **Timezone Awareness**: Frontend sends `Intl.DateTimeFormat().resolvedOptions().timeZone` with all scheduling API calls.

---

## 📖 Deep-Dive Developer Documentation
For detailed code architecture, file specs, DB index keys, API configurations, and custom failover configurations, refer to the full developer guide at [docs/DEVELOPER_GUIDE.md](file:///home/arvind/Desktop/inkpost/docs/DEVELOPER_GUIDE.md).
