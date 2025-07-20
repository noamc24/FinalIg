const express = require("express");
const router = express.Router();
const User = require("../models/user");

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
