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

For local frontend login, make sure `frontend/.env.local` points to the port printed by the backend:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:5001/api
```

On macOS, another system process may already use port 5000. In that case the backend will usually start on 5001, so keep the frontend API URL on 5001 or set `PORT=5001` when starting the backend.

## Public deployment

### Frontend: GitHub Pages

The frontend is configured for a static GitHub Pages deployment at:

```text
https://3bdoum.github.io/abqora-mvp/
```

Deployment is handled by `.github/workflows/pages.yml`. In GitHub, open the repository settings and set **Pages > Build and deployment > Source** to **GitHub Actions**. Every push to `main` will build `frontend/out` and publish it.

The workflow currently points the frontend API client to:

```text
https://abqora-mvp.onrender.com/api
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
OPENAI_API_KEY=<optional, enables the student AI tutor>
OPENAI_MODEL=gpt-4.1-mini
```

After deploying backend code, run `npm run migrate:courses` once from the Render Shell to update course and lesson records without creating demo users. Run the seed script only for demo/test databases, and never after real users exist. In production it is blocked unless `ALLOW_PRODUCTION_SEED=true` is set intentionally.

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
- `CS Fundamentals: Express Course` — 31 lesson records. Each lesson follows the same student flow: watch one or more Abqora explanation videos first, open the public Code.org student activity for practice, then return to Abqora and submit the lesson for teacher review.

The exact, permitted 31-lesson titles and explanation video links were not available in this repository. The Express course therefore uses stable lesson identifiers and generic Abqora-authored titles for lessons whose official metadata has not been supplied yet. Replace those titles and add lesson videos only from verified material that Abqora is allowed to use; do not scrape Code.org or copy protected curriculum text.

Lesson records support both the legacy single `videoUrl` field and a newer `videoUrls` array for one or more explanation videos:

```js
videoUrls: [
  {
    title: 'شرح التمرين',
    url: 'https://www.youtube.com/watch?v=...',
    description: 'اختياري',
    duration: 'اختياري'
  }
]
```

Only HTTPS YouTube links are accepted for explanation videos from the admin lesson-creation API.

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

Code.org's official Canvas integration documentation also says iframe placements are unsupported, so Code.org pages are not embedded or proxied inside Abqora. Abqora uses this safe review flow:

1. The student watches the Abqora explanation video or videos on the lesson page.
2. The student opens the public Code.org student practice link in a new tab.
3. The student returns to Abqora and selects **انتهيت من التطبيق — إرسال للمراجعة**.
4. An assigned teacher or admin approves or rejects the request.
5. Approval completes the lesson and unlocks the next one.

Locked lessons hide explanation video URLs and Code.org links in the API response. The backend still enforces lesson order, so changing a URL or sending a direct completion API request cannot bypass prerequisites.

Abqora does not scrape Code.org, request instructor-only URLs, impersonate a Code.org user, or claim automatic Code.org progress synchronization. Reference material:

- https://support.code.org/hc/en-us/articles/115000693231-Viewing-student-progress
- https://support.code.org/hc/en-us/articles/14961588931597-How-do-I-print-my-student-s-progress-reports
- https://support.code.org/hc/en-us/articles/23123273783437-Install-the-Code-org-Integration-for-Canvas

## Explanation video authoring

For every lesson in both courses, add at least one Abqora-owned or properly licensed explanation video before asking students to practice on Code.org. A lesson can have multiple videos when the exercise needs smaller steps, for example:

- a short concept introduction;
- a walkthrough of the Code.org puzzle goal;
- a reminder video for common mistakes.

The lesson page will show all videos in order before the Code.org practice card. If no videos are configured yet, the student sees a clear placeholder message instead of a broken player.

Admins can manage lesson videos from **Admin > إدارة المناهج والدروس > إدارة فيديوهات الدروس**. The manager shows each course's lesson count, ready-video count, lessons missing videos, per-lesson video rows, and a YouTube preview before saving.

The same admin curriculum page includes a content readiness dashboard. It calculates course readiness from lesson videos, Code.org student links, and quiz availability, then filters lessons by missing video, missing Code.org link, missing quiz, or fully ready. Use **تعديل الدرس** from any readiness row to jump directly into the lesson editor.

Teachers and admins can use **لوحة المعلم** to search assigned students, filter lessons by review status, apply feedback templates, approve/reject completion requests, manually unlock/relock lessons, and see per-lesson content readiness hints for videos, Code.org links, and quizzes.

## Home page ads and offers

Admins can manage the public home page ads/offers from **Admin > إعلانات الصفحة الرئيسية**. Ads support title, badge, icon, description, button text/link, active state, display order, audience label, and optional start/end dates.

The public home page loads active ads from `/api/ads/public/home`. If no active ads are available, the frontend keeps safe fallback offer cards so the layout does not look empty. Ad links must be either internal paths such as `/register` or HTTPS URLs.

## Student AI tutor

The lesson page includes an optional Arabic AI tutor for students. It is scoped to the currently available lesson, uses the student's age group for tone, and is designed to give hints and explain the exercise without providing copy-ready full answers.

The AI tutor:

- runs only through the backend; never expose `OPENAI_API_KEY` in frontend code;
- checks the same lesson prerequisite rules as lesson access, so locked lessons cannot be queried through direct API calls;
- cannot approve completions, unlock lessons, or change progress;
- stores student questions and assistant replies in MongoDB for supervision and future review;
- blocks obvious requests for full solutions, credentials, API keys, or lesson approval shortcuts.

If `OPENAI_API_KEY` is not configured, the backend returns a clear disabled-state message and no OpenAI request is made. To enable it in production, add `OPENAI_API_KEY` in Render's environment variables and redeploy the backend. `OPENAI_MODEL` is optional and defaults to `gpt-4.1-mini`.

## Public AI assistant

The Thanaweya public page includes a floating assistant. In production it first calls the backend endpoint:

```txt
POST /api/ai/public-chat
```

This endpoint can answer general questions while using the current page context when the question is about Abqora, the official result link, percentage calculation, or college analysis. The frontend never stores or exposes an API key. To enable advanced answers publicly:

1. Add `OPENAI_API_KEY` to the backend environment on Render.
2. Optionally set `OPENAI_MODEL`; default is `gpt-4.1-mini`.
3. Ensure the GitHub Pages build uses the deployed backend URL in `.github/workflows/pages.yml` as `NEXT_PUBLIC_API_BASE_URL`.

If the backend AI provider is unavailable, the frontend keeps the chat UI available but shows a clear setup/connection message instead of pretending to answer broadly without AI.

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

The migration is idempotent. It upserts the two courses and stable lesson records, then backfills legacy completed lesson progress. It does not create demo users, does not call `deleteMany`, and preserves existing lesson document IDs and completion arrays wherever the existing 11 lessons can be matched by course and order.

For a fresh local/test database that needs demo accounts, run:

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
