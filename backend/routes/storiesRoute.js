const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const storiesController = require('../controller/storiesController');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}_${Math.round(Math.random()*1e9)}${ext}`);
  }
});
const upload = multer({ 
  storage,
  limits: { fieldSize: 10 * 1024 * 1024 }
});

// יצירת סטורי
router.post('/', upload.single('file'), storiesController.createStory);
// קבלת כל הסטוריז או לפי יוזר
router.get('/', storiesController.getStories);
// מחיקת סטורי
router.delete('/:id/:username', storiesController.deleteStory);

module.exports = router;
