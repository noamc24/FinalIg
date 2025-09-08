const path = require("path");
const multer = require("multer");
const express = require("express");
const postsController = require("../controller/postsController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ 
  storage,
  limits: {
    fieldSize: 5 * 1024 * 1024
  }
});

router.put("/:id", postsController.updatePost);
router.get("/feed/:username", postsController.getFeed);
router.post("/", upload.single("file"), postsController.createPost);
router.delete("/:id/:username", postsController.deletePost);

module.exports = router;