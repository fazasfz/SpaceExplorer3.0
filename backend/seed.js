require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Observation = require('./models/Observation');
const CitizenContribution = require('./models/CitizenContribution');
const Discovery = require('./models/Discovery');
const FollowedLaunch = require('./models/FollowedLaunch');
const PointsLog = require('./models/PointsLog');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Wipe legacy collections cleanly
    await User.deleteMany({});
    await Observation.deleteMany({});
    await CitizenContribution.deleteMany({});
    await Discovery.deleteMany({});
    await FollowedLaunch.deleteMany({});
    await PointsLog.deleteMany({});

    console.log('🧹 Cleaning old database sectors...');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // 1. Seed Users
    const adminUser = await User.create({ 
      username: 'commander', 
      email: 'commander@spaceexplorer.io', 
      passwordHash: hashedPassword, 
      role: 'admin', 
      totalPoints: 500,
      level: 'commander'
    });

    const viewerUser = await User.create({ 
      username: 'faza', 
      email: 'test@space.com', 
      passwordHash: hashedPassword, 
      role: 'user', 
      totalPoints: 110,
      level: 'pilot'
    });

    // 2. Seed Observations
    const obs1 = await Observation.create({
      createdBy: viewerUser._id,
      objectName: 'Orion Nebula (M42)',
      objectType: 'Nebula',
      locationName: 'Dark Sky Observatory',
      equipment: '8-inch Dobsonian',
      seeing: 'Good',
      bortleScale: 3,
      notes: 'Trapezium cluster clearly resolved.',
      rating: 5
    });

    await PointsLog.create({
      userId: viewerUser._id,
      action: 'OBSERVATION_LOGGED',
      points: 20,
      sourceId: obs1._id
    });

    // 3. Seed Discoveries
    const disc1 = await Discovery.create({
      title: 'Ares Thermal Rift Anomaly',
      type: 'anomaly',
      location: 'Mars Quadrant Delta-4',
      description: 'Subsurface thermal vents detected processing liquid elements.',
      significance: 'High trace biosignature asset indicators.',
      discoveredBy: viewerUser._id
    });

    await PointsLog.create({
      userId: viewerUser._id,
      action: 'DISCOVERY_LOGGED',
      points: 40,
      sourceId: disc1._id
    });

    // 4. Seed Citizen Contributions
    const cit1 = await CitizenContribution.create({
      userId: viewerUser._id,
      programId: 'nasa-exoplanet-watch',
      programName: 'Exoplanet Watch',
      description: 'Analyzed light curve data for transit candidate.',
      link: 'https://exoplanets.nasa.gov'
    });

    await PointsLog.create({
      userId: viewerUser._id,
      action: 'CITIZEN_SCIENCE_LOGGED',
      points: 50,
      sourceId: cit1._id
    });

    // 5. Seed Followed Launches
    await FollowedLaunch.create({
      userId: viewerUser._id,
      launchId: 'launch-falcon-9-starlink'
    });

    console.log('🧪 Database Seeded with Realistic Amateur Astronomy Data Successfully!');
    process.exit();
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedData();