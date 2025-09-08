const Story = require('../models/storyModel');
const path = require('path');

// יצירת סטורי חדש
exports.createStory = async (req, res) => {
  try {
    const { username, caption, mediaType, profilePic } = req.body;
    let mediaUrl = req.file ? `/uploads/${req.file.filename}` : req.body.mediaUrl;
    if (!mediaUrl) return res.status(400).json({ error: 'Missing media file' });
    const story = await Story.create({
      username,
      profilePic,
      mediaUrl,
      mediaType,
      caption,
      duration: req.body.duration || 5000
    });
    res.status(201).json({ story });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// קבלת כל הסטוריז (או לפי יוזר)
exports.getStories = async (req, res) => {
  try {
    const { username } = req.query;
    const filter = username ? { username } : {};
    const stories = await Story.find(filter).sort({ createdAt: -1 });
    res.json(stories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// מחיקת סטורי (כמו פוסט: id + username, בדיקת הרשאה)
exports.deleteStory = async (req, res) => {
  try {
    const { id, username } = req.params;
    if (!id || !username) return res.status(400).json({ error: 'Missing id or username' });
    const story = await Story.findById(id);
    if (!story) return res.status(404).json({ error: 'Story not found' });
    if (story.username !== username) {
      return res.status(403).json({ error: 'Unauthorized to delete this story' });
    }
    // מחיקת קובץ פיזי אם קיים
    if (story.mediaUrl && story.mediaUrl.startsWith('/uploads/')) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '..', story.mediaUrl);
      fs.unlink(filePath, err => {}); // לא חוסם, מתעלם משגיאות
    }
    await Story.findByIdAndDelete(id);
    res.json({ success: true, message: 'Story deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};
