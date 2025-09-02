const express = require("express");
const router = express.Router();
const Post = require('../models/post');

// שאילתה 1 – מספר הפוסטים לכל משתמש
router.get("/posts-per-user", async (req, res) => {
  try {
    const stats = await Post.aggregate([
      { $group: { _id: "$username", totalPosts: { $sum: 1 } } },
      { $sort: { totalPosts: -1 } }
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "Aggregation failed" });
  }
});

// שאילתה 2 – ממוצע הלייקים לכל משתמש
router.get("/avg-likes", async (req, res) => {
  try {
    const stats = await Post.aggregate([
      { $group: { _id: "$username", avgLikes: { $avg: { $size: "$likes" } } } },
      { $sort: { avgLikes: -1 } }
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "Aggregation failed" });
  }
});

module.exports = router;
