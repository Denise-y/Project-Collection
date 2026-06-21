
### 1. System Overview
IntelliSched is an intelligent production scheduling system that combines LLM-driven rule generation with a scheduling engine to optimize job shop operations. It allows users to define jobs/machines, input natural-language scheduling goals, and visualize results via Gantt charts and KPIs.

---

### 2. Pre-Launch Preparation & Troubleshooting
#### 2.1 Prerequisites
- Docker Desktop 4.x+ installed and running (with WSL 2 enabled)
- `.env` file configured with valid `LLM_API_KEY` (or cleared for fallback rules)
- At least 4GB of RAM allocated to Docker

#### 2.2 Common Startup Failures & Solutions
| Failure Scenario | Root Cause | Fix Steps |
|------------------|------------|-----------|
| `project name must not be empty` | Chinese characters in project folder name | Rename folder to English, re-run `docker compose up --build` |
| `WSL needs updating` | Outdated WSL kernel | Run `wsl --update` in admin PowerShell, restart Docker Desktop |
| `failed to connect to docker API` | Docker daemon not running | Open Docker Desktop, wait for green "Running" status, retry command |
| `mysql:8.0 image pull failed` | Network timeout accessing Docker Hub | Configure Docker registry mirrors (e.g., `https://hub-mirror.c.163.com`), restart Docker, or pull `mysql:8.0` manually |

---

#### 2.3 Launch Steps
1. Open Docker Desktop and confirm all services are running (db, backend, frontend).
2. Navigate to project root folder in terminal: `cd C:\Users\ASUS\Desktop\GRP\final`
3. Start services: `docker compose up --build`
4. Verify access:
   - Frontend: http://localhost:5173
   - Backend API docs: http://localhost:8000/docs

---

### 3. Step-by-Step User Operations
#### 3.1 Register / Login
1. **Registration Flow**:
   - Click "Register" on the login page.
   - Enter a unique username and password (minimum 6 characters).
   - Click "Register" → system validates input, creates account, redirects to login page.
   - *Failure Case*: If username already exists, system shows "Username taken" error; if password is too short, prompts "Password must be at least 6 characters".
2. **Login Flow**:
   - Enter registered username/password.
   - Click "Login" → valid credentials log you in, invalid ones show "Incorrect username or password".
   - *Edge Case*: Refreshing the page after login preserves session state (token stored in browser).
3. **Logout**:
   - Click "Logout" button in top-right corner → redirects to login page, protected routes require re-authentication.

---

#### 3.2 Define Jobs & Machines
##### 3.2.1 Job Management
- **Add Job**: Click "Add Job" → new row appears with default ID (e.g., `Job-3`) and auto-assigned machine.
- **Edit Job**: Click edit icon on a job row → modify machine selection, operation duration, or job ID; changes save automatically when focus is lost.
- **Delete Job**: Click delete icon → removes selected job (disabled if only 1 job remains to prevent invalid state).
- *Failure Case*: If duration is set to 0, system shows "Duration must be > 0" error and blocks saving.

##### 3.2.2 Machine Management
- **Add Machine**: Click "Add Machine" → new machine is added with unique name (e.g., `Machine D`) and ID.
- **Edit Machine Name**: Type new name in machine input box → system validates no duplicate names; if duplicate, shows "Machine name already exists" error.
- **Delete Machine**: Click delete icon → disabled if only 1 machine remains (system requires at least one machine for scheduling).

---

#### 3.3 Input Scheduling Goal & Run
1. **Enter Goal**: Type natural-language goal in the text box (e.g., "Minimize total makespan", "Prioritize VIP orders", "Balance machine load").
2. **Run Schedule**: Click "Run Schedule" → system:
   - Invokes LLM to generate scheduling rules (or uses fallback FIFO if LLM is unavailable).
   - Runs scheduling engine to compute optimal job sequence.
   - Displays Gantt chart, KPIs (Makespan, machine utilization), and the rule used.
- *Failure Case*: If `LLM_API_KEY` is missing/invalid, system falls back to FIFO scheduling and shows "Using default FIFO rule" notification.

#### 3.4 View & Save Results
- **KPI Metrics**: After scheduling, view total makespan (total project duration) and machine utilization percentage.
- **Gantt Chart**: Visualize job timelines; hover over tasks to see job ID, machine, and start/end times.
- **Save to History**: Click "Save to History" → stores current configuration, goal, and results for later replay.
- *Failure Case*: If scheduling takes longer than 30 seconds, system times out and shows "Scheduling timeout, please try again".

---

#### 3.5 History & Replay
1. Open "History" panel → list of past schedules with timestamps and goals.
2. Select a record → click "Replay" → restores job/machine configuration, goal, and Gantt chart results.
3. *Edge Case*: Replayed schedules can be modified and re-run to compare different outcomes.

---

### 4. Post-Operation Validation
1. **Data Persistence**: After adding/editing jobs/machines, refresh page → data remains intact (verified via local storage/database).
2. **Session Security**: Logged-out users cannot access scheduling pages → redirected to login.
3. **UI Responsiveness**: All buttons/inputs respond within 1 second; no freezing during scheduling.

---

### 5. Emergency Recovery Procedures
#### 5.1 Service Crash Recovery
- Run `docker compose down` to stop all services.
- Re-run `docker compose up --build` to restart; data is preserved in MySQL volume.
#### 5.2 Database Corruption
- If `intellisched` database is corrupted:
  1. Stop services: `docker compose down`
  2. Delete MySQL volume: `docker volume rm final_mysql_data`
  3. Restart: `docker compose up --build` (triggers `init_mysql.sql` to reinitialize)
#### 5.3 LLM Unavailable Fallback
- If LLM calls fail repeatedly:
  1. Open `.env` file → set `LLM_API_KEY=` (empty string).
  2. Rebuild: `docker compose up --build` → system uses default FIFO scheduling rule.

---

### 6. Final Notes
- Always ensure Docker Desktop is running before launching the system.
- Avoid modifying `docker-compose.yml` or `init_mysql.sql` unless necessary.
- For persistent issues, check Docker logs (`docker compose logs`) for detailed error messages.
