# 🚀 Production Deployment Guide: Vercel + Render.com + PostgreSQL

This guide provides exact step-by-step instructions to deploy the **Anti-Drug Club Quiz Competition Platform** with:
- **Frontend & Next.js API Routes** on **Vercel**
- **Real-time WebSocket Server & PostgreSQL Database** on **Render.com**

---

## 🔑 Default Admin Credentials
- **Username**: `admin_login`
- **Password**: `admin@login.123`

---

## 1. 🟣 Step 1: Deploy Backend & PostgreSQL Database on Render.com

Render provides a 1-click **Blueprint** setup using the `render.yaml` file included in this repository.

### Option A: One-Click Blueprint Setup (Recommended)
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → Select **Blueprint**.
3. Connect your GitHub repository (`zakwan-haaziq-2006/AntiDrugQuiz`).
4. Render will automatically detect `render.yaml` and prompt you to create:
   - 🗄️ **PostgreSQL Database** (`anti-drug-db`)
   - ⚡ **Web Service** (`anti-drug-backend`)
5. Click **Apply**.
6. Once the build finishes, copy your Web Service URL (e.g. `https://anti-drug-backend.onrender.com`).

---

### Option B: Manual Setup on Render
If you prefer setting up services manually:
1. **Create Database**:
   - Click **New +** → **PostgreSQL**.
   - Name: `anti-drug-db`, Database: `antidrugquiz`.
   - Copy the **Internal Database URL**.
2. **Create Web Service**:
   - Click **New +** → **Web Service** → Connect `AntiDrugQuiz` repo.
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npx prisma db push && npx ts-node prisma/seed.ts && npm start`
   - **Environment Variables**:
     - `DATABASE_URL` = *(Your Render Internal Database URL)*
     - `JWT_SECRET` = `antidrug_club_secret_key_2026_secure`
     - `ADMIN_USERNAME` = `admin_login`
     - `ADMIN_PASSWORD` = `admin@login.123`
     - `NODE_ENV` = `production`

---

## 2. ⚡ Step 2: Deploy Frontend on Vercel

1. Log in to [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** → **Project** → Import your GitHub repository (`AntiDrugQuiz`).
3. Set **Framework Preset** to `Next.js`.
4. Under **Environment Variables**, add:
   - `DATABASE_URL` = *(Your Render External Database URL)*
   - `JWT_SECRET` = `antidrug_club_secret_key_2026_secure`
   - `ADMIN_USERNAME` = `admin_login`
   - `ADMIN_PASSWORD` = `admin@login.123`
   - `NEXT_PUBLIC_APP_URL` = `https://your-vercel-domain.vercel.app`
   - `NEXT_PUBLIC_WS_URL` = `https://anti-drug-backend.onrender.com` *(Your Render Service URL from Step 1)*
5. Click **Deploy**.

---

## 🧪 Post-Deployment Verification Checklist

- [ ] Visit `https://your-vercel-domain.vercel.app/admin/login`
- [ ] Sign in with `admin_login` / `admin@login.123`
- [ ] Open a separate window to `/register` and register a test participant
- [ ] Verify `/admin` dashboard updates waiting room count live via WebSockets
- [ ] Click **START QUIZ NOW** in Admin panel and verify live participant redirection to `/quiz`
