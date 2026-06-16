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