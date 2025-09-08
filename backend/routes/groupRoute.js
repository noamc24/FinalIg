const express = require("express");
const groupController = require("../controller/groupController");

const router = express.Router();

router.get("/:group", groupController.getGroup);

router.post("/join", groupController.joinGroup);

router.post("/create", groupController.createGroup);
router.post("/create-from-following", groupController.createGroupFromFollowing);

router.post("/add-member", groupController.addMember);

router.post("/remove-member", groupController.removeMember);

router.post("/:groupId/messages", groupController.addMessage);

router.put("/:groupId/messages/:messageId", groupController.editMessage);

router.delete("/:groupId/messages/:messageId", groupController.deleteMessage);

router.get("/:groupId/messages", groupController.getMessages);

module.exports = router;
