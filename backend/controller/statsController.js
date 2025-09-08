const Post = require("../models/postModel");

const statsController = {
  postsPerDay: async (req, res) => {
    try {
      const days = Math.max(1, Math.min(parseInt(req.query.days) || 14, 365));
      const since = new Date();
      since.setHours(0, 0, 0, 0);
      since.setDate(since.getDate() - (days - 1));

      const agg = await Post.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]);

      const map = new Map();
      for (const r of agg) map.set(r._id, r.count);

      const out = [];
      const today = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        out.push({ date: key, count: map.get(key) || 0 });
      }

      res.json({ success: true, series: out });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  mediaTypeDistribution: async (_req, res) => {
    try {
      const items = await Post.aggregate([
        { $group: { _id: "$mediaType", count: { $sum: 1 } } },
        { $project: { _id: 0, mediaType: "$_id", count: 1 } },
        { $sort: { count: -1 } },
      ]);
      res.json({ success: true, items });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  likesAvgPerDay: async (req, res) => {
    try {
      const days = Math.max(1, Math.min(parseInt(req.query.days) || 14, 365));
      const since = new Date();
      since.setHours(0, 0, 0, 0);
      since.setDate(since.getDate() - (days - 1));

      const agg = await Post.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $project: { createdAt: 1, likesCount: { $size: { $ifNull: ["$likes", []] } } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, totalLikes: { $sum: "$likesCount" }, posts: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]);

      const map = new Map();
      for (const r of agg) map.set(r._id, r.posts > 0 ? r.totalLikes / r.posts : 0);

      const out = [];
      const today = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        out.push({ date: key, avgLikes: Number((map.get(key) || 0).toFixed(2)) });
      }

      res.json({ success: true, series: out });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
};

module.exports = statsController;

