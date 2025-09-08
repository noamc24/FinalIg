// backend/app.js
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");
const path = require("path");

const authRouter = require("./routes/authRoute");
const usersRouter = require("./routes/userRoute");
const postsRouter = require("./routes/postsRoute");
const groupsRouter = require("./routes/groupRoute");
const postsExtrasRouter = require("./routes/postsExtrasRoute");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static
app.use("/frontend", express.static(path.join(__dirname, "..", "frontend")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API routes
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/posts", postsRouter);
app.use("/api/groups", groupsRouter);
app.use("/api/post-extras", postsExtrasRouter);

// Optional: news route (לא חובה. אם אין קובץ—לא נופלים)
try {
  const newsRouter = require("./routes/newsRoute");
  app.use("/api/news", newsRouter);
  console.log("News route loaded");
} catch (e) {
  console.log("News route not loaded (optional):", e.message);
}

connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`));
});
