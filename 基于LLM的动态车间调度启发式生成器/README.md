# IntelliSched

> LLM-driven dynamic jobshop scheduling heuristic generator—describe your goal in natural language, get executable scheduling rules and a visual Gantt chart.


---

## Table of Contents

- [Project Overview](#project-overview)
- [Environment Requirements](#environment-requirements)
- [Quick Start](#quick-start)
- [User Guide](#user-guide-brief)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Testing](#testing)
- [Environment Variables](#environment-variables)
- [Tech Stack](#tech-stack)
- [Core Workflow](#core-workflow)
- [Safety Net & Robustness](#safety-net--robustness)
- [Code Attribution & Licenses](#code-attribution--licenses)

---

## Project Overview

IntelliSched translates **natural language scheduling goals** into **executable scheduling rules (heuristics)**, then simulates and visualizes the job shop schedule.

**Examples:**

| User Goal | System Output |
|-----------|---------------|
| "Minimize total makespan." | Generates SPT rule, displays Gantt chart |
| "Order 2 is VIP, prioritize it." | Generates multi-tier `job_priority`, phased scheduling |
| "Balance load, avoid long idle periods." | Generates parametric weights, displays KPI |

User types a goal in the text box; the system:

1. Calls the LLM to generate a rule (FIFO / SPT / LPT / Parametric Score / multi-phase priorities)
2. Parses and validates via RuleParser and SafetyNet
3. Runs the SchedulingEngine
4. Displays the Gantt chart and KPI (Makespan, machine utilization, etc.)

---

## Environment Requirements

| Requirement | Specification |
|-------------|---------------|
| **OS** | Windows 10/11, macOS 10.15+, Linux (Docker tested on Ubuntu 22.04) |
| **RAM** | 4 GB minimum, 8 GB recommended |
| **Docker (recommended)** | Docker Desktop 4.x+ with Docker Compose |
| **Local dev** | Python 3.11+, Node.js 18+, MySQL 8.0 |

---

## Quick Start

### Option 1: Docker (recommended, no Python / Node / MySQL needed)

**1. Install Docker Desktop**  
Download from [Docker](https://www.docker.com/products/docker-desktop).

**2. Start services**

In the project root (Windows / macOS / Linux):

```bash
docker compose up --build
```

First run builds images and starts MySQL, backend, and frontend. Use `docker compose up -d` for background mode later.

**3. Access the app**

- **Frontend**: http://localhost:5173  
- **Backend Swagger**: http://localhost:8000/docs  

**4. LLM usage**  
For the course submission bundle, the root `.env` file already contains a valid `LLM_API_KEY`, `LLM_URL` and `LLM_MODEL`, and `docker-compose` loads it via `env_file: .env`.  
If you want to disable external LLM calls, simply clear `LLM_API_KEY` in `.env` and rebuild.

---

### Option 2: Local development

For debugging or code changes. Requires Python 3.11+, Node.js 18+, MySQL 8.0 on your machine.

**1. Configure environment**

The repository already includes a pre-filled `.env` file (committed for coursework submission), with:

- Database connection (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`)
- JWT secret and expiry (`SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`)
- LLM configuration (`LLM_API_KEY`, `LLM_URL`, `LLM_MODEL`)

You can open `.env` directly and adjust values if needed (for example, change DB password or replace the LLM key with your own).  
For this course submission, `.env` is tracked in Git on purpose, so that the project runs out-of-the-box.

**2. Initialize database**

With MySQL running:

```bash
mysql -u root -p < Backend/scripts/init_mysql.sql
```

This command is the same on Windows (with MySQL in PATH), macOS, and Linux.  
It creates the `intellisched` database; tables are created on backend startup.

**3. Start backend**

**Windows (PowerShell / CMD)**:

```powershell
cd Backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
cd ..
uvicorn Backend.main:app --host 0.0.0.0 --port 8000 --reload
```

**macOS / Linux (bash)**:

```bash
cd Backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ..
uvicorn Backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend: http://localhost:8000  
Swagger: http://localhost:8000/docs  

**4. Start frontend**

In a new terminal (Windows / macOS / Linux):

```bash
cd Frontend
npm install
npm run dev
```

Frontend runs at http://localhost:3000; Vite proxies `/api` to the backend.

**5. Open the app**

Visit http://localhost:3000 in your browser.

| Mode | Frontend | Backend |
|------|----------|---------|
| **Docker** | http://localhost:5173 | http://localhost:8000 |
| **Local** | http://localhost:3000 | http://localhost:8000 |

Local: Vite proxies `/api` to `http://127.0.0.1:8000`. For LAN access, use `--host 0.0.0.0` and set `FRONTEND_ORIGINS` in `.env`.

---

## User Guide (Brief)

1. **Register / Login**: Create an account or sign in.
2. **Define jobs**: Add job rows and operations (machine, duration) in the table.
3. **Enter goal**: Type a natural-language goal (e.g. *minimize makespan*, *prioritize VIP orders*).
4. **Run schedule**: Click **Run Schedule**; the system invokes the LLM, runs the engine, and displays the Gantt chart.
5. **View results**: See KPI (Makespan, utilization) and the rule used; optionally save to history.
6. **History & replay**: Open history, select a record, and replay past schedules.

For the complete user manual, see [`UserGuide.md`](./UserGuide.md).

---

## Project Structure

```
grp-intellisched/
├── Backend/                 # Python / FastAPI
│   ├── api/                 # Routes, deps, models
│   ├── db/                  # DB models & session
│   ├── domain/              # Job, Machine, Schedule
│   ├── engine/              # Scheduling engine & heuristics
│   ├── llm/                 # LLM client, rule parser, safety net
│   ├── services/            # Auth, machine, gantt, etc.
│   ├── tests/               # pytest
│   └── main.py
├── Frontend/                # React + Vite + TypeScript
│   ├── src/
│   │   ├── auth/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── utils/
│   ├── e2e/                 # Playwright E2E
│   └── package.json
├── docker-compose.yml
└── README.md / README_CN.md
```

---

## API Overview

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/machines/` | List machines |
| GET | `/api/machines/{id}` | Get machine |
| POST | `/api/machines/` | Create machine |
| PUT | `/api/machines/{id}` | Update machine |
| DELETE | `/api/machines/{id}` | Delete machine |
| POST | `/api/schedule/` | Submit schedule (jobs + goal) |
| GET | `/api/schedules/history` | List history |
| GET | `/api/schedules/history/{id}` | Get history detail |
| DELETE | `/api/schedules/history/{id}` | Delete history |
| GET | `/api/user/configs/{key}` | Get user config |
| PUT | `/api/user/configs/{key}` | Set user config |
| POST | `/api/llm/test` | LLM test |

Full API: http://localhost:8000/docs

---

## Testing

| Type | Tool | Scope |
|------|------|-------|
| Backend API | pytest | Auth, machines CRUD, schedule (incl. 100-job payload), history |
| Frontend unit | Vitest | Components, API client, utils |
| E2E | Playwright | Full flow: register, login, schedule, KPI, history, replay; login failure; large payload |

This section also serves as a **quality assurance summary**: together, the tests cover core API correctness, frontend behaviour, integration flows, and performance on large scheduling instances.

**Unit tests (pytest + Vitest):**

```bash
# Backend tests (from repository root or Backend/)
cd Backend
pytest

# Frontend unit tests (from repository root or Frontend/)
cd ../Frontend
npm test
```

**E2E** (Windows / macOS / Linux, requires frontend and backend running):

```bash
cd Frontend
npm run test:e2e
```

---

## Environment Variables

### Backend (root `.env` or `docker-compose` `backend.env_file + environment`)

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | Database host | `127.0.0.1` or `db` (Docker) |
| `DB_PORT` | Database port | `3306` |
| `DB_USER` / `DB_PASSWORD` | DB credentials | |
| `DB_NAME` | Database name | `intellisched` |
| `SECRET_KEY` | JWT secret | Long random string |
| `LLM_API_KEY` | LLM API key (pre-filled in `.env` for coursework; clear to fall back to FIFO) | `sk-...` |
| `LLM_URL` | LLM endpoint | `https://api.siliconflow.cn/v1/chat/completions` |
| `LLM_MODEL` | Model name | `deepseek-ai/DeepSeek-V3.2` |
| `FRONTEND_ORIGINS` | Allowed origins | `http://localhost:3000,http://localhost:5173` |

### Frontend (`Frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend URL; empty = use Vite proxy `/api` |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy 2, Uvicorn |
| **Database** | MySQL 8.0 (prod) / SQLite (tests) |
| **Auth** | JWT, bcrypt |
| **Frontend** | React 18, TypeScript, Vite 6, Tailwind, Radix UI / shadcn |
| **Charts** | Recharts |
| **Scheduling** | Custom discrete-event engine; FIFO / SPT / LPT / Parametric Score / multi-phase |
| **LLM** | Configurable (e.g. SiliconFlow / DeepSeek, OpenAI-compatible) |
| **Testing** | pytest, Vitest, Playwright |

---

## Core Workflow

1. **Job data**: Define jobs and operations (machine, duration) in the table.  
2. **Goal**: Enter a natural language goal (e.g. "minimize makespan", "prioritize VIP orders").  
3. **LLM**: Backend calls LLM to produce rule JSON (e.g. `{"type":"SPT"}` or `{"rule_type":"parametric_score", "weights":{...}}`).  
4. **Parse & validate**: RuleParser parses; SafetyNet validates; invalid → fallback to FIFO.  
5. **Execute**: SchedulingEngine runs simulation; GanttService builds chart data.  
6. **Display**: Gantt chart, KPI, rule description; history and replay supported.

---

## Safety Net & Robustness

- **RuleParser**: Extracts JSON from LLM text or infers rule from keywords (SPT / LPT, etc.).  
- **SafetyNet**: Validates parametric weights, `job_priority` format; invalid → fallback to FIFO.  
- **SchedulingEngine**: On runtime errors, falls back to FIFO.  
- **No LLM**: When `LLM_API_KEY` is empty, uses default FIFO and does not call the LLM.

---

## Code Attribution & Licenses

- **Project code**: Authored by the IntelliSched team (as noted in main modules).
- **Third-party libraries**: See `Backend/requirements.txt` and `Frontend/package.json`; all dependencies use permissive licenses (MIT, Apache 2.0). Ensure compliance if redistributing.

---

*IntelliSched · LLM-Driven Jobshop Scheduling*
