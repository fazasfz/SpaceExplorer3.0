// ============================================================
// SpaceExplorer 2.0 — Global Components
// Toast · Modal · Panel · Confirm · Skeleton · Empty State
// ============================================================

// ── Toast System ──────────────────────────────────────────────
let toastContainer;

function showToast(message, type = 'info', title = null) {
  if (!toastContainer) {
    toastContainer = document.getElementById('toast-container');
  }
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const titles = { success: 'Success', error: 'Error', warning: 'Warning', info: 'Info' };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <div class="toast-body">
      <div class="toast-title">${title || titles[type]}</div>
      <div class="toast-msg">${message}</div>
    </div>
    <div class="toast-progress" id="tp-${Date.now()}"></div>
  `;
  toastContainer.appendChild(toast);

  // Animate progress bar
  const prog = toast.querySelector('.toast-progress');
  prog.style.width = '100%';
  prog.style.transition = 'width 3.5s linear';
  requestAnimationFrame(() => requestAnimationFrame(() => { prog.style.width = '0%'; }));

  // Auto-remove
  const dur = 3500;
  const timer = setTimeout(() => removeToast(toast), dur);
  toast.addEventListener('click', () => { clearTimeout(timer); removeToast(toast); });

  return toast;
}

function removeToast(toast) {
  toast.classList.add('exiting');
  setTimeout(() => toast.remove(), 300);
}

// ── Modal System ──────────────────────────────────────────────
let activeModal = null;

function openModal(title, contentHTML, actions = []) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'active-modal';

  const actionsHTML = actions.map(a =>
    `<button class="btn ${a.class || 'btn-primary'}" id="modal-action-${a.id || 'act'}">${a.label}</button>`
  ).join('');

  overlay.innerHTML = `
    <div class="modal-box" role="dialog" aria-modal="true" aria-label="${title}">
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="modal-close" aria-label="Close">✕</button>
      </div>
      <div class="modal-body">${contentHTML}</div>
      ${actionsHTML ? `<div class="modal-actions">${actionsHTML}</div>` : ''}
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));

  overlay.querySelector('.modal-close').addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  // Wire actions
  actions.forEach(a => {
    const btn = overlay.querySelector(`#modal-action-${a.id || 'act'}`);
    if (btn && a.handler) btn.addEventListener('click', a.handler);
  });

  // ESC key
  const onKeydown = e => { if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', onKeydown); } };
  document.addEventListener('keydown', onKeydown);

  activeModal = overlay;
  return overlay;
}

function closeModal() {
  if (activeModal) {
    activeModal.classList.remove('open');
    setTimeout(() => { activeModal?.remove(); activeModal = null; }, 300);
  }
}

// ── Slide-in Panel ────────────────────────────────────────────
let activePanel = null;
let activePanelOverlay = null;

function openPanel(title, formHTML, onSubmit = null) {
  closePanel();

  const overlay = document.createElement('div');
  overlay.className = 'panel-overlay';
  overlay.id = 'active-panel-overlay';

  const panel = document.createElement('div');
  panel.className = 'slide-panel';
  panel.id = 'active-panel';
  panel.innerHTML = `
    <div class="panel-header">
      <h2>${title}</h2>
      <button class="panel-close" aria-label="Close panel">✕</button>
    </div>
    <div class="panel-body">${formHTML}</div>
  `;
  document.body.appendChild(overlay);
  document.body.appendChild(panel);

  requestAnimationFrame(() => {
    overlay.classList.add('open');
    panel.classList.add('open');
  });

  panel.querySelector('.panel-close').addEventListener('click', closePanel);
  overlay.addEventListener('click', closePanel);

  // ESC key
  const onKeydown = e => { if (e.key === 'Escape') { closePanel(); document.removeEventListener('keydown', onKeydown); } };
  document.addEventListener('keydown', onKeydown);

  // Wire form submit
  if (onSubmit) {
    const form = panel.querySelector('form');
    if (form) form.addEventListener('submit', e => { e.preventDefault(); onSubmit(new FormData(form)); });
  }

  activePanel = panel;
  activePanelOverlay = overlay;
  return panel;
}

function closePanel() {
  if (activePanel) {
    activePanel.classList.remove('open');
    activePanelOverlay?.classList.remove('open');
    setTimeout(() => {
      activePanel?.remove();
      activePanelOverlay?.remove();
      activePanel = null;
      activePanelOverlay = null;
    }, 400);
  }
}

// ── Confirm Dialog ────────────────────────────────────────────
function confirmAction(message, onConfirm, onCancel = null) {
  let clicks = 0;
  openModal('Confirm Action', `<p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.6;">${message}</p>`, [
    {
      id: 'cancel', label: 'Cancel', class: 'btn btn-ghost',
      handler: () => { closeModal(); onCancel?.(); }
    },
    {
      id: 'confirm', label: 'Confirm', class: 'btn btn-danger',
      handler: (e) => {
        clicks++;
        if (clicks >= 2) { closeModal(); onConfirm(); }
        else {
          e.currentTarget.classList.add('animate-shake');
          setTimeout(() => e.currentTarget?.classList.remove('animate-shake'), 400);
        }
      }
    }
  ]);
}

// ── Skeleton Loader ───────────────────────────────────────────
function showSkeleton(containerId, count = 4, type = 'card') {
  const el = document.getElementById(containerId);
  if (!el) return;
  let html = '';
  for (let i = 0; i < count; i++) {
    if (type === 'card') {
      html += `<div class="card" style="min-height:180px;">
        <div class="skeleton skeleton-circle" style="width:48px;height:48px;margin-bottom:16px;"></div>
        <div class="skeleton skeleton-line wide"></div>
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line short"></div>
      </div>`;
    } else if (type === 'row') {
      html += `<tr><td colspan="10"><div class="skeleton skeleton-line" style="height:20px;margin:4px 0;"></div></td></tr>`;
    }
  }
  el.innerHTML = html;
}

// ── Empty State ───────────────────────────────────────────────
function renderEmptyState(containerId, title, desc, btnLabel = null, btnAction = null) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">👨‍🚀</div>
      <div class="empty-title">${title}</div>
      <div class="empty-desc">${desc}</div>
      ${btnLabel ? `<button class="btn btn-primary" onclick="${btnAction}">${btnLabel}</button>` : ''}
    </div>
  `;
}

// ── Utility: Animate Counter ──────────────────────────────────
function animateCounter(el, target, duration = 1500, suffix = '') {
  const start = 0;
  const startTime = performance.now();
  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = Math.round(start + (target - start) * eased);
    el.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ── Utility: Hash Color for Avatars ──────────────────────────
function hashColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 40%)`;
}

function hashColorPair(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${h1},60%,35%), hsl(${h2},70%,45%))`;
}

// ── Utility: Initials from Name ───────────────────────────────
function getInitials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

// ── Utility: Format Date ──────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Utility: Countdown String ─────────────────────────────────
function getCountdownString(targetDate) {
  const now = new Date();
  const target = new Date(targetDate);
  const diff = target - now;
  if (diff <= 0) return 'T+00d 00h 00m 00s';
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `T-${String(d).padStart(2,'0')}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
}

// ── Utility: Stars HTML ───────────────────────────────────────
function renderStars(rating, max = 5) {
  let html = '<span class="star-display">';
  for (let i = 1; i <= max; i++) {
    html += `<span class="${i <= rating ? 'star-filled' : 'star-empty'}">★</span>`;
  }
  return html + '</span>';
}

// ── Utility: Debounce ─────────────────────────────────────────
function debounce(fn, delay) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

// ── Utility: Sortable Table ───────────────────────────────────
function makeSortable(tableId, data, renderFn) {
  const table = document.getElementById(tableId);
  if (!table) return;
  let sortKey = null, sortDir = 1;
  table.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (sortKey === key) sortDir *= -1;
      else { sortKey = key; sortDir = 1; }
      table.querySelectorAll('th').forEach(t => t.classList.remove('sorted'));
      th.classList.add('sorted');
      th.querySelector('.sort-icon').textContent = sortDir === 1 ? '↑' : '↓';
      const sorted = [...data].sort((a, b) => {
        const v1 = a[key], v2 = b[key];
        return typeof v1 === 'string' ? v1.localeCompare(v2) * sortDir : (v1 - v2) * sortDir;
      });
      renderFn(sorted);
    });
  });
}
