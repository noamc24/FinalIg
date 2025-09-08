const express = require("express");
const router = express.Router();

// /api/news/hackernews  -> רשימת כותרות קצרה
router.get("/hackernews", async (req, res) => {
  try {
    const top = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
    const ids = await top.json();
    const first = ids.slice(0, 8);
    const articles = await Promise.all(
      first.map(async (id) => {
        const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        const it = await r.json();
        return {
          id: it.id,
          title: it.title,
          url: it.url || `https://news.ycombinator.com/item?id=${it.id}`,
          by: it.by,
          time: it.time
        };
      })
    );
    res.json({ success: true, articles });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
