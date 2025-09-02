const express = require("express");
const router = express.Router();
const postExtrasController = require("../controller/postsExtrasController");

router.post("/like", postExtrasController.likePost);
router.post("/unlike", postExtrasController.unlikePost);
router.get("/:id/likes", postExtrasController.getPostLikes);

router.post("/comment", postExtrasController.addComment);
router.delete("/comment", postExtrasController.deleteComment);
router.put("/comment", postExtrasController.updateComment);
router.get("/:id/comments", postExtrasController.getPostComments);

module.exports = router;
