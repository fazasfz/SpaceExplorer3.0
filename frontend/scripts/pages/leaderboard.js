// ============================================================
// SpaceExplorer 3.0 — Leaderboard Page
// Real points: observations logged + citizen science + streak
// Async backend with localStorage seed fallback
// ============================================================

// Offline seed for leaderboard display when backend is unreachable
const LEADERBOARD_SEED = [
  { _id: 'lb1', username: 'StargazerPriya',  totalPoints: 3200, totalObservations: 48, totalCitizenScience: 12, observationDays: 22, level: 'commander', updatedAt: new Date(Date.now() - 86400000).toISOString() },
  { _id: 'lb2', username: 'OmarDobsonian',   totalPoints: 2450, totalObservations: 35, totalCitizenScience:  7, observationDays: 18, level: 'specialist', updatedAt: new Date(Date.now() - 2*86400000).toISOString() },
  { _id: 'lb3', username: 'SarahNebula',     totalPoints: 1980, totalObservations: 29, totalCitizenScience: 15, observationDays: 14, level: 'specialist', updatedAt: new Date(Date.now() - 3*86400000).toISOString() },
  { _id: 'lb4', username: 'JamesOutreach',   totalPoints: 1340, totalObservations: 20, totalCitizenScience:  4, observationDays: 10, level: 'pilot',      updatedAt: new Date(Date.now() - 5*86400000).toISOString() },
  { _id: 'lb5', username: 'LenaFirstLight',  totalPoints:  420, totalObservations:  8, totalCitizenScience:  1, observationDays:  4, level: 'cadet',      updatedAt: new Date(Date.now() - 7*86400000).toISOString() }
];

function initLeaderboard() {
  loadAndRenderLeaderboard();
  renderAchievements();
  initPointsSystem();
}

async function loadAndRenderLeaderboard() {
  let lb = await getLeaderboardData();
  // Fall back to seed data so the page always shows something
  if (!lb || !lb.length) lb = LEADERBOARD_SEED;

  renderPodium(lb);
  renderLeaderboardTable(lb);
}

// ── Podium ────────────────────────────────────────────────────
function renderPodium(lb) {
  const [gold, silver, bronze] = lb;
  [
    { user: gold,   id: 'podium-1' },
    { user: silver, id: 'podium-2' },
    { user: bronze, id: 'podium-3' }
  ].forEach(({ user, id }) => {
    if (!user) return;
    const el = document.getElementById(id);
    if (!el) return;
    const name = user.username || 'Explorer';
    el.querySelector('.podium-avatar').textContent = getInitials(name.replace(/_/g, ' '));
    el.querySelector('.podium-username').textContent = name;
    el.querySelector('.podium-pts').textContent = (user.totalPoints || 0).toLocaleString() + ' pts';
  });
}

// ── Table ─────────────────────────────────────────────────────
function renderLeaderboardTable(lb) {
  const tbody = document.getElementById('lb-table-body');
  if (!tbody) return;
  const medals = ['🥇', '🥈', '🥉'];

  tbody.innerHTML = lb.map((u, i) => {
    const obs     = u.totalObservations    || 0;
    const cs      = u.totalCitizenScience  || 0;
    const days    = u.observationDays      || 0;
    const pts     = u.totalPoints          || 0;
    const total   = obs + cs + days || 1; // avoid div/0
    const oPct    = Math.round(obs  / total * 100);
    const cPct    = Math.round(cs   / total * 100);
    const dPct    = Math.round(days / total * 100);
    const lastActive = u.updatedAt ? formatDate(u.updatedAt) : '—';
    const level      = u.level || 'cadet';
    const name       = u.username || 'Explorer';

    return `
    <tr class="lb-row" style="animation-delay:${i*50}ms">
      <td class="mono" style="font-weight:700;width:48px">
        ${i < 3 ? medals[i] : `<span style="color:var(--text-dim)">#${i+1}</span>`}
      </td>
      <td>
        <div style="display:flex;align-items:center;gap:var(--space-sm)">
          <div style="width:36px;height:36px;border-radius:50%;background:${hashColorPair(name)};display:flex;align-items:center;justify-content:center;font-family:var(--font-heading);font-size:0.65rem;font-weight:700;color:#fff;flex-shrink:0">${getInitials(name.replace(/_/g,' '))}</div>
          <span style="font-weight:500">${name}</span>
        </div>
      </td>
      <td class="mono" style="color:var(--accent-gold);font-weight:700">${pts.toLocaleString()}</td>
      <td>
        <div style="display:flex;flex-direction:column;gap:2px;font-size:0.68rem;color:var(--text-secondary);font-family:var(--font-mono)">
          <span>🔭 ${obs} obs</span>
          <span>🔬 ${cs} contrib</span>
          <span>🔥 ${days}d streak</span>
        </div>
      </td>
      <td>
        <div style="display:flex;height:8px;border-radius:4px;overflow:hidden;width:100px;gap:1px">
          <div style="width:${oPct}%;background:var(--accent-primary)"></div>
          <div style="width:${cPct}%;background:var(--accent-pulse)"></div>
          <div style="width:${dPct}%;background:var(--accent-gold)"></div>
        </div>
      </td>
      <td><span class="badge ${level}">${level.toUpperCase()}</span></td>
      <td style="font-size:0.72rem;color:var(--text-dim);font-family:var(--font-mono)">${lastActive}</td>
    </tr>`;
  }).join('');
}

// ── Achievement badges (real actions) ─────────────────────────
const ACHIEVEMENTS = [
  { icon: '🔭', label: 'First Log',         desc: 'Log your first observation',           unlocked: true  },
  { icon: '🌟', label: '10 Observations',    desc: 'Log 10 night-sky observations',         unlocked: true  },
  { icon: '🔬', label: 'Citizen Scientist',  desc: 'First citizen science contribution',    unlocked: true  },
  { icon: '🔥', label: '7-Day Streak',       desc: 'Observe 7 nights in a row',            unlocked: false },
  { icon: '🌌', label: 'Galaxy Hunter',      desc: 'Log 5 galaxy observations',            unlocked: false },
  { icon: '🏆', label: 'Top Explorer',       desc: 'Reach #1 on the leaderboard',          unlocked: false },
  { icon: '☄️', label: 'Comet Watcher',      desc: 'Log a comet observation',              unlocked: false },
  { icon: '🪐', label: 'Planet Hunter',      desc: 'Log all 5 visible planets',            unlocked: false },
  { icon: '🌙', label: 'Lunar Mapper',       desc: 'Log 10 lunar feature observations',    unlocked: false },
  { icon: '📸', label: 'Astrophotographer',  desc: 'Attach a photo to an observation',     unlocked: false }
];

function renderAchievements() {
  const container = document.getElementById('achievements-grid');
  if (!container) return;
  container.innerHTML = ACHIEVEMENTS.map(a => `
    <div class="achievement-hex" title="${a.desc}">
      <div class="hex-shape ${a.unlocked ? '' : 'locked'}">${a.icon}${!a.unlocked ? '<div style="position:absolute;top:2px;right:2px;font-size:0.6rem">🔒</div>' : ''}</div>
      <div class="hex-label">${a.label}</div>
    </div>
  `).join('');
}

// ── Points system accordion ───────────────────────────────────
function initPointsSystem() {
  const header = document.getElementById('pts-system-header');
  const body   = document.getElementById('pts-system-body');
  if (!header || !body) return;
  const toggle = document.getElementById('pts-toggle-icon');
  header.addEventListener('click', () => {
    body.classList.toggle('open');
    if (toggle) toggle.textContent = body.classList.contains('open') ? '▲' : '▼';
  });
}
