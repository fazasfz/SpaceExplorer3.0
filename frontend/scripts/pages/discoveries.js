// ============================================================
// SpaceExplorer 3.0 — Citizen Science Hub Page
// Real programs: Unistellar, Zooniverse, ExoClock, Spectroscopy
// Wired to /api/citizen backend + localStorage offline fallback
// ============================================================

let discTypeFilters = new Set(['unistellar', 'zooniverse', 'exoclock', 'spectroscopy']);
let discSearch = '';

async function initDiscoveries() {
  await updateContributionHero();
  await renderContributions();
  initDiscoveryFilters();
  startContributionTicker();
}

// ── Hero counter ──────────────────────────────────────────────
async function updateContributionHero() {
  const el = document.getElementById('total-discoveries');
  if (!el) return;
  const contribs = await getCitizenContributions();
  if (typeof animateCounter === 'function') {
    animateCounter(el, contribs.length, 1200);
  } else {
    el.textContent = contribs.length;
  }
}

// ── Scrolling ticker ──────────────────────────────────────────
async function startContributionTicker() {
  const ticker = document.getElementById('discovery-ticker');
  if (!ticker) return;
  const contribs = await getCitizenContributions();
  if (!contribs.length) {
    ticker.textContent = '✦ Log your first contribution to Unistellar, Zooniverse, or ExoClock';
    return;
  }
  const items = contribs.map(c =>
    `✦ ${c.programName || c.programId || 'Program'} — ${c.description ? c.description.slice(0, 60) + '…' : 'Contribution logged'} — ${formatDate(c.date || c.createdAt)}`
  );
  ticker.textContent = items.join('   ·   ');
}

// ── Filter wiring ─────────────────────────────────────────────
function initDiscoveryFilters() {
  document.querySelectorAll('.disc-type-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) discTypeFilters.add(cb.value);
      else discTypeFilters.delete(cb.value);
      renderContributions();
    });
  });

  const searchEl = document.getElementById('disc-search');
  if (searchEl && typeof debounce === 'function') {
    searchEl.addEventListener('input', debounce(() => {
      discSearch = searchEl.value;
      renderContributions();
    }, 300));
  }
}

// ── Program metadata ─────────────────────────────────────────
const PROGRAM_META = {
  unistellar:   { icon: '🔭', color: 'rgba(0,212,255,0.14)',   label: 'Unistellar Network',      url: 'https://unistellar.com/science/' },
  zooniverse:   { icon: '🌌', color: 'rgba(0,255,204,0.12)',   label: 'Zooniverse Projects',      url: 'https://www.zooniverse.org/projects?discipline=astronomy' },
  exoclock:     { icon: '🪐', color: 'rgba(255,215,0,0.12)',   label: 'ExoClock Exoplanets',      url: 'https://www.exoclock.space' },
  spectroscopy: { icon: '🌈', color: 'rgba(200,150,255,0.12)', label: 'Amateur Spectroscopy',     url: 'https://www.aavso.org/spectroscopy' }
};

function getProgramMeta(programId) {
  const id = (programId || '').toLowerCase();
  for (const key of Object.keys(PROGRAM_META)) {
    if (id.includes(key)) return { ...PROGRAM_META[key], key };
  }
  return { icon: '🔬', color: 'rgba(255,107,53,0.12)', label: programId || 'Citizen Science', url: null, key: 'other' };
}

// ── Grid renderer ─────────────────────────────────────────────
async function renderContributions() {
  const container = document.getElementById('discoveries-grid');
  if (!container) return;

  const allContribs = await getCitizenContributions();
  const q = discSearch.toLowerCase();

  const items = allContribs.filter(c => {
    const meta = getProgramMeta(c.programId);
    const typeMatch = discTypeFilters.size === 0 || discTypeFilters.has(meta.key) || discTypeFilters.has((c.programId || '').toLowerCase());
    const searchMatch = !q || (c.programName || '').toLowerCase().includes(q)
      || (c.description || '').toLowerCase().includes(q)
      || (c.programId || '').toLowerCase().includes(q);
    return typeMatch && searchMatch;
  });

  if (!items.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔬</div>
        <div class="empty-title">No contributions yet</div>
        <div class="empty-desc">Log a contribution to Unistellar, Zooniverse, ExoClock, or Amateur Spectroscopy to see it here.</div>
      </div>`;
    return;
  }

  container.innerHTML = items.map((c, i) => {
    const meta   = getProgramMeta(c.programId);
    const cId    = c._id || c.id || i;
    const dateStr = formatDate(c.date || c.createdAt || new Date());

    return `
    <div class="discovery-card-wrap animate-in" style="animation-delay:${i * 60}ms">
      <div class="card card-brackets" style="padding:var(--space-lg)">
        <div class="discovery-type-icon" style="background:${meta.color}">${meta.icon}</div>
        <div style="font-size:0.65rem;font-family:var(--font-mono);color:var(--text-dim);letter-spacing:0.12em;margin-bottom:6px">${meta.label.toUpperCase()}</div>
        <div class="discovery-title">${c.description ? c.description.slice(0, 80) + (c.description.length > 80 ? '…' : '') : 'Contribution logged'}</div>
        <div style="font-size:0.75rem;color:var(--text-secondary);margin:var(--space-xs) 0">${dateStr}</div>
        ${c.link ? `<a href="${c.link}" target="_blank" rel="noopener" style="font-size:0.72rem;color:var(--accent-primary);font-family:var(--font-mono)">→ VIEW IN PROGRAM</a>` : ''}
        <div style="display:flex;justify-content:flex-end;margin-top:var(--space-sm);gap:var(--space-xs)">
          <button class="btn btn-ghost btn-sm" onclick="shareContribution('${cId}')">📋 SHARE</button>
          <button class="btn btn-danger btn-sm" onclick="deleteContributionLocal('${cId}')">×</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── Actions ────────────────────────────────────────────────────
async function shareContribution(id) {
  const contribs = await getCitizenContributions();
  const c = contribs.find(x => (x._id || x.id) == id);
  if (!c) return;
  const meta = getProgramMeta(c.programId);
  const text = `🔬 CITIZEN SCIENCE: ${meta.label}\n📝 ${c.description}\n🗓️ ${formatDate(c.date || c.createdAt)}\n#AmateurAstronomy #CitizenScience`;
  navigator.clipboard.writeText(text)
    .then(() => typeof showToast === 'function' && showToast('Contribution copied to clipboard!', 'success'))
    .catch(() => typeof showToast === 'function' && showToast('Copy failed', 'error'));
}

async function deleteContributionLocal(id) {
  if (typeof confirmAction === 'function') {
    confirmAction('Delete this contribution log?', () => {
      // Remove from local cache(s)
      ['se_citizen_local', 'se_citizen_cache'].forEach(key => {
        const arr = JSON.parse(localStorage.getItem(key) || '[]');
        const filtered = arr.filter(x => (x._id || x.id) != id);
        localStorage.setItem(key, JSON.stringify(filtered));
      });
      if (typeof showToast === 'function') showToast('Contribution removed', 'warning');
      updateContributionHero();
      renderContributions();
      startContributionTicker();
    });
  }
}

// ── Add contribution panel ────────────────────────────────────
function openAddDiscovery() {
  if (typeof openPanel !== 'function') return;
  openPanel('Log Citizen Science Contribution', `
    <form id="add-discovery-form">
      <div class="form-group">
        <label class="form-label">Program *</label>
        <select class="form-select" name="programId" required>
          <option value="">Select program</option>
          <option value="unistellar">🔭 Unistellar Network</option>
          <option value="zooniverse">🌌 Zooniverse (Galaxy Zoo, Planet Hunters, etc.)</option>
          <option value="exoclock">🪐 ExoClock — Exoplanet Transits</option>
          <option value="spectroscopy">🌈 Amateur Spectroscopy (AAVSO / BASS)</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Program Name / Campaign</label>
        <input class="form-input" name="programName" placeholder="e.g. Galaxy Zoo, WASP-12b Transit Night">
      </div>
      <div class="form-group">
        <label class="form-label">What did you contribute? *</label>
        <textarea class="form-textarea" name="description" placeholder="e.g. Submitted light curve for WASP-12b transit. Full ingress + egress captured over 2h 40min session." required style="min-height:110px"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Verification / Submission Link (optional)</label>
        <input class="form-input" type="url" name="link" placeholder="https://www.exoclock.space/observations/...">
      </div>
      <button type="submit" class="btn btn-primary btn-full">🔬 LOG CONTRIBUTION</button>
    </form>
  `, async (fd) => {
    const data = Object.fromEntries(fd);
    if (!data.programId || !data.description) {
      typeof showToast === 'function' && showToast('Program and description are required', 'error');
      return;
    }
    if (!data.programName) data.programName = getProgramMeta(data.programId).label;

    try {
      await addCitizenContribution(data);
      if (typeof closePanel === 'function') closePanel();
      if (typeof showToast === 'function') showToast(`Contribution to ${data.programName} logged! +50 pts`, 'success');
      updateContributionHero();
      renderContributions();
      startContributionTicker();
    } catch (e) {
      if (typeof showToast === 'function') showToast(e.message || 'Failed to save', 'error');
    }
  });
}