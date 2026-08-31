// ============================================================
// SpaceExplorer 2.0 — Countdown & Mission Clock
// ============================================================

// Helper parsing function to guarantee strings are updated gracefully if missing in utilities
function getCountdownString(targetDate) {
  const diff = new Date(targetDate) - new Date();
  if (diff <= 0) return "🚀 LIFTOFF / EN ROUTE";
  
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  
  if (d > 0) return `T-${d}d ${h}h ${m}m`;
  return `T-${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// ── Mission Clock ─────────────────────────────────────────────
// Counts up from a fixed launch date (Artemis IX)
const MISSION_EPOCH = new Date('2026-01-01T00:00:00Z').getTime();

function startMissionClock() {
  const el = document.getElementById('mission-clock-value');
  if (!el) return;
  function tick() {
    const now = Date.now();
    const elapsed = now - MISSION_EPOCH;
    const d = Math.floor(elapsed / 86400000);
    const h = Math.floor((elapsed % 86400000) / 3600000);
    const m = Math.floor((elapsed % 3600000) / 60000);
    const s = Math.floor((elapsed % 60000) / 1000);
    el.textContent = `MET ${String(d).padStart(3,'0')}:${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  tick();
  setInterval(tick, 1000);
}

// ── Countdown Timers on Mission Cards ─────────────────────────
const countdownIntervals = {};

function startCountdown(elId, targetDate) {
  if (countdownIntervals[elId]) clearInterval(countdownIntervals[elId]);
  const el = document.getElementById(elId);
  if (!el) return;
  function tick() {
    el.textContent = getCountdownString(targetDate);
  }
  tick();
  countdownIntervals[elId] = setInterval(tick, 1000);
}

function clearAllCountdowns() {
  Object.values(countdownIntervals).forEach(clearInterval);
  Object.keys(countdownIntervals).forEach(k => delete countdownIntervals[k]);
}

// ── Hero Launch Dynamic Selection Engine ───────────────────────
let heroCDInterval = null;

function initHeroLaunchSequence() {
  if (heroCDInterval) clearInterval(heroCDInterval);

  function tick() {
    const now = new Date().getTime();
    
    // Fallback error-check matching space telemetry array handles
    if (typeof upcomingLaunches === 'undefined' || upcomingLaunches.length === 0) {
      const rocketEl = document.getElementById('hero-rocket');
      if (rocketEl) rocketEl.textContent = "Awaiting mission matrix data array...";
      return;
    }

    // Filter array to strip past epochs and sort by closest chronological window
    const activeFutureLaunches = upcomingLaunches
      .filter(launch => {
        const launchTime = new Date(launch.date || launch.net).getTime();
        return launchTime > now;
      })
      .sort((a, b) => {
        return new Date(a.date || a.net).getTime() - new Date(b.date || b.net).getTime();
      });

    // Handle complete system cycle fallback if everything is launched
    if (activeFutureLaunches.length === 0) {
      const nameEl = document.getElementById('hero-mission-name');
      const rocketEl = document.getElementById('hero-rocket');
      if (nameEl) nameEl.textContent = "ALL MISSIONS DEPLOYED";
      if (rocketEl) rocketEl.textContent = "Awaiting next launch cycle telemetry...";
      
      ['cd-days', 'cd-hours', 'cd-mins', 'cd-secs'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = "00";
      });
      return;
    }

    // Select target matrix fields
    const currentActiveLaunch = activeFutureLaunches[0];
    const targetTime = new Date(currentActiveLaunch.date || currentActiveLaunch.net).getTime();
    const diff = targetTime - now;

    // Update Banner descriptive strings dynamically
    const nameEl = document.getElementById('hero-mission-name');
    const rocketEl = document.getElementById('hero-rocket');
    if (nameEl && nameEl.textContent !== currentActiveLaunch.name.toUpperCase()) {
      nameEl.textContent = currentActiveLaunch.name.toUpperCase();
    }
    if (rocketEl) {
      const subTextStr = `${currentActiveLaunch.rocket} • ${currentActiveLaunch.location || 'Global Range'}`;
      if (rocketEl.textContent !== subTextStr) {
        rocketEl.textContent = subTextStr;
      }
    }

    // Calculate time segments
    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000) / 60000);
    const secs  = Math.floor((diff % 60000) / 1000);

    // Dom digital injection update with flip animation hooks
    const updateDigitBox = (id, val) => {
      const el = document.getElementById(id);
      if (el) {
        const str = String(val).padStart(2, '0');
        if (el.textContent !== str) {
          el.style.animation = 'none';
          requestAnimationFrame(() => {
            el.style.animation = 'flip-digit 0.3s ease';
          });
          el.textContent = str;
        }
      }
    };

    updateDigitBox('cd-days',  days);
    updateDigitBox('cd-hours', hours);
    updateDigitBox('cd-mins',  mins);
    updateDigitBox('cd-secs',  secs);
  }

  tick();
  heroCDInterval = setInterval(tick, 1000);
}