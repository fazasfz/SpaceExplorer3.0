const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'user', enum: ['user', 'admin'] }, // Simplified for moderation only
  totalPoints: { type: Number, default: 0 },
  level: { type: String, default: 'cadet' } // cadet, pilot, specialist, commander, admiral
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);