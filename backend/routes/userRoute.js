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
  getUserStats,
} = require("../controller/userController");

router.get("/profile/:username", getUserProfile);

router.post("/follow", followUser);
router.post("/unfollow", unfollowUser);

router.get("/is-following", isFollowing);
router.get("/:username/groups", getUserGroups)

// New: stats endpoint used by frontend `/api/users/stats?username=`
router.get("/stats", getUserStats);

router.put("/update/:username", updateUserProfile);

router.delete("/delete/:username", deleteUser);

module.exports = router;
