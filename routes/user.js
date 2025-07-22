const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Post = require("../models/post");

// 📌 פעולה של Follow
router.post("/follow", async (req, res) => {
  const { followerUsername, followeeUsername } = req.body;

  try {
    const follower = await User.findOne({ username: followerUsername });
    const followee = await User.findOne({ username: followeeUsername });

    if (!follower || !followee) {
      return res.status(404).json({ error: "משתמש לא נמצא" });
    }

    if (follower.following.includes(followee._id)) {
      return res.status(400).json({ error: "כבר עוקב אחרי המשתמש" });
    }

    follower.following.push(followee._id);
    await follower.save();

    res.status(200).json({ message: "התחלת לעקוב אחרי המשתמש" });
  } catch (err) {
    console.error("Follow Error:", err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
});

// 📌 פעולה של Unfollow
router.post("/unfollow", async (req, res) => {
  const { followerUsername, followeeUsername } = req.body;

  try {
    const follower = await User.findOne({ username: followerUsername });
    const followee = await User.findOne({ username: followeeUsername });

    if (!follower || !followee) {
      return res.status(404).json({ error: "משתמש לא נמצא" });
    }

    follower.following = follower.following.filter(
      (id) => id.toString() !== followee._id.toString()
    );
    await follower.save();

    res.status(200).json({ message: "הפסקת לעקוב אחרי המשתמש" });
  } catch (err) {
    console.error("Unfollow Error:", err);
    res.status(500).json({ error: "שגיאת שרת" });
  }
});

module.exports = router;

router.get("/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const posts = await Post.find({ username: user.username }).sort({ createdAt: -1 }).lean();

    res.json({
      user: {
        username: user.username,
        bio: user.bio || "",
        profilePicUrl: user.profilePicUrl || null,
        followers: user.followers || [],
        following: user.following || []
      },
      posts
    });
  } catch (err) {
    console.error("⚠️ Error loading user profile:", err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});
