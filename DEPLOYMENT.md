# Momentum v1.0 Production Deployment Guide

This guide explains how to deploy the entire Momentum application (Frontend, Backend, and Database) to production environments using Vercel, Render, and MongoDB Atlas.

## 1. MongoDB Atlas Setup

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under **Database Access**, create a database user and save the password.
3. Under **Network Access**, allow IP access from anywhere (`0.0.0.0/0`) or specifically Render's outbound IPs.
4. Click **Connect** on your cluster, choose **Connect your application**, and copy the connection string.
5. Replace `<password>` in the connection string with your user's password. This is your `MONGODB_URI`.

> [!WARNING]
> Momentum no longer automatically seeds data on startup in production to prevent overriding user data. To seed the database initially, you must run `npm run seed` manually.

## 2. Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to **APIs & Services > Credentials**.
3. Edit your existing OAuth 2.0 Client ID or create a new one.
4. Under **Authorized JavaScript Origins**, add your Vercel URL (e.g., `https://momentum-app.vercel.app`).
5. Under **Authorized Redirect URIs**, add your Render backend URL (e.g., `https://momentum-api.onrender.com/api/v1/auth/google/callback`).

## 3. Backend Deployment (Render)

1. Create a new **Web Service** on [Render](https://render.com/).
2. Connect your GitHub repository.
3. Configuration:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Set the following Environment Variables:
   - `NODE_ENV=production`
   - `PORT=10000`
   - `MONGODB_URI` (from Atlas)
   - `JWT_SECRET` (generate a random secure string)
   - `JWT_EXPIRES_IN=30d`
   - `GOOGLE_CLIENT_ID` (from Google)
   - `GOOGLE_CLIENT_SECRET` (from Google)
   - `FRONTEND_URL` (your Vercel URL, e.g., `https://momentum-app.vercel.app`)
5. Deploy.
6. Render will ping the health check at `https://your-url.onrender.com/health` to confirm the server booted successfully.

## 4. Frontend Deployment (Vercel)

1. Import your project into [Vercel](https://vercel.com/).
2. Configuration:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Set the following Environment Variables:
   - `VITE_API_BASE_URL` (your Render URL + `/api/v1`, e.g., `https://momentum-api.onrender.com/api/v1`)
   - `VITE_GOOGLE_CLIENT_ID` (from Google)
4. Deploy.

## 5. Security & CORS Configuration

Momentum is pre-configured with industry-standard security out of the box:
- **Helmet:** Sets secure HTTP headers.
- **Express Rate Limit:** Prevents abuse (100 requests per 15 minutes per IP).
- **CORS:** Strictly accepts cross-origin requests *only* from the `FRONTEND_URL` defined in your backend environment variables. **Ensure this exactly matches your Vercel URL.**

## 6. Troubleshooting

- **MongoDB Fails to Connect:** The backend will forcefully exit (`process.exit(1)`) and restart on Render until a valid `MONGODB_URI` is provided. Check Render logs.
- **CORS Errors:** Verify that your backend `FRONTEND_URL` does not contain a trailing slash.
- **OAuth Login Fails:** Ensure the `VITE_GOOGLE_CLIENT_ID` on the frontend exactly matches the one on the backend, and that the Vercel domain is listed in Google Cloud Console.
