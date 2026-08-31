// ============================================================
// SpaceExplorer 3.0 — Charts Controller
// Dashboard doughnut: citizen science programs breakdown
// Observation bar: monthly activity over last 6 months
// ============================================================

let discoveryChartInstance = null;
let obsChartInstance = null;

// Dashboard: contributions by program (Unistellar, Zooniverse, etc.)
async function initDiscoveryChart(elementId, contributionsData = null) {
  const container = document.getElementById(elementId);
  if (!container) return;

  const contribs = contributionsData || await getCitizenContributions();

  if (!contribs.length) {
    container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-dim);font-family:var(--font-mono);font-size:0.75rem">No contributions yet</div>`;
    return;
  }

  // Group by program
  const counts = { 'Unistellar': 0, 'Zooniverse': 0, 'ExoClock': 0, 'Spectroscopy': 0, 'Other': 0 };
  contribs.forEach(c => {
    const id = (c.programId || '').toLowerCase();
    if (id.includes('unistellar'))   counts['Unistellar']++;
    else if (id.includes('zooniverse')) counts['Zooniverse']++;
    else if (id.includes('exoclock'))  counts['ExoClock']++;
    else if (id.includes('spectroscopy')) counts['Spectroscopy']++;
    else counts['Other']++;
  });

  // Remove zero-count programs
  const labels = Object.keys(counts).filter(k => counts[k] > 0);
  const values = labels.map(k => counts[k]);

  container.innerHTML = '<canvas></canvas>';
  const canvas = container.querySelector('canvas');
  if (discoveryChartInstance) discoveryChartInstance.destroy();

  discoveryChartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data:            values,
        backgroundColor: ['#00d4ff', '#00ffcc', '#ffd700', '#c896ff', '#ff6b35'],
        borderColor:     '#0d1424',
        borderWidth:     3,
        hoverOffset:     8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#7a9bbf', font: { family: 'JetBrains Mono', size: 10 }, padding: 12 }
        }
      }
    }
  });
}

// Observation activity bar chart — last 6 months
async function initObsChart(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  if (obsChartInstance) obsChartInstance.destroy();

  const obs = await getObservations();
  const now  = new Date();
  const months = [];
  const counts = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleString('default', { month: 'short' }));
    counts.push(obs.filter(o => {
      const od = new Date(o.observedAt || o.datetime || o.date || 0);
      return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
    }).length);
  }

  obsChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{
        label:           'Observations',
        data:            counts,
        backgroundColor: 'rgba(0,255,204,0.25)',
        borderColor:     '#00ffcc',
        borderWidth:     2,
        borderRadius:    4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, color: '#7a9bbf', font: { family: 'JetBrains Mono', size: 10 } }, grid: { color: 'rgba(0,212,255,0.06)' } },
        x: { ticks: { color: '#7a9bbf', font: { family: 'JetBrains Mono', size: 10 } }, grid: { display: false } }
      }
    }
  });
}