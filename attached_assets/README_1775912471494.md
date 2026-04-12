# HYDROGES — Supabase Shared Database Setup Guide

## Why Supabase?

**Supabase** (https://supabase.com) is the recommended shared database platform for linking HYDROGES and the public citizen portal. It provides:

- A free-tier **PostgreSQL** database accessible from any website
- Built-in **REST API** — no extra backend needed for the public portal
- **File Storage** for PDF and photo attachment uploads
- **Row-Level Security (RLS)** — citizens can only INSERT, HYDROGES staff gets full access
- **CORS support** out of the box

---

## Complete Table Overview

The `schema.sql` file in this folder creates **all 4 tables** that HYDROGES runs on:

| Table | Purpose | Who writes | Who reads/updates |
|---|---|---|---|
| `users` | HYDROGES internal staff accounts | HYDROGES backend | HYDROGES backend only |
| `documents` | Internal document exchange between staff | HYDROGES backend | HYDROGES backend only |
| `claims` | Citizen complaints from public portal | Public (anon) | HYDROGES staff |
| `market` | Project offers from public portal | Public (anon) | HYDROGES staff |

---

## Step-by-Step Setup

### 1. Create a Supabase Project
1. Go to https://supabase.com and create a free account
2. Click **New Project** — name it `hydroges`, set a strong password, choose **EU (Frankfurt)** region (closest to Algeria)
3. Wait ~2 minutes for the project to initialize

### 2. Run the Complete Schema
1. In your Supabase project, go to **SQL Editor**
2. Paste the **entire content** of `schema.sql` and click **Run**
3. All 4 tables, security policies, and triggers will be created

### 3. Create the Storage Bucket (for file uploads)
1. Go to **Storage** in the Supabase dashboard
2. Click **New Bucket**, name it `attachments`, enable **Public**
3. Return to SQL Editor, uncomment and run the storage policy block at the bottom of `schema.sql`

### 4. Get your API Keys
Go to **Settings → API** in your Supabase project:

| Variable | Where to find | Used by |
|---|---|---|
| `SUPABASE_URL` | "Project URL" | Both sites |
| `SUPABASE_ANON_KEY` | "anon public" key | Public portal only |
| `SUPABASE_SERVICE_KEY` | "service_role" secret key | HYDROGES backend only — never in browser |

---

## HYDROGES App Configuration

Add these to your **Replit Secrets** for the HYDROGES backend:

```
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

The HYDROGES backend uses the `service_role` key which bypasses all RLS — giving full read/write access to all 4 tables including `users` and `documents`.

> **Security note:** The `service_role` key must NEVER be exposed in browser code or the public portal. Keep it only in HYDROGES backend environment variables.

---

## Public Portal Configuration

The **public citizen site** uses only the `SUPABASE_ANON_KEY`. Thanks to RLS policies, it can only INSERT into `claims` and `market` — it cannot see `users`, `documents`, or other people's submissions.

### Environment file for the public portal (`.env`):
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Install the Supabase JS client:
```bash
npm install @supabase/supabase-js
```

### Submit a claim (public portal example):
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// 1. Upload attachment (optional)
async function uploadFile(file) {
  const path = `claims/${Date.now()}_${file.name}`
  const { error } = await supabase.storage
    .from('attachments')
    .upload(path, file)
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage
    .from('attachments')
    .getPublicUrl(path)
  return { url: publicUrl, name: file.name }
}

// 2. Submit the claim
async function submitClaim(form, file) {
  let attachmentUrl = null
  let attachmentName = null

  if (file) {
    const att = await uploadFile(file)
    attachmentUrl = att.url
    attachmentName = att.name
  }

  const { data, error } = await supabase
    .from('claims')
    .insert({
      first_name: form.firstName,
      last_name: form.lastName,
      wilaya: form.wilaya,
      commune: form.commune,
      complaint: form.complaint,
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
    })

  if (error) throw error
  return data
}
```

### Submit a project offer (public portal example):
```javascript
async function submitOffer(form, file) {
  let attachmentUrl = null
  let attachmentName = null

  if (file) {
    const path = `market/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(path, file)
    if (uploadError) throw uploadError
    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(path)
    attachmentUrl = publicUrl
    attachmentName = file.name
  }

  const { data, error } = await supabase
    .from('market')
    .insert({
      first_name: form.firstName,
      last_name: form.lastName,
      email: form.email,
      phone: form.phone,
      wilaya: form.wilaya,
      commune: form.commune,
      project_title: form.projectTitle,
      project_type: form.projectType,
      project_description: form.projectDescription,
      budget: form.budget,
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
    })

  if (error) throw error
  return data
}
```

---

## Architecture

```
┌──────────────────────────┐         ┌──────────────────────────┐
│     Public Portal        │  INSERT │                          │
│   (citizen-facing site)  │────────▶│       Supabase DB        │
│   Uses: ANON key         │         │      (PostgreSQL)         │
│   Can access:            │         │                          │
│   • claims (insert)      │         │  ┌─────────────────────┐ │
│   • market (insert)      │         │  │ users               │ │
│   • attachments storage  │         │  │ documents           │ │
└──────────────────────────┘         │  │ claims         ◀────┼─┤ public INSERT
                                     │  │ market         ◀────┼─┤ public INSERT
┌──────────────────────────┐         │  └─────────────────────┘ │
│     HYDROGES App         │  FULL   │                          │
│   (this app — staff)     │◀───────▶│  Storage: attachments    │
│   Uses: SERVICE_ROLE key │  ACCESS │                          │
│   Can access ALL tables  │         └──────────────────────────┘
└──────────────────────────┘
```

---

## Recommended Hosting for the Public Portal

| Platform | Free Tier | Best For |
|---|---|---|
| **Vercel** | Unlimited projects | React / Next.js apps — deploy with one command |
| **Netlify** | 100 GB/month | Vite / React — drag-and-drop or Git deploy |
| **Cloudflare Pages** | Unlimited requests | Fastest globally, free custom domain |

Since the public portal only calls Supabase directly from the browser (no server needed), any static host works perfectly.
