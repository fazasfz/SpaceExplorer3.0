const express = require('express');
const router  = express.Router();
const CommunityMember = require('../models/CommunityMember');
const PointsLog       = require('../models/PointsLog');
const User            = require('../models/User');
const auth            = require('../middleware/auth');

// GET: All community members (public — no auth required for directory browsing)
router.get('/', async (req, res) => {
  try {
    const members = await CommunityMember.find().sort({ joinedAt: -1 });
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching community members' });
  }
});

// POST: Add a new member to the club directory (auth required — awards points)
router.post('/', auth, async (req, res) => {
  try {
    const { name, role, equipment, location, bio } = req.body;
    if (!name || !role) {
      return res.status(400).json({ error: 'Name and role are required.' });
    }

    const member = new CommunityMember({
      name, role, equipment, location, bio,
      addedBy: req.user.id
    });
    await member.save();

    // Award 10 points for adding a community member
    const pointsEarned = 10;
    await PointsLog.create({
      userId: req.user.id,
      action: 'MEMBER_ADDED',
      points: pointsEarned,
      sourceId: member._id
    });
    await User.findByIdAndUpdate(req.user.id, { $inc: { totalPoints: pointsEarned } });

    res.status(201).json(member);
  } catch (err) {
    res.status(400).json({ error: 'Failed to add community member' });
  }
});

module.exports = router;
