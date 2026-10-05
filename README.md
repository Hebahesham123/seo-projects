# SEO Tasks & Reports

An app for managing SEO work across websites or clients.

- **Projects:** one for each website or client. The sidebar shows each project's progress.
- **Board:** tasks in 4 columns: To Do, In Progress, Review and Done. Drag a card to another column to change its status.
  - Each task has an **SEO category** (Technical, On-Page, Content, Off-Page / Links, Local, Analytics, Other), a priority, an assignee, a due date and a **target URL**.
  - Filter by search text, category or priority.
- **Task panel:** changes save automatically. You can also add comments and attach files or images (browse, drag and drop, or paste a screenshot with Ctrl+V). The limit is 20 MB per file.
- **Reports** for each project:
  - Totals and completion %
  - Tasks done in the last 7 and 14 days
  - Overdue tasks
  - Status breakdown, open tasks by priority, tasks by SEO category
  - Tasks completed per day
  - Team workload and recent activity
  - **Print / Save as PDF** to send to a client
- Light and dark mode, and a layout that works on mobile.

## Run

```bash
npm install
npm start
```

Then open http://localhost:3000. To use a different port, set `PORT` first (PowerShell: `$env:PORT=4000; npm start`).

## Stack

- Node.js 22.13 or newer, Express, Multer
- SQLite through Node's built-in `node:sqlite` (stored in `data.db`; older databases are upgraded automatically)
- Uploaded files go in `uploads/`
- Plain HTML, CSS and JS frontend in `public/`

## API

| Method | Path | |
|---|---|---|
| GET/POST | `/api/projects` | List / create projects |
| PUT/DELETE | `/api/projects/:id` | Update / delete project |
| GET | `/api/projects/:id/report` | Report data for a project |
| GET/POST | `/api/projects/:id/tasks` | List / create tasks |
| GET/PUT/DELETE | `/api/tasks/:id` | Task details (with comments and attachments) / update / delete |
| POST | `/api/tasks/:id/comments` | Add comment `{author, body}` |
| DELETE | `/api/comments/:id` | Delete comment |
| POST | `/api/tasks/:id/attachments` | Upload (multipart, field `files`) |
| DELETE | `/api/attachments/:id` | Delete attachment |
