const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const path = require('path');

const app = express();
app.use(express.json());

// סטטי – ששרת יגיש את קבצי ה-HTML, CSS, JS
app.use(express.static(path.join(__dirname, 'html')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

mongoose.connect('mongodb://localhost:27017/new-users')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ Mongo Error:', err));

app.use('/api/auth', authRoutes);

app.listen(3000, () => console.log('🚀 Server running on http://localhost:3000'));
