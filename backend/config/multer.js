const multer = require('multer');
const path = require('path');

// Set up storage for profile pictures
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = 'profile_' + Date.now() + ext;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

module.exports = upload;
