const express = require("express");
const router = express.Router();

const {
  getUserProfile,
  followUser,
  unfollowUser,
  isFollowing,
  updateUserProfile,
  getUserGroups,
  deleteUser,
  getSuggestions,
} = require("../controller/userController");
const upload = require("../config/multer");
// Suggestions endpoint
router.get("/suggestions", getSuggestions);

router.get("/profile/:username", getUserProfile);

router.post("/follow", followUser);
router.post("/unfollow", unfollowUser);

router.get("/is-following", isFollowing);
router.get("/:username/groups", getUserGroups)

router.put("/update/:username", upload.single("profilePic"), updateUserProfile);

router.delete("/delete/:username", deleteUser);

module.exports = router;
