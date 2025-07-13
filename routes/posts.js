router.get("/user/:username", async (req, res) => {
  try {
    const posts = await Post.find({ username: req.params.username }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "שגיאת שרת" });
  }
});
const express = require("express");
const router = express.Router();
const Post = require("/models/Post");

// קבלת כל הפוסטים של משתמש מסוים
router.get("/user/:username", async (req, res) => {
  try {
    const posts = await Post.find({ username: req.params.username }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "שגיאת שרת" });
  }
});

// יצירת פוסט חדש
router.post("/", async (req, res) => {
  try {
    const { username, caption, mediaUrl, mediaType } = req.body;
    const newPost = new Post({ username, caption, mediaUrl, mediaType });
    await newPost.save();
    res.status(201).json({ message: "פוסט נוצר בהצלחה" });
  } catch (err) {
    res.status(500).json({ error: "שגיאה ביצירת פוסט" });
  }
});

module.exports = router;
