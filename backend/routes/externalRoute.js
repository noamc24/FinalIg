const express = require("express");
const https = require("https");

const router = express.Router();

function getJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (err) {
            reject(err);
          }
        });
      })
      .on("error", (err) => reject(err));
  });
}

// GET /api/external/suggestions?count=5
router.get("/suggestions", async (req, res) => {
  const countRaw = parseInt(req.query.count, 10);
  const count = Number.isFinite(countRaw) ? Math.min(Math.max(countRaw, 1), 10) : 5;

  const url = `https://randomuser.me/api/?results=${count}&nat=us,gb,ca,au,il`;
  try {
    const payload = await getJson(url);
    const results = Array.isArray(payload?.results) ? payload.results : [];
    const mapped = results.map((u) => ({
      username: u?.login?.username || `${u?.name?.first || "user"}${Math.floor(Math.random()*1000)}`,
      fullName: `${u?.name?.first || ""} ${u?.name?.last || ""}`.trim(),
      avatar: u?.picture?.medium || u?.picture?.thumbnail || null,
      country: u?.location?.country || null,
    }));
    res.json(mapped);
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch suggestions", details: String(err?.message || err) });
  }
});

// GET /api/external/news - latest front-page tech news (no count param)
router.get("/news", async (req, res) => {
  const url = "https://hn.algolia.com/api/v1/search?tags=front_page";
  try {
    const payload = await getJson(url);
    const hits = Array.isArray(payload?.hits) ? payload.hits : [];
    const mapped = hits.map((h) => ({
      id: h?.objectID,
      title: h?.title || h?.story_title || "Untitled",
      url: h?.url || h?.story_url || null,
      author: h?.author || null,
      points: typeof h?.points === "number" ? h.points : null,
      createdAt: h?.created_at || null,
    }));
    res.json(mapped);
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch news", details: String(err?.message || err) });
  }
});

module.exports = router;
