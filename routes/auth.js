const express = require('express');
const router = express.Router();
const User = require('../models/user');

router.post('/register', async (req, res) => {
  try {
    const { username, fullName, email, password } = req.body;

    const userExists = await User.findOne({ username });
    if (userExists) return res.status(400).json({ error: 'Username already exists' });

    const newUser = new User({ username, fullName, email, password });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully!' });

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'שם המשתמש לא קיים' });

    if (user.password !== password)
      return res.status(401).json({ error: 'סיסמה שגויה' });

    res.status(200).json({ message: 'Logged in successfully!' });

  } catch (err) {
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

module.exports = router;
