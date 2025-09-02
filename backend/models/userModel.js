const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  profilePic: { type: String, default: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3wp373FQFBWrTX6j8BqHG1jPz_tmkS2yAxg&s" },
  username: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
 followers: [{ type: String }], 
  following: [{ type: String }]  , 
groups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }]

}, { timestamps: true });


module.exports = mongoose.model('User', userSchema);

