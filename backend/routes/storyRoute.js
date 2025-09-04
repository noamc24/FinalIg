const express = require("express");
const router = express.Router();
const Story = require("../models/storyModel");
const multer = require("multer");
const path = require("path");

// שמירה ל-uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(__dirname, "..", "uploads")); // ← backend/uploads
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    cb(null, Date.now() + ext.toLowerCase());
  }
});

const fileFilter = (req, file, cb) => {
  const ok = /image|video/.test(file.mimetype);
  cb(ok ? null : new Error("Only images/videos allowed"), ok);
};
const upload = multer({ storage, fileFilter });

// יצירת סטורי חדש
router.post("/", upload.single("media"), async (req, res) => {
  try {
    const { userId, username, profilePic, caption } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "media file is required" });
    }

    const mediaUrl = `/uploads/${req.file.filename}`;
    const mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";

    const newStory = new Story({
      userId,
      username,
      profilePic,
      caption,
      mediaUrl,
      mediaType
    });

    await newStory.save();
    res.status(201).json(newStory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// קבלת כל הסטוריז עם אופציה לסינן לפי משתמש
router.get("/", async (req, res) => {
  try {
    const stories = await Story.find().sort({ createdAt: -1 });
    res.json(stories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// מחיקת סטורי – רק אם המשתמש הוא היוצר
router.delete("/:id", async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    
    const loggedInUserId = req.body.userId; 

    if (story.userId.toString() !== loggedInUserId) {
      return res.status(403).json({ message: "Not authorized to delete this story" });
    }

    await story.deleteOne();
    res.json({ message: "Story deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
