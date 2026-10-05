const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { Pool, types } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const PORT = process.env.PORT || 3000;
const BUCKET = process.env.SUPABASE_BUCKET || 'attachments';
const MAX_FILE_MB = 50;
const SIGNED_URL_TTL = 60 * 60; // seconds that file links stay valid
const STATUSES = ['todo', 'in_progress', 'review', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];
const CATEGORIES = ['technical', 'on_page', 'content', 'off_page', 'local', 'analytics', 'other'];

const REQUIRED_ENV = ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingEnv = REQUIRED_ENV.filter(k => !process.env[k]);

// Return DATE columns as plain 'YYYY-MM-DD' strings instead of JS Dates
types.setTypeParser(1082, v => v);

// ---------- Database (Supabase Postgres) ----------
function connectionString(raw) {
  // pg treats sslmode=require as strict certificate checking, which Supabase's pooler fails;
  // drop it and configure SSL below instead
  try {
    const url = new URL(raw);
    url.searchParams.delete('sslmode');
    return url.toString();
  } catch {
    return raw;
  }
}

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: connectionString(process.env.DATABASE_URL),
      ssl: /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL) ? false : { rejectUnauthorized: false },
      max: 5,
    })
  : null;

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;
const storage = () => supabase.storage.from(BUCKET);

const q = async (sql, params) => (await pool.query(sql, params)).rows;
const one = async (sql, params) => (await q(sql, params))[0];

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'todo',
    priority TEXT NOT NULL DEFAULT 'medium',
    category TEXT NOT NULL DEFAULT 'other',
    assignee TEXT NOT NULL DEFAULT '',
    due_date DATE,
    url TEXT NOT NULL DEFAULT '',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    original_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT '',
    size INTEGER NOT NULL DEFAULT 0,
    uploaded_by TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON tasks(project_id);
  CREATE INDEX IF NOT EXISTS comments_task_id_idx ON comments(task_id);
  CREATE INDEX IF NOT EXISTS attachments_task_id_idx ON attachments(task_id);
  -- The app talks to Postgres directly; RLS with no policies keeps these tables
  -- closed to Supabase's public REST API
  ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
  ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
  ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
`;

// Create tables and the storage bucket once per server instance
let setupPromise = null;
function ensureSetup() {
  setupPromise ??= (async () => {
    await pool.query(SCHEMA);
    const { error } = await supabase.storage.getBucket(BUCKET);
    if (error) {
      const created = await supabase.storage.createBucket(BUCKET, {
        public: false,
        fileSizeLimit: MAX_FILE_MB * 1024 * 1024,
      });
      if (created.error && !/already exists/i.test(created.error.message)) throw created.error;
    }
  })().catch(err => {
    setupPromise = null; // retry on the next request
    const e = new Error(`Could not connect to Supabase: ${err.message}`);
    e.expose = true;
    throw e;
  });
  return setupPromise;
}

async function removeStoredFiles(paths) {
  if (!paths.length) return;
  const { error } = await storage().remove(paths);
  if (error) console.error('Failed to remove files from storage:', error.message);
}

// Add short-lived signed links so private files can be viewed and downloaded
async function withFileUrls(attachments) {
  if (!attachments.length) return attachments;
  const { data, error } = await storage().createSignedUrls(attachments.map(a => a.storage_path), SIGNED_URL_TTL);
  if (error) throw error;
  const byPath = new Map(data.filter(d => d.signedUrl).map(d => [d.path, d.signedUrl]));
  return attachments.map(a => {
    const url = byPath.get(a.storage_path) || null;
    return { ...a, url, download_url: url && `${url}&download=${encodeURIComponent(a.original_name)}` };
  });
}

function validateTask(t) {
  if (!t.title) return 'Title is required';
  if (!STATUSES.includes(t.status)) return 'Invalid status';
  if (!PRIORITIES.includes(t.priority)) return 'Invalid priority';
  if (!CATEGORIES.includes(t.category)) return 'Invalid category';
  return null;
}

// ---------- App ----------
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', async (req, res, next) => {
  if (missingEnv.length) {
    return res.status(500).json({ error: `Server is missing environment variables: ${missingEnv.join(', ')}` });
  }
  await ensureSetup();
  next();
});

const notFound = (res, what) => res.status(404).json({ error: `${what} not found` });
app.param('id', (req, res, next, id) => (/^\d+$/.test(id) ? next() : notFound(res, 'Item')));

// Projects
app.get('/api/projects', async (req, res) => {
  res.json(await q(`
    SELECT p.*,
      (SELECT COUNT(*)::int FROM tasks t WHERE t.project_id = p.id) AS task_count,
      (SELECT COUNT(*)::int FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') AS done_count
    FROM projects p ORDER BY p.created_at DESC, p.id DESC
  `));
});

app.post('/api/projects', async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Name is required' });
  res.status(201).json(await one(
    'INSERT INTO projects (name, description) VALUES ($1, $2) RETURNING *',
    [name, req.body.description || ''],
  ));
});

app.put('/api/projects/:id', async (req, res) => {
  const p = await one('SELECT * FROM projects WHERE id = $1', [req.params.id]);
  if (!p) return notFound(res, 'Project');
  const name = String(req.body.name ?? p.name).trim();
  if (!name) return res.status(400).json({ error: 'Name is required' });
  res.json(await one(
    'UPDATE projects SET name = $1, description = $2 WHERE id = $3 RETURNING *',
    [name, req.body.description ?? p.description, p.id],
  ));
});

app.delete('/api/projects/:id', async (req, res) => {
  const files = await q(`
    SELECT a.storage_path FROM attachments a JOIN tasks t ON t.id = a.task_id WHERE t.project_id = $1
  `, [req.params.id]);
  const deleted = await one('DELETE FROM projects WHERE id = $1 RETURNING id', [req.params.id]);
  if (!deleted) return notFound(res, 'Project');
  await removeStoredFiles(files.map(f => f.storage_path));
  res.status(204).end();
});

// Tasks
app.get('/api/projects/:id/tasks', async (req, res) => {
  res.json(await q(`
    SELECT t.*,
      (SELECT COUNT(*)::int FROM comments c WHERE c.task_id = t.id) AS comment_count,
      (SELECT COUNT(*)::int FROM attachments a WHERE a.task_id = t.id) AS attachment_count
    FROM tasks t WHERE t.project_id = $1 ORDER BY t.created_at DESC, t.id DESC
  `, [req.params.id]));
});

app.post('/api/projects/:id/tasks', async (req, res) => {
  if (!await one('SELECT 1 FROM projects WHERE id = $1', [req.params.id])) return notFound(res, 'Project');
  const t = {
    title: '', description: '', status: 'todo', priority: 'medium', category: 'other',
    assignee: '', due_date: null, url: '', ...req.body,
  };
  t.title = String(t.title).trim();
  const error = validateTask(t);
  if (error) return res.status(400).json({ error });
  res.status(201).json(await one(`
    INSERT INTO tasks (project_id, title, description, status, priority, category, assignee, due_date, url, completed_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CASE WHEN $4 = 'done' THEN now() END)
    RETURNING *
  `, [req.params.id, t.title, t.description || '', t.status, t.priority, t.category, t.assignee || '',
    t.due_date || null, String(t.url || '').trim()]));
});

app.get('/api/tasks/:id', async (req, res) => {
  const task = await one('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
  if (!task) return notFound(res, 'Task');
  const [comments, attachments] = await Promise.all([
    q('SELECT * FROM comments WHERE task_id = $1 ORDER BY created_at, id', [task.id]),
    q('SELECT * FROM attachments WHERE task_id = $1 ORDER BY created_at DESC, id DESC', [task.id]),
  ]);
  res.json({ ...task, comments, attachments: await withFileUrls(attachments) });
});

app.put('/api/tasks/:id', async (req, res) => {
  const t = await one('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
  if (!t) return notFound(res, 'Task');
  const next = { ...t, ...req.body };
  next.title = String(next.title || '').trim();
  const error = validateTask(next);
  if (error) return res.status(400).json({ error });
  // completed_at is set when a task moves into Done and cleared when it leaves
  res.json(await one(`
    UPDATE tasks SET title = $1, description = $2, status = $3, priority = $4, category = $5, assignee = $6,
      due_date = $7, url = $8, updated_at = now(),
      completed_at = CASE WHEN $3 <> 'done' THEN NULL WHEN status = 'done' THEN completed_at ELSE now() END
    WHERE id = $9 RETURNING *
  `, [next.title, next.description || '', next.status, next.priority, next.category, next.assignee || '',
    next.due_date || null, String(next.url || '').trim(), t.id]));
});

app.delete('/api/tasks/:id', async (req, res) => {
  const files = await q('SELECT storage_path FROM attachments WHERE task_id = $1', [req.params.id]);
  const deleted = await one('DELETE FROM tasks WHERE id = $1 RETURNING id', [req.params.id]);
  if (!deleted) return notFound(res, 'Task');
  await removeStoredFiles(files.map(f => f.storage_path));
  res.status(204).end();
});

// Reports
app.get('/api/projects/:id/report', async (req, res) => {
  const id = req.params.id;
  if (!await one('SELECT 1 FROM projects WHERE id = $1', [id])) return notFound(res, 'Project');
  // The browser sends its local date and time zone so "overdue" and "per day" match the viewer
  const today = /^\d{4}-\d{2}-\d{2}$/.test(req.query.today) ? req.query.today : new Date().toISOString().slice(0, 10);
  let tz = String(req.query.tz || 'UTC');
  try { new Intl.DateTimeFormat('en', { timeZone: tz }); } catch { tz = 'UTC'; }

  // column names below are fixed constants, never user input
  const groupBy = col => q(`
    SELECT ${col} AS key, COUNT(*)::int AS count, COUNT(*) FILTER (WHERE status = 'done')::int AS done
    FROM tasks WHERE project_id = $1 GROUP BY ${col}
  `, [id]);

  const [total, byStatus, byPriority, byCategory, byAssignee, overdue, completed7d, completedDaily, activity] = await Promise.all([
    one('SELECT COUNT(*)::int AS n FROM tasks WHERE project_id = $1', [id]),
    groupBy('status'),
    groupBy('priority'),
    groupBy('category'),
    q(`
      SELECT COALESCE(NULLIF(TRIM(assignee), ''), 'Unassigned') AS key,
        COUNT(*)::int AS count, COUNT(*) FILTER (WHERE status = 'done')::int AS done
      FROM tasks WHERE project_id = $1 GROUP BY 1 ORDER BY count DESC, key
    `, [id]),
    q(`
      SELECT id, title, due_date, assignee, priority FROM tasks
      WHERE project_id = $1 AND status <> 'done' AND due_date IS NOT NULL AND due_date < $2::date
      ORDER BY due_date
    `, [id, today]),
    one(`
      SELECT COUNT(*)::int AS n FROM tasks
      WHERE project_id = $1 AND status = 'done' AND completed_at >= now() - interval '7 days'
    `, [id]),
    // tasks completed per day over the last 14 days, in the viewer's time zone
    q(`
      SELECT to_char(completed_at AT TIME ZONE $2, 'YYYY-MM-DD') AS day, COUNT(*)::int AS count FROM tasks
      WHERE project_id = $1 AND status = 'done' AND completed_at >= now() - interval '14 days'
      GROUP BY 1
    `, [id, tz]),
    q(`
      SELECT * FROM (
        SELECT 'comment' AS type, c.author AS who, c.body AS detail, c.created_at, t.id AS task_id, t.title AS task_title
        FROM comments c JOIN tasks t ON t.id = c.task_id WHERE t.project_id = $1
        UNION ALL
        SELECT 'file', a.uploaded_by, a.original_name, a.created_at, t.id, t.title
        FROM attachments a JOIN tasks t ON t.id = a.task_id WHERE t.project_id = $1
      ) activity ORDER BY created_at DESC LIMIT 12
    `, [id]),
  ]);

  res.json({
    total: total.n,
    by_status: byStatus,
    by_priority: byPriority,
    by_category: byCategory,
    by_assignee: byAssignee,
    overdue,
    completed_7d: completed7d.n,
    completed_daily: completedDaily,
    activity,
  });
});

// Comments
app.post('/api/tasks/:id/comments', async (req, res) => {
  if (!await one('SELECT 1 FROM tasks WHERE id = $1', [req.params.id])) return notFound(res, 'Task');
  const author = String(req.body.author || '').trim() || 'Anonymous';
  const body = String(req.body.body || '').trim();
  if (!body) return res.status(400).json({ error: 'Comment cannot be empty' });
  res.status(201).json(await one(
    'INSERT INTO comments (task_id, author, body) VALUES ($1, $2, $3) RETURNING *',
    [req.params.id, author, body],
  ));
});

app.delete('/api/comments/:id', async (req, res) => {
  const deleted = await one('DELETE FROM comments WHERE id = $1 RETURNING id', [req.params.id]);
  if (!deleted) return notFound(res, 'Comment');
  res.status(204).end();
});

// Attachments: the browser uploads straight to Supabase Storage with a signed URL
// (this keeps large files out of the server, which has a small request size limit on Vercel)
app.post('/api/tasks/:id/attachments/sign', async (req, res) => {
  if (!await one('SELECT 1 FROM tasks WHERE id = $1', [req.params.id])) return notFound(res, 'Task');
  const size = Number(req.body.size) || 0;
  if (size > MAX_FILE_MB * 1024 * 1024) return res.status(400).json({ error: `File too large (max ${MAX_FILE_MB} MB)` });
  const ext = path.extname(String(req.body.name || '')).toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 10);
  const storagePath = `tasks/${req.params.id}/${crypto.randomUUID()}${ext}`;
  const { data, error } = await storage().createSignedUploadUrl(storagePath);
  if (error) throw error;
  res.json({ path: storagePath, upload_url: data.signedUrl });
});

app.post('/api/tasks/:id/attachments', async (req, res) => {
  const taskId = req.params.id;
  if (!await one('SELECT 1 FROM tasks WHERE id = $1', [taskId])) return notFound(res, 'Task');
  const storagePath = String(req.body.path || '');
  if (!storagePath.startsWith(`tasks/${taskId}/`) || storagePath.includes('..')) {
    return res.status(400).json({ error: 'Invalid file path' });
  }
  // Make sure the upload actually reached storage before recording it
  const { error } = await storage().createSignedUrl(storagePath, 60);
  if (error) return res.status(400).json({ error: 'Uploaded file not found in storage' });
  const row = await one(`
    INSERT INTO attachments (task_id, original_name, storage_path, mime_type, size, uploaded_by)
    VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
  `, [taskId, String(req.body.name || 'file'), storagePath, String(req.body.type || ''),
    Number(req.body.size) || 0, String(req.body.uploaded_by || '')]);
  res.status(201).json((await withFileUrls([row]))[0]);
});

app.delete('/api/attachments/:id', async (req, res) => {
  const a = await one('DELETE FROM attachments WHERE id = $1 RETURNING storage_path', [req.params.id]);
  if (!a) return notFound(res, 'Attachment');
  await removeStoredFiles([a.storage_path]);
  res.status(204).end();
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.expose ? err.message : 'Server error' });
});

// Vercel imports the app; locally `npm start` runs it as a normal server
module.exports = app;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Running at http://localhost:${PORT}`));
}
