# 🚀 Production Deployment Guide: Vercel + Railway + PostgreSQL

This guide walks you through deploying the **Anti-Drug Club Quiz Competition Platform** with **Vercel** (Frontend Next.js app) and **Railway** (Backend Express WebSocket server + PostgreSQL database).

---

## 🔑 Default Admin Credentials
- **Username**: `admin_login`
- **Password**: `admin@login.123`

---

## 1. 🗄️ Database & WebSocket Server Deployment (Railway)

### Step 1.1: Provision PostgreSQL Database on Railway
1. Go to [Railway Dashboard](https://railway.app) and create a **New Project**.
2. Click **Add Plugin / Service** → Select **PostgreSQL**.
3. Once created, copy the connection string under **Variables** -> `DATABASE_URL`.

### Step 1.2: Switch Prisma Schema to PostgreSQL
In `prisma/schema.prisma`, update the datasource provider:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Step 1.3: Deploy Custom Server on Railway
1. Connect your GitHub repository to Railway.
2. Select the repository and add a **Web Service**.
3. Set the **Start Command**:
   ```bash
   npx prisma db push && node --loader ts-node/register prisma/seed.ts && npm start
   ```
4. Set Environment Variables in Railway:
   - `DATABASE_URL` = *(Your Railway PostgreSQL Connection String)*
   - `JWT_SECRET` = `antidrug_club_secret_key_2026_secure`
   - `ADMIN_USERNAME` = `admin_login`
   - `ADMIN_PASSWORD` = `admin@login.123`
   - `NODE_ENV` = `production`
5. Railway will deploy your app on a URL (e.g. `https://your-backend.up.railway.app`).

---

## 2. ⚡ Frontend Deployment (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com) → **New Project**.
2. Import your GitHub repository.
3. Set **Framework Preset** to `Next.js`.
4. Set **Environment Variables**:
   - `DATABASE_URL` = *(Your Railway PostgreSQL Connection String)*
   - `JWT_SECRET` = `antidrug_club_secret_key_2026_secure`
   - `ADMIN_USERNAME` = `admin_login`
   - `ADMIN_PASSWORD` = `admin@login.123`
   - `NEXT_PUBLIC_APP_URL` = `https://your-app.vercel.app`
   - `NEXT_PUBLIC_WS_URL` = `https://your-backend.up.railway.app`
5. Click **Deploy**.

---

## 🧪 Post-Deployment Verification Checklist
- [ ] Visit `https://your-app.vercel.app/admin/login`
- [ ] Click **Autofill** (`admin_login` / `admin@login.123`) & click **Sign In**
- [ ] Register a test participant at `/register`
- [ ] Verify that the Admin Dashboard (`/admin`) updates the waiting room count in real-time
- [ ] Click **START QUIZ NOW** in Admin panel and verify participants are redirected live to `/quiz`
