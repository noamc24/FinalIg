const fs = require("fs");

["uploads", "assets"].forEach((folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
    console.log(`תיקייה ${folder} נוצרה`);
  }
});

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const app = express();
const router = express.Router();

// Middlewares
app.use(express.json({ limit: "1000mb" }));
app.use(express.urlencoded({ extended: true, limit: "1000mb" }));
app.use(express.static(path.join(__dirname, "html")));
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use("/uploads", express.static("uploads"));

// Mongo connection
mongoose
  .connect("mongodb://localhost:27017/new-users")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ Mongo Error:", err));

// API Routes
const authRouter = require("./routes/authRoute");
const usersRouter = require("./routes/userRoute");
const postsRouter = require("./routes/postsRoute");
const groupsRouter = require("./routes/groupRoute");
const postsExtrasRouter = require("./routes/postsExtrasRoute");

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/posts", postsRouter);
app.use("/api/groups", groupsRouter);
app.use("/api/post-extras", postsExtrasRouter);

// 👇 זה חשוב מאוד שיהיה כאן (לפני ה-listen)
app.get("/profile/:username", (req, res) => {
  res.sendFile(path.join(__dirname, "html", "profile.html"));
});

// Start the server
app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
app.use(express.static("assets"));
