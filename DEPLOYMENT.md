# ProSess Deployment Guide

This guide will walk you through deploying your ProSess application for free using the following stack:

- **Database:** MongoDB Atlas (Free Cloud Database)
- **Backend (API):** Render (Free Web Service)
- **Frontend (UI):** Vercel (Free Static Hosting)

---

## 0. Prerequisites

- [ ] A GitHub account.
- [ ] This project pushed to your GitHub repository (which we just did!).
- [ ] Accounts on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas), [Render](https://render.com/), and [Vercel](https://vercel.com/signup).

---

## 1. Database Setup (Existing)

**Good news! You already have a MongoDB Atlas database connected.**

1.  Open your local file: `backend/.env`.
2.  Copy the value of `MONGODB_URI`. It should look like:
    `mongodb+srv://akashk79026...prosess-cluster...`
3.  **Critical Step:** Go to the [MongoDB Atlas Dashboard](https://cloud.mongodb.com/).
    - Navigate to **Security** -> **Network Access**.
    - Ensure there is an IP entry for `0.0.0.0/0` (Allow Access from Anywhere).
    - _Why?_ Your local computer connects fine, but **Render** (the cloud server) needs permission to connect too. Without this, your deployed app will fail.\_

---

## 2. Backend Deployment (Render)

1.  Log in to **[Render Dashboard](https://dashboard.render.com/)**.
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repository ("focus-flow-main").
4.  Configure the service:
    - **Name:** `prosess-api` (or similar)
    - **Region:** Choose one close to you (e.g., Singapore, Frankfurt).
    - **Branch:** `main`
    - **Root Directory:** `backend` (Important!)
    - **Runtime:** Node
    - **Build Command:** `npm install && npm run build`
    - **Start Command:** `npm start`
    - **Instance Type:** Free
5.  **Environment Variables** (Scroll down to "Advanced"):
    Add the following keys and values:
    - `MONGODB_URI`: Paste your connection string from Step 1.
    - `JWT_SECRET`: Generate a random long string (e.g., `my-super-secret-key-123`).
    - `NODE_ENV`: `production`
6.  Click **Create Web Service**.
7.  Wait for the deployment to finish. Once it says "Live", copy the **URL** (e.g., `https://prosess-api.onrender.com`).
    _Note: The free tier spins down after inactivity, so the first request might take 50 seconds._

---

## 3. Frontend Deployment (Vercel)

1.  Log in to **[Vercel Dashboard](https://vercel.com/dashboard)**.
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository.
4.  Configure the project:
    - **Framework Preset:** Vite (should be auto-detected).
    - **Root Directory:** `./` (default).
5.  **Environment Variables**:
    - Key: `VITE_API_URL`
    - Value: Paste your **Render Backend URL** from Step 2 (e.g., `https://prosess-api.onrender.com/api`).
      _Important: Make sure to add `/api` at the end if your backend routes are prefixed with it (which they are)._
6.  Click **Deploy**.
7.  Wait for the confetti! Your app is now live.

---

## 4. Final Verification

1.  Open your **Vercel URL**.
2.  Try to **Register** a new account.
    - If it loads indefinitely, your Render backend might be "waking up". Wait 1 minute and try again.
3.  Log in and try creating a session.
4.  If everything works, you are done!

## Troubleshooting

- **White screen on Vercel?** Check the browser console (F12). If you see "CORS" errors, you might need to update the `cors` configuration in `backend/src/server.ts` to allow your specific Vercel domain instead of just localhost.
- **Login fails?** Check Render logs to ensure MongoDB connected successfully.
