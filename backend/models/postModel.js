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
    default: "https://static.vecteezy.com/system/resources/thumbnails/020/765/399/small_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg"
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
    enum: ["image", "video", "text"],
    required: true
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],  
  comments: [                                                    
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      username: String,
      text: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Post || mongoose.model("Post", postSchema);
