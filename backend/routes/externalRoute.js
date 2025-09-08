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
    // Fallback: local placeholder suggestions to avoid empty UI when offline
    const fallback = [
      { username: "alex_dev", fullName: "Alex Developer", avatar: null, country: "" },
      { username: "maya_k", fullName: "Maya K.", avatar: null, country: "" },
      { username: "sam_codes", fullName: "Sam Codes", avatar: null, country: "" },
      { username: "lily_r", fullName: "Lily R.", avatar: null, country: "" },
      { username: "noam_b", fullName: "Noam B.", avatar: null, country: "" },
    ];
    res.json(fallback);
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
    // Fallback: local placeholder news items
    const now = new Date().toISOString();
    const fallback = [
      { id: "local-1", title: "Welcome to your feed", url: "#", author: "system", points: null, createdAt: now },
      { id: "local-2", title: "Explore trending posts", url: "#", author: "system", points: null, createdAt: now },
      { id: "local-3", title: "Follow people to personalize", url: "#", author: "system", points: null, createdAt: now },
    ];
    res.json(fallback);
  }
});

module.exports = router;
