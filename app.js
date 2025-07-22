const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'html')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Mongo connection
mongoose.connect('mongodb://localhost:27017/new-users')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ Mongo Error:', err));

// API Routes
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/user');
const statsRoutes = require('./routes/stats');

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);

// 👇 זה חשוב מאוד שיהיה כאן (לפני ה-listen)
app.get("/profile/:username", (req, res) => {
  res.sendFile(path.join(__dirname, "html", "profile.html"));
});

// Start the server
app.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});
