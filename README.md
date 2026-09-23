# Cavite Crop List Registry

A Google-authenticated data collection portal for updating the list of crops
across the 23 cities and municipalities of Cavite — built for PSA Region IV-A.
It behaves like a restricted Google Form: only email addresses you register
can sign in, every submission is written to a Google Sheet you own, and an
admin dashboard summarizes progress per city/municipality.

- **406 crops**, organized into the same three categories as the source PSA
  worksheet (Non-Food and Industrial Crops, Fruit Crops, Vegetables and Root
  Crops), each markable as Major Produce / Priority / Emerging / Others /
  Discontinue, with optional remarks — mirroring columns (1)–(7) of the
  printed form.
- **Google Sheets as the database.** No separate database to host — responses
  append to a spreadsheet you control.
- **Access control by email**, not a public link. Only accounts you add to
  the `AllowedUsers` tab (or list as admins) can sign in.
- **One shareable link or QR code** for everyone — after sign-in, each
  respondent only sees their assigned city/municipality's list.
- **Admin dashboard** summarizing submissions across all 23 LGUs, with
  per-category totals, a comparison chart, and per-LGU drill-down.

---

## 1. How it works

| Role | What they do |
|---|---|
| **Admin** (you) | Registers respondent emails in the sheet, shares one link/QR, monitors the dashboard. |
| **Respondent** (city/municipal agriculture focal person) | Signs in with their registered Google account, marks their LGU's crop list, submits. |

Each respondent is mapped to exactly one city/municipality in the
`AllowedUsers` tab, so the form always opens pre-scoped to their LGU — there's
no dropdown to pick the wrong one.

---

## 2. One-time setup

### 2.1 Your Google Sheet

This project is already wired to a Cavite crop registry sheet:
`https://docs.google.com/spreadsheets/d/1f_TGptGBNkmoJ2KCwILUSJpRef3j8YxpXOC4BqU_PoE/edit`
— its ID (`1f_TGptGBNkmoJ2KCwILUSJpRef3j8YxpXOC4BqU_PoE`) is already set as the
default in `render.yaml`. Leave the sheet's tabs empty for now — the app
creates `AllowedUsers`, `Responses`, and `Submissions` automatically the
first time an admin opens the dashboard (step 2.5). If you'd rather use a
different sheet, just swap the ID wherever it appears below.

### 2.2 Create a Google Cloud project with OAuth + a service account

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and
   create (or reuse) a project.
2. **Enable the Google Sheets API** (APIs & Services → Library).
3. **OAuth consent screen**: set it up as Internal (if you're on Google
   Workspace) or External. You don't need Google verification for a small
   registered list of users.
4. **OAuth Client ID** (APIs & Services → Credentials → Create Credentials →
   OAuth client ID → Web application):
   - Authorized redirect URI: `https://YOUR-APP.onrender.com/api/auth/callback/google`
     (you'll only know the exact `.onrender.com` subdomain after step 2.4 —
     come back and fill this in once Render assigns it, then redeploy).
   - Also add `http://localhost:3000/api/auth/callback/google` for local testing.
   - Save the **Client ID** and **Client Secret**.
5. **Service account** (APIs & Services → Credentials → Create Credentials →
   Service account): create one, then open it → Keys → Add key → JSON.
   Download the JSON key file. You'll need its `client_email` and
   `private_key`.
6. **Share the Google Sheet** from step 2.1 with the service account's
   `client_email` (found in the JSON key) — open the sheet, click **Share**,
   paste that email, give it **Editor** access.

### 2.3 Push this project to GitHub

If you don't have a repo yet, create an empty one on
[github.com/new](https://github.com/new) (don't initialize it with a README),
then from inside the unzipped `psa-cavite-crop-portal` folder:

```bash
cd psa-cavite-crop-portal
git init
git add .
git commit -m "Initial commit: Cavite Crop List Registry"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/psa-cavite-crop-portal.git
git push -u origin main
```

No `git` on your machine, or prefer not to use the command line? Go to your
new empty repo on GitHub → **Add file → Upload files** → drag the entire
contents of the unzipped folder in → commit. (Skip `node_modules` — it isn't
included in the zip, and Render installs it fresh anyway.)

### 2.4 Deploy on Render

**Option A — Blueprint (recommended):** this repo includes a `render.yaml`
that describes the service for you.

1. Go to [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints) → **New Blueprint Instance**.
2. Connect your GitHub account if you haven't, then pick the
   `psa-cavite-crop-portal` repo. Render reads `render.yaml` and proposes one
   web service.
3. It will prompt you for the env vars marked `sync: false` in
   `render.yaml` — fill in the ones you have so far
   (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
   `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`,
   `ADMIN_EMAILS`). Leave `NEXTAUTH_URL` blank for now — see step 5 below.
   `NEXTAUTH_SECRET` is generated for you automatically.
4. Click **Apply**. Render builds and deploys — this takes a few minutes on
   the free plan's first build.

**Option B — Manual Web Service**, if you'd rather not use the blueprint:

1. [dashboard.render.com/new/web](https://dashboard.render.com/new/web) → connect the repo.
2. **Runtime:** Node. **Build command:** `npm install && npm run build`.
   **Start command:** `npm run start`.
3. Add the environment variables listed in the block below under the
   service's **Environment** tab.
4. Click **Create Web Service**.

**5. Wire up the real URL** — once deployed, Render gives you a domain like
`https://psa-cavite-crop-portal.onrender.com`. Do two things with it:
   - In Render's **Environment** tab, set `NEXTAUTH_URL` to that exact URL
     (no trailing slash), then it will redeploy automatically.
   - Back in Google Cloud (step 2.2.4), edit the OAuth client's authorized
     redirect URI to `https://psa-cavite-crop-portal.onrender.com/api/auth/callback/google`.

> **Free plan note:** Render's free web services spin down after 15 minutes
> of inactivity and take ~30–50 seconds to wake back up on the next visit.
> Fine for a low-traffic internal form; upgrade to a paid instance if your
> respondents need it always warm.

#### Environment variables

Copy `.env.example` to `.env.local` for local dev. In Render, set the same
keys under the service's **Environment** tab:

```
GOOGLE_CLIENT_ID=            # from step 2.2.4
GOOGLE_CLIENT_SECRET=        # from step 2.2.4
NEXTAUTH_SECRET=             # auto-generated by render.yaml, or: openssl rand -base64 32
NEXTAUTH_URL=                # https://psa-cavite-crop-portal.onrender.com (your real Render URL)
GOOGLE_SERVICE_ACCOUNT_EMAIL=      # from the service account JSON, "client_email"
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY= # from the JSON, "private_key" (keep the \n's)
GOOGLE_SHEET_ID=1f_TGptGBNkmoJ2KCwILUSJpRef3j8YxpXOC4BqU_PoE
ADMIN_EMAILS=you@example.gov.ph,colleague@example.gov.ph
```

> **Pasting the private key:** Render's env var fields accept multi-line
> values directly — paste the `private_key` value as-is, including the
> `-----BEGIN PRIVATE KEY-----` / `-----END PRIVATE KEY-----` lines. If you
> end up with it on one line with literal `\n` characters instead, that
> works too — the app converts them back to real newlines automatically.

Any host that runs Next.js server routes works (Render, Vercel, Railway,
your own Node server) — GitHub Pages alone will **not** work, since this app
needs server-side API routes to talk to Google Sheets and keep the service
account key private.

### 2.5 Initialize the sheet and register respondents

1. Sign in at your deployed URL using an email listed in `ADMIN_EMAILS`.
   You'll land on `/admin`.
2. If the dashboard shows a setup message, click **Initialize spreadsheet
   tabs** — this creates `AllowedUsers`, `Responses`, and `Submissions` with
   the right headers.
3. Open the Google Sheet and fill in `AllowedUsers`:

   | email | name | lguSlug | role | status |
   |---|---|---|---|---|
   | juan@example.gov.ph | Juan Dela Cruz | bacoor | respondent | active |
   | maria@example.gov.ph | Maria Santos | tagaytay | respondent | active |

   `lguSlug` must match one of the slugs in `src/lib/lgus.ts` (e.g. `bacoor`,
   `cavite-city`, `dasmarinas`, `general-trias`, `gen-mariano-alvarez`, …).
   Set `status` to `disabled` to revoke access without deleting the row.

4. From the admin dashboard, generate the QR code or copy the link and send
   it to your respondents. Everyone uses the same link.

---

## 3. Local development

```bash
npm install
cp .env.example .env.local   # fill in real values
npm run dev
```

Visit `http://localhost:3000`.

---

## 4. Project structure

```
src/
  app/
    page.tsx                 Sign-in landing page
    form/page.tsx             Respondent's crop-marking form
    admin/page.tsx             Admin dashboard (23-LGU summary)
    admin/lgu/[slug]/page.tsx   Full response detail for one LGU
    api/auth/[...nextauth]/     Google OAuth (NextAuth)
    api/submit/                 Saves a respondent's crop entries
    api/summary/                Admin-only aggregated summary
    api/qr/                     Generates a QR code for the sign-in link
    api/admin/init/             One-time sheet-tab setup
  components/                  UI building blocks
  lib/
    sheets.ts                  All Google Sheets read/write logic
    lgus.ts                     The 23 cities/municipalities
    auth.ts                     NextAuth config + allow-list enforcement
  data/crops.json               406 crops in 3 categories (from the source PSA worksheet)
```

## 5. Notes on the data model

Each submission writes one row per marked crop to `Responses` (so a city that
marks 40 crops adds 40 rows), plus one summary row per LGU in `Submissions`
recording who last submitted and when. Re-submitting replaces that LGU's rows
in `Responses` is **not** automatic — the current version simply appends new
rows each submit, so if you expect respondents to revise their answers over
multiple sessions, periodically dedupe `Responses` by keeping the latest
`timestamp` per `lguSlug` + `cropId`, or extend `submitCropEntries` in
`src/lib/sheets.ts` to delete-then-append. This was kept simple deliberately
so you can adapt the update policy to how your office actually runs revisions.
