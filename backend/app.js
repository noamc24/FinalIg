const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");
const path = require("path");
const authRouter = require("./routes/authRoute");
const usersRouter = require("./routes/userRoute");
const postsRouter = require("./routes/postsRoute");
const groupsRouter = require("./routes/groupRoute");
const postsExtrasRouter = require("./routes/postsExtrasRoute");
const newsRouter = require("./routes/newsRoute");
const app = express();
const PORT = 3000;

app.use(cors({
  origin: "*"
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use('/frontend', express.static(path.join(__dirname, '..', 'frontend')));
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/posts", postsRouter);
app.use("/api/groups", groupsRouter);
app.use("/api/post-extras", postsExtrasRouter);
app.use("/api/news", newsRouter);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`));
});
