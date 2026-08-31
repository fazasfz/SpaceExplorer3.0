// ============================================================
// SpaceExplorer 3.0 — Observation Log Page
// Core personal journal. Wired to /api/observations backend
// with localStorage offline fallback when not logged in.
// ============================================================

function initObservations() {
  renderObservationCards();
  renderObsStats();
  renderTonightSuggestions();
  initGeoLocation();

  setTimeout(() => {
    if (typeof initObsChart === 'function') initObsChart('obs-chart');
  }, 200);
}

// ── Geolocation ───────────────────────────────────────────────
function initGeoLocation() {
  const locInput  = document.getElementById('obs-location');
  const skyFrame  = document.getElementById('stellarium-viewport');

  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude.toFixed(4);
      const lon = pos.coords.longitude.toFixed(4);
      if (locInput) locInput.value = `LAT: ${lat}° / LON: ${lon}°`;
      if (skyFrame) {
        skyFrame.src = `https://virtualsky.lco.global/embed/index.html?longitude=${lon}&latitude=${lat}&projection=stereo&constellations=true&constellationlabels=true&gradient=true`;
      }
    },
    () => { if (locInput) locInput.value = 'Location unavailable'; }
  );
}

// ── Observation cards ─────────────────────────────────────────
async function renderObservationCards() {
  const container = document.getElementById('obs-cards') || document.getElementById('obs-feed-container');
  if (!container) return;

  container.innerHTML = '<div style="color:var(--text-dim);font-family:var(--font-mono);font-size:0.75rem;padding:var(--space-md)">LOADING JOURNAL...</div>';

  const obs = await getObservations();

  // Update stat counters
  const totalEl = document.getElementById('obs-stat-total');
  if (totalEl) totalEl.textContent = obs.length;

  if (!obs.length) {
    container.innerHTML = `
      <div style="text-align:center;padding:3rem;color:#64748b;border:1px dashed rgba(255,255,255,0.05);border-radius:8px">
        <p style="font-size:1.3rem;margin-bottom:0.5rem;color:#fff">🌌 Journal Empty</p>
        <p style="font-size:0.85rem">No observations logged yet. Use the form on the left to record your first night-sky entry.</p>
      </div>`;
    return;
  }

  container.innerHTML = obs.map((o, i) => {
    const name      = o.objectName || o.object || 'Unknown Object';
    const type      = o.objectType || o.type || 'Other';
    const equip     = o.equipment || 'Bare Eye / Binoculars';
    const rawDate   = o.observedAt || o.datetime || o.date || new Date().toISOString();
    const dateStr   = typeof formatDate === 'function'
      ? formatDate(rawDate.split ? rawDate.split('T')[0] : rawDate)
      : new Date(rawDate).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
    const seeingColor = { excellent: '#00ff88', good: 'var(--accent-primary)', poor: 'var(--accent-warn)' }[(o.seeing||'').toLowerCase()] || 'var(--text-secondary)';
    const photoUrl  = o.photoUrl || o.photo || '';
    const photoTag  = photoUrl
      ? `<div style="width:100%;height:130px;margin-bottom:var(--space-sm);border-radius:4px;background:url('${escapeHtml(photoUrl)}') center/cover;border:1px solid var(--border-subtle)"></div>`
      : '';
    const entryId   = o._id || o.id || i;

    return `
    <div class="card card-brackets obs-card animate-in" style="animation-delay:${i*50}ms;padding:var(--space-md);background:rgba(20,24,35,0.4);border:1px solid var(--border-subtle)">
      ${photoTag}
      <div style="display:flex;align-items:flex-start;gap:var(--space-sm);margin-bottom:var(--space-sm)">
        <div style="font-size:1.6rem">${obsTypeIcon(type)}</div>
        <div style="flex:1">
          <div style="font-weight:bold;font-size:1.05rem;color:#fff">${escapeHtml(name)}</div>
          <div style="font-size:0.82rem;color:var(--text-secondary)">🔭 ${escapeHtml(equip)}</div>
        </div>
        <div>${typeof renderStars === 'function' ? renderStars(o.rating || 3) : '★'.repeat(o.rating || 3)}</div>
      </div>

      <div style="display:flex;gap:var(--space-sm);margin-bottom:var(--space-sm);flex-wrap:wrap">
        <span style="background:${seeingColor}22;color:${seeingColor};border:1px solid ${seeingColor}44;font-size:0.68rem;padding:2px 6px;border-radius:4px;font-family:var(--font-mono)">
          SEEING: ${(o.seeing || 'GOOD').toUpperCase()}
        </span>
        <span style="background:rgba(255,255,255,0.05);color:var(--text-secondary);font-size:0.68rem;padding:2px 6px;border-radius:4px;font-family:var(--font-mono)">
          BORTLE ${o.bortleScale || o.bortle || 5}
        </span>
        <span style="background:rgba(0,212,255,0.1);color:var(--accent-primary);font-size:0.68rem;padding:2px 6px;border-radius:4px;font-family:var(--font-mono)">
          ${type.toUpperCase()}
        </span>
      </div>

      <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:var(--space-sm);line-height:1.5">${escapeHtml(o.notes || 'No notes recorded.')}</div>

      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px dashed var(--border-subtle);padding-top:var(--space-xs);font-size:0.72rem;color:var(--text-dim)">
        <div>📍 ${escapeHtml(o.locationName || o.location || 'Location not recorded')}</div>
        <div style="font-family:var(--font-mono)">${dateStr}</div>
        <button onclick="deleteObservationLocal('${entryId}')" style="background:transparent;border:none;color:var(--accent-warn);cursor:pointer;font-size:1.1rem;padding:0 4px">×</button>
      </div>
    </div>`;
  }).join('');
}

function obsTypeIcon(type) {
  return { Planet:'🪐', Star:'⭐', Galaxy:'🌌', Nebula:'🌫️', Comet:'☄️', Satellite:'🛰️', Other:'🔭' }[type] || '🔭';
}

// ── Stats ─────────────────────────────────────────────────────
async function renderObsStats() {
  const obs = await getObservations();

  const totalEl = document.getElementById('obs-stat-total');
  if (totalEl) totalEl.textContent = obs.length;

  const favEl = document.getElementById('obs-stat-fav');
  if (favEl && obs.length) {
    const counts = {};
    obs.forEach(o => { const t = o.objectType || o.type || 'Other'; counts[t] = (counts[t] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    favEl.textContent = top ? top[0] : '—';
  }

  const streakEl = document.getElementById('obs-stat-best');
  if (streakEl) {
    const streak = computeObsStreak(obs);
    streakEl.textContent = streak + (streak === 1 ? ' day' : ' days');
  }
}

function computeObsStreak(obs) {
  if (!obs.length) return 0;
  const days = [...new Set(
    obs.map(o => new Date(o.observedAt || o.datetime || o.date || Date.now()).toISOString().slice(0, 10))
  )].sort().reverse();

  let streak = 0;
  let prev = null;
  for (const day of days) {
    if (!prev) { streak = 1; prev = day; continue; }
    const diff = (new Date(prev) - new Date(day)) / 86400000;
    if (diff === 1) { streak++; prev = day; }
    else break;
  }
  return streak;
}

// ── Delete (local) ────────────────────────────────────────────
function deleteObservationLocal(id) {
  const performDelete = () => {
    ['se_observations_local', 'se_observations_cache'].forEach(key => {
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = arr.filter(x => (x._id || x.id) != id);
      localStorage.setItem(key, JSON.stringify(filtered));
    });
    if (typeof showToast === 'function') showToast('Observation removed', 'warning');
    renderObservationCards();
    renderObsStats();
  };

  if (typeof confirmAction === 'function') {
    confirmAction('Delete this observation entry?', performDelete);
  } else if (confirm('Delete this observation?')) {
    performDelete();
  }
}

// ── Tonight suggestions ────────────────────────────────────────
function renderTonightSuggestions() {
  const listEl = document.getElementById('tonights-targets-list');
  if (!listEl) return;

  const suggestions = [
    { name: 'Orion Nebula (M42)', type: 'Nebula',        mag: '4.0',  desc: 'Best winter deep-sky object, excellent in any scope' },
    { name: 'Jupiter',           type: 'Planet',         mag: '-2.5', desc: 'Belt detail & Galilean moons visible all night' },
    { name: 'Andromeda (M31)',   type: 'Galaxy',         mag: '3.4',  desc: 'Naked-eye galaxy, superb in binoculars' },
    { name: 'Pleiades (M45)',    type: 'Star Cluster',   mag: '1.6',  desc: 'Open cluster, stunning in wide-field binoculars' },
    { name: 'Double Cluster',    type: 'Star Cluster',   mag: '4.3',  desc: 'NGC 869 & NGC 884 in Perseus — showpiece pair' }
  ];

  listEl.innerHTML = suggestions.map(item => `
    <li style="display:flex;justify-content:space-between;padding:var(--space-xs) 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:0.85rem">
      <div>
        <div style="color:#fff;font-weight:600">${escapeHtml(item.name)}</div>
        <div style="font-size:0.7rem;color:var(--text-dim);font-family:var(--font-mono)">${escapeHtml(item.type)} · ${escapeHtml(item.desc)}</div>
      </div>
      <div style="text-align:right;font-family:var(--font-mono);font-size:0.72rem;flex-shrink:0;margin-left:8px">
        <div style="color:var(--accent-primary)">Mag ${escapeHtml(item.mag)}</div>
      </div>
    </li>
  `).join('');
}

// ── Inline form submit ─────────────────────────────────────────
async function handleSaveObservation(event) {
  event.preventDefault();

  const target    = document.getElementById('obs-target')?.value?.trim();
  const equipment = document.getElementById('obs-equipment')?.value?.trim() || 'Bare Eye / Binoculars';
  const location  = document.getElementById('obs-location')?.value?.trim() || 'Location not recorded';
  const weather   = document.getElementById('obs-weather')?.value?.trim() || 'Clear Sky';
  const photo     = document.getElementById('obs-photo')?.value?.trim() || '';
  const notes     = document.getElementById('obs-notes')?.value?.trim() || '';

  if (!target) {
    if (typeof showToast === 'function') showToast('Target object is required', 'error');
    return;
  }

  const obsData = {
    objectName:   target,
    objectType:   'Other',
    equipment,
    locationName: location,
    seeing:       'good',
    bortleScale:  5,
    notes:        weather !== 'Clear Sky' ? `[Conditions: ${weather}] ${notes}` : notes,
    photoUrl:     photo,
    rating:       4,
    observedAt:   new Date().toISOString()
  };

  const btn = event.target.querySelector('[type="submit"]');
  if (btn) { btn.disabled = true; btn.textContent = 'SAVING...'; }

  try {
    await addObservation(obsData);
    if (typeof showToast === 'function') showToast(`Observation of ${target} logged!`, 'success');
    event.target.reset();
    initGeoLocation(); // re-detect location for next entry
    await renderObservationCards();
    await renderObsStats();
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message || 'Save failed', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '⚡ SAVE TO PERSONAL JOURNAL'; }
  }
}

// ── Panel (FAB +) ─────────────────────────────────────────────
function openAddObservation() {
  let obsRating = 3;
  if (typeof openPanel !== 'function') return;
  openPanel('Log New Observation', `
    <form id="add-obs-form">
      <div class="form-group">
        <label class="form-label">Object Name *</label>
        <input class="form-input" name="objectName" placeholder="e.g., Jupiter, M42, Andromeda Galaxy" required>
      </div>
      <div class="form-group">
        <label class="form-label">Object Type *</label>
        <select class="form-select" name="objectType" required>
          <option value="">Select type</option>
          <option value="Planet">Planet</option>
          <option value="Star">Star</option>
          <option value="Galaxy">Galaxy</option>
          <option value="Nebula">Nebula</option>
          <option value="Star Cluster">Star Cluster</option>
          <option value="Comet">Comet</option>
          <option value="Satellite">Satellite</option>
          <option value="Double Star">Double Star</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Date & Time *</label>
        <input class="form-input" type="datetime-local" name="observedAt" id="form-datetime-val" required>
      </div>
      <div class="form-group">
        <label class="form-label">Observing Location</label>
        <input class="form-input" name="locationName" id="form-location-val" placeholder="Detecting coordinates...">
      </div>
      <div class="form-group">
        <label class="form-label">Equipment Used</label>
        <input class="form-input" name="equipment" placeholder="e.g., Celestron 8-inch SCT, Bare Eye">
      </div>
      <div class="form-group">
        <label class="form-label">Astrophotography Image URL (optional)</label>
        <input class="form-input" type="url" name="photoUrl" placeholder="https://...">
      </div>
      <div class="form-group">
        <label class="form-label">Seeing Conditions</label>
        <div class="toggle-group">
          <button type="button" class="toggle-btn" id="see-poor" onclick="setSeeingFilter('poor')">Poor</button>
          <button type="button" class="toggle-btn active" id="see-good" onclick="setSeeingFilter('good')">Good</button>
          <button type="button" class="toggle-btn" id="see-excellent" onclick="setSeeingFilter('excellent')">Excellent</button>
        </div>
        <input type="hidden" name="seeing" id="seeing-val" value="good">
      </div>
      <div class="form-group">
        <label class="form-label">Sky Darkness — Bortle Scale (1=darkest, 9=city)</label>
        <input class="form-range" type="range" name="bortleScale" min="1" max="9" value="5" id="bortle-range">
        <div style="font-family:var(--font-mono);font-size:0.75rem;color:var(--accent-primary);text-align:right" id="bortle-val">5</div>
      </div>
      <div class="form-group">
        <label class="form-label">Field Notes</label>
        <textarea class="form-textarea" name="notes" placeholder="What did you see? Colors, detail, eyepiece impressions..." style="min-height:90px"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Session Rating</label>
        <div class="star-rating" id="obs-stars">
          ${[1,2,3,4,5].map(n => `<span class="star ${n<=obsRating?'active':''}" onclick="setObsRating(${n})">★</span>`).join('')}
        </div>
        <input type="hidden" name="rating" id="rating-input" value="${obsRating}">
      </div>
      <button type="submit" class="btn btn-primary btn-full">🔭 LOG OBSERVATION</button>
    </form>
  `, async (fd) => {
    const data = Object.fromEntries(fd);
    data.bortleScale = parseInt(data.bortleScale) || 5;
    data.rating      = parseInt(data.rating) || 3;

    try {
      await addObservation(data);
      if (typeof closePanel === 'function') closePanel();
      if (typeof showToast === 'function') showToast(`Observation of ${data.objectName} logged! +20 pts`, 'success');
      renderObservationCards();
      renderObsStats();
    } catch (e) {
      if (typeof showToast === 'function') showToast(e.message || 'Failed to save', 'error');
    }
  });

  setTimeout(() => {
    const range  = document.getElementById('bortle-range');
    const valEl  = document.getElementById('bortle-val');
    if (range && valEl) range.addEventListener('input', () => { valEl.textContent = range.value; });

    const timeInp = document.getElementById('form-datetime-val');
    if (timeInp) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      timeInp.value = now.toISOString().slice(0, 16);
    }

    const locInp = document.getElementById('form-location-val');
    if (locInp && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => { locInp.value = `LAT: ${pos.coords.latitude.toFixed(4)}° / LON: ${pos.coords.longitude.toFixed(4)}°`; },
        ()  => { locInp.value = 'Location unavailable'; }
      );
    }
  }, 100);
}

function setSeeingFilter(val) {
  document.querySelectorAll('.toggle-btn[id^="see-"]').forEach(b => b.classList.remove('active'));
  document.getElementById(`see-${val}`)?.classList.add('active');
  const inp = document.getElementById('seeing-val');
  if (inp) inp.value = val;
}

function setObsRating(val) {
  document.querySelectorAll('#obs-stars .star').forEach((s, i) => s.classList.toggle('active', i < val));
  const inp = document.getElementById('rating-input');
  if (inp) inp.value = val;
}

// ── HTML escape ────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// Router alias
function initObservationsPage() { initObservations(); }
