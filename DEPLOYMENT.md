# 🚀 Production Deployment Guide: Vercel + Railway + PostgreSQL

This guide provides exact step-by-step instructions to deploy the **Anti-Drug Club Quiz Competition Platform** with:
- **Frontend & Next.js API Routes** on **Vercel**
- **Real-time WebSocket Server** on **Railway**
- **Database** on **Railway PostgreSQL**

---

## 🔑 Default Admin Credentials
- **Username**: `admin_login`
- **Password**: `admin@login.123`

---

## 1. 🗄️ Step 1: Provision PostgreSQL Database on Railway

1. Log in to [Railway Dashboard](https://railway.app).
2. Click **New Project** → Select **Provision PostgreSQL**.
3. Once created, click on the **PostgreSQL service** -> **Variables** tab.
4. Copy the connection string value from `DATABASE_URL` (or `DATABASE_PUBLIC_URL`).

---

## 2. 🔌 Step 2: Deploy Real-time WebSocket Server on Railway

1. In the same Railway project, click **New** → **GitHub Repo**.
2. Select your repository `AntiDrugQuiz`.
3. In service settings, go to **Variables** and set:
   - `DATABASE_URL` = *(Your Railway PostgreSQL Connection String)*
   - `JWT_SECRET` = `antidrug_club_secret_key_2026_secure`
   - `ADMIN_USERNAME` = `admin_login`
   - `ADMIN_PASSWORD` = `admin@login.123`
   - `NODE_ENV` = `production`
   - `PORT` = `3000`
4. Go to **Settings** tab -> **Build & Start Command**:
   - **Start Command**:
     ```bash
     npx prisma db push && npx ts-node prisma/seed.ts && npm start
     ```
5. Go to **Settings** -> **Networking** -> Click **Generate Domain**.
   - Copy the generated domain (e.g. `https://anti-drug-backend.up.railway.app`).

---

## 3. ⚡ Step 3: Deploy Frontend on Vercel

1. Log in to [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** → **Project** → Import your GitHub repository (`AntiDrugQuiz`).
3. Set **Framework Preset** to `Next.js`.
4. Under **Environment Variables**, add the following:
   - `DATABASE_URL` = *(Your Railway PostgreSQL Connection String)*
   - `JWT_SECRET` = `antidrug_club_secret_key_2026_secure`
   - `ADMIN_USERNAME` = `admin_login`
   - `ADMIN_PASSWORD` = `admin@login.123`
   - `NEXT_PUBLIC_APP_URL` = `https://your-vercel-domain.vercel.app`
   - `NEXT_PUBLIC_WS_URL` = `https://anti-drug-backend.up.railway.app` *(Your Railway Domain from Step 2)*
5. Click **Deploy**.

---

## 🧪 Post-Deployment Verification Checklist

- [ ] Visit `https://your-vercel-domain.vercel.app/admin/login`
- [ ] Sign in with `admin_login` / `admin@login.123`
- [ ] Open a separate tab/window to `/register` and register a participant
- [ ] Check `/admin` dashboard to confirm real-time participant count update via WebSockets
- [ ] Click **START QUIZ NOW** in Admin panel and verify live participant redirection to `/quiz`
- [ ] Test tab switching / window blur on `/quiz` and verify real-time malpractice alert in `/admin`
