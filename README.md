# ReachInbox Full-Stack Email Job Scheduler

A complete, production-grade enterprise email scheduling system built with **Express, TypeScript, PostgreSQL, Redis, BullMQ, Ethereal SMTP, Elasticsearch, and React 18**.

---

## Features

- **Google OAuth 2.0 & Session Security**: Real Google OAuth 2.0 authentication issuing `httpOnly` JWT session cookies with full route-level user authorization.
- **Dynamic Email Dispatcher**: Schedule emails immediately ("Send Now") or with custom delay intervals.
- **CSV/TXT Email Parser**: Automated email address extraction using regex with duplicate email removal.
- **BullMQ & Redis Background Worker**: Asynchronous queue processing with minimum send delay, job retry backoff (3 attempts), and execution status tracking.
- **Atomic Hourly Rate Limiting**: Per-user Redis atomic counters (`INCR`, `EXPIRE`, `PTTL`). Reschedules jobs to the next hour window when rate limit is reached.
- **Automated Slack Alerts**: Real-time notifications for rate-limit hits and email delivery failures via Slack Webhooks or OAuth API.
- **Elasticsearch Engine**: Real-time full-text search across sent email subjects, body content, and recipient addresses scoped by user ID.
- **Ethereal SMTP Integration**: Real Nodemailer email sending with auto-generated preview links.

---

## Architecture Diagram

```
User (Browser) ──> React Frontend (Vite) ──> Express API ──> Auth Middleware (JWT Cookie)
                                                                 │
                                ┌────────────────────────────────┴────────────────────────────────┐
                                ▼                                 ▼                               ▼
                          PostgreSQL DB                     Redis + BullMQ                  Elasticsearch
                       (Durable Email State)               (Delayed Queue)                  (Full-Text Search)
                                                                  │                               ▲
                                                                  ▼                               │
                                                            Email Worker ───> Ethereal SMTP ──────┘
                                                                  │
                                                                  ▼
                                                             Slack Alert
```

---

## Step-by-Step Developer Guide

Follow this sequence to set up and run the project locally:

### 1. Clone Repository
```bash
git clone <repository-url>
cd "Email Job Scheduler"
```

### 2. Install Dependencies
Install dependencies for both backend and frontend:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### 3. Copy `.env.example` -> `.env`
```bash
cp .env.example .env
```

### 4. Configure Google OAuth (Optional / Pre-configured)
Set your Google Cloud OAuth credentials in `.env`:
```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```
*Note: If no Google Client ID is configured, the application automatically enables instant developer login fallback (`/api/auth/dev-login`).*

### 5. Configure Slack Integration (Optional)
Set Slack OAuth credentials in `.env` or input an Incoming Webhook URL directly on the Slack Settings page in the Dashboard.

### 6. Configure Ethereal Mail
Leave `SMTP_USER` and `SMTP_PASS` empty in `.env` to allow Nodemailer to automatically generate a disposable Ethereal test account on startup!

### 7. Start Docker Services
Launch PostgreSQL, Redis, and Elasticsearch containers:
```bash
docker-compose up -d
```
Verify containers are healthy:
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Elasticsearch: `localhost:9200`

### 8. Run Prisma Database Migrations
Generate Prisma client and push the schema to PostgreSQL:
```bash
cd backend
npx prisma db push
cd ..
```

### 9. Start Backend API & Worker
In the `backend` directory, run:
```bash
cd backend
npm run dev
```

### 10. Start Frontend Dashboard
In a new terminal window, navigate to `frontend` and start Vite:
```bash
cd frontend
npm run dev
```

### 11. Open Application
Open your browser and navigate to:
```
http://localhost:5173
```

### 12. Login with Google
Click **"Continue with Google"** on the login page to authenticate and enter the dashboard.

### 13. Test Email Scheduling Flow
1. Go to **Compose Email**.
2. Add recipient emails manually or upload a sample CSV file.
3. Enter subject and body content.
4. Set Send Delay (e.g. 10 seconds) and Hourly Limit (e.g. 50).
5. Click **Schedule Email Job**.
6. Check **Scheduled Queue** to view BullMQ delay tracking.
7. After execution, navigate to **Sent Emails** to open the live **Ethereal Mail Preview URL**.
8. Go to **Search** to test Elasticsearch full-text search.

---

## Verification & Testing Commands

To run TypeScript type checks:
```bash
# Backend TypeScript Check
cd backend && npm run build

# Frontend TypeScript Check
cd frontend && npm run build
```
