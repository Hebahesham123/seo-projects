const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const MAX_FILE_MB = 20;
const STATUSES = ['todo', 'in_progress', 'review', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];
const CATEGORIES = ['technical', 'on_page', 'content', 'off_page', 'local', 'analytics', 'other'];

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ---------- Database ----------
const db = new DatabaseSync(path.join(__dirname, 'data.db'));
db.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'todo',
    priority TEXT NOT NULL DEFAULT 'medium',
    assignee TEXT DEFAULT '',
    due_date TEXT,
    category TEXT NOT NULL DEFAULT 'other',
    url TEXT DEFAULT '',
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    original_name TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    mime_type TEXT,
    size INTEGER,
    uploaded_by TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Add columns that older databases don't have yet
const taskCols = db.prepare('PRAGMA table_info(tasks)').all().map(c => c.name);
if (!taskCols.includes('category')) db.exec("ALTER TABLE tasks ADD COLUMN category TEXT NOT NULL DEFAULT 'other'");
if (!taskCols.includes('url')) db.exec("ALTER TABLE tasks ADD COLUMN url TEXT DEFAULT ''");
if (!taskCols.includes('completed_at')) db.exec('ALTER TABLE tasks ADD COLUMN completed_at TEXT');

function validateTask(t) {
  if (!t.title) return 'Title is required';
  if (!STATUSES.includes(t.status)) return 'Invalid status';
  if (!PRIORITIES.includes(t.priority)) return 'Invalid priority';
  if (!CATEGORIES.includes(t.category)) return 'Invalid category';
  return null;
}

// ---------- Uploads ----------
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) =>
      cb(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase()),
  }),
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024 },
});

function removeStoredFiles(rows) {
  for (const r of rows) fs.rm(path.join(UPLOAD_DIR, r.stored_name), { force: true }, () => {});
}

// ---------- App ----------
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

const notFound = (res, what) => res.status(404).json({ error: `${what} not found` });

// Projects
app.get('/api/projects', (req, res) => {
  res.json(db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) AS task_count,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') AS done_count
    FROM projects p ORDER BY p.created_at DESC, p.id DESC
  `).all());
});

app.post('/api/projects', (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const r = db.prepare('INSERT INTO projects (name, description) VALUES (?, ?)')
    .run(name, req.body.description || '');
  res.status(201).json(db.prepare('SELECT * FROM projects WHERE id = ?').get(r.lastInsertRowid));
});

app.put('/api/projects/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!p) return notFound(res, 'Project');
  const name = (req.body.name ?? p.name).trim();
  if (!name) return res.status(400).json({ error: 'Name is required' });
  db.prepare('UPDATE projects SET name = ?, description = ? WHERE id = ?')
    .run(name, req.body.description ?? p.description, p.id);
  res.json(db.prepare('SELECT * FROM projects WHERE id = ?').get(p.id));
});

app.delete('/api/projects/:id', (req, res) => {
  const files = db.prepare(`
    SELECT a.stored_name FROM attachments a JOIN tasks t ON t.id = a.task_id WHERE t.project_id = ?
  `).all(req.params.id);
  const r = db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  if (!r.changes) return notFound(res, 'Project');
  removeStoredFiles(files);
  res.status(204).end();
});

// Tasks
app.get('/api/projects/:id/tasks', (req, res) => {
  res.json(db.prepare(`
    SELECT t.*,
      (SELECT COUNT(*) FROM comments c WHERE c.task_id = t.id) AS comment_count,
      (SELECT COUNT(*) FROM attachments a WHERE a.task_id = t.id) AS attachment_count
    FROM tasks t WHERE t.project_id = ? ORDER BY t.created_at DESC, t.id DESC
  `).all(req.params.id));
});

app.post('/api/projects/:id/tasks', (req, res) => {
  if (!db.prepare('SELECT 1 FROM projects WHERE id = ?').get(req.params.id)) return notFound(res, 'Project');
  const t = {
    title: '', description: '', status: 'todo', priority: 'medium', category: 'other',
    assignee: '', due_date: null, url: '', ...req.body,
  };
  t.title = String(t.title).trim();
  const error = validateTask(t);
  if (error) return res.status(400).json({ error });
  const r = db.prepare(`
    INSERT INTO tasks (project_id, title, description, status, priority, category, assignee, due_date, url, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 'done' THEN datetime('now') END)
  `).run(req.params.id, t.title, t.description, t.status, t.priority, t.category, t.assignee,
    t.due_date || null, String(t.url).trim(), t.status);
  res.status(201).json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(r.lastInsertRowid));
});

app.get('/api/tasks/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return notFound(res, 'Task');
  task.comments = db.prepare('SELECT * FROM comments WHERE task_id = ? ORDER BY created_at, id').all(task.id);
  task.attachments = db.prepare('SELECT * FROM attachments WHERE task_id = ? ORDER BY created_at DESC, id DESC').all(task.id);
  res.json(task);
});

app.put('/api/tasks/:id', (req, res) => {
  const t = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!t) return notFound(res, 'Task');
  const next = { ...t, ...req.body };
  next.title = String(next.title || '').trim();
  const error = validateTask(next);
  if (error) return res.status(400).json({ error });
  // completed_at is set when a task moves into Done and cleared when it leaves
  db.prepare(`
    UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, category = ?, assignee = ?,
      due_date = ?, url = ?, updated_at = datetime('now'),
      completed_at = CASE WHEN ? != 'done' THEN NULL WHEN status = 'done' THEN completed_at ELSE datetime('now') END
    WHERE id = ?
  `).run(next.title, next.description || '', next.status, next.priority, next.category, next.assignee || '',
    next.due_date || null, String(next.url || '').trim(), next.status, t.id);
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(t.id));
});

app.delete('/api/tasks/:id', (req, res) => {
  const files = db.prepare('SELECT stored_name FROM attachments WHERE task_id = ?').all(req.params.id);
  const r = db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  if (!r.changes) return notFound(res, 'Task');
  removeStoredFiles(files);
  res.status(204).end();
});

// Reports
app.get('/api/projects/:id/report', (req, res) => {
  const id = req.params.id;
  if (!db.prepare('SELECT 1 FROM projects WHERE id = ?').get(id)) return notFound(res, 'Project');
  // column names below are fixed constants, never user input
  const groupBy = col => db.prepare(`
    SELECT ${col} AS key, COUNT(*) AS count, SUM(status = 'done') AS done
    FROM tasks WHERE project_id = ? GROUP BY ${col}
  `).all(id);
  const overdueWhere = "project_id = ? AND status != 'done' AND due_date IS NOT NULL AND due_date < date('now', 'localtime')";
  res.json({
    total: db.prepare('SELECT COUNT(*) AS n FROM tasks WHERE project_id = ?').get(id).n,
    by_status: groupBy('status'),
    by_priority: groupBy('priority'),
    by_category: groupBy('category'),
    by_assignee: db.prepare(`
      SELECT COALESCE(NULLIF(TRIM(assignee), ''), 'Unassigned') AS key, COUNT(*) AS count, SUM(status = 'done') AS done
      FROM tasks WHERE project_id = ? GROUP BY key ORDER BY count DESC, key
    `).all(id),
    overdue: db.prepare(`SELECT id, title, due_date, assignee, priority FROM tasks WHERE ${overdueWhere} ORDER BY due_date`).all(id),
    completed_7d: db.prepare(`
      SELECT COUNT(*) AS n FROM tasks WHERE project_id = ? AND status = 'done' AND completed_at >= datetime('now', '-7 days')
    `).get(id).n,
    // tasks completed per day over the last 14 days
    completed_daily: db.prepare(`
      SELECT date(completed_at, 'localtime') AS day, COUNT(*) AS count FROM tasks
      WHERE project_id = ? AND status = 'done' AND completed_at >= datetime('now', '-14 days')
      GROUP BY day
    `).all(id),
    activity: db.prepare(`
      SELECT * FROM (
        SELECT 'comment' AS type, c.author AS who, c.body AS detail, c.created_at, t.id AS task_id, t.title AS task_title
        FROM comments c JOIN tasks t ON t.id = c.task_id WHERE t.project_id = ?
        UNION ALL
        SELECT 'file', a.uploaded_by, a.original_name, a.created_at, t.id, t.title
        FROM attachments a JOIN tasks t ON t.id = a.task_id WHERE t.project_id = ?
      ) ORDER BY created_at DESC LIMIT 12
    `).all(id, id),
  });
});

// Comments
app.post('/api/tasks/:id/comments', (req, res) => {
  if (!db.prepare('SELECT 1 FROM tasks WHERE id = ?').get(req.params.id)) return notFound(res, 'Task');
  const author = (req.body.author || '').trim() || 'Anonymous';
  const body = (req.body.body || '').trim();
  if (!body) return res.status(400).json({ error: 'Comment cannot be empty' });
  const r = db.prepare('INSERT INTO comments (task_id, author, body) VALUES (?, ?, ?)').run(req.params.id, author, body);
  res.status(201).json(db.prepare('SELECT * FROM comments WHERE id = ?').get(r.lastInsertRowid));
});

app.delete('/api/comments/:id', (req, res) => {
  const r = db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
  if (!r.changes) return notFound(res, 'Comment');
  res.status(204).end();
});

// Attachments (files & images)
app.post('/api/tasks/:id/attachments', upload.array('files', 10), (req, res) => {
  const files = req.files || [];
  if (!db.prepare('SELECT 1 FROM tasks WHERE id = ?').get(req.params.id)) {
    removeStoredFiles(files.map(f => ({ stored_name: f.filename })));
    return notFound(res, 'Task');
  }
  if (!files.length) return res.status(400).json({ error: 'No files uploaded' });
  const insert = db.prepare(`
    INSERT INTO attachments (task_id, original_name, stored_name, mime_type, size, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const created = files.map(f => {
    // multer decodes filenames as latin1; re-decode so non-English names (e.g. Arabic) survive
    const name = Buffer.from(f.originalname, 'latin1').toString('utf8');
    const r = insert.run(req.params.id, name, f.filename, f.mimetype, f.size, req.body.uploaded_by || '');
    return db.prepare('SELECT * FROM attachments WHERE id = ?').get(r.lastInsertRowid);
  });
  res.status(201).json(created);
});

app.delete('/api/attachments/:id', (req, res) => {
  const a = db.prepare('SELECT * FROM attachments WHERE id = ?').get(req.params.id);
  if (!a) return notFound(res, 'Attachment');
  db.prepare('DELETE FROM attachments WHERE id = ?').run(a.id);
  removeStoredFiles([a]);
  res.status(204).end();
});

// Errors (e.g. file too large)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? `File too large (max ${MAX_FILE_MB} MB)` : err.message;
    return res.status(400).json({ error: msg });
  }
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

app.listen(PORT, () => console.log(`Running at http://localhost:${PORT}`));
