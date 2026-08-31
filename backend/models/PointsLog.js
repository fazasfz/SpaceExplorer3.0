const mongoose = require('mongoose');

const PointsLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true }, // e.g., 'OBSERVATION_LOGGED', 'CITIZEN_SCIENCE_LOGGED'
    points: { type: Number, required: true },
    sourceId: { type: mongoose.Schema.Types.ObjectId },
    createdAt: { type: Date, default: Date.now }
});

PointsLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('PointsLog', PointsLogSchema);