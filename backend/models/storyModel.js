const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  username: { type: String, required: true },
  profilePic: { type: String },
  mediaUrl: { type: String, required: true },
  mediaType: { type: String, enum: ['image', 'video'], required: true },
  caption: { type: String },
  duration: { type: Number, default: 5000 },
  createdAt: { type: Date, default: Date.now },
  viewed: { type: Boolean, default: false }
});

module.exports = mongoose.model('Story', storySchema);
