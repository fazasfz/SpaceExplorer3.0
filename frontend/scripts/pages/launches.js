// ============================================================
// SpaceExplorer 2.0 — Live Launches Page (HTML-Matched Edition)
// ============================================================

let liveLaunchesCache = [];
let recentLaunchesCache = [];
let heroCountdownInterval = null;

/**
 * Core Initialization Module — Fetches Live Rocket Data and Mounts Layout Elements
 */
async function initLaunches() {
  const container = document.getElementById('launch-cards');
  const heroMissionName = document.getElementById('hero-mission-name');
  
  // if (container) {
  //   container.innerHTML = '<div style="font-family:var(--font-mono); padding:var(--space-md); color:var(--accent-primary);">⚡ ESTABLISHING DOWNLINK WITH LAUNCH LIBRARY 2...</div>';
  // }
  // if (heroMissionName) {
  //   heroMissionName.textContent = "RETRIEVING APEX TELEMETRY...";
  // }

  try {
    // 1. Clear any duplicate background runners safely
    if (heroCountdownInterval) clearInterval(heroCountdownInterval);
    if (window.activeLaunchesPageInterval) clearInterval(window.activeLaunchesPageInterval);

    // 2. Fetch directly from the Production Launch Library 2 API
    // Requesting top 5 upcoming orbital space flights
    const liveResponse = await fetch('https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=5');
    if (!liveResponse.ok) throw new Error('Downlink telemetry response degraded.');
    const liveData = await liveResponse.json();
    const rawUpcomingList = liveData.results || [];

    // 3. Map Live API response directly into your app design caching metrics
    liveLaunchesCache = rawUpcomingList.map(item => ({
      id: item.id,
      mission: item.mission?.name || item.name || "Orbital Flight Test",
      rocket: item.rocket?.configuration?.full_name || "Commercial Launch Vehicle",
      site: item.pad?.location?.name || item.pad?.name || "Global Range Vector",
      provider: item.launch_service_provider?.name || "International Aerospace",
      netDate: item.net || item.window_start,
      status: (item.status?.abbrev || "go").toLowerCase(),
      missionType: item.mission?.type || "Orbital"
    }));

    // 4. Fetch the most recent past deployments to power the history slider component
    try {
      const pastResponse = await fetch('https://lldev.thespacedevs.com/2.2.0/launch/previous/?limit=4');
      if (pastResponse.ok) {
        const pastData = await pastResponse.json();
        const rawPastList = pastData.results || [];
        recentLaunchesCache = rawPastList.map(item => ({
          mission: item.mission?.name || item.name || "Completed Assignment",
          rocket: item.rocket?.configuration?.name || "Falcon 9",
          provider: item.launch_service_provider?.name || "SpaceX",
          netDate: item.net || item.window_start,
          outcome: item.mission?.description || "Mission objective fulfilled successfully."
        }));
      }
    } catch (pastErr) {
      console.warn("Could not retrieve past missions, using fallback cards:", pastErr);
      recentLaunchesCache = [];
    }

    // 5. Hardcoded Fallback Safe-switch if the development live API fails/times out
    if (!liveLaunchesCache || liveLaunchesCache.length === 0) {
      liveLaunchesCache = [
        {
          id: "local-fallback-1",
          mission: "Starlink Operational Fleet Deployment",
          rocket: "Falcon 9 Block 5",
          site: "CCSFS SLC-40, Florida",
          provider: "SpaceX",
          netDate: new Date(Date.now() + 150000000).toISOString(),
          status: "go",
          missionType: "Communications"
        }
      ];
    }

    // 6. Build out all matching screen components dynamically
    renderLaunchHero();
    renderLaunchCards();
    renderRecentLaunches();
    renderLaunchCalendar();

    // 7. Initiate active real-time card updates
    startSecondaryTickers();

  } catch (error) {
    console.error("Caught terminal setup error inside launches.js:", error);
    if (container) {
      container.innerHTML = `<div style="color:var(--accent-warn); font-family:var(--font-mono); padding:var(--space-md);">[CRITICAL] SYSTEM OVERLOAD — DOWNLINK DEGRADED<br><small style="color:var(--text-dim)">${error.message}</small></div>`;
    }
  }
}

// function renderLaunchHero() {
//   const next = liveLaunchesCache[0];
//   const nameEl = document.getElementById('hero-mission-name');
//   const rocketEl = document.getElementById('hero-rocket');
  
//   if (!next) {
//     if (nameEl) nameEl.textContent = 'NO UPCOMING TELEMETRY TRACKED';
//     return;
//   }
  
//   if (nameEl) nameEl.textContent = next.mission.toUpperCase();
//   if (rocketEl) rocketEl.textContent = `${next.rocket} · ${next.site}`;
  
//   // Launch primary dynamic ticker counter
//   runHeroTimer(next.netDate);
// }

function renderLaunchHero() {
  const nameEl = document.getElementById('hero-mission-name');
  const rocketEl = document.getElementById('hero-rocket');
  const now = new Date().getTime();

  // 1. Safety check: Handle empty or unpopulated caches gracefully
  if (!liveLaunchesCache || liveLaunchesCache.length === 0) {
    if (nameEl) nameEl.textContent = 'NO UPCOMING TELEMETRY TRACKED';
    return;
  }

  // 2. Dynamic Filtration Check: Find only missions that are still in the future, sorted by proximity
  const validFutureLaunches = liveLaunchesCache
    .filter(launch => {
      const launchTime = new Date(launch.netDate).getTime();
      return launchTime > now;
    })
    .sort((a, b) => new Date(a.netDate).getTime() - new Date(b.netDate).getTime());

  // 3. Fallback check if all missions in the active array have reached zero/elapsed
  if (validFutureLaunches.length === 0) {
    if (nameEl) nameEl.textContent = 'ALL MISSIONS DEPLOYED';
    if (rocketEl) rocketEl.textContent = 'Awaiting next launch cycle telemetry...';
    
    // Clear out standard digital grid outputs safely
    ['cd-days', 'cd-hours', 'cd-mins', 'cd-secs'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '00';
    });
    if (typeof heroCountdownInterval !== 'undefined') clearInterval(heroCountdownInterval);
    return;
  }

  // 4. Bind the closest upcoming mission profile directly to the Hero element variables
  const nextActiveMission = validFutureLaunches[0];
  
  if (nameEl) nameEl.textContent = nextActiveMission.mission.toUpperCase();
  if (rocketEl) rocketEl.textContent = `${nextActiveMission.rocket} · ${nextActiveMission.site}`;
  
  // 5. Fire your primary dynamic ticker count matching the active target epoch 
  runHeroTimer(nextActiveMission.netDate);
}

function runHeroTimer(targetIsoString) {
  const targetDate = new Date(targetIsoString).getTime();
  
  const dayEl = document.getElementById('cd-days');
  const hourEl = document.getElementById('cd-hours');
  const minEl = document.getElementById('cd-mins');
  const secEl = document.getElementById('cd-secs');

  function updateClock() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      if (dayEl) dayEl.textContent = "00";
      if (hourEl) hourEl.textContent = "00";
      if (minEl) minEl.textContent = "00";
      if (secEl) secEl.textContent = "00";
      clearInterval(heroCountdownInterval);
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (dayEl) dayEl.textContent = String(days).padStart(2, '0');
    if (hourEl) hourEl.textContent = String(hours).padStart(2, '0');
    if (minEl) minEl.textContent = String(minutes).padStart(2, '0');
    if (secEl) secEl.textContent = String(seconds).padStart(2, '0');
  }

  updateClock();
  heroCountdownInterval = setInterval(updateClock, 1000);
}

function renderLaunchCards() {
  const container = document.getElementById('launch-cards');
  if (!container) return;
  
  container.innerHTML = liveLaunchesCache.map((l, i) => {
    const initials = l.provider ? l.provider.split(' ').map(w => w[0]).slice(0, 2).join('') : "SP";
    const followed = typeof isFollowed === 'function' ? isFollowed(l.id) : false;
    const badgeClass = l.status ? l.status.replace(' ', '-') : 'go';
    
    const dateObj = new Date(l.netDate);
    const displayDate = isNaN(dateObj.getTime()) ? l.netDate : dateObj.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    return `
    <div class="card card-brackets" style="display:flex; flex-direction:column; justify-content:space-between; padding:var(--space-md); background:rgba(20,24,35,0.4); border:1px solid var(--border-subtle);">
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-sm)">
          <div style="background:#1c2333; border:1px solid var(--accent-primary); color:var(--accent-primary); width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-weight:bold; border-radius:4px; font-size:0.75rem; font-family:var(--font-mono);">${initials}</div>
          <span style="font-size:0.7rem; color:var(--text-dim); font-family:var(--font-mono)">${l.provider || "Agency"}</span>
        </div>
        <div style="font-weight:bold; font-size:1.05rem; margin-bottom:4px; color:#fff; font-family:var(--font-heading);">${l.mission}</div>
        <div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:2px">🚀 ${l.rocket}</div>
        <div style="font-size:0.8rem; color:var(--text-dim); margin-bottom:var(--space-sm); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">📍 ${l.site}</div>
        
        <div style="display:flex; align-items:center; gap:6px; margin-bottom:var(--space-md)">
          <span class="badge ${badgeClass}"><span class="status-dot ${badgeClass}"></span>${badgeClass.toUpperCase()}</span>
          <span class="badge low">${l.missionType || "Orbital"}</span>
        </div>
      </div>

      <div style="margin-top:auto;">
        <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--accent-primary); margin-bottom:4px;">${displayDate}</div>
        <div class="live-card-ticker" id="card-ticker-${l.id ? l.id.replace(/[^a-zA-Z0-9]/g, '') : i}" data-target="${l.netDate}" style="font-family:var(--font-mono); font-size:0.85rem; color:var(--accent-pulse); margin-bottom:var(--space-sm);">Syncing clock...</div>
        
        <button class="follow-btn ${followed ? 'followed' : ''}" style="width:100%; padding:8px; cursor:pointer; font-family:var(--font-mono); font-size:0.75rem;" onclick="toggleLiveFollow('${l.id}', this)">
          ${followed ? '★ Following' : '☆ Follow Launch'}
        </button>
      </div>
    </div>`;
  }).join('');
}

function renderRecentLaunches() {
  const container = document.getElementById('recent-launches');
  if (!container) return;
  
  if (!recentLaunchesCache || !recentLaunchesCache.length) {
    container.innerHTML = '<div style="color:var(--text-secondary); font-size:0.82rem; padding:var(--space-md);">No recent deployment history logged.</div>'; 
    return; 
  }

  container.innerHTML = recentLaunchesCache.map(l => {
    const initials = l.provider ? l.provider.split(' ').map(w => w[0]).slice(0, 2).join('') : "SP";
    const outcomeTruncated = l.outcome && l.outcome.length > 90 ? l.outcome.slice(0, 90) + '...' : l.outcome;
    const dateObj = new Date(l.netDate);
    const displayDate = isNaN(dateObj.getTime()) ? l.netDate : dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

    return `
    <div class="card" style="min-width:280px; padding:var(--space-md); background:rgba(255,255,255,0.01); display:flex; flex-direction:column; justify-content:space-between; border:1px solid var(--border-subtle);">
      <div>
        <div style="display:flex; gap:var(--space-sm); align-items:center; margin-bottom:var(--space-sm)">
          <div style="width:32px; height:32px; border-radius:4px; background:#141822; border:1px solid var(--border-subtle); display:flex; align-items:center; justify-content:center; font-family:var(--font-mono); font-size:0.7rem; font-weight:700; color:var(--accent-primary); flex-shrink:0">${initials}</div>
          <div style="overflow:hidden;">
            <div style="font-family:var(--font-heading); font-size:0.85rem; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:#fff">${l.mission}</div>
            <div style="font-size:0.7rem; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${l.rocket}</div>
          </div>
        </div>
        <span class="badge launched" style="background:rgba(0,255,204,0.08); color:var(--accent-pulse); border:1px solid rgba(0,255,204,0.15); font-size:0.65rem;">✓ TERMINAL SUCCESS</span>
        <div style="font-size:0.78rem; color:var(--text-dim); margin-top:var(--space-sm); line-height:1.4">${outcomeTruncated}</div>
      </div>
      <div style="font-family:var(--font-mono); font-size:0.65rem; color:var(--text-dim); margin-top:8px; border-top:1px dashed var(--border-subtle); padding-top:6px;">
        ${displayDate}
      </div>
    </div>`;
  }).join('');
}
function renderLaunchCalendar() {
  const container = document.getElementById('launch-calendar-grid');
  if (!container) return;

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  
  // Dynamic Shift: If we have upcoming launches, shift the calendar focus
  // to the month of the nearest pending launch so the user actually sees the timeline!
  if (liveLaunchesCache && liveLaunchesCache.length > 0) {
    const nextTargetDate = new Date(liveLaunchesCache[0].netDate);
    if (!isNaN(nextTargetDate.getTime())) {
      year = nextTargetDate.getFullYear();
      month = nextTargetDate.getMonth();
    }
  }
  
  const titleEl = document.getElementById('cal-month-title');
  if (titleEl) {
    // Dynamically update the header title (e.g., "JUNE 2026")
    titleEl.textContent = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase();
  }

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarLaunchMap = {};
  liveLaunchesCache.forEach(l => {
    const d = new Date(l.netDate);
    if (d.getMonth() === month && d.getFullYear() === year) {
      const dayNum = d.getDate();
      if (!calendarLaunchMap[dayNum]) calendarLaunchMap[dayNum] = [];
      calendarLaunchMap[dayNum].push(l);
    }
  });

  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  let html = dayNames.map(d => `<div class="cal-day-name" style="font-family:var(--font-mono); font-size:0.65rem; color:var(--text-secondary); text-align:center; padding:4px 0;">${d}</div>`).join('');

  for (let i = 0; i < firstDayIndex; i++) {
    html += `<div class="cal-day empty" style="opacity:0.15;"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    // Check against actual system today date only if year/month match exactly
    const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
    const matches = calendarLaunchMap[day];
    const hasLaunch = !!matches;
    const tooltipText = hasLaunch ? matches.map(m => `• ${m.mission}`).join('\n') : 'No Operations';

    html += `
      <div class="cal-day ${isToday ? 'today' : ''} ${hasLaunch ? 'has-launch' : ''}" 
           title="${tooltipText}"
           style="position:relative; padding:6px; border:1px solid var(--border-subtle); min-height:42px; font-family:var(--font-mono); font-size:0.75rem; background:${isToday ? 'rgba(0,212,255,0.06)' : 'transparent'}">
        <span style="color:${isToday ? 'var(--accent-primary)' : '#fff'}">${day}</span>
        ${hasLaunch ? `<div style="position:absolute; bottom:4px; right:4px; width:5px; height:5px; border-radius:50%; background:var(--accent-pulse); box-shadow:0 0 4px var(--accent-pulse);"></div>` : ''}
      </div>
    `;
  }
  
  container.innerHTML = html;
}

function toggleLiveFollow(id, btn) {
  if (typeof toggleFollowLaunch === 'function') {
    toggleFollowLaunch(id);
    const followed = typeof isFollowed === 'function' ? isFollowed(id) : false;
    btn.classList.toggle('followed', followed);
    btn.textContent = followed ? '★ Following' : '☆ Follow Launch';
  }
}

function startSecondaryTickers() {
  function runTick() {
    let needsNetworkRefresh = false;
    const now = new Date().getTime();

    document.querySelectorAll('.live-card-ticker').forEach(el => {
      const target = el.getAttribute('data-target');
      if (target) {
        const targetTime = new Date(target).getTime();
        const diff = targetTime - now;
        
        if (diff < 0) {
          // ── SMART CHECK ──
          // Only trigger a refresh if the card was actively counting down 
          // and JUST hit zero while open on the screen.
          const currentText = el.textContent;
          if (currentText !== "LIFTOFF DETECTED" && currentText !== "Syncing clock..." && currentText !== "") {
            // This means it transitioned from a live countdown to past-due right now!
            needsNetworkRefresh = true;
          }
          
          el.textContent = "LIFTOFF DETECTED";
          return;
        }
        
        // Calculate standard counting variables
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        
        el.textContent = `${d}d ${h}h ${m}m ${s}s`;
      }
    });

    // Fire network reload only on live transition milestones
    if (needsNetworkRefresh) {
      console.log("Mission countdown reached T-0 live. Re-initializing telemetry downlinks...");
      if (window.activeLaunchesPageInterval) clearInterval(window.activeLaunchesPageInterval);
      
      setTimeout(() => {
        initLaunches();
      }, 5000); // 5 second buffer to let the API data cache clear historical items
    }
  }
  
  // Clear any existing active runner intervals safely before assigning a new one
  if (window.activeLaunchesPageInterval) clearInterval(window.activeLaunchesPageInterval);
  
  runTick();
  window.activeLaunchesPageInterval = setInterval(runTick, 1000);
}
