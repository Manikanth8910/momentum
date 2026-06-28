# Momentum Productivity Platform

Momentum is a production-grade full-stack SaaS application designed for deep work, task management, and team collaboration.

## Tech Stack
- **Frontend:** React, Vite, TypeScript, Tailwind CSS, TanStack Router
- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Authentication:** JWT & Google OAuth

## Local Setup

### 1. Requirements
- Node.js 20+
- MongoDB (Running locally on port 27017 or a valid Atlas URI)

### 2. Environment Variables
Create a `.env` file in both `frontend` and `backend` directories based on the `.env.example` files provided in each directory.

### 3. Installation & Running
```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

### 4. Seeding Data (Optional)
To pre-populate your local database with sample users and tasks:
```bash
cd backend
npm run seed
```

## Production Deployment

Momentum is fully configured for deployment on standard cloud platforms:
- **Frontend:** Vercel (via `vercel.json` and Vite build).
- **Backend:** Render or any VPS (via `Dockerfile`, `ecosystem.config.js`, or standard `npm start`).
- **Database:** MongoDB Atlas.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the complete, step-by-step production deployment guide.
