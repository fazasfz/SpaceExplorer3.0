// ============================================================
// SpaceExplorer 3.0 — API Bridge
// All backend calls go through here. Falls back to offline
// mode (localStorage cache) when server is unreachable.
// ============================================================

const API_BASE = 'http://localhost:5000/api';

// ── Auth helpers ─────────────────────────────────────────────
function getToken() { return localStorage.getItem('se_token'); }
function getUser()  {
  try { return JSON.parse(localStorage.getItem('se_user') || 'null'); } catch { return null; }
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': getToken() ? `Bearer ${getToken()}` : ''
  };
}

// ── Offline fallback core ─────────────────────────────────────
// If the backend is unreachable, every getter falls back to
// localStorage. Every poster writes to localStorage too.
async function apiGet(path, localKey = null) {
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // Cache successful responses locally for offline reuse
    if (localKey) localStorage.setItem(localKey, JSON.stringify(data));
    return { online: true, data };
  } catch {
    if (localKey) {
      const cached = localStorage.getItem(localKey);
      return { online: false, data: cached ? JSON.parse(cached) : [] };
    }
    return { online: false, data: [] };
  }
}

async function apiPost(path, body, localKey = null, offlineFn = null) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    // Bust cache on successful write
    if (localKey) {
      const cached = JSON.parse(localStorage.getItem(localKey) || '[]');
      localStorage.setItem(localKey, JSON.stringify([data, ...cached]));
    }
    return { online: true, data };
  } catch (err) {
    // Offline write: store locally and flag for later sync
    if (offlineFn) {
      const data = offlineFn();
      return { online: false, data };
    }
    throw err; // re-throw for auth errors etc.
  }
}

// ── AUTH ──────────────────────────────────────────────────────
async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Login failed');
  localStorage.setItem('se_token', data.token);
  localStorage.setItem('se_user', JSON.stringify(data.user));
  // Legacy key support
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data.user;
}

async function registerUser(username, email, password, role) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password, role })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Registration failed');
  localStorage.setItem('se_token', data.token);
  localStorage.setItem('se_user', JSON.stringify(data.user));
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data.user;
}

async function getMe() {
  const { data } = await apiGet('/auth/me');
  return data;
}

function logoutUser() {
  ['se_token','se_user','token','user'].forEach(k => localStorage.removeItem(k));
}

// ── OBSERVATIONS ──────────────────────────────────────────────
async function getObservations() {
  if (!getToken()) {
    // Offline / not logged in — use local cache
    const local = localStorage.getItem('se_observations_local');
    return local ? JSON.parse(local) : [];
  }
  const { data } = await apiGet('/observations', 'se_observations_cache');
  return Array.isArray(data) ? data : [];
}

async function addObservation(obsData) {
  const CACHE_KEY = 'se_observations_local';
  if (!getToken()) {
    // Offline mode — save to local journal only
    const local = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    const entry = { ...obsData, _id: 'local_' + Date.now(), observedAt: new Date().toISOString() };
    local.unshift(entry);
    localStorage.setItem(CACHE_KEY, JSON.stringify(local));
    return entry;
  }
  const { data } = await apiPost('/observations', obsData, 'se_observations_cache', () => {
    const local = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    const entry = { ...obsData, _id: 'local_' + Date.now(), observedAt: new Date().toISOString() };
    local.unshift(entry);
    localStorage.setItem(CACHE_KEY, JSON.stringify(local));
    return entry;
  });
  // Also update the local cache so offline reads stay fresh
  const localAll = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
  if (!localAll.find(x => x._id === data._id)) localAll.unshift(data);
  localStorage.setItem(CACHE_KEY, JSON.stringify(localAll));
  return data;
}

// ── COMMUNITY DIRECTORY (Crew) ────────────────────────────────
async function getClubMembers() {
  const { data } = await apiGet('/crew', 'se_crew_cache');
  return Array.isArray(data) ? data : [];
}

async function addClubMember(memberData) {
  const CACHE_KEY = 'se_crew_cache';
  if (!getToken()) {
    const local = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    const entry = { ...memberData, _id: 'local_' + Date.now(), joinedAt: new Date().toISOString() };
    local.unshift(entry);
    localStorage.setItem(CACHE_KEY, JSON.stringify(local));
    return entry;
  }
  const { data } = await apiPost('/crew', memberData, CACHE_KEY, () => {
    const local = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    const entry = { ...memberData, _id: 'local_' + Date.now(), joinedAt: new Date().toISOString() };
    local.unshift(entry);
    localStorage.setItem(CACHE_KEY, JSON.stringify(local));
    return entry;
  });
  return data;
}

// ── CITIZEN SCIENCE ────────────────────────────────────────────
async function getCitizenContributions() {
  if (!getToken()) {
    const local = localStorage.getItem('se_citizen_local');
    return local ? JSON.parse(local) : [];
  }
  const { data } = await apiGet('/citizen', 'se_citizen_cache');
  return Array.isArray(data) ? data : [];
}

async function addCitizenContribution(contribData) {
  const CACHE_KEY = 'se_citizen_local';
  if (!getToken()) {
    const local = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    const entry = { ...contribData, _id: 'local_' + Date.now(), date: new Date().toISOString() };
    local.unshift(entry);
    localStorage.setItem(CACHE_KEY, JSON.stringify(local));
    return entry;
  }
  const { data } = await apiPost('/citizen', contribData, CACHE_KEY, () => {
    const local = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    const entry = { ...contribData, _id: 'local_' + Date.now(), date: new Date().toISOString() };
    local.unshift(entry);
    localStorage.setItem(CACHE_KEY, JSON.stringify(local));
    return entry;
  });
  return data;
}

// ── LAUNCHES (SpaceDevs public API) ───────────────────────────
async function getLaunches(limit = 5) {
  try {
    const res = await fetch(`https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=${limit}`);
    if (!res.ok) throw new Error('Launch API unavailable');
    const data = await res.json();
    const mapped = (data.results || []).map(item => ({
      id:          item.id,
      mission:     item.mission?.name || item.name || 'Orbital Flight',
      rocket:      item.rocket?.configuration?.full_name || 'Launch Vehicle',
      site:        item.pad?.location?.name || item.pad?.name || 'Launch Site',
      provider:    item.launch_service_provider?.name || 'Provider TBD',
      netDate:     item.net || item.window_start,
      status:      (item.status?.abbrev || 'go').toLowerCase(),
      missionType: item.mission?.type || 'Orbital'
    }));
    localStorage.setItem('se_launches_cache', JSON.stringify(mapped));
    return mapped;
  } catch {
    const cached = localStorage.getItem('se_launches_cache');
    return cached ? JSON.parse(cached) : [];
  }
}

async function getRecentLaunches(limit = 4) {
  try {
    const res = await fetch(`https://lldev.thespacedevs.com/2.2.0/launch/previous/?limit=${limit}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    return (data.results || []).map(item => ({
      mission:  item.mission?.name || item.name || 'Completed Mission',
      rocket:   item.rocket?.configuration?.name || 'Unknown Vehicle',
      provider: item.launch_service_provider?.name || 'Unknown',
      netDate:  item.net || item.window_start,
      outcome:  item.mission?.description || 'Mission completed.'
    }));
  } catch { return []; }
}

// ── LEADERBOARD ────────────────────────────────────────────────
async function getLeaderboardData() {
  const { data } = await apiGet('/leaderboard', 'se_leaderboard_cache');
  return Array.isArray(data) ? data : [];
}

// ── FOLLOWED LAUNCHES (personal tracking) ─────────────────────
async function getFollowedLaunches() {
  if (!getToken()) return [];
  const { data } = await apiGet('/launches', 'se_followed_launches');
  return Array.isArray(data) ? data : [];
}

async function followLaunch(launchId) {
  if (!getToken()) return null;
  const { data } = await apiPost('/launches', { launchId });
  return data;
}