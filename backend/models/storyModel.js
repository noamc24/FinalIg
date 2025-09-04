const mongoose = require("mongoose");

const storySchema = new mongoose.Schema({
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
    type: String
  },
  mediaType: {
    type: String,
    enum: ["image", "video"],
    required: true
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],  
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
  type: Date,
  default: () => new Date(Date.now() + 24*60*60*1000)
}
});

storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.Story || mongoose.model("Story", storySchema);
