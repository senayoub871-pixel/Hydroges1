# How to Deploy DocExchange

This guide shows you step-by-step how to put your app online using **Render** (for the backend + database) and either **Netlify** or **Vercel** (for the frontend website).

---

## Step 1 — Deploy the Backend on Render

The backend is your API server (it handles logins, documents, etc.) and it needs a database.

1. Create a free account at [render.com](https://render.com)
2. Click **New → Blueprint**
3. Connect your GitHub repository
4. Render will read the `render.yaml` file automatically and create:
   - A **web service** for the API (`docexchange-api`)
   - A **PostgreSQL database** (`docexchange-db`)
5. During setup, you will be asked to fill in **CORS_ORIGIN** — leave it blank for now, you'll fill it in after deploying the frontend
6. Click **Apply** and wait for the deployment to finish (takes a few minutes)
7. Once deployed, copy your API URL — it will look like: `https://docexchange-api.onrender.com`

> **Note:** The free Render plan puts your server to sleep after 15 minutes of inactivity. The first request after sleep takes ~30 seconds. Upgrade to a paid plan to avoid this.

---

## Step 2 — Deploy the Frontend on Netlify (Option A)

1. Create a free account at [netlify.com](https://netlify.com)
2. Click **Add new site → Import an existing project**
3. Connect your GitHub repository
4. Netlify will read the `netlify.toml` file automatically
5. Before deploying, go to **Site settings → Environment variables** and add:
   - `VITE_API_URL` = your Render API URL (e.g. `https://docexchange-api.onrender.com`)
6. Click **Deploy site**
7. Once deployed, copy your Netlify URL (e.g. `https://docexchange-abc123.netlify.app`)

---

## Step 2 — Deploy the Frontend on Vercel (Option B)

1. Create a free account at [vercel.com](https://vercel.com)
2. Click **Add New → Project**
3. Import your GitHub repository
4. Vercel will read the `vercel.json` file automatically
5. Before deploying, go to **Environment Variables** and add:
   - `VITE_API_URL` = your Render API URL (e.g. `https://docexchange-api.onrender.com`)
   - `BASE_PATH` = `/`
6. Click **Deploy**
7. Once deployed, copy your Vercel URL (e.g. `https://docexchange.vercel.app`)

---

## Step 3 — Connect Frontend to Backend (CORS)

Now that both are deployed, you need to tell the backend which frontend URL is allowed to talk to it.

1. Go to your Render dashboard → `docexchange-api` service → **Environment**
2. Set `CORS_ORIGIN` to your frontend URL (e.g. `https://docexchange-abc123.netlify.app`)
3. Click **Save Changes** — Render will redeploy automatically

---

## Step 4 — Set Up the Database

You need to create the database tables. Do this once after your first deployment.

Run this command in your Replit terminal (with the production DATABASE_URL from Render):

```bash
DATABASE_URL="your-render-database-url-here" pnpm --filter @workspace/db run push
```

You can find your database URL in the Render dashboard → `docexchange-db` → **Connection** → **External Database URL**.

---

## You're done!

Your app is now live. Share the frontend URL with your users.
