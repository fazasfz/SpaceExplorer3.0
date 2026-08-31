const express = require('express');
const router = express.Router();
const Discovery = require('../models/Discovery');
const PointsLog = require('../models/PointsLog');
const User = require('../models/User');
const auth = require('../middleware/auth');

// GET: Fetch all public community discoveries
router.get('/', async (req, res) => {
    try {
        const discoveries = await Discovery.find().populate('discoveredBy', 'username level').sort({ createdAt: -1 });
        res.json(discoveries);
    } catch (err) {
        res.status(500).json({ error: 'Server error while fetching discoveries' });
    }
});

// POST: Log a new discovery and award points
router.post('/', auth, async (req, res) => {
    try {
        const { title, type, location, description, significance } = req.body;

        const discovery = new Discovery({
            title,
            type,
            location,
            description,
            significance,
            discoveredBy: req.user.id
        });

        await discovery.save();

        // Award points for community discovery
        const pointsEarned = 40;
        await PointsLog.create({
            userId: req.user.id,
            action: 'DISCOVERY_LOGGED',
            points: pointsEarned,
            sourceId: discovery._id
        });

        await User.findByIdAndUpdate(req.user.id, { $inc: { totalPoints: pointsEarned } });

        res.status(201).json(discovery);
    } catch (err) {
        res.status(400).json({ error: 'Failed to log discovery' });
    }
});

module.exports = router;