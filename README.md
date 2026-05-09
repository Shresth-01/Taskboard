# Taskboard — Academic Task Management Portal

A full-stack Kanban-style task management system built for BITS Pilani FSAD assignment. Supports role-based workflows for students, teachers, and admins.

## Live Demo

- **Frontend**: https://taskboard-lza3dw8ub-shresth-1534s-projects.vercel.app
- **Backend API**: https://taskboard-backend-prmq.onrender.com/api

### Default Accounts

| Role    | Email                      | Password     |
|---------|----------------------------|--------------|
| Admin   | admin@taskboard.com        | Admin@123    |
| Teacher | teacher@taskboard.com      | Teacher@123  |
| Student | student@taskboard.com      | Student@123  |

> Or click **"Try Demo"** on the login page for instant access without signing up.

> **Note:** The backend runs on Render's free tier and **spins down after 15 minutes of inactivity**. The first request after idle may take 30–60 seconds to respond. To warm it up before a demo, open the [health check URL](https://taskboard-backend-prmq.onrender.com/api/health) first.

## Features

- **Kanban Board** — 5-column workflow: To Do → In Progress → On Hold → Monitoring → Done
- **Role-Based Access**
  - Students: move their own tasks (To Do → In Progress → On Hold)
  - Teachers: review and grade tasks (On Hold → Monitoring → Done)
  - Admin: full control over all tasks and users
- **Task Details** — subject, type, due date, max marks, grade, submission notes
- **Drag & Drop** — enforced per role with visual column restrictions
- **Demo Mode** — explore with mock data, no account needed
- **Dark Mode** — persistent theme preference
- **Admin Panel** — manage all users and tasks

## Tech Stack

### Frontend
- React 18 + TypeScript (Vite)
- Tailwind CSS v4
- Zustand (state management)
- React Beautiful DnD
- Axios

### Backend
- Node.js + Express + TypeScript
- MongoDB Atlas + Mongoose
- JWT Authentication
- bcrypt password hashing

## Project Structure

```
fsad_assignment/
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── pages/     # LoginPage, SignupPage, BoardPage, AdminPage
│   │   ├── components/ # TaskCard, TaskModal, Navbar, etc.
│   │   ├── store/     # Zustand stores (auth, task, theme)
│   │   ├── services/  # Axios API client
│   │   └── types/     # Shared TypeScript types
│   └── .env.example
├── backend/           # Express API
│   ├── src/
│   │   ├── models/    # User, Task (Mongoose schemas)
│   │   ├── routes/    # auth, tasks, users
│   │   ├── middleware/ # JWT auth, role guard
│   │   └── seed.ts    # Default account seeder
│   └── .env.example
└── README.md
```

## Local Development

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET
npm run dev            # starts on http://localhost:5000
```

Seed default accounts:
```bash
npx ts-node src/seed.ts
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # leave VITE_API_URL empty for dev (uses proxy)
npm run dev            # starts on http://localhost:5173
```

## Deployment

| Service | Platform | Config |
|---------|----------|--------|
| Backend | Render   | Root: `backend`, Build: `npm install && npm run build`, Start: `node dist/server.js` |
| Frontend | Vercel  | Root: `frontend`, Framework: Vite, Env: `VITE_API_URL=<Render URL>/api` |

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | — | Register new user |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/tasks` | Any | Get tasks (filtered by role) |
| POST | `/api/tasks` | Teacher/Admin | Create task |
| PUT | `/api/tasks/:id` | Teacher/Admin | Update task |
| PATCH | `/api/tasks/:id/status` | Any | Advance task status |
| DELETE | `/api/tasks/:id` | Teacher/Admin | Delete task |
| GET | `/api/users` | Teacher/Admin | List users |
| DELETE | `/api/users/:id` | Admin | Delete user |
