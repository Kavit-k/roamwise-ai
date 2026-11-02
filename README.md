# Roamwise AI (Voyana) 🌍

> **Intelligent, budget-conscious travel itinerary planner powered by Groq LLMs, Supabase PostgreSQL, and ReportLab vector PDF export.**

Roamwise AI is a full-stack web application designed for modern travelers. It generates realistic, day-by-day travel schedules tailored to traveler party dynamics, preferred pace, and real financial limits. The platform supports live activity editing, automatic budget rebalancing, single-day regeneration, secure database persistence via Supabase with Row Level Security (RLS), and publication-ready vector PDF downloads.

---

## 🌟 Key Capabilities

1. **Destination Discovery**: Curated inspiration cards for world-class destinations (Kyoto, Amalfi Coast, Swiss Alps, Oaxaca, Cape Town, Bali) with pre-fillable trip parameters.
2. **Interactive 6-Step Wizard**:
   - Destination & Country
   - Departure & Return Dates (auto-duration calculation, past date validation, up to 30-day itineraries)
   - Traveler Party (Adults, Children, Solo/Couple/Family/Friends/Business dynamics)
   - Financial Parameters (Target budget, multi-currency support, Budget/Moderate/Luxury tiering)
   - Preferences & Pace (Pace selection, transportation, accommodation styles, dietary & accessibility notes)
   - Review & Live Confirmation
3. **Groq AI Generation**: High-speed structured LLM synthesis via the official Groq Python SDK with strict Pydantic validation, retries, and rate-limit backoff.
4. **Day-by-Day Customization**:
   - Timed morning, afternoon, and evening activities with estimated costs and practical tips.
   - Activity CRUD: Add new activities, edit details, delete, and reorder.
5. **Live Budget Rebalancing**: Adding or editing any activity immediately recalculates total costs, category breakdowns, and alerts if spending exceeds planned funds.
6. **Single-Day AI Regeneration**: Modify and refresh only one selected day using custom instructions while preserving neighboring days.
7. **Vector PDF Export**: Backend-generated multi-page PDF documents via ReportLab featuring Roamwise branding, budget breakdown tables, day schedules, and page numbers.
8. **Supabase PostgreSQL & Auth**:
   - User authentication and persistent sessions.
   - Strict Row Level Security (RLS) guaranteeing that users can only view and manage their own trips.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, React Router v7, Lucide Icons |
| **Backend** | Python 3.13 / 3.14, FastAPI, Pydantic v2, Pydantic-Settings, Uvicorn |
| **AI Provider** | Groq Python SDK (`llama-3.3-70b-versatile` configurable) |
| **Database & Auth** | Supabase PostgreSQL, Supabase Auth, Row Level Security (RLS) |
| **Document Generation** | ReportLab (Vector PDF generator with custom two-pass canvas) |
| **Testing** | Pytest, Pytest-Asyncio, HTTPX TestClient |

---

## 📁 Repository Structure

```
roamwise-ai/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application, CORS, global exception handler
│   │   ├── core/
│   │   │   ├── config.py           # Pydantic Settings & environment variables
│   │   │   └── security.py         # Supabase JWT token validation & auth dependencies
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── health.py       # Readiness & configuration health check
│   │   │       ├── trips.py        # Trip generation, listing, retrieval, deletion
│   │   │       ├── itinerary.py    # Activity CRUD, day regeneration, reordering
│   │   │       └── export.py       # Branded vector PDF generation & download
│   │   ├── schemas/
│   │   │   ├── trip.py             # Request/response validation schemas
│   │   │   └── itinerary.py        # Itinerary, DayPlan, Activity, Budget schemas
│   │   ├── services/
│   │   │   ├── groq_service.py     # Groq API client with structured prompts & retry
│   │   │   ├── itinerary_service.py# Activity math, budget recomputation, day updates
│   │   │   ├── trip_service.py     # Supabase DB operations with RLS token context
│   │   │   └── pdf_service.py      # ReportLab branded PDF document builder
│   │   └── db/
│   │       └── supabase.py         # Supabase client factory
│   ├── migrations/
│   │   └── 001_initial_schema.sql  # Profiles & Trips tables, indexes, RLS policies
│   ├── tests/
│   │   ├── conftest.py             # Pytest fixtures and mock client
│   │   ├── test_health.py          # Health check & root endpoints
│   │   ├── test_schemas.py         # Pydantic schema validation tests
│   │   ├── test_groq_service.py    # AI parsing, retry policy, and rate limit tests
│   │   ├── test_itinerary_service.py# Activity CRUD and budget recalculation tests
│   │   ├── test_pdf_service.py     # Vector PDF byte verification tests
│   │   └── test_trips.py           # Cross-user isolation and auth tests
│   ├── requirements.txt            # Backend Python dependencies
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx          # Brand header with navigation & user controls
│   │   │   ├── Footer.tsx          # Footer with architecture callouts & disclaimer
│   │   │   ├── ProtectedRoute.tsx  # Auth guard for private routes
│   │   │   ├── ActivityModal.tsx   # Add/Edit activity dialog
│   │   │   └── RegenerateDayModal.tsx # Single-day AI re-planning dialog
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx     # Hero, Discovery cards, How it works, Sample preview
│   │   │   ├── LoginPage.tsx       # Supabase sign-in
│   │   │   ├── RegisterPage.tsx    # Supabase registration
│   │   │   ├── DashboardPage.tsx   # Saved trips, search, deletion
│   │   │   ├── WizardPage.tsx      # 6-step guided planning wizard
│   │   │   └── TripDetailPage.tsx  # Dynamic itinerary viewer & PDF export
│   │   ├── context/
│   │   │   └── AuthContext.tsx     # Supabase auth session provider
│   │   ├── lib/
│   │   │   ├── api.ts              # Centralized API client with JWT injection
│   │   │   └── supabase.ts         # Supabase browser client
│   │   ├── types/
│   │   │   └── trip.ts             # TypeScript interfaces
│   │   ├── App.tsx                 # Route declarations
│   │   ├── main.tsx
│   │   └── index.css               # Tailwind CSS styles & typography
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── .env.example
├── README.md
└── .gitignore
```

---

## ⚡ Quickstart Guide

### Prerequisites

- **Python 3.10+** (Python 3.13 recommended)
- **Node.js 18+** (Node 20+ or 26)
- **Git**
- A **Groq Cloud API Key** (from [console.groq.com](https://console.groq.com))
- A free **Supabase Project** (from [supabase.com](https://supabase.com))

---

### Step 1: Database Setup (Supabase)

1. Create a new project in your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor** tab in Supabase.
3. Open `backend/migrations/001_initial_schema.sql` from this repository.
4. Copy and paste the entire SQL file into the Supabase SQL Editor and click **Run**.
5. This creates:
   - `profiles` table with automatic user creation triggers.
   - `trips` table with UUID keys, dates, JSONB preferences and itineraries.
   - Indexes on `user_id` and `created_at`.
   - Strict Row Level Security (RLS) policies isolating user data.
6. Copy your **Project URL**, **anon key**, and **JWT secret** from **Settings > API**.

---

### Step 2: Backend Configuration & Startup

1. Open a terminal in `backend/`:
   ```bash
   cd backend
   ```

2. Create your `.env` configuration:
   ```bash
   cp .env.example .env
   ```
   Fill in your credentials:
   ```ini
   GROQ_API_KEY=gsk_your_groq_api_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your_supabase_anon_key_or_service_key
   SUPABASE_JWT_SECRET=your_supabase_jwt_secret_here
   FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   ENVIRONMENT=development
   ```

3. Create virtual environment and install dependencies:

   **Windows (PowerShell):**
   ```powershell
   py -3.13 -m venv venv
   .\venv\Scripts\Activate.ps1
   python -m pip install -r requirements.txt
   ```

   **macOS / Linux:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

4. Start the FastAPI backend:

   **Windows (PowerShell):**
   ```powershell
   .\venv\Scripts\uvicorn.exe app.main:app --reload --host 127.0.0.1 --port 8000
   ```

   **macOS / Linux:**
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

5. Access interactive API documentation at:
   - Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
   - Health Status: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

### Step 3: Frontend Configuration & Startup

1. Open a second terminal in `frontend/`:
   ```bash
   cd frontend
   ```

2. Create your `.env` configuration:
   ```bash
   cp .env.example .env
   ```
   Provide your Supabase client settings:
   ```ini
   VITE_API_BASE_URL=http://127.0.0.1:8000
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

3. Install packages and start Vite:

   **Windows (PowerShell / Command Prompt):**
   ```powershell
   cmd /c "npm install"
   cmd /c "npm run dev"
   ```

   **macOS / Linux:**
   ```bash
   npm install
   npm run dev
   ```

4. Open the application in your browser:
   👉 **http://localhost:5173**

---

## 🧪 Automated Testing

### Backend Unit & Integration Tests

The backend test suite tests health endpoints, Pydantic schema validation boundaries, Groq structured output recovery, single-day and full regeneration, activity CRUD, budget math recalculations, cross-user authorization isolation, and ReportLab PDF binary output:

```powershell
# From the backend directory or repository root:
backend\venv\Scripts\pytest.exe -v backend\tests
```

**Test Results:**
```
collected 19 items
backend/tests/test_groq_service.py::test_groq_service_generate_success PASSED
backend/tests/test_groq_service.py::test_groq_service_retry_on_malformed_json PASSED
backend/tests/test_groq_service.py::test_groq_service_rate_limit PASSED
backend/tests/test_health.py::test_health_check PASSED
backend/tests/test_health.py::test_root_endpoint PASSED
backend/tests/test_itinerary_service.py::test_add_activity PASSED
backend/tests/test_itinerary_service.py::test_update_activity PASSED
backend/tests/test_itinerary_service.py::test_delete_activity PASSED
backend/tests/test_itinerary_service.py::test_reorder_activities PASSED
backend/tests/test_itinerary_service.py::test_budget_exceeded_warning PASSED
backend/tests/test_pdf_service.py::test_pdf_generation_valid_output PASSED
backend/tests/test_schemas.py::test_trip_request_valid_dates PASSED
backend/tests/test_schemas.py::test_trip_request_invalid_dates_order PASSED
backend/tests/test_schemas.py::test_trip_request_exceeds_max_duration PASSED
backend/tests/test_schemas.py::test_trip_request_invalid_budget PASSED
backend/tests/test_schemas.py::test_activity_invalid_time_slot PASSED
backend/tests/test_trips.py::test_unauthenticated_request_rejected PASSED
backend/tests/test_trips.py::test_list_trips_authenticated PASSED
backend/tests/test_trips.py::test_cross_user_trip_access_denied PASSED

======================== 19 passed in 0.78s ========================
```

### Frontend Production Build Verification

```powershell
# From the frontend directory:
cmd /c "npm run build"
```

**Build Output:**
```
✓ 2109 modules transformed.
dist/index.html                   0.99 kB
dist/assets/index-qWruR36m.css   29.78 kB
dist/assets/index-D6H_kMnP.js   590.19 kB
✓ built in 2.18s
```

---

## 🔒 Security & Factual Integrity

- **Zero Secret Exposure**: The `GROQ_API_KEY` and Supabase Service keys reside exclusively on the backend server.
- **Row Level Security (RLS)**: PostgreSQL enforces that queries are filtered by `auth.uid() = user_id`. Attempting to read another user's trip returns HTTP 403.
- **JWT Signature Verification**: All user-specific API calls validate the Supabase bearer token before processing requests.
- **Factual Limitations Disclosure**: Groq provides estimated costs, suggested timings, and area recommendations. All schedules prominently display notices reminding travelers to verify opening hours, ticket availability, and transit schedules before departure.

---

## 📄 License

This project is licensed under the MIT License.
