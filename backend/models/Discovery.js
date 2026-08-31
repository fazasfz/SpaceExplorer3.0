const mongoose = require('mongoose');

const DiscoverySchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, required: true }, // exoplanet, anomaly, star
  location: { type: String, required: true },
  discoveredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: { type: String },
  significance: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// LAB 7: Indexes
DiscoverySchema.index({ type: 1 });
DiscoverySchema.index({ type: 1, createdAt: -1 }); // Compound
DiscoverySchema.index({ title: 'text', description: 'text' }); // Text Index

module.exports = mongoose.model('Discovery', DiscoverySchema);