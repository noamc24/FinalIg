const Post = require("../models/postModel");
const User = require("../models/userModel");

const postsController = {
  getFeed: async (req, res) => {
    try {
      const user = await User.findOne({ username: req.params.username });
      if (!user) return res.status(404).json({ error: "User not found" });

      const usersToFetch = [...(user.following || []), user.username];
      const posts = await Post.find({ username: { $in: usersToFetch } })
        .sort({ createdAt: -1 });

      res.json(posts);
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  },

updatePost: async (req, res) => {
  try {
    const { caption } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    post.caption = caption || post.caption;
    await post.save();

    res.json({ success: true, message: "Post updated", post });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
},

  createPost: async (req, res) => {
    try {
      const { username, caption, mediaType, profilePic } = req.body;
      const user = await User.findOne({ username });
      if (!user) return res.status(404).json({ error: "User not found" });

      const newPost = new Post({
        userId: user._id,
        username: user.username,
        profilePic: profilePic || "/assets/Photos/defaultprfl.png",
        caption,
        mediaUrl: req.file ? `/uploads/${req.file.filename}` : null,
        mediaType,
      });

      await newPost.save();

      res.status(201).json({
        success: true,
        post: newPost   // 👈 מחזירים את הפוסט המלא
      });

    } catch (err) {
      res.status(500).json({ error: "Server error", details: err.message });
    }
  }
  ,


  deletePost: async (req, res) => {
    try {
      const { id, username } = req.params;  // 👈 מתוך ה־URL

      const user = await User.findOne({ username });
      if (!user) return res.status(404).json({ error: "User not found" });

      const post = await Post.findById(id);
      if (!post) return res.status(404).json({ error: "Post not found" });

      if (post.userId.toString() !== user._id.toString()) {
        return res.status(403).json({ error: "Unauthorized to delete this post" });
      }

      await Post.findByIdAndDelete(id);

      res.json({ success: true, message: "Post deleted" });
    } catch (err) {
      res.status(500).json({ error: "Server error", details: err.message });
    }
  },
}

module.exports = { postsController };
