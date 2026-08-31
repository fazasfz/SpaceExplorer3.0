const mongoose = require('mongoose');

const ObservationSchema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  objectName: { type: String, required: true },
  objectType: { type: String, required: true },
  locationName: { type: String },
  equipment: { type: String },
  seeing: { type: String },
  bortleScale: { type: Number, min: 1, max: 9 },
  notes: { type: String },
  rating: { type: Number },
  observedAt: { type: Date, default: Date.now }
}, { timestamps: true });

ObservationSchema.index({ createdBy: 1, observedAt: -1 });

module.exports = mongoose.model('Observation', ObservationSchema);