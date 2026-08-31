const PAGES = {
  'dashboard':    { title: 'Observer Dashboard',        module: () => initDashboard() },
  'crew':         { title: 'Community Directory',        module: () => initCrew() },
  'discoveries':  { title: 'Citizen Science Hub',        module: () => initDiscoveries() },
  'observations': { title: 'Observation Log',            module: () => initObservationsPage() },
  'launches':     { title: 'Live Launch Companion',      module: () => initLaunches() },
  'leaderboard':  { title: 'Explorer Leaderboard',       module: () => initLeaderboard() },
  'search':       { title: 'Search & Database',          module: () => initSearch() },
  'login':        { title: 'Account / Sync',             module: () => initLogin() }
};

let currentPage = null;

function navigateTo(page) {
  if (!PAGES[page]) return;
  if (currentPage === page) return;

  if (currentPage) {
    const oldEl = document.getElementById(`page-${currentPage}`);
    if (oldEl) {
      oldEl.classList.add('exiting');
      setTimeout(() => { oldEl.classList.remove('active', 'exiting'); }, 200);
    }
  }

  setTimeout(async () => {
    const newEl = document.getElementById(`page-${page}`);
    if (newEl) {
      newEl.classList.add('active');
      newEl.classList.remove('exiting');
    }

    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = PAGES[page].title;

    currentPage = page;

    if (page !== 'launches' && window.activeLaunchesPageInterval) clearInterval(window.activeLaunchesPageInterval);
    if (page !== 'dashboard' && window.activeDashboardInterval) clearInterval(window.activeDashboardInterval);

    try { 
      await PAGES[page].module(); 
    } catch(e) { 
      console.warn('Telemetry page initialization exception caught:', e); 
    }

    const main = document.getElementById('main-content');
    if (main) main.scrollTop = 0;
  }, 150);
}

function initRouter() {
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => navigateTo(item.dataset.page));
  });

  navigateTo('dashboard');
}