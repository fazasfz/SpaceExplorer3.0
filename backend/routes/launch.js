const express = require('express');
const router = express.Router();
const FollowedLaunch = require('../models/FollowedLaunch');
const auth = require('../middleware/auth');

// Get all followed launches for logged-in user
router.get('/', auth, async (req, res) => {
    try {
        const launches = await FollowedLaunch.find({ userId: req.user.id });
        res.json(launches);
    } catch (err) {
        res.status(500).json({ error: 'Server error while fetching followed launches' });
    }
});

// Follow a launch
router.post('/', auth, async (req, res) => {
    try {
        const { launchId } = req.body;
        const newFollow = new FollowedLaunch({ userId: req.user.id, launchId });
        await newFollow.save();
        res.status(201).json(newFollow);
    } catch (err) {
        res.status(400).json({ error: 'Launch already followed or invalid ID' });
    }
});

// Unfollow a launch
router.delete('/:launchId', auth, async (req, res) => {
    try {
        await FollowedLaunch.findOneAndDelete({ userId: req.user.id, launchId: req.params.launchId });
        res.json({ message: 'Launch unfollowed successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error while unfollow action' });
    }
});

module.exports = router;