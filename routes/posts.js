const express = require("express");
const router = express.Router();
const Post = require("../models/post");
const User = require("../models/user");

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // תיקייה מקומית
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext); // שם ייחודי לקובץ
  }
});

const upload = multer({storage});

// פיד של משתמש לפי מי שהוא עוקב אחריו
router.get('/feed/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const usersToFetch = [...(Array.isArray(user.following) ? user.following : []), user.username];

    const posts = await Post.find({ username: { $in: usersToFetch } }).sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (err) {
    console.error("שגיאה בראוט feed:", err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

// יצירת פוסט חדש
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { username, caption, mediaType, profilePic } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const newPost = new Post({
      userId: user._id,
      username: user.username,
      profilePic: profilePic || "/assets/Photos/defaultprfl.png",
      caption,
      mediaUrl: `/uploads/${req.file.filename}`, // זה מה שתחזיר
      mediaType,
      createdAt: new Date()
    });

    await newPost.save();

    res.status(201).json({ message: "פוסט נוצר", mediaUrl: `/uploads/${req.file.filename}` });
  } catch (err) {
    console.error("שגיאה ביצירת פוסט:", err);
    res.status(500).json({ error: "שגיאה ביצירת פוסט" });
  }
});

// יצירת פוסט עם קובץ מדיה
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { username, caption } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "לא נשלח קובץ" });

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const newPost = new Post({
      userId: user._id,
      username: user.username,
      profilePic: user.profilePic,
      caption,
      mediaUrl: `/uploads/${file.filename}`,
      mediaType: file.mimetype.startsWith("video") ? "video" : "image",
      createdAt: new Date()
    });

    await newPost.save();
    res.status(201).json({ message: "פוסט עם קובץ נשמר בהצלחה" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה בשרת" });
  }
});


module.exports = router;
