const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  profilePic : { type: String, default: "/assets/Photos/defaultPrfl.jpg" },
  username: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
following: [{ type: String }]
});

module.exports = mongoose.model('User', userSchema);

