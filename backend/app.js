const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");

const authRouter = require("./routes/authRoute");
const usersRouter = require("./routes/userRoute");
const postsRouter = require("./routes/postsRoute");
const groupsRouter = require("./routes/groupRoute");
const postsExtrasRouter = require("./routes/postsExtrasRoute");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// API
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/posts", postsRouter);
app.use("/api/groups", groupsRouter);
app.use("/api/post-extras", postsExtrasRouter);




connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`));
});
