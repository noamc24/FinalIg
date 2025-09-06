const Post = require("../models/postModel");
const User = require("../models/userModel");

const postsExtrasController = {
  // ✅ לייק לפוסט
  likePost: async (req, res) => {
    try {
      const { postId, username } = req.body;
      const user = await User.findOne({ username });
      if (!user) return res.status(404).json({ error: "User not found" });

      const post = await Post.findById(postId);
      if (!post) return res.status(404).json({ error: "Post not found" });

      if (!post.likes.includes(user._id)) {
        post.likes.push(user._id);
        await post.save();
      }

      res.json({ success: true, message: `${username} liked the post` });
    } catch (err) {
      res.status(500).json({ error: "Server error", details: err.message });
    }
  },


 unlikePost : async (req, res) => {
  try {
    const { postId, username } = req.body;
    if (!postId || !username) {
      return res.status(400).json({ error: "Missing postId or username" });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const before = post.likes.map(id => id.toString());
    const wasLiked = before.includes(user._id.toString());

    if (wasLiked) {
      post.likes = post.likes.filter(id => id.toString() !== user._id.toString());
      await post.save();
    }

    res.json({
      success: true,
      message: wasLiked ? `${username} unliked the post` : "Already not liked",
      likesCount: post.likes.length,
      postId: post._id
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
},



  getPostLikes: async (req, res) => {
    try {
      const { id } = req.params;
      const post = await Post.findById(id).populate("likes", "username profilePic");
      if (!post) return res.status(404).json({ error: "Post not found" });

      res.json({ success: true, likes: post.likes });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  },

  addComment: async (req, res) => {
    try {
      const { postId, username, text } = req.body;
      const user = await User.findOne({ username });
      if (!user) return res.status(404).json({ error: "User not found" });

      const post = await Post.findById(postId);
      if (!post) return res.status(404).json({ error: "Post not found" });

      post.comments.push({
        userId: user._id,
        username: user.username,
        text
      });

      await post.save();
      res.json({ success: true, message: "Comment added", comments: post.comments });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  },

  deleteComment: async (req, res) => {
    try {
      const { postId, commentId, username } = req.body;
      const user = await User.findOne({ username });
      const post = await Post.findById(postId);

      if (!user || !post) return res.status(404).json({ error: "Not found" });

      const comment = post.comments.id(commentId);
      if (!comment) return res.status(404).json({ error: "Comment not found" });

      if (comment.userId.toString() !== user._id.toString()) {
        return res.status(403).json({ error: "Not authorized" });
      }

      comment.deleteOne();
      await post.save();

      res.json({ success: true, message: "Comment deleted" });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  },

  getPostComments: async (req, res) => {
    try {
      const { id } = req.params; 
      const post = await Post.findById(id);
      if (!post) return res.status(404).json({ error: "Post not found" });

      res.json({ success: true, comments: post.comments });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  },
  updateComment: async (req, res) => {
  try {
    const { postId, commentId, username, text } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    if (comment.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    comment.text = text;
    await post.save();

    res.json({ success: true, message: "Comment updated", comments: post.comments });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
}



};

module.exports = postsExtrasController;
