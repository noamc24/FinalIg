const mongoose = require('mongoose');

const socialEventSchema = new mongoose.Schema({
  provider: { type: String, enum: ['facebook', 'twitter'], required: true },
  type: { type: String },
  payload: { type: Object },
  receivedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SocialEvent', socialEventSchema);

