// Suggestions: return a list of users for the frontend suggestions bar
const getSuggestions = async (req, res) => {
  try {
    // You can customize this list as needed, e.g., exclude the logged-in user, limit number, etc.
    // For now, return a fixed set of users (the ones you want to suggest)
    const usernames = [
      "RonDrin7",
      "EladiJR",
      "Montekio7",
      "SaHaRif5",
      "Sultan12",
      "FCBJ"
    ];
    const users = await User.find({ username: { $in: usernames } }, "username fullName profilePic");
    res.json(users);
  } catch (err) {
    console.error("❌ getSuggestions error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const norm = s => (s || "").toString().trim().toLowerCase();


const getUserProfile = async (req, res) => {
  try {
    let { username } = req.params;
    username = username.trim();
  const user = await User.findOne({ username: { $regex: `^${username}$`, $options: 'i' } });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    // Return only the relevant fields for suggestions
    res.json({
      success: true,
      fullName: user.fullName,
      profilePic: user.profilePic,
      username: user.username
    });
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
    console.log('DEBUG updateUserProfile req.body:', req.body, 'type:', typeof req.body);
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Handle profilePic upload first
    if (req.file) {
      user.profilePic = `/uploads/${req.file.filename}`;
    } else if (req.body && typeof req.body === 'object' && req.body.profilePic) {
      user.profilePic = req.body.profilePic;
    }

    // Only destructure if req.body is defined and is an object
    if (req.body && typeof req.body === 'object') {
      const { fullName, email, password } = req.body;
      if (fullName) user.fullName = fullName;
      if (email) user.email = email;
      if (password) {
        // הצפנה עם bcrypt
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
      }
    }

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
  getSuggestions,
  // Added: return counts for followers/following
  getUserStats: async (req, res) => {
    try {
      let { username } = req.query || {};
      username = (username || "").toString().trim();
      if (!username) {
        return res.status(400).json({ success: false, error: "username is required" });
      }

      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ success: false, error: "User not found" });
      }

      return res.json({
        success: true,
        followers: Array.isArray(user.followers) ? user.followers.length : 0,
        following: Array.isArray(user.following) ? user.following.length : 0,
      });
    } catch (err) {
      console.error("getUserStats error:", err);
      return res.status(500).json({ success: false, error: "Server error" });
    }
  }
};
