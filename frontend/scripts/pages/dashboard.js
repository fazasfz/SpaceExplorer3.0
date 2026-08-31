// ============================================================
// SpaceExplorer 3.0 — Dashboard Page
// Wired to real backend: observations, club members,
// citizen science, and the SpaceDevs launch API.
// ============================================================

let liveDashboardLaunches = [];

async function initDashboard() {
  try {
    // Fetch all data concurrently
    const [launches, observations, members, contributions] = await Promise.all([
      getLaunches(5),
      getObservations(),
      getClubMembers(),
      getCitizenContributions()
    ]);

    liveDashboardLaunches = launches;

    // ── Stats ──────────────────────────────────────────────────
    const streak = computeStreak(observations);
    const statMap = {
      'stat-active-missions': { val: observations.length,    suffix: '' },
      'stat-crew-deployed':   { val: members.length,          suffix: '' },
      'stat-discoveries':     { val: contributions.length,    suffix: '' },
      'stat-success-rate':    { val: streak,                  suffix: '' }
    };
    Object.entries(statMap).forEach(([id, { val, suffix }]) => {
      const el = document.getElementById(id);
      if (el) animateCounter(el, val, 1500, suffix);
    });

    // ── Sections ───────────────────────────────────────────────
    renderLaunchFeed();
    renderDashTimeline(observations.slice(0, 5));
    renderMiniCrew(members.slice(0, 5));
    setTimeout(() => initDiscoveryChart('discovery-chart', contributions), 300);

  } catch (err) {
    console.error('Dashboard init error:', err);
  }
}

// ── Streak calculator ─────────────────────────────────────────
function computeStreak(observations) {
  if (!observations.length) return 0;
  const days = [...new Set(
    observations.map(o => {
      const d = new Date(o.observedAt || o.datetime || o.date || Date.now());
      return d.toISOString().slice(0, 10);
    })
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

// ── Upcoming launch feed ──────────────────────────────────────
function renderLaunchFeed() {
  const container = document.getElementById('mission-feed');
  if (!container) return;

  if (!liveDashboardLaunches.length) {
    container.innerHTML = '<div class="empty-state" style="font-size:0.8rem;padding:var(--space-md)">No upcoming launches loaded</div>';
    return;
  }

  container.innerHTML = liveDashboardLaunches.map(m => {
    const t = m.netDate ? getCountdownString(m.netDate) : 'TBD';
    return `
    <div class="mission-feed-card card card-brackets">
      <div class="card-body" style="padding:var(--space-md)">
        <div class="mission-title" style="font-weight:bold;font-size:0.9rem;margin-bottom:4px">${m.mission}</div>
        <div style="font-size:0.72rem;color:var(--text-secondary);margin-bottom:8px">🚀 ${m.rocket}</div>
        <div style="font-family:var(--font-mono);font-size:0.7rem;color:var(--accent-primary)">${t}</div>
        <div style="font-size:0.65rem;color:var(--text-dim);margin-top:4px">📍 ${m.site || 'TBD'}</div>
      </div>
    </div>`;
  }).join('');
}

// ── Recent observations timeline ──────────────────────────────
function renderDashTimeline(observations) {
  const container = document.getElementById('dash-timeline');
  if (!container) return;

  if (!observations.length) {
    container.innerHTML = '<div style="color:var(--text-dim);font-size:0.8rem;padding:var(--space-sm)">No observations yet — start your journal!</div>';
    return;
  }

  container.innerHTML = observations.map(o => {
    const name    = o.objectName || o.object || 'Unknown Object';
    const dateStr = formatDate(o.observedAt || o.datetime || o.date);
    return `
    <div class="timeline-item" style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border-subtle)">
      <div style="font-size:1.2rem">${obsTypeIcon(o.objectType || 'Other')}</div>
      <div style="flex:1">
        <div style="font-size:0.88rem;color:#fff;font-weight:500">${name}</div>
        <div style="font-size:0.72rem;color:var(--text-dim);font-family:var(--font-mono)">${dateStr}</div>
      </div>
    </div>`;
  }).join('');
}

// ── Mini club directory ───────────────────────────────────────
function renderMiniCrew(members) {
  const container = document.getElementById('dash-crew');
  if (!container) return;

  if (!members.length) {
    container.innerHTML = '<div style="color:var(--text-dim);font-size:0.8rem;padding:var(--space-sm)">No members yet — add your observing buddies!</div>';
    return;
  }

  container.innerHTML = members.map(m => `
    <div class="mini-crew-row">
      <div class="mini-crew-avatar" style="background:${hashColor(m.name)}">${getInitials(m.name)}</div>
      <div class="mini-crew-info">
        <div class="mini-crew-name">${m.name}</div>
        <div class="mini-crew-role">${(m.role || 'observer').toUpperCase()}</div>
      </div>
    </div>
  `).join('');
}

function obsTypeIcon(type) {
  return { Planet:'🪐', Star:'⭐', Galaxy:'🌌', Nebula:'🌫️', Comet:'☄️', Satellite:'🛰️', Other:'🔭' }[type] || '🔭';
}

// Auto-init
initDashboard();