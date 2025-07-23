const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  username: {
    type: String,
    required: true
  },
  profilePic: {
  type: String,
  default: "/assets/Photos/defaultprfl.png"
  },
  caption: {
    type: String,
    default: ""
  },
  mediaUrl: {
    type: String,
    required: false
  },
  mediaType: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Post || mongoose.model('Post', postSchema);

