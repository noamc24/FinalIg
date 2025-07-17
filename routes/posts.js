const express = require("express");
const router = express.Router();
const Post = require("../models/post");
const User = require("../models/user");

// פיד של משתמש לפי מי שהוא עוקב אחריו
router.get("/feed/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).populate("following");
    if (!user) return res.status(404).json({ error: "User not found" });

    const followedUserIds = user.following.map(f => f._id);
    followedUserIds.push(user._id); // גם את עצמו

    const posts = await Post.find({ userId: { $in: followedUserIds } }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error("שגיאה בקבלת הפיד:", err);
    res.status(500).json({ error: "שגיאה בקבלת הפיד" });
  }
});


// יצירת פוסט חדש
router.post("/", async (req, res) => {
  try {
    const { username, caption, mediaUrl, mediaType } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

const newPost = new Post({
      userId: user._id,
      username,
      caption,
      mediaUrl,
      mediaType
});

    await newPost.save();
    res.status(201).json({ message: "פוסט נוצר בהצלחה" });
  } catch (err) {
    res.status(500).json({ error: "שגיאה ביצירת פוסט" });
  }
});

module.exports = router;

