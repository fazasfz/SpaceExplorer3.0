const mongoose = require('mongoose');

const CitizenContributionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    programId: { type: String, required: true },
    programName: { type: String, required: true },
    description: { type: String, required: true },
    link: { type: String },
    date: { type: Date, default: Date.now }
});

CitizenContributionSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('CitizenContribution', CitizenContributionSchema);