# KAI — AI-Powered Internship & Placement Accelerator

## 7 Days. Your Dream Company. Let's Go.

KAI is a full-stack AI-powered student internship & placement accelerator that transforms the gap between ambition and action into a structured, gamified 7-day sprint.

---

## Features

- 🤖 **AI-Personalized 7-Day Roadmap** — Gemini-generated prep plans tailored to your target company
- 💻 **Proctored Coding Tests** — In-browser IDE with Monaco Editor + Judge0 execution
- 📝 **Adaptive Quiz Engine** — 500+ questions with dynamic difficulty adjustment
- 🎤 **AI Mock Interviews** — Conversational interviews with real-time Gemini feedback
- 📄 **ATS Resume Builder** — Live ATS scoring with keyword gap analysis
- 🏆 **Gamification** — Streaks, badges, institution leaderboard
- 💬 **Soft Skills Training** — 7 AI-guided modules
- 🃏 **Shareable Readiness Card** — Viral PNG export with your prep stats

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React 18, Tailwind CSS, Framer Motion |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| AI | Google Gemini 1.5 Pro/Flash |
| Auth | Firebase Authentication |
| Code Execution | Judge0 API |
| Realtime | Socket.io |

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Firebase project
- Google Gemini API key
- Judge0 API key (optional, for code execution)

### 1. Clone & Install

```bash
# Install client dependencies
cd kai/client && npm install

# Install server dependencies
cd ../server && npm install
```

### 2. Environment Variables

**Client** (`kai/client/.env`):
```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_BASE_URL=http://localhost:5000/api
```

**Server** (`kai/server/.env`):
```env
MONGODB_URI=mongodb+srv://...
GEMINI_API_KEY=your_gemini_key
FIREBASE_ADMIN_SDK_JSON={"type":"service_account",...}
JUDGE0_API_KEY=your_judge0_key
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JWT_SECRET=your_jwt_secret
PORT=5000
CLIENT_URL=http://localhost:5173
```

### 3. Run

```bash
# Terminal 1 — Start backend
cd kai/server && npm run dev

# Terminal 2 — Start frontend
cd kai/client && npm run dev
```

App runs at **http://localhost:5173**

---

## Deployment (Vercel + Render)

### 1) Deploy Backend on Render

- Create a new **Web Service** from this repository
- Set **Root Directory** to `server`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/api/health`

Set these Render environment variables:

```env
NODE_ENV=production
CLIENT_URL=https://<your-vercel-domain>
# Optional: comma-separated list for preview/custom domains
CLIENT_URLS=https://<your-vercel-domain>,https://<your-preview-domain>

MONGODB_URI=...
GEMINI_API_KEY=...
FIREBASE_ADMIN_SDK_JSON={"type":"service_account",...}
FIREBASE_STORAGE_BUCKET=...
JUDGE0_API_KEY=...
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JWT_SECRET=...
```

You can also use the included blueprint file at `render.yaml`.

### 2) Deploy Frontend on Vercel

- Import this repository in Vercel
- Set **Root Directory** to `client`
- Framework preset: **Vite**
- Build command: `npm run build`
- Output directory: `dist`

Set these Vercel environment variables:

```env
VITE_API_BASE_URL=https://<your-render-service>.onrender.com/api

VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

`client/vercel.json` is included to support SPA route refreshes.

---

## Project Structure

```
kai/
├── client/          # Vite + React frontend
│   └── src/
│       ├── pages/   # 13 route pages
│       ├── components/  # Feature & UI components
│       ├── context/     # Auth, User, Focus contexts
│       ├── hooks/       # Custom hooks
│       └── lib/         # Firebase, API, utils
└── server/          # Node.js + Express backend
    ├── models/      # Mongoose schemas
    ├── routes/      # API endpoints
    ├── services/    # AI, code eval, ATS, badges
    ├── middleware/  # Auth, rate limiting, proctor
    └── config/      # DB, Firebase Admin
```

---

## Modules

1. 🔐 **Authentication & Onboarding** — Firebase Auth + 5-step wizard
2. 🏠 **Dashboard** — Glassmorphism cards, AI insights, company carousel
3. 🗺️ **7-Day Roadmap** — Gemini-generated, company-specific sub-roadmaps
4. 📄 **Resume ATS Builder** — Live preview, 3 templates, PDF export
5. 💻 **Proctored Coding Tests** — Full-screen lock, tab detection, Monaco IDE
6. 📝 **Adaptive Quiz Engine** — 500+ questions, dynamic difficulty
7. 🤖 **AI Mock Interview** — Voice I/O, real-time scoring, detailed report
8. 💬 **Soft Skills Training** — 7 progressive modules with AI feedback
9. 🏆 **Leaderboard & Gamification** — 10 badge types, institution ranking
10. 📊 **Analytics** — Recharts dashboards, AI weekly summaries
11. 🔒 **Focus Mode** — Fullscreen enforcement, violation tracking
12. 🃏 **Readiness Card** — PNG export, WhatsApp sharing

---

## Grade Scale

| Score | Grade | Level |
|-------|-------|-------|
| 90-100 | A+ | Expert |
| 80-89 | A | Advanced |
| 70-79 | B+ | Proficient |
| 60-69 | B | Developing |
| 50-59 | C | Beginner |
| <50 | D | Needs Work |

---

Built with ❤️ for students chasing their dream companies.
