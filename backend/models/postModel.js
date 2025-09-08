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
    default: "defaultPrfl.png"
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
  location: {
    address: { type: String, trim: true },
    placeId: { type: String },
    source:  { type: String, enum: ["google","bing","manual"] },
    geo: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number] }
    }
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

postSchema.index({ "location.geo": "2dsphere" });
module.exports = mongoose.models.Post || mongoose.model("Post", postSchema);
