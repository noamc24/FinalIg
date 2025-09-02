const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const JWT_SECRET = process.env.JWT_SECRET || "mySecretKey";

const authController = {
  register: async (req, res) => {
    try {
      const { username, fullName, email, password, profilePic } = req.body;

      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        return res.status(400).json({ success: false, error: "Username or Email already taken" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = new User({
        username,
        fullName,
        email,
        password: hashedPassword,
        profilePic: profilePic || "/assets/Photos/defaultprfl.png"
      });

      await newUser.save();

      res.status(201).json({ success: true, message: "User registered successfully" });
    } catch (err) {
      console.error("❌ register error:", err);
      res.status(500).json({ success: false, error: "Server error", details: err.message });
    }
  },

  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      const user = await User.findOne({ username });
      if (!user) {
        return res.status(401).json({ success: false, error: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user._id, username: user.username },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({
        success: true,
        token,
        user: {
          username: user.username,
          fullName: user.fullName,
          profilePic: user.profilePic
        }
      });
    } catch (err) {
      console.error("❌ login error:", err);
      res.status(500).json({ success: false, error: "Server error" });
    }
  },

  authMiddleware: (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(403).json({ success: false, error: "Invalid or expired token" });
    }
  }
};

module.exports = authController;
