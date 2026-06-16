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



## If you want a different password, use this tool to generate:
## https://bcrypt-generator.com/
