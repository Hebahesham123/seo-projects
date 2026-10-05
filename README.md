# SEO Tasks & Reports

An app for managing SEO work across websites or clients.

- **Projects:** one for each website or client. The sidebar shows each project's progress.
- **Board:** tasks in 4 columns: To Do, In Progress, Review and Done. Drag a card to another column to change its status.
  - Each task has an **SEO category** (Technical, On-Page, Content, Off-Page / Links, Local, Analytics, Other), a priority, an assignee, a due date and a **target URL**.
  - Filter by search text, category or priority.
- **Task panel:** changes save automatically. You can also add comments and attach files or images (browse, drag and drop, or paste a screenshot with Ctrl+V). The limit is 50 MB per file.
- **Reports** for each project:
  - Totals and completion %
  - Tasks done in the last 7 and 14 days
  - Overdue tasks
  - Status breakdown, open tasks by priority, tasks by SEO category
  - Tasks completed per day
  - Team workload and recent activity
  - **Print / Save as PDF** to send to a client
- Light and dark mode, and a layout that works on mobile.

## Stack

- **Backend:** Node.js and Express. Runs as a Vercel function or as a normal server.
- **Database:** Supabase Postgres. The tables are created automatically the first time the app runs.
- **Files:** Supabase Storage, in a private bucket (`attachments`) that is created automatically. Browsers upload files straight to Supabase using signed URLs, so uploads don't hit Vercel's request size limit.
- **Frontend:** plain HTML, CSS and JS in `public/`.

## 1. Set up Supabase

1. Create a project at https://supabase.com.
2. Get these 3 values:
   - **DATABASE_URL:** click **Connect** at the top of the dashboard → **Transaction pooler** → copy the URI. It uses port `6543`. Replace `[YOUR-PASSWORD]` with your database password.
   - **SUPABASE_URL:** **Project Settings → API** → Project URL.
   - **SUPABASE_SERVICE_ROLE_KEY:** **Project Settings → API keys** → the `service_role` key (or the **secret** key). This key has full access: keep it on the server only.

You don't need to run any SQL. The app creates the tables and the storage bucket on its first request.

## 2. Deploy to Vercel

1. Import this GitHub repo in Vercel. The framework is detected as **Express**.
2. In **Settings → Environment Variables**, add `DATABASE_URL`, `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
3. Deploy, or redeploy if the project already exists. Environment variables only take effect on a new deployment.

## Run locally

```bash
npm install
cp .env.example .env   # then fill in the 3 values
npm start
```

Then open http://localhost:3000. To use a different port, set `PORT` (for example `PORT=4000` in `.env`).

## Security note

The app has no login yet. Anyone who can open the URL can see, edit and delete everything. Add authentication before sharing the URL widely.

## API

| Method | Path | |
|---|---|---|
| GET/POST | `/api/projects` | List / create projects |
| PUT/DELETE | `/api/projects/:id` | Update / delete project |
| GET | `/api/projects/:id/report` | Report data for a project (`?today=YYYY-MM-DD&tz=Area/City`) |
| GET/POST | `/api/projects/:id/tasks` | List / create tasks |
| GET/PUT/DELETE | `/api/tasks/:id` | Task details (with comments and signed file links) / update / delete |
| POST | `/api/tasks/:id/comments` | Add comment `{author, body}` |
| DELETE | `/api/comments/:id` | Delete comment |
| POST | `/api/tasks/:id/attachments/sign` | Get a signed upload URL `{name, size, type}` |
| POST | `/api/tasks/:id/attachments` | Record an uploaded file `{path, name, size, type, uploaded_by}` |
| DELETE | `/api/attachments/:id` | Delete attachment |
