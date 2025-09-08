const express = require("express");
const stats = require("../controller/statsController");

const router = express.Router();

router.get("/posts-per-day", stats.postsPerDay);
router.get("/media-type", stats.mediaTypeDistribution);
router.get("/likes-avg-per-day", stats.likesAvgPerDay);

module.exports = router;

