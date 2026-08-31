// ============================================================
// SpaceExplorer 3.0 — Search & Database Page
// Searches real data: Observations, Club Members, Citizen
// Science, and Launches. No fictional missions.
// ============================================================

let searchCat   = 'all';
let searchQuery = '';
let dbTabActive = 'observations';

function initSearch() {
  initSearchInput();
  initCategoryPills();
  initDbTabs();
  renderDbTable('observations');
  animatePlaceholder();
}

const SEARCH_PLACEHOLDERS = [
  'Search observations...', 'Find a club member...', 'Look up a citizen science contribution...', 'Search launches...'
];
let phIdx = 0;
function animatePlaceholder() {
  const input = document.getElementById('main-search-input');
  if (!input) return;
  setInterval(() => {
    phIdx = (phIdx + 1) % SEARCH_PLACEHOLDERS.length;
    input.placeholder = SEARCH_PLACEHOLDERS[phIdx];
  }, 2500);
}

function initSearchInput() {
  const input = document.getElementById('main-search-input');
  if (!input) return;
  input.addEventListener('input', typeof debounce === 'function' ? debounce(() => {
    searchQuery = input.value.trim();
    renderSearchResults();
  }, 300) : () => { searchQuery = input.value.trim(); renderSearchResults(); });
}

function initCategoryPills() {
  document.querySelectorAll('.category-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      searchCat = pill.dataset.cat;
      renderSearchResults();
    });
  });
}

async function renderSearchResults() {
  const container = document.getElementById('search-results');
  if (!container) return;
  if (!searchQuery) { container.innerHTML = ''; return; }

  const q = searchQuery.toLowerCase();

  // Load all data concurrently
  const [obs, members, contribs, launches] = await Promise.all([
    getObservations(),
    getClubMembers(),
    getCitizenContributions(),
    getLaunches(10)
  ]);

  const results = {
    observations: [],
    crew: [],
    discoveries: [],
    launches: []
  };

  if (searchCat === 'all' || searchCat === 'observations') {
    results.observations = obs.filter(o => {
      const name = (o.objectName || o.object || '').toLowerCase();
      const loc  = (o.locationName || o.location || '').toLowerCase();
      const notes = (o.notes || '').toLowerCase();
      return name.includes(q) || loc.includes(q) || notes.includes(q);
    });
  }
  if (searchCat === 'all' || searchCat === 'crew') {
    results.crew = members.filter(m => {
      return (m.name || '').toLowerCase().includes(q)
          || (m.role || '').toLowerCase().includes(q)
          || (m.location || '').toLowerCase().includes(q)
          || (m.equipment || '').toLowerCase().includes(q);
    });
  }
  if (searchCat === 'all' || searchCat === 'discoveries') {
    results.discoveries = contribs.filter(c => {
      return (c.programName || '').toLowerCase().includes(q)
          || (c.programId || '').toLowerCase().includes(q)
          || (c.description || '').toLowerCase().includes(q);
    });
  }
  if (searchCat === 'all' || searchCat === 'launches') {
    results.launches = launches.filter(l => {
      return (l.mission || '').toLowerCase().includes(q)
          || (l.rocket || '').toLowerCase().includes(q)
          || (l.provider || '').toLowerCase().includes(q);
    });
  }

  const total = Object.values(results).reduce((s, a) => s + a.length, 0);
  if (!total) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">No Results</div><div class="empty-desc">Try a different search term or category.</div></div>';
    return;
  }

  let html = '';

  if (results.observations.length) {
    html += `<div class="search-result-group" style="margin-bottom:var(--space-lg)"><h3>🔭 Observations (${results.observations.length})</h3>`;
    html += results.observations.map(o => {
      const name = o.objectName || o.object || 'Unknown';
      const loc  = o.locationName || o.location || 'Unknown location';
      const see  = o.seeing || 'good';
      return `<div class="search-result-item" onclick="navigateTo('observations')">
        <div class="result-type-icon">🔭</div>
        <div><div class="result-name">${name}</div><div class="result-desc">${loc} · ${see} seeing</div></div>
        <button class="btn btn-ghost btn-sm result-view" onclick="event.stopPropagation();navigateTo('observations')">View</button>
      </div>`;
    }).join('');
    html += '</div>';
  }

  if (results.crew.length) {
    html += `<div class="search-result-group" style="margin-bottom:var(--space-lg)"><h3>👥 Club Members (${results.crew.length})</h3>`;
    html += results.crew.map(m => `
      <div class="search-result-item" onclick="navigateTo('crew')">
        <div class="result-type-icon">👥</div>
        <div><div class="result-name">${m.name}</div><div class="result-desc">${(m.role||'observer').toUpperCase()} · ${m.location || 'Location N/A'}</div></div>
        <button class="btn btn-ghost btn-sm result-view" onclick="event.stopPropagation();navigateTo('crew')">View</button>
      </div>`).join('');
    html += '</div>';
  }

  if (results.discoveries.length) {
    html += `<div class="search-result-group" style="margin-bottom:var(--space-lg)"><h3>🔬 Citizen Science (${results.discoveries.length})</h3>`;
    html += results.discoveries.map(c => `
      <div class="search-result-item" onclick="navigateTo('discoveries')">
        <div class="result-type-icon">🔬</div>
        <div><div class="result-name">${c.programName || c.programId}</div><div class="result-desc">${(c.description || '').slice(0, 80)}</div></div>
        <button class="btn btn-ghost btn-sm result-view" onclick="event.stopPropagation();navigateTo('discoveries')">View</button>
      </div>`).join('');
    html += '</div>';
  }

  if (results.launches.length) {
    html += `<div class="search-result-group" style="margin-bottom:var(--space-lg)"><h3>🚀 Launches (${results.launches.length})</h3>`;
    html += results.launches.map(l => `
      <div class="search-result-item" onclick="navigateTo('launches')">
        <div class="result-type-icon">🚀</div>
        <div><div class="result-name">${l.mission}</div><div class="result-desc">${l.rocket} · ${l.provider}</div></div>
        <button class="btn btn-ghost btn-sm result-view" onclick="event.stopPropagation();navigateTo('launches')">View</button>
      </div>`).join('');
    html += '</div>';
  }

  container.innerHTML = html;
}

function initDbTabs() {
  document.querySelectorAll('.db-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.db-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      dbTabActive = tab.dataset.table;
      renderDbTable(dbTabActive);
    });
  });
}

async function renderDbTable(type) {
  const container = document.getElementById('db-table-container');
  if (!container) return;

  // Show loading state
  container.innerHTML = '<div style="padding:var(--space-md);color:var(--text-dim);font-family:var(--font-mono);font-size:0.75rem">LOADING DATABASE...</div>';

  const configs = {
    observations: {
      cols: ['Object', 'Type', 'Location', 'Equipment', 'Seeing', 'Date'],
      data: await getObservations(),
      row: o => [
        o.objectName || o.object || '—',
        o.objectType || '—',
        o.locationName || o.location || '—',
        o.equipment || '—',
        `<span class="badge ${o.seeing === 'excellent' ? 'active' : o.seeing === 'good' ? 'completed' : 'hold'}">${(o.seeing || 'good').toUpperCase()}</span>`,
        formatDate((o.observedAt || o.datetime || '').split('T')[0])
      ]
    },
    crew: {
      cols: ['Name', 'Role', 'Equipment', 'Location', 'Joined'],
      data: await getClubMembers(),
      row: m => [
        m.name || '—',
        `<span class="badge ${m.role || 'observer'}">${(m.role || 'observer').toUpperCase()}</span>`,
        m.equipment || '—',
        m.location || '—',
        formatDate((m.joinedAt || m.createdAt || '').split('T')[0])
      ]
    },
    discoveries: {
      cols: ['Program', 'Contribution', 'Link', 'Date'],
      data: await getCitizenContributions(),
      row: c => [
        c.programName || c.programId || '—',
        (c.description || '—').slice(0, 80) + (c.description?.length > 80 ? '…' : ''),
        c.link ? `<a href="${c.link}" target="_blank" style="color:var(--accent-primary);font-size:0.75rem">↗ Open</a>` : '—',
        formatDate((c.date || c.createdAt || '').split('T')[0])
      ]
    },
    launches: {
      cols: ['Mission', 'Rocket', 'Provider', 'Site', 'Launch Date', 'Status'],
      data: await getLaunches(12),
      row: l => [
        l.mission,
        l.rocket,
        l.provider,
        l.site,
        formatDate(l.netDate ? l.netDate.split('T')[0] : ''),
        `<span class="badge ${l.status === 'go' ? 'active' : l.status}">${(l.status || 'tbd').toUpperCase()}</span>`
      ]
    }
  };

  const cfg = configs[type];
  if (!cfg) { container.innerHTML = ''; return; }

  const filterEl = document.getElementById('db-filter-input');
  const filterVal = filterEl ? filterEl.value.toLowerCase() : '';
  let data = cfg.data;
  if (filterVal) {
    data = data.filter(item => Object.values(item).some(v => String(v || '').toLowerCase().includes(filterVal)));
  }

  container.innerHTML = `
  <div style="margin-bottom:var(--space-sm)">
    <input class="form-input" id="db-filter-input" placeholder="Filter ${type}..." style="max-width:300px" value="${filterVal}" oninput="renderDbTable('${type}')">
    <button class="btn btn-ghost btn-sm" onclick="exportDbCSV('${type}')" style="margin-left:var(--space-sm)">📥 Export CSV</button>
  </div>
  <div class="data-table-wrap">
    <table class="data-table">
      <thead><tr>${cfg.cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
      <tbody>${data.length
        ? data.map(item => `<tr>${cfg.row(item).map(v => `<td>${v}</td>`).join('')}</tr>`).join('')
        : `<tr><td colspan="${cfg.cols.length}"><div class="empty-state" style="padding:32px"><div class="empty-icon">🔍</div><div class="empty-title">No Data</div></div></td></tr>`
      }</tbody>
    </table>
  </div>`;
}

async function exportDbCSV(type) {
  const dataMap = {
    observations: await getObservations(),
    crew:         await getClubMembers(),
    discoveries:  await getCitizenContributions(),
    launches:     await getLaunches(20)
  };
  const data = dataMap[type] || [];
  if (!data.length) return typeof showToast === 'function' && showToast('No data to export', 'warning');
  const headers = Object.keys(data[0]);
  const csv = [headers.join(','), ...data.map(row =>
    headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(',')
  )].join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = `${type}_export.csv`;
  a.click();
  typeof showToast === 'function' && showToast(`Exported ${data.length} ${type} records`, 'success');
}
