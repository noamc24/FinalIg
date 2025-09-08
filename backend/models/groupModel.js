const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: "" },
  isPublic: { type: Boolean, default: false },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  messages: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      username: { type: String, required: true },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Group", groupSchema);
