const express = require('express');
const router = express.Router();
const CitizenContribution = require('../models/CitizenContribution');
const PointsLog = require('../models/PointsLog');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get user's contributions
router.get('/', auth, async (req, res) => {
    try {
        const contributions = await CitizenContribution.find({ userId: req.user.id }).sort({ date: -1 });
        res.json(contributions);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Log a new citizen contribution and award points
router.post('/', auth, async (req, res) => {
    try {
        const { programId, programName, description, link } = req.body;
        
        const contribution = new CitizenContribution({
            userId: req.user.id,
            programId,
            programName,
            description,
            link
        });
        await contribution.save();

        // Award points for citizen science action
        const pointsEarned = 50;
        await PointsLog.create({
            userId: req.user.id,
            action: 'CITIZEN_SCIENCE_LOGGED',
            points: pointsEarned,
            sourceId: contribution._id
        });

        await User.findByIdAndUpdate(req.user.id, { $inc: { totalPoints: pointsEarned } });

        res.status(201).json(contribution);
    } catch (err) {
        res.status(400).json({ error: 'Failed to log contribution' });
    }
});

module.exports = router;