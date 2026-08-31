const mongoose = require('mongoose');

const CommunityMemberSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  role:      { type: String, required: true, enum: ['astrophotographer', 'observer', 'researcher', 'beginner', 'sidewalk'] },
  equipment: { type: String, default: '' },       // e.g. "8-inch Dobsonian, DSLR"
  location:  { type: String, default: '' },       // e.g. "Lahore, Pakistan"
  bio:       { type: String, default: '' },
  joinedAt:  { type: Date, default: Date.now },
  addedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

CommunityMemberSchema.index({ role: 1 });
CommunityMemberSchema.index({ name: 'text', bio: 'text' });

module.exports = mongoose.model('CommunityMember', CommunityMemberSchema);
