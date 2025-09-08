const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");
const path = require("path");
const authRouter = require("./routes/authRoute");
const usersRouter = require("./routes/userRoute");
const postsRouter = require("./routes/postsRoute");
const groupsRouter = require("./routes/groupRoute");
const postsExtrasRouter = require("./routes/postsExtrasRoute");
const storiesRouter = require("./routes/storiesRoute");
const statsRouter = require("./routes/statsRoute");

const app = express();
const PORT = 3000;

app.use(cors({
  origin: "*"
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// הוספת כותרת CORS לקבצים סטטיים (uploads)
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
}, express.static(path.join(__dirname, 'uploads')));
app.use('/frontend', express.static(path.join(__dirname, '..', 'frontend')));
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/posts", postsRouter);
app.use("/api/groups", groupsRouter);
app.use("/api/post-extras", postsExtrasRouter);
app.use("/api/stories", storiesRouter);
app.use("/api/stats", statsRouter);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`));
});