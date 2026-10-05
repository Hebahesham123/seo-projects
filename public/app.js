// ---------- Constants ----------
const STATUSES = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
];
const PRIORITIES = [
  { key: 'high', label: 'High' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
];
const CATEGORIES = [
  { key: 'technical', label: 'Technical SEO' },
  { key: 'on_page', label: 'On-Page' },
  { key: 'content', label: 'Content' },
  { key: 'off_page', label: 'Off-Page / Links' },
  { key: 'local', label: 'Local SEO' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'other', label: 'Other' },
];
const label = (list, key) => list.find(x => x.key === key)?.label ?? key;

// Swatch/avatar colors: all keep white text readable
const SWATCHES = ['#4f46e5', '#0e7490', '#047857', '#b45309', '#be185d', '#7c3aed', '#1d4ed8', '#b91c1c'];
const colorFor = str => {
  let h = 0;
  for (const ch of String(str)) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return SWATCHES[h % SWATCHES.length];
};
const initials = name => String(name).trim().split(/\s+/).slice(0, 2).map(w => [...w][0]).join('').toUpperCase() || '?';

const ICONS = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  clip: '<path d="m21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l8.6-8.6a4 4 0 1 1 5.7 5.7l-8.6 8.6a2 2 0 0 1-2.8-2.8l8.5-8.5"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  board: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 16v-4M12 16V8M17 16v-7"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/>',
  alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
  checkCircle: '<path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="m22 4-10 10-3-3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  trending: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  circle: '<circle cx="12" cy="12" r="9"/>',
  tag: '<path d="M12 2H2v10l9.3 9.3a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4Z"/><circle cx="7" cy="7" r="1.5"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  printer: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7Z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
};
const icon = name => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;
const hydrateIcons = (root = document) =>
  root.querySelectorAll('i[data-icon]').forEach(el => { el.outerHTML = icon(el.dataset.icon); });

// ---------- State & helpers ----------
const state = {
  projects: [], currentProject: null, tasks: [], currentTask: null,
  view: 'board', filters: { search: '', category: '', priority: '' },
};
const $ = sel => document.querySelector(sel);
const store = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

async function api(url, options = {}) {
  const opts = { ...options };
  if (opts.body && !(opts.body instanceof FormData)) {
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = JSON.stringify(opts.body);
  }
  const res = await fetch(url, opts);
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${icon(type === 'error' ? 'alert' : 'check')}<span>${esc(msg)}</span>`;
  $('#toasts').append(el);
  setTimeout(() => el.remove(), 2800);
}
const fail = e => toast(e.message, 'error');

// SQLite stores UTC "YYYY-MM-DD HH:MM:SS"
const parseUtc = s => new Date(s.replace(' ', 'T') + 'Z');
function timeAgo(s) {
  const sec = (Date.now() - parseUtc(s)) / 1000;
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return parseUtc(s).toLocaleDateString();
}
const localDay = (d = new Date()) => d.toLocaleDateString('en-CA'); // YYYY-MM-DD
const fmtDue = d => new Date(d + 'T00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const fmtSize = b => (b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB');
const isOverdue = t => t.due_date && t.status !== 'done' && t.due_date < localDay();
const userName = () => $('#userName').value.trim() || 'Anonymous';
const safeUrl = u => (!u ? '' : /^https?:\/\//i.test(u) ? u : 'https://' + u);
const shortUrl = u => String(u).replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
const avatar = (name, cls = '') => `<span class="avatar ${cls}" style="background:${colorFor(name)}" title="${esc(name)}">${esc(initials(name))}</span>`;

function fileBadge(name, mime = '') {
  const ext = (name.split('.').pop() || 'file').slice(0, 4).toUpperCase();
  const color = /pdf/.test(mime) ? '#b91c1c'
    : /word|document/.test(mime) ? '#1d4ed8'
    : /sheet|excel|csv/.test(mime) ? '#047857'
    : /zip|compressed/.test(mime) ? '#b45309'
    : /video|audio/.test(mime) ? '#7c3aed' : '#475569';
  return `<span class="ext" style="background:${color}">${esc(ext)}</span>`;
}

function fillSelect(sel, items, placeholder) {
  sel.innerHTML = (placeholder ? `<option value="">${placeholder}</option>` : '') +
    items.map(i => `<option value="${i.key}">${i.label}</option>`).join('');
}

// ---------- Projects ----------
async function loadProjects() {
  state.projects = await api('/api/projects');
  if (state.currentProject) state.currentProject = state.projects.find(p => p.id === state.currentProject.id) || null;
  renderProjects();
}

function renderProjects() {
  $('#projectList').innerHTML = state.projects.map(p => {
    const pct = p.task_count ? Math.round((p.done_count / p.task_count) * 100) : 0;
    return `<li data-id="${p.id}" class="${state.currentProject?.id === p.id ? 'active' : ''}" title="${esc(p.name)}">
      <span class="swatch" style="background:${colorFor(p.name)}">${esc(initials(p.name))}</span>
      <div class="p-main">
        <div class="p-name">${esc(p.name)}</div>
        <div class="p-bar"><div style="width:${pct}%"></div></div>
      </div>
      <span class="p-count">${p.done_count}/${p.task_count}</span>
    </li>`;
  }).join('') || '<li class="p-empty">No projects yet</li>';
}

async function selectProject(id) {
  state.currentProject = state.projects.find(p => p.id === id) || null;
  if (id) store.set('lastProject', id);
  renderProjects();
  $('#sidebar').classList.remove('open');
  $('#emptyState').hidden = !!state.currentProject;
  $('#projectView').hidden = !state.currentProject;
  if (!state.currentProject) return;
  renderProjectHeader();
  await loadTasks();
}

function renderProjectHeader() {
  const p = state.currentProject;
  $('#projectName').textContent = p.name;
  $('#projectDesc').textContent = p.description || 'No description';
  $('#projectSwatch').textContent = initials(p.name);
  $('#projectSwatch').style.background = colorFor(p.name);
  document.title = `${p.name} · SEO Tasks & Reports`;
}

function openProjectDialog(project) {
  const f = $('#projectForm');
  f.reset();
  f.dataset.id = project?.id || '';
  $('#projectDialogTitle').textContent = project ? 'Edit project' : 'New project';
  if (project) { f.name.value = project.name; f.description.value = project.description; }
  $('#projectDialog').showModal();
}

$('#projectDialog').addEventListener('close', async () => {
  if ($('#projectDialog').returnValue !== 'save') return;
  const f = $('#projectForm');
  const body = { name: f.name.value, description: f.description.value };
  try {
    const p = f.dataset.id
      ? await api(`/api/projects/${f.dataset.id}`, { method: 'PUT', body })
      : await api('/api/projects', { method: 'POST', body });
    await loadProjects();
    await selectProject(p.id);
    toast(f.dataset.id ? 'Project updated' : 'Project created');
  } catch (e) { fail(e); }
});

// ---------- Views ----------
function setView(view) {
  state.view = view;
  store.set('view', view);
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === view));
  $('#board').hidden = view !== 'board';
  $('#filters').hidden = view !== 'board';
  $('#reports').hidden = view !== 'reports';
  if (view === 'reports') loadReport();
  else renderBoard();
}

async function loadTasks() {
  state.tasks = await api(`/api/projects/${state.currentProject.id}/tasks`);
  if (state.view === 'reports') loadReport();
  else renderBoard();
}

async function refreshAfterTaskChange() {
  await Promise.all([loadTasks(), loadProjects()]);
}

// ---------- Board ----------
function renderBoard() {
  const { search, category, priority } = state.filters;
  const q = search.toLowerCase();
  const visible = state.tasks.filter(t =>
    (!category || t.category === category) &&
    (!priority || t.priority === priority) &&
    (!q || [t.title, t.description, t.assignee, t.url].some(v => (v || '').toLowerCase().includes(q))));

  $('#board').innerHTML = STATUSES.map(s => {
    const tasks = visible.filter(t => t.status === s.key);
    return `<div class="column" data-status="${s.key}">
      <div class="column-head">
        <span class="dot" style="background:var(--st-${s.key})"></span>${s.label}
        <span class="n">${tasks.length}</span>
        <button class="icon-btn add" data-add="${s.key}" title="Add task to ${s.label}" aria-label="Add task to ${s.label}">${icon('plus')}</button>
      </div>
      ${tasks.map(cardHtml).join('') || `<div class="column-empty">${state.tasks.length ? 'No matching tasks' : 'No tasks yet'}</div>`}
    </div>`;
  }).join('');
}

function cardHtml(t) {
  const due = t.status === 'done' && t.completed_at
    ? `<span class="done-date">${icon('checkCircle')}${fmtDue(localDay(parseUtc(t.completed_at)))}</span>`
    : t.due_date ? `<span class="${isOverdue(t) ? 'overdue' : ''}" title="${isOverdue(t) ? 'Overdue' : 'Due date'}">${icon('calendar')}${fmtDue(t.due_date)}</span>` : '';
  return `<div class="card" draggable="true" data-id="${t.id}">
    <div class="card-top">
      <span class="chip" style="--c:var(--cat-${t.category})">${label(CATEGORIES, t.category)}</span>
      <span class="prio ${t.priority}">${icon('flag')}${t.priority}</span>
    </div>
    <div class="card-title">${esc(t.title)}</div>
    ${t.url ? `<div class="card-url">${icon('link')}${esc(shortUrl(t.url))}</div>` : ''}
    <div class="card-foot">
      <div class="card-meta">
        ${due}
        ${t.comment_count ? `<span title="Comments">${icon('message')}${t.comment_count}</span>` : ''}
        ${t.attachment_count ? `<span title="Files">${icon('clip')}${t.attachment_count}</span>` : ''}
      </div>
      ${t.assignee ? avatar(t.assignee, 'sm') : ''}
    </div>
  </div>`;
}

// Drag & drop between columns to change status
const board = $('#board');
board.addEventListener('dragstart', e => {
  const card = e.target.closest('.card');
  if (!card) return;
  e.dataTransfer.setData('text/plain', card.dataset.id);
  card.classList.add('dragging');
});
board.addEventListener('dragend', e => e.target.closest('.card')?.classList.remove('dragging'));
board.addEventListener('dragover', e => {
  const col = e.target.closest('.column');
  if (!col) return;
  e.preventDefault();
  board.querySelectorAll('.column.drag-over').forEach(c => c !== col && c.classList.remove('drag-over'));
  col.classList.add('drag-over');
});
board.addEventListener('dragleave', e => {
  const col = e.target.closest('.column');
  if (col && !col.contains(e.relatedTarget)) col.classList.remove('drag-over');
});
board.addEventListener('drop', async e => {
  const col = e.target.closest('.column');
  if (!col) return;
  e.preventDefault();
  col.classList.remove('drag-over');
  const id = Number(e.dataTransfer.getData('text/plain'));
  const task = state.tasks.find(t => t.id === id);
  if (!task || task.status === col.dataset.status) return;
  task.status = col.dataset.status; // optimistic
  renderBoard();
  try {
    await api(`/api/tasks/${id}`, { method: 'PUT', body: { status: col.dataset.status } });
    toast(`Moved to ${label(STATUSES, col.dataset.status)}`);
  } catch (err) { fail(err); }
  refreshAfterTaskChange();
});
board.addEventListener('click', e => {
  const add = e.target.closest('[data-add]');
  if (add) return openNewTask(add.dataset.add);
  const card = e.target.closest('.card');
  if (card) openTask(Number(card.dataset.id));
});

function openNewTask(status = 'todo') {
  const f = $('#taskForm');
  f.reset();
  f.status.value = status;
  f.priority.value = 'medium';
  f.category.value = state.filters.category || 'technical';
  $('#taskDialog').showModal();
}

$('#taskDialog').addEventListener('close', async () => {
  if ($('#taskDialog').returnValue !== 'save') return;
  const body = Object.fromEntries(new FormData($('#taskForm')));
  try {
    await api(`/api/projects/${state.currentProject.id}/tasks`, { method: 'POST', body });
    toast('Task created');
    await refreshAfterTaskChange();
  } catch (e) { fail(e); }
});

// ---------- Reports ----------
async function loadReport() {
  const projectId = state.currentProject.id;
  let r;
  try { r = await api(`/api/projects/${projectId}/report`); } catch (e) { return fail(e); }
  if (state.currentProject?.id !== projectId || state.view !== 'reports') return;
  renderReport(r);
}

function renderReport(r) {
  const count = (list, key) => list.find(x => x.key === key)?.count || 0;
  const done = count(r.by_status, 'done');
  const open = r.total - done;
  const pct = r.total ? Math.round((done / r.total) * 100) : 0;
  const inProgress = count(r.by_status, 'in_progress') + count(r.by_status, 'review');

  // Status: one stacked bar, legend with values
  const statusSegs = STATUSES.map(s => ({ ...s, n: count(r.by_status, s.key) })).filter(s => s.n);
  const stack = r.total
    ? `<div class="stack">${statusSegs.map(s =>
        `<div class="seg" style="flex:${s.n};background:var(--st-${s.key})" data-tip="${s.label}: ${s.n} (${Math.round(s.n / r.total * 100)}%)"></div>`).join('')}</div>`
    : '<div class="stack empty"></div>';
  const statusLegend = `<div class="legend">${STATUSES.map(s =>
    `<span><i class="sw" style="background:var(--st-${s.key})"></i>${s.label} <b>${count(r.by_status, s.key)}</b></span>`).join('')}</div>`;

  // Category: single-series bars (tasks per category), with done/total
  const catMax = Math.max(1, ...r.by_category.map(c => c.count));
  const catRows = CATEGORIES.map(c => ({ ...c, row: r.by_category.find(x => x.key === c.key) })).filter(c => c.row);
  const catBars = catRows.length ? `<div class="hbars">${catRows.map(c => `
    <div class="hbar" data-tip="${c.label}: ${c.row.done} of ${c.row.count} done">
      <span class="lbl"><span class="chip" style="--c:var(--cat-${c.key})">${c.label}</span></span>
      <div class="track"><div class="fill" style="width:${c.row.count / catMax * 100}%"></div></div>
      <span class="val">${c.row.count} <small>· ${c.row.done} done</small></span>
    </div>`).join('')}</div>` : '<div class="empty-note">No tasks yet</div>';

  // Priority of open work
  const prioOpen = PRIORITIES.map(p => {
    const row = r.by_priority.find(x => x.key === p.key);
    return { ...p, n: row ? row.count - row.done : 0 };
  });
  const prioMax = Math.max(1, ...prioOpen.map(p => p.n));
  const prioBars = `<div class="hbars">${prioOpen.map(p => `
    <div class="hbar" data-tip="${p.label} priority: ${p.n} open">
      <span class="lbl"><span class="prio ${p.key}">${icon('flag')}${p.label}</span></span>
      <div class="track"><div class="fill" style="width:${p.n / prioMax * 100}%"></div></div>
      <span class="val">${p.n}</span>
    </div>`).join('')}</div>`;

  // Completed per day, last 14 days
  const days = [...Array(14)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 13 + i); return d; });
  const daily = days.map(d => ({ d, n: r.completed_daily.find(x => x.day === localDay(d))?.count || 0 }));
  const dayMax = Math.max(1, ...daily.map(x => x.n));
  const total14 = daily.reduce((a, x) => a + x.n, 0);
  const cols = `<div class="cols">${daily.map(x => `
    <div class="col" data-tip="${x.d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}: ${x.n} completed">
      <div class="bar" style="height:${x.n / dayMax * 100}%"></div>
    </div>`).join('')}</div>
    <div class="cols-axis">${daily.map((x, i) => `<span>${i % 2 === 0 || i === 13 ? x.d.getDate() : ''}</span>`).join('')}</div>`;

  // Team workload
  const team = r.by_assignee.length ? `<table class="table">
    <thead><tr><th>Person</th><th class="num">Open</th><th class="num">Done</th><th>Progress</th></tr></thead>
    <tbody>${r.by_assignee.map(a => `<tr>
      <td><div class="who">${a.key === 'Unassigned' ? `<span class="avatar sm">?</span><span class="muted">Unassigned</span>` : avatar(a.key, 'sm') + esc(a.key)}</div></td>
      <td class="num">${a.count - a.done}</td>
      <td class="num">${a.done}</td>
      <td><div class="mini-bar" data-tip="${Math.round(a.done / a.count * 100)}% done"><div style="width:${a.done / a.count * 100}%"></div></div></td>
    </tr>`).join('')}</tbody></table>` : '<div class="empty-note">No tasks yet</div>';

  const activity = r.activity.length ? `<ul class="activity">${r.activity.map(a => `
    <li data-task="${a.task_id}">
      <span class="a-icon">${icon(a.type === 'comment' ? 'message' : 'clip')}</span>
      <div class="a-body">
        <div><b>${esc(a.who || 'Someone')}</b> ${a.type === 'comment' ? 'commented on' : 'uploaded a file to'} <b>${esc(a.task_title)}</b></div>
        <div class="a-detail">${esc(a.detail)}</div>
        <div class="a-time">${timeAgo(a.created_at)}</div>
      </div>
    </li>`).join('')}</ul>` : '<div class="empty-note">No comments or uploads yet</div>';

  const overdue = r.overdue.length ? `<div class="panel span-12">
    <h3>Overdue tasks</h3><div class="sub">Past their due date and not done yet</div>
    <table class="table"><thead><tr><th>Task</th><th>Priority</th><th>Assignee</th><th class="num">Due</th></tr></thead>
    <tbody>${r.overdue.map(t => `<tr class="clickable" data-task="${t.id}">
      <td>${esc(t.title)}</td><td><span class="prio ${t.priority}">${icon('flag')}${t.priority}</span></td>
      <td>${t.assignee ? `<div class="who">${avatar(t.assignee, 'sm')}${esc(t.assignee)}</div>` : '<span class="muted">Unassigned</span>'}</td>
      <td class="num" style="color:var(--danger);font-weight:600">${fmtDue(t.due_date)}</td></tr>`).join('')}</tbody></table>
  </div>` : '';

  $('#reports').innerHTML = `
    <div class="span-12 row" style="justify-content:space-between">
      <div class="muted">Report generated ${new Date().toLocaleString()}</div>
      <button class="btn" id="printBtn">${icon('printer')} Print / Save as PDF</button>
    </div>
    <div class="panel span-3 stat">
      <span class="stat-label">${icon('layers')} Total tasks</span>
      <span class="stat-value">${r.total}</span>
      <span class="stat-note">${open} open · ${inProgress} in progress or review</span>
    </div>
    <div class="panel span-3 stat">
      <div class="stat-row">
        <div class="stat">
          <span class="stat-label">${icon('checkCircle')} Completion</span>
          <span class="stat-value">${pct}%</span>
          <span class="stat-note">${done} of ${r.total} done</span>
        </div>
        <div class="ring" style="--p:${pct}" role="img" aria-label="${pct}% complete"></div>
      </div>
    </div>
    <div class="panel span-3 stat">
      <span class="stat-label">${icon('trending')} Done in last 7 days</span>
      <span class="stat-value">${r.completed_7d}</span>
      <span class="stat-note">${total14} in last 14 days</span>
    </div>
    <div class="panel span-3 stat">
      <span class="stat-label">${icon('alert')} Overdue</span>
      <span class="stat-value">${r.overdue.length}</span>
      <span class="stat-note ${r.overdue.length ? 'bad' : ''}">${r.overdue.length ? 'Need attention' : 'Everything on schedule'}</span>
    </div>

    <div class="panel span-7"><h3>Status breakdown</h3><div class="sub">Where all ${r.total} tasks stand</div>${stack}${statusLegend}</div>
    <div class="panel span-5"><h3>Open tasks by priority</h3><div class="sub">Work still to do</div>${prioBars}</div>

    <div class="panel span-7"><h3>Tasks by SEO category</h3><div class="sub">Number of tasks in each area</div>${catBars}</div>
    <div class="panel span-5"><h3>Completed per day</h3><div class="sub">Last 14 days · ${total14} tasks completed</div>${cols}</div>

    <div class="panel span-7"><h3>Team workload</h3><div class="sub">Tasks per person</div>${team}</div>
    <div class="panel span-5"><h3>Recent activity</h3><div class="sub">Latest comments and uploads</div>${activity}</div>
    ${overdue}`;
}

$('#reports').addEventListener('click', e => {
  if (e.target.closest('#printBtn')) return window.print();
  const row = e.target.closest('[data-task]');
  if (row) openTask(Number(row.dataset.task));
});

// Tooltips for any element with data-tip
const tip = $('#tooltip');
document.addEventListener('mousemove', e => {
  const el = e.target.closest?.('[data-tip]');
  if (!el) { tip.hidden = true; return; }
  tip.textContent = el.dataset.tip;
  tip.hidden = false;
  const x = Math.min(e.clientX + 12, window.innerWidth - tip.offsetWidth - 8);
  tip.style.left = x + 'px';
  tip.style.top = (e.clientY - tip.offsetHeight - 10) + 'px';
});

// ---------- Task detail ----------
const detailFields = {
  title: '#dTitle', status: '#dStatus', category: '#dCategory', priority: '#dPriority',
  assignee: '#dAssignee', due_date: '#dDue', url: '#dUrl', description: '#dDesc',
};

async function openTask(id) {
  try { state.currentTask = await api(`/api/tasks/${id}`); } catch (e) { return fail(e); }
  const t = state.currentTask;
  for (const [k, sel] of Object.entries(detailFields)) $(sel).value = t[k] ?? '';
  renderDetailMeta();
  renderAttachments();
  renderComments();
  if (!$('#detailDialog').open) $('#detailDialog').showModal();
  autosize($('#dTitle'));
}

function renderDetailMeta() {
  const t = state.currentTask;
  $('#dCrumb').textContent = `${state.currentProject?.name ?? ''} · Task #${t.id} · Created ${timeAgo(t.created_at)}`;
  const link = safeUrl(t.url);
  $('#dUrlOpen').hidden = !link;
  if (link) $('#dUrlOpen').href = link;
}

async function saveDetail() {
  const t = state.currentTask;
  if (!t) return;
  const patch = {};
  for (const [k, sel] of Object.entries(detailFields)) {
    const v = k === 'title' ? $(sel).value.trim() : $(sel).value;
    if (v !== (t[k] ?? '')) patch[k] = v;
  }
  if ('title' in patch && !patch.title) { $('#dTitle').value = t.title; delete patch.title; }
  if (!Object.keys(patch).length) return;
  Object.assign(t, patch); // avoid double-saving while the request is in flight
  try {
    Object.assign(t, await api(`/api/tasks/${t.id}`, { method: 'PUT', body: patch }));
    renderDetailMeta();
    const hint = $('#savedHint');
    hint.hidden = false;
    clearTimeout(saveDetail.timer);
    saveDetail.timer = setTimeout(() => (hint.hidden = true), 1600);
    refreshAfterTaskChange();
  } catch (e) { fail(e); openTask(t.id); }
}

Object.values(detailFields).forEach(sel => $(sel).addEventListener('change', saveDetail));
$('#dTitle').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } });
$('#dTitle').addEventListener('input', e => autosize(e.target));
$('#detailDialog').addEventListener('close', () => { saveDetail(); state.currentTask = null; });
$('#closeDetail').addEventListener('click', () => $('#detailDialog').close());
// Click on the backdrop closes the drawer
$('#detailDialog').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.close(); });

function autosize(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

$('#deleteTaskBtn').addEventListener('click', async () => {
  if (!confirm('Delete this task with all its comments and files?')) return;
  try {
    await api(`/api/tasks/${state.currentTask.id}`, { method: 'DELETE' });
    state.currentTask = null;
    $('#detailDialog').close();
    toast('Task deleted');
    await refreshAfterTaskChange();
  } catch (e) { fail(e); }
});

function renderAttachments() {
  const list = state.currentTask.attachments;
  $('#attCount').textContent = list.length;
  $('#attachments').innerHTML = list.map(a => {
    const url = `/uploads/${encodeURIComponent(a.stored_name)}`;
    const preview = a.mime_type?.startsWith('image/')
      ? `<img src="${url}" alt="${esc(a.original_name)}" data-full="${url}" loading="lazy">`
      : `<a class="file-thumb" href="${url}" target="_blank" rel="noopener">${fileBadge(a.original_name, a.mime_type)}</a>`;
    return `<div class="att">
      ${preview}
      <div class="att-actions">
        <a href="${url}" download="${esc(a.original_name)}" title="Download" aria-label="Download">${icon('download')}</a>
        <button class="del" data-id="${a.id}" title="Delete" aria-label="Delete">${icon('trash')}</button>
      </div>
      <div class="att-info">
        <a class="att-name" href="${url}" target="_blank" rel="noopener" title="${esc(a.original_name)}">${esc(a.original_name)}</a>
        <div class="att-sub">${fmtSize(a.size)}${a.uploaded_by ? ' · ' + esc(a.uploaded_by) : ''}</div>
      </div>
    </div>`;
  }).join('');
}

function renderComments() {
  const list = state.currentTask.comments;
  $('#commentCount').textContent = list.length;
  $('#comments').innerHTML = list.map(c => `
    <div class="comment">
      ${avatar(c.author)}
      <div class="comment-main">
        <div class="comment-head">
          <b>${esc(c.author)}</b><time title="${parseUtc(c.created_at).toLocaleString()}">${timeAgo(c.created_at)}</time>
          <button class="del" data-id="${c.id}">Delete</button>
        </div>
        <div class="comment-text">${esc(c.body)}</div>
      </div>
    </div>`).join('') || '<div class="empty-note">No comments yet. Start the conversation below.</div>';
}

async function reloadTask() {
  const fresh = await api(`/api/tasks/${state.currentTask.id}`);
  state.currentTask.comments = fresh.comments;
  state.currentTask.attachments = fresh.attachments;
  renderAttachments();
  renderComments();
  loadTasks();
}

async function uploadFiles(fileList) {
  if (!fileList.length || !state.currentTask) return;
  const fd = new FormData();
  [...fileList].forEach(f => fd.append('files', f));
  fd.append('uploaded_by', userName());
  try {
    toast(`Uploading ${fileList.length} file${fileList.length > 1 ? 's' : ''}…`);
    await api(`/api/tasks/${state.currentTask.id}/attachments`, { method: 'POST', body: fd });
    await reloadTask();
    toast('Upload complete');
  } catch (e) { fail(e); }
}

$('#commentForm').addEventListener('submit', async e => {
  e.preventDefault();
  const body = $('#commentBody').value.trim();
  if (!body) return;
  try {
    await api(`/api/tasks/${state.currentTask.id}/comments`, { method: 'POST', body: { author: userName(), body } });
    $('#commentBody').value = '';
    autosize($('#commentBody'));
    await reloadTask();
    const scroller = $('.drawer-body');
    scroller.scrollTop = scroller.scrollHeight;
  } catch (err) { fail(err); }
});
$('#commentBody').addEventListener('input', e => autosize(e.target));
$('#commentBody').addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) $('#commentForm').requestSubmit();
});

$('#comments').addEventListener('click', async e => {
  const btn = e.target.closest('.del');
  if (!btn || !confirm('Delete this comment?')) return;
  try { await api(`/api/comments/${btn.dataset.id}`, { method: 'DELETE' }); await reloadTask(); } catch (err) { fail(err); }
});

$('#attachments').addEventListener('click', async e => {
  const del = e.target.closest('.del');
  if (del) {
    if (!confirm('Delete this file?')) return;
    try { await api(`/api/attachments/${del.dataset.id}`, { method: 'DELETE' }); await reloadTask(); } catch (err) { fail(err); }
    return;
  }
  const img = e.target.closest('img[data-full]');
  if (img) { $('#lightboxImg').src = img.dataset.full; $('#lightbox').showModal(); }
});

$('#fileInput').addEventListener('change', e => { uploadFiles(e.target.files); e.target.value = ''; });
const dz = $('#dropzone');
dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over'); });
dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('drag-over'); uploadFiles(e.dataTransfer.files); });

// Paste images (e.g. screenshots) straight into an open task
document.addEventListener('paste', e => {
  if (!$('#detailDialog').open) return;
  const files = [...e.clipboardData.files];
  if (files.length) { e.preventDefault(); uploadFiles(files); }
});

// ---------- User & theme ----------
function renderMe() {
  const name = $('#userName').value.trim();
  for (const el of [$('#meAvatar'), $('#composerAvatar')]) {
    el.textContent = name ? initials(name) : '?';
    el.style.background = name ? colorFor(name) : '';
  }
}
$('#userName').value = store.get('userName') || '';
$('#userName').addEventListener('input', e => { store.set('userName', e.target.value.trim()); renderMe(); });

function isDark() {
  const t = document.documentElement.dataset.theme;
  return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
}
function renderThemeBtn() { $('#themeBtn').innerHTML = icon(isDark() ? 'sun' : 'moon'); }
$('#themeBtn').addEventListener('click', () => {
  const next = isDark() ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  store.set('theme', next);
  renderThemeBtn();
});

// ---------- Wiring ----------
$('#projectList').addEventListener('click', e => {
  const li = e.target.closest('li[data-id]');
  if (li) selectProject(Number(li.dataset.id));
});
$('#newProjectBtn').addEventListener('click', () => openProjectDialog());
$('#emptyNewProject').addEventListener('click', () => openProjectDialog());
$('#editProjectBtn').addEventListener('click', () => openProjectDialog(state.currentProject));
$('#deleteProjectBtn').addEventListener('click', async () => {
  if (!confirm(`Delete project "${state.currentProject.name}" and all its tasks, comments and files?`)) return;
  try {
    await api(`/api/projects/${state.currentProject.id}`, { method: 'DELETE' });
    toast('Project deleted');
    await loadProjects();
    selectProject(state.projects[0]?.id);
  } catch (e) { fail(e); }
});
$('#newTaskBtn').addEventListener('click', () => openNewTask());
$('#menuBtn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
$('#lightbox').addEventListener('click', () => $('#lightbox').close());
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => setView(t.dataset.view)));

$('#searchInput').addEventListener('input', e => { state.filters.search = e.target.value; renderBoard(); });
$('#categoryFilter').addEventListener('change', e => { state.filters.category = e.target.value; renderBoard(); });
$('#priorityFilter').addEventListener('change', e => { state.filters.priority = e.target.value; renderBoard(); });

fillSelect($('#taskForm').status, STATUSES);
fillSelect($('#taskForm').priority, PRIORITIES);
fillSelect($('#taskForm').category, CATEGORIES);
fillSelect($('#dStatus'), STATUSES);
fillSelect($('#dPriority'), PRIORITIES);
fillSelect($('#dCategory'), CATEGORIES);
fillSelect($('#categoryFilter'), CATEGORIES, 'All categories');
fillSelect($('#priorityFilter'), PRIORITIES, 'All priorities');

hydrateIcons();
renderMe();
renderThemeBtn();

(async () => {
  state.view = store.get('view') === 'reports' ? 'reports' : 'board';
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === state.view));
  $('#board').hidden = state.view !== 'board';
  $('#filters').hidden = state.view !== 'board';
  $('#reports').hidden = state.view !== 'reports';
  try { await loadProjects(); } catch (e) { return fail(e); }
  const last = Number(store.get('lastProject'));
  if (state.projects.some(p => p.id === last)) selectProject(last);
  else if (state.projects.length) selectProject(state.projects[0].id);
})();
