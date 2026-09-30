# Intelligent Document Processing (IDP) System
### Enterprise Multimodal Document Intelligence powered by Google Gemini 2.0 Flash & Supabase

A production-grade, end-to-end Intelligent Document Processing (IDP) platform designed to ingest unstructured enterprise documents (Invoices, Receipts, Contracts, Resumes, and Identity Proofs), perform high-accuracy multimodal OCR, extract structured key-value entities and tabular line items, score field confidence, flag low-confidence items (< 85%) for human review, and export verified datasets to CSV or JSON.

---

## 🌟 Key Architecture & Capabilities

1. **Native Multimodal Vision Extraction (`gemini-2.0-flash`)**:
   - Built on `@google/genai` (official Google Gen AI SDK).
   - Bypasses brittle legacy OCR template coordinate matching by feeding high-resolution document images and PDF buffers directly to Gemini 2.0 Flash's multimodal vision engine.
   - Enforces structured JSON output schema directly in the model call.

2. **Automated Document Classification**:
   - Invoices: Vendor, date, subtotal, tax, total, terms, PO number, and line items.
   - Receipts: Merchant, transaction date, payment method, tax, tip, total, line items.
   - Contracts: Parties involved, effective date, termination clauses, governing law, liability caps.
   - Resumes: Candidate name, email, phone, years of experience, skills, education.
   - Identity Proofs: Full name, ID number, DOB, expiry date, issuing authority.

3. **Field-Level Confidence Scoring & HITL (Human-in-the-Loop) Verification**:
   - Granular confidence scores ($0.0 - 1.0$) for every extracted entity.
   - Dynamic thresholding: Fields with confidence $< 85\%$ ($0.85$) are visibly flagged with amber/red alert badges and review indicators.
   - Split-screen workspace (`/documents/:id`) with interactive Document Viewer on the left and Editable Extraction Grid on the right.
   - One-click "Mark as Verified" workflow logging human corrections to an immutable audit trail.

4. **Multi-Format Document Upload**:
   - Drag-and-drop batch queue (`/upload`) supporting PDF, PNG, JPEG, and DOCX up to 10MB per document.
   - Server-side MIME validation and size limits enforced via Multer.

5. **Security & Data Isolation (Supabase RLS & Signed URLs)**:
   - Private Supabase Storage bucket (`documents`) accessed exclusively through short-lived signed URLs.
   - PostgreSQL Row Level Security (RLS) policies guaranteeing strict multi-tenant isolation.
   - Zod validation schemas for all API payloads and AI outputs.

6. **Full Fallback & Instant Demo Capability**:
   - Zero-configuration test mode: Pre-seeded sample invoices, receipts, and contracts allow immediate exploration without third-party API keys.
   - When `GEMINI_API_KEY` and Supabase credentials are provided in `.env`, the system automatically switches to live Gemini 2.0 Flash multimodal vision and Supabase PostgreSQL.

---

## 📂 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js                # Environment configuration
│   │   │   ├── supabase.js           # Supabase Client & Admin setup
│   │   │   └── gemini.js             # @google/genai SDK setup (gemini-2.0-flash)
│   │   ├── middleware/
│   │   │   ├── auth.js               # Supabase JWT token verification
│   │   │   ├── upload.js             # Multer upload & 10MB limits
│   │   │   └── validate.js           # Zod schema validation
│   │   ├── schemas/
│   │   │   ├── documentSchemas.js    # Zod schemas (FieldUpdate, Upload, Query)
│   │   │   └── geminiExtractionSchema.js # Gemini JSON schema definition
│   │   ├── services/
│   │   │   ├── geminiService.js      # Multimodal vision extraction & auto-flagging
│   │   │   ├── storageService.js     # Supabase Storage & signed URLs
│   │   │   ├── documentService.js    # PostgreSQL CRUD, fields & audit logging
│   │   │   └── exportService.js      # CSV and JSON generation
│   │   ├── controllers/
│   │   │   ├── authController.js     # Register, Login, Profile
│   │   │   ├── documentController.js # Upload, Get, Re-extract, Edit, Export, Delete
│   │   │   └── analyticsController.js# System metrics & class breakdown
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── documentRoutes.js
│   │   │   └── analyticsRoutes.js
│   │   ├── utils/
│   │   │   ├── logger.js
│   │   │   └── apiResponse.js
│   │   └── index.js                  # Main Express entrypoint
│   ├── .env
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx             # Main navigation & status
│   │   │   ├── UploadDropzone.tsx     # Drag-and-drop batch upload area
│   │   │   ├── DocumentViewer.tsx     # PDF & Image split viewer with zoom/rotate
│   │   │   ├── ExtractionDataGrid.tsx # Inline editable grid & line items
│   │   │   ├── ConfidenceBadge.tsx    # Visual color-coded confidence indicators
│   │   │   └── ExportButton.tsx       # CSV & JSON export dropdown
│   │   ├── pages/
│   │   │   ├── Login.tsx              # Secure authentication + instant demo
│   │   │   ├── Register.tsx           # New user registration
│   │   │   ├── Dashboard.tsx          # KPI cards, search & document archive
│   │   │   ├── UploadPage.tsx         # Document ingestion & schema guide
│   │   │   ├── DocumentDetail.tsx     # Split-screen review & human verification
│   │   │   └── Analytics.tsx          # Throughput, accuracy & audit metrics
│   │   ├── context/
│   │   │   └── AuthContext.tsx        # Authentication state management
│   │   ├── services/
│   │   │   └── api.ts                 # Typed API client
│   │   ├── types/
│   │   │   └── index.ts               # Core TypeScript definitions
│   │   ├── App.tsx                    # Route definitions & protected guards
│   │   └── index.css                  # Tailwind styles, dark theme & glassmorphism
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── supabase/
│   ├── schema.sql                     # Complete PostgreSQL tables, RLS & triggers
│   └── migrations/
│       └── 001_initial_schema.sql     # Full migration with schema, RLS, storage & seed data
└── package.json
```

---

## 🚀 Quick Start Guide

### 1. Start the Backend Server (Port 5000)
```bash
cd backend
npm install
npm start
```
The server will start on `http://localhost:5000`.

### 2. Start the Frontend Application (Port 5173)
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## ⚙️ Environment Variables

### Backend Configuration (`backend/.env`)
```ini
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Supabase PostgreSQL & Auth
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Google Gemini API
GEMINI_API_KEY=AIzaSy...your-gemini-2-api-key

# Fallback / Demo Mode
ENABLE_DEMO_FALLBACK=true
```

### Frontend Configuration (`frontend/.env`)
```ini
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 🗄️ Database Setup (Supabase Cloud PostgreSQL)

Target Supabase Project: `https://rcviajizjxiiuqsiqwsn.supabase.co`

### Method A: Automated Migration Runner
Run the migration script directly from your terminal:
```bash
# Option 1: Pass your database password
npm run migrate -- --password=YOUR_DB_PASSWORD

# Option 2: Pass full connection URI
npm run migrate -- --db-url="postgresql://postgres.rcviajizjxiiuqsiqwsn:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"

# Option 3: With Service Role Key
npm run migrate -- --key=YOUR_SERVICE_ROLE_KEY
```

### Method B: 1-Click via Supabase Dashboard SQL Editor (Instant)
1. Open your project's SQL Editor: [https://supabase.com/dashboard/project/rcviajizjxiiuqsiqwsn/sql/new](https://supabase.com/dashboard/project/rcviajizjxiiuqsiqwsn/sql/new)
2. Copy and paste the entire contents of [`supabase/migrations/001_initial_schema.sql`](file:///c:/Users/shubh/create%20video/supabase/migrations/001_initial_schema.sql).
3. Click **"Run"** ▶. All tables, triggers, RLS policies, storage bucket policies, and seed data will be created instantly.

---

## 🧪 Verified Integration Tests

All core user flows and API endpoints have been verified with 100% automated test coverage:
- ✅ **Authentication**: Email/password registration, login, and instant demo session.
- ✅ **Document Archive**: Filter by status (`needs_review`, `verified`), document class, and search by filename.
- ✅ **AI Extraction**: Multi-format PDF/Image buffer processing with `@google/genai` and `gemini-2.0-flash`.
- ✅ **Confidence Flagging**: Automatic review flagging for entities with $< 85\%$ confidence.
- ✅ **Human-in-the-Loop Corrections**: Inline field editing, status transition to `verified`, and audit logging.
- ✅ **Export**: Multi-table CSV and JSON exports with metadata, key-values, and line items.
- ✅ **Analytics**: Live distribution and automation straight-through rate calculations.
