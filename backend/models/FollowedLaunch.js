const mongoose = require('mongoose');

const FollowedLaunchSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    launchId: { type: String, required: true },
    followedAt: { type: Date, default: Date.now }
});

FollowedLaunchSchema.index({ userId: 1, launchId: 1 }, { unique: true });

module.exports = mongoose.model('FollowedLaunch', FollowedLaunchSchema);