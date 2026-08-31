const DEFAULT_MISSIONS = [
  { id: 1, name: 'Artemis IX', destination: 'Moon', objective: 'Establish permanent lunar base Alpha and conduct deep-core geological surveys of the south pole crater region.', launchDate: '2026-06-15', duration: '8 months', priority: 'critical', status: 'active', progress: 42 },
  { id: 2, name: 'Hermes-7', destination: 'Mars', objective: 'Deploy autonomous drilling rig at Hellas Basin and collect subsurface rock samples for biosignature analysis.', launchDate: '2026-09-01', duration: '2 years', priority: 'high', status: 'planning', progress: 0 },
  { id: 3, name: 'Project Cassini-2', destination: 'Europa', objective: 'Penetrate Europa ice shell and deploy submersible probe into subsurface ocean to search for thermophilic lifeforms.', launchDate: '2025-03-10', duration: '4 years', priority: 'critical', status: 'active', progress: 78 },
  { id: 4, name: 'Titan Diver', destination: 'Titan', objective: 'Atmospheric dive into Titan methane lakes using heat-shielded probe to collect organic compound samples.', launchDate: '2024-11-22', duration: '3 years', priority: 'high', status: 'completed', progress: 100 },
  { id: 5, name: 'Voyager Legacy', destination: 'Deep Space', objective: 'Long-range survey mission to chart the heliosphere boundary and measure interstellar medium composition.', launchDate: '2025-08-03', duration: '5 years', priority: 'medium', status: 'active', progress: 29 },
  { id: 6, name: 'Nemesis Sweep', destination: 'Asteroid Belt', objective: 'Map and classify 500+ near-Earth asteroids; deploy hazard beacon network for planetary defense.', launchDate: '2025-01-15', duration: '18 months', priority: 'high', status: 'failed', progress: 63 },
  { id: 7, name: 'Prometheus II', destination: 'Jupiter', objective: 'Deploy atmospheric probe into Jovian storm systems; measure magnetic anomalies and radio emission sources.', launchDate: '2026-12-01', duration: '3 years', priority: 'medium', status: 'planning', progress: 0 },
  { id: 8, name: 'Helios Reach', destination: 'Solar Corona', objective: 'Closest solar flyby ever attempted — measure coronal plasma density, map magnetic field lines in real time.', launchDate: '2026-04-20', duration: '6 months', priority: 'critical', status: 'planning', progress: 0 }
];

const DEFAULT_DISCOVERIES = [
  { id: 1, title: 'Subsurface Brine Channels Detected', type: 'geological', location: 'Europa South Pole', lat: -87.3, lon: 214.7, discoveredBy: 'Orbital Probe Alpha', date: '2025-11-14', significance: 5, description: 'Ground-penetrating radar revealed an interconnected network of liquid brine channels approximately 2km below the ice shell surface.', missionId: 3 },
  { id: 2, title: 'Ancient Lava Tubes — Lunar South Pole', type: 'geological', location: 'Shackleton Crater Rim', lat: -89.9, lon: 0.0, discoveredBy: 'Lidar Recon 1', date: '2026-01-08', significance: 4, description: 'LIDAR mapping revealed a network of intact basaltic lava tubes, some up to 80m in diameter.', missionId: 1 },
  { id: 3, title: 'Titan Amino Acid Precursors', type: 'chemical', location: 'Ligeia Mare, Titan', lat: 78.2, lon: 248.1, discoveredBy: 'Titan Diver Probe', date: '2025-07-22', significance: 5, description: 'Mass spectrometry of Titan methane lake samples revealed complex nitrile compounds.', missionId: 4 },
  { id: 4, title: 'Anomalous Magnetic Wake — Hellas Basin', type: 'astronomical', location: 'Hellas Basin, Mars', lat: -42.4, lon: 70.5, discoveredBy: 'Orbital Magnetometer', date: '2025-09-03', significance: 3, description: 'Orbital magnetometer detected a mobile magnetic anomaly inconsistent with crustal remanence.', missionId: 2 },
  { id: 5, title: 'First Confirmed Microstructures in Martian Core Sample', type: 'biological', location: 'Elysium Planitia, Mars', lat: 25.0, lon: 147.0, discoveredBy: 'Automated Drill Unit', date: '2025-12-01', significance: 5, description: 'Electron microscopy of a core sample from 3.8m depth revealed sub-micron tubular microstructures.', missionId: 2 }
];

const DEFAULT_OBSERVATIONS = [
  { id: 1, object: 'Jupiter', objectType: 'Planet', datetime: '2026-03-10T21:30:00', location: 'Observatory Site A', equipment: 'Celestron 8-inch SCT', seeing: 'excellent', bortle: 6, notes: 'Great belt detail visible. Could clearly make out all four Galilean moons.', rating: 4 },
  { id: 2, object: 'Orion Nebula (M42)', objectType: 'Nebula', datetime: '2026-03-08T22:15:00', location: 'High Altitude Station', equipment: 'William Optics ZenithStar 73', seeing: 'good', bortle: 4, notes: 'Stunning nebulosity visible with OIII filter. Trapezium resolved cleanly.', rating: 5 }
];

const DEFAULT_LAUNCHES = [
  { id: 1, mission: 'Starship IFT-9', rocket: 'Starship / Super Heavy', provider: 'SpaceX', site: 'Starbase, Texas', netDate: '2026-04-10', status: 'go', missionType: 'Test Flight', outcome: null },
  { id: 2, mission: 'Artemis IV SLS', rocket: 'Space Launch System Block 1B', provider: 'NASA', site: 'Kennedy Space Center, LC-39B', netDate: '2026-05-22', status: 'go', missionType: 'Uncrewed Exploration', outcome: null },
  { id: 3, mission: 'Falcon 9 — Starlink G12', rocket: 'Falcon 9 Block 5', provider: 'SpaceX', site: 'Cape Canaveral, SLC-40', netDate: '2026-03-28', status: 'go', missionType: 'Satellite Deploy', outcome: null }
];

const DEFAULT_LEADERBOARD = [
  { id: 1, username: 'StarCaptain_Elena', points: 4850, missions: 1200, discoveries: 2100, observations: 900, community: 650, level: 'admiral', lastActive: '2026-03-24' },
  { id: 2, username: 'NebulaHunter_X', points: 4220, missions: 900, discoveries: 1800, observations: 1100, community: 420, level: 'admiral', lastActive: '2026-03-23' },
  { id: 3, username: 'CosmicDrifter', points: 3780, missions: 1500, discoveries: 1200, observations: 800, community: 280, level: 'commander', lastActive: '2026-03-22' }
];

function loadData(key, defaults) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [...defaults];
  } catch { return [...defaults]; }
}

let MISSIONS = loadData('se_missions', DEFAULT_MISSIONS);
let DISCOVERIES = loadData('se_discoveries', DEFAULT_DISCOVERIES);
let OBSERVATIONS = loadData('se_observations', DEFAULT_OBSERVATIONS);
let LAUNCHES = loadData('se_launches', DEFAULT_LAUNCHES);
let LEADERBOARD = loadData('se_leaderboard', DEFAULT_LEADERBOARD);