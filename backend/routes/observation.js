const express = require('express');
const router = express.Router();
const Observation = require('../models/Observation');
const PointsLog = require('../models/PointsLog');
const User = require('../models/User');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
    try {
        const observations = await Observation.find({ createdBy: req.user.id }).sort({ observedAt: -1 });
        res.json(observations);
    } catch (err) {
        res.status(500).json({ error: 'Server error while fetching observations' });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { objectName, objectType, locationName, equipment, seeing, bortleScale, notes, rating } = req.body;

        const observation = new Observation({
            objectName,
            objectType,
            locationName,
            equipment,
            seeing,
            bortleScale,
            notes,
            rating,
            createdBy: req.user.id
        });

        await observation.save();

        const pointsEarned = 20;
        await PointsLog.create({
            userId: req.user.id,
            action: 'OBSERVATION_LOGGED',
            points: pointsEarned,
            sourceId: observation._id
        });

        await User.findByIdAndUpdate(req.user.id, { $inc: { totalPoints: pointsEarned } });

        res.status(201).json(observation);
    } catch (err) {
        res.status(400).json({ error: 'Failed to log observation' });
    }
});

module.exports = router;