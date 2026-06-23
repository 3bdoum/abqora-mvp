# Abqora MVP

Arabic e-learning MVP for students aged 7–16.

Tech stack:
- Frontend: Next.js
- Backend: Node.js + Express
- Database: MongoDB
- Auth: JWT
- Storage: Firebase Storage (planned)

## Project structure

- `/frontend` - Next.js app with RTL Arabic UI
- `/backend` - Express API with JWT auth and MongoDB models

## Setup

1. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```
3. Run backend and frontend from the project root:
   ```bash
   npm run dev:backend
   npm run dev:frontend
   ```

If you are in the backend folder, run:
```bash
npm run dev
```

If you are in the frontend folder, run:
```bash
npm run dev
```

If port 5000 is already in use, the backend will automatically try ports 5001 through 5010 and start on the first available port.
You can also start the backend on a custom port:
```bash
cd backend
PORT=5004 npm run dev
```

## Public deployment

### Frontend: GitHub Pages

The frontend is configured for a static GitHub Pages deployment at:

```text
https://3bdoum.github.io/abqora-mvp/
```

Deployment is handled by `.github/workflows/pages.yml`. In GitHub, open the repository settings and set **Pages > Build and deployment > Source** to **GitHub Actions**. Every push to `main` will build `frontend/out` and publish it.

The workflow currently points the frontend API client to:

```text
https://abqora-api.onrender.com/api
```

If Render gives the backend a different URL, update `NEXT_PUBLIC_API_BASE_URL` in `.github/workflows/pages.yml`.

### Backend: Render

Create a Render Web Service from this GitHub repository:

```text
Root Directory: backend
Build Command: npm ci
Start Command: npm start
Health Check Path: /health
```

Set these environment variables in Render:

```text
NODE_ENV=production
MONGODB_URI=<your MongoDB Atlas connection string>
JWT_SECRET=<a long random secret>
CORS_ORIGIN=https://3bdoum.github.io
FRONTEND_URL=https://3bdoum.github.io/abqora-mvp
```

Run the seed script only once for demo data, and never after real users exist. In production it is blocked unless `ALLOW_PRODUCTION_SEED=true` is set intentionally.

## MVP scope

- Login / Register
- Student dashboard
- Course page
- Lesson page
- Quiz page
- Progress tracking
- Certificate generation

## Course catalog and access model

Abqora currently includes two student-facing courses:

- `CS Fundamentals: Pre-reader Express` — the existing 11-lesson course. The migration updates the course metadata and adds stable lesson identifiers without replacing lesson documents or deleting `Progress.completedLessons`.
- `CS Fundamentals: Express Course` — 31 lesson records. Lessons 1–2 now contain original Abqora Blockly activities that run entirely inside the lesson page; lessons 3–31 remain visible in sequence as placeholders, but they do not expose direct Code.org student links until original Abqora activities are authored.

The exact, permitted 31-lesson metadata was not available in this repository or the supplied public page. Lessons 3–31 are deliberately labelled in the UI and database as placeholders (`isPlaceholder: true`) with titles such as `الدرس 3 — العنوان الرسمي مطلوب`. Replace them only when verified metadata is supplied; do not scrape Code.org or copy protected curriculum text.

`Progress` remains the student-course enrollment record so existing progress is not split into a duplicate concept. It now contains per-lesson status and manual access overrides alongside the legacy `completedLessons` array. Existing completed lesson IDs are backfilled to the richer structure and remain intact.

Lesson access is enforced by the Express API:

- Enrolling makes lesson 1 available.
- A later lesson is available only after the previous ordered lesson is approved as completed, unless a teacher/admin unlock override exists.
- Direct lesson, quiz, project-submission, and completion API calls perform the same prerequisite check.
- Student completion requests become `awaiting_approval`; they do not complete a lesson immediately.
- Approval completes that lesson and makes only the next ordered lesson available.
- Teachers can act only on explicitly assigned students. Admins can supervise every student.
- Approvals, rejections, unlocks, relocks, and student completion requests create immutable audit entries.

## Code.org integration limitation

As of June 23, 2026, Code.org's official support material documents its own teacher progress dashboard and manual CSV downloads, plus SSO/roster integrations for providers such as Clever, Google Classroom, Canvas, and Schoology. The official Canvas documentation explicitly says Code.org grade sync to Canvas is not available. No documented public API was found that permits Abqora to read a student's Code.org course completion automatically.

Code.org's official Canvas integration documentation also says iframe placements are unsupported, so Code.org pages are not embedded or proxied inside Abqora. Abqora uses this safe native flow:

1. For an Abqora-native activity, the student arranges Blockly commands and runs the activity inside the lesson page.
2. The Express API independently simulates the submitted commands; the generic completion endpoint cannot bypass this validation.
3. A verified solution becomes **بانتظار موافقة المعلم**.
4. An assigned teacher or admin approves or rejects the request.
5. Approval completes the lesson and unlocks the next one.

Lessons that are still placeholders cannot be completed and do not launch Code.org directly from the student experience. To make the rest of the Express course usable inside Abqora, author original native activities and replace each placeholder with verified lesson metadata.

Abqora does not scrape Code.org, request instructor-only URLs, impersonate a Code.org user, or claim automatic Code.org progress synchronization. Reference material:

- https://support.code.org/hc/en-us/articles/115000693231-Viewing-student-progress
- https://support.code.org/hc/en-us/articles/14961588931597-How-do-I-print-my-student-s-progress-reports
- https://support.code.org/hc/en-us/articles/23123273783437-Install-the-Code-org-Integration-for-Canvas

## Native activity authoring

Lessons `express-2025-l01` and `express-2025-l02` use the first reusable `sequence_maze` activity type. Each lesson stores its public grid, start, goal, walkable cells, lesson-specific instructions, and block limit on the existing `Lesson.nativeActivity` field. The browser animates the commands for immediate feedback, while `POST /api/progress/native-activity` performs the authoritative validation before creating the audited completion request. Never treat the browser simulation as proof of completion.

## Roles and sample accounts

Supported roles are `student`, `parent`, `teacher`, and `admin`. Public registration remains limited to students and parents; teacher/admin accounts must be provisioned by an administrator or the seed script.

The idempotent seed creates these local demo accounts without resetting passwords or deleting existing users when rerun:

```text
teacher@abqora.com / teacher123
student@abqora.com / student123
admin@abqora.com / admin123
parent@abqora.com / parent123
```

Change all sample passwords outside local development.

## Migration, seed, and tests

Back up MongoDB before any production migration. Then run from `backend`:

```bash
npm run migrate:courses
```

The migration is idempotent. It upserts the two courses, stable lesson records, sample accounts, and the sample teacher assignment; it does not call `deleteMany` and it preserves existing lesson document IDs and completion arrays wherever the existing 11 lessons can be matched by course and order.

For a fresh local database, the same behavior is available through:

```bash
npm run seed
```

Run the focused authorization, ordering, preservation, and seed tests with:

```bash
npm test
```

The tests use an isolated in-memory MongoDB and do not touch the configured application database.



## If you want a different password, use this tool to generate:
## https://bcrypt-generator.com/
