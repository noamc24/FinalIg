const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Post = require('../models/post');

router.post('/register', async (req, res) => {
  try {
    const { username, fullName, email, password } = req.body;

    const userExists = await User.findOne({ username });
    if (userExists) return res.status(400).json({ error: 'Username already exists' });

    const newUser = new User({ username, fullName, email, password });
    await newUser.save();

    const defaultFollows = ["KingPaul1010", "Ron.Drin7", "unrealNews", "Elad_Atia10", "Sultan29", "noam11010", "Sahar_ifrach", "Roy_montekyo10", "I.D.F", "itzik123213"];
    await User.updateOne(
      { _id: newUser._id },
      { $addToSet: { following: { $each: defaultFollows } } }
    );

    res.status(201).json({ message: 'User created successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log("הגיע מהקליינט:", req.body);

  try {
    const user = await User.findOne({ username });

    if (!user) {
      console.log("משתמש לא נמצא");
      return res.status(401).json({ error: 'שם המשתמש לא קיים' });
    }

    if (user.password !== password) {
      console.log("סיסמה שגויה");
      return res.status(401).json({ error: 'סיסמה שגויה' });
    }

    res.status(200).json({
      username: user.username,
      profilePic: user.profilePic || "/assets/Photos/defaultprfl.png"
    });

  } catch (err) {
    console.error("🚨 שגיאת שרת בלוגין:", err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

module.exports = router;
