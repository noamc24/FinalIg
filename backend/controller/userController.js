const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const norm = s => (s || "").toString().trim().toLowerCase();


const getUserProfile = async (req, res) => {
  try {
let { username } = req.params;
username = username.trim();  
const user = await User.findOne({ username: username });


    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const posts = [];
    res.json({ success: true, user, posts });
  } catch (err) {
    console.error("❌ getUserProfile error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

const followUser = async (req, res) => {
  try {
    const { followerUsername, followeeUsername } = req.body;

    if (followerUsername === followeeUsername) {
      return res.status(400).json({ success: false, error: "לא ניתן לעקוב אחרי עצמך" });
    }

    const follower = await User.findOne({ username: followerUsername });
    const followee = await User.findOne({ username: followeeUsername });

    if (!follower || !followee)
      return res.status(404).json({ success: false, error: "User not found" });

    if (!followee.followers.includes(followerUsername)) {
      followee.followers.push(followerUsername);
      follower.following.push(followeeUsername);
      await followee.save();
      await follower.save();
    }

    res.json({
      success: true,
      message: `${followerUsername} התחיל לעקוב אחרי ${followeeUsername}`,
    });
  } catch (err) {
    console.error("❌ followUser error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

const unfollowUser = async (req, res) => {
  try {
    const { followerUsername, followeeUsername } = req.body;

    const follower = await User.findOne({ username: followerUsername });
    const followee = await User.findOne({ username: followeeUsername });

    if (!follower || !followee)
      return res.status(404).json({ success: false, error: "User not found" });

    followee.followers = followee.followers.filter((u) => u !== followerUsername);
    follower.following = follower.following.filter((u) => u !== followeeUsername);

    await followee.save();
    await follower.save();

    res.json({
      success: true,
      message: `${followerUsername} הפסיק לעקוב אחרי ${followeeUsername}`,
    });
  } catch (err) {
    console.error("❌ unfollowUser error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const { fullName, email, password, profilePic } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    if (fullName) user.fullName = fullName;
    if (email) user.email = email;

    if (password) {
      // הצפנה עם bcrypt
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    if (profilePic) user.profilePic = profilePic;

    await user.save();

    res.json({ success: true, message: "Profile updated successfully", user });
  } catch (err) {
    console.error("❌ updateUserProfile error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

const getUserGroups = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).populate("groups", "name description");
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    res.json({ success: true, groups: user.groups });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

const deleteUser = async (req, res) => {
  let { username } = req.params;
  username = username.trim();

  try {
    const user = await User.findOneAndDelete({ username });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, message: `User '${username}' deleted successfully` });
  } catch (err) {
    console.error("❌ deleteUser error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

const isFollowing = async (req, res) => {
  try {
    const { follower, followee } = req.query;

    const user = await User.findOne({ username: followee });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const isFollowing = user.followers.includes(follower);
    res.json({ success: true, isFollowing });
  } catch (err) {
    console.error("❌ isFollowing error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

module.exports = {
  getUserProfile,
  followUser,
  unfollowUser,
  isFollowing,
  updateUserProfile,
  deleteUser,
  getUserGroups,
 };
