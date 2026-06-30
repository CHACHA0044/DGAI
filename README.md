# 🛡️ Deadline Guardian AI

> **Your AI-powered productivity companion.** Every task is instantly analyzed by Gemini AI to generate priority scores, execution plans, subtasks, risk assessments, and personalized productivity advice.

---

## ✨ Features (Phase 1)

| Feature | Description |
|---------|-------------|
| **AI Task Analysis** | Gemini AI enriches every task on creation |
| **Priority Scoring** | 1–10 urgency score |
| **Risk & Difficulty** | LOW/MEDIUM/HIGH/CRITICAL + EASY→EXPERT |
| **Subtask Generation** | 3–6 actionable subtasks |
| **Execution Planning** | Step-by-step strategy |
| **Productivity Advice** | Personalized tips per task |
| **Next Immediate Step** | Instant first action |
| **Dependency Detection** | AI identifies blockers |
| **Re-analysis** | Re-run Gemini on any task |
| **Dark Mode** | Fully themed with localStorage persistence |

---

## 🏗️ Architecture

```
Routes → Controllers → Services → Repository → Database (Supabase PostgreSQL)
                            ↓
                       AI Service
                            ↓
                      Gemini 1.5 Flash
```

### Backend layers
```
backend/src/
├── config/         # env validation, DB client, CORS
├── middlewares/    # error handler, rate limiter, validator, logger
├── validators/     # Zod schemas for all endpoints
├── prompts/        # Gemini prompt templates
├── ai/             # Gemini client singleton
├── services/       # Business logic (aiService, taskService)
├── repositories/   # All database access
├── controllers/    # HTTP layer
├── routes/         # Route definitions + aggregator
├── types/          # Shared interfaces + AppError
├── app.ts          # Express factory
└── server.ts       # Entry point + graceful shutdown
```

### Frontend layers
```
frontend/src/
├── api/            # Axios client + typed API methods
├── hooks/          # TanStack Query hooks
├── contexts/       # Theme + Toast providers
├── constants/      # Query keys, display configs
├── utils/          # Formatters (dates, priority, etc.)
├── components/ui/  # Button, Badge, Modal, Spinner, Toast, ErrorBoundary
├── components/layout/ # Header, Layout
├── features/tasks/ # TaskCard, TaskList, CreateTaskModal, AIInsightPanel, AnalyzingAnimation
├── pages/          # Dashboard (lazy loaded)
├── types/          # Frontend type interfaces
└── App.tsx         # Root providers + router
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **Supabase** project with PostgreSQL database
- **Google AI Studio** API key

### 1. Clone & Install

```bash
# Install backend deps
cd backend
npm install

# Install frontend deps
cd ../frontend
npm install
```

### 2. Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase **pooler** URL (port 6543, Transaction mode) |
| `DIRECT_URL` | Supabase **direct** URL (port 5432) |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `FRONTEND_URL` | Frontend URL (default: `http://localhost:5173`) |

> **Finding your Supabase URLs**: Dashboard → Settings → Database → Connection string

### 3. Run Database Migrations

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

> **Note:** Migrations always use `DIRECT_URL` (port 5432). Runtime queries use `DATABASE_URL` (pooler, port 6543).

### 4. Start Development Servers

```bash
# Terminal 1 — Backend (port 3001)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) 🎉

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tasks` | Create + AI-analyze a task |
| `GET` | `/api/tasks` | List tasks (paginated) |
| `GET` | `/api/tasks/:id` | Get single task |
| `PATCH` | `/api/tasks/:id` | Update task fields |
| `DELETE` | `/api/tasks/:id` | Delete task |
| `POST` | `/api/tasks/:id/analyze` | Re-run AI analysis |
| `GET` | `/health` | Health check |

### Response shape

```json
{
  "success": true,
  "message": "Task created and AI analysis complete",
  "data": { /* Task object */ },
  "meta": { /* Pagination for list endpoints */ }
}
```

---

## 🔐 Security

- **Helmet** — Secure HTTP headers
- **CORS whitelist** — Only allowed origins
- **Rate limiting** — 100 req/15min general, 20 AI calls/min
- **Input validation** — Zod on every endpoint
- **Prompt injection prevention** — Input sanitized before Gemini
- **Response size limit** — 8KB cap on AI responses
- **AI retry with backoff** — 3 attempts: 1s → 2s → 4s
- **Parameterized queries** — Prisma ORM prevents SQL injection
- **Environment secrets** — All credentials in `.env` (git-ignored)

---

## 🗄️ Database

**Prisma + Supabase PostgreSQL** with dual connection strategy:

| Connection | URL Variable | Used For |
|------------|-------------|----------|
| Connection Pooler (port 6543) | `DATABASE_URL` | All runtime queries |
| Direct (port 5432) | `DIRECT_URL` | `prisma migrate dev` only |

---

## 🧩 Future Extensibility (Phase 2+)

The architecture is built for plug-in modules. Add new features by:

1. Uncomment the future model in `prisma/schema.prisma`
2. Add a new route file in `backend/src/routes/`
3. Register it in `backend/src/routes/index.ts`
4. Add a new page in `frontend/src/pages/`
5. Register it in `frontend/src/App.tsx`

Planned future modules:
- 🗓️ Calendar integration
- 💬 Chat assistant (Gemini conversational)
- 🔔 Notifications & reminders
- 🧠 AI daily planner
- ♻️ Habit tracking
- 🚨 Emergency mode
- 🤖 Autonomous task planning

---

## ☁️ Deployment (Google Cloud Run)

```bash
# Build backend
cd backend && npm run build

# Build frontend
cd frontend && npm run build
# → serves from frontend/dist/

# Build Docker images and push to GCR
# (Dockerfiles not included in Phase 1)
```

---

## 📁 Project Structure

```
deadline-guardian/
├── backend/
│   ├── prisma/schema.prisma
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   ├── index.html
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
├── .gitignore
└── README.md
```

---

## 🧪 Testing (Phase 2)

Code is structured for easy testing:

- **Backend**: Each layer (repo, service, controller) is independently testable
- **Frontend**: Hooks and utilities are pure and mockable
- TanStack Query enables easy mocking with `QueryClient` in tests
- Zod schemas can be unit-tested independently

---

## License

MIT © Deadline Guardian AI
