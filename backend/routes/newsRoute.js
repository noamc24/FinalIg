// routes/newsRoute.js
const express = require("express");
const router = express.Router();

// אם יש global.fetch (Node 18+), נשתמש בו; אחרת נטען node-fetch דינמית
const fetchFn =
  typeof fetch === "function"
    ? fetch
    : (...args) => import("node-fetch").then(({ default: f }) => f(...args));

/**
 * GET /api/news/hackernews
 * מביא כתבות מובילות מ-Hacker News, מעבד ומחזיר JSON נקי לתצוגה.
 */
router.get("/hackernews", async (req, res) => {
  try {
    // מזהי כתבות מובילות
    const ids = await fetchFn(
      "https://hacker-news.firebaseio.com/v0/topstories.json"
    ).then((r) => r.json());

    // פרטי 15 הכתבות הראשונות
    const items = await Promise.all(
      ids.slice(0, 15).map((id) =>
        fetchFn(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(
          (r) => r.json()
        )
      )
    );

    // סינון/מיפוי לשדות לתצוגה
    const articles = items
      .filter((it) => it && it.title && it.url)
      .slice(0, 8)
      .map(({ id, title, by, url, score, time }) => ({
        id,
        title,
        by,
        url,
        score,
        time, // Unix seconds
      }));

    res.json({ success: true, articles });
  } catch (err) {
    console.error("HN fetch error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch Hacker News" });
  }
});

module.exports = router;
