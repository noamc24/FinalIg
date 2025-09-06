const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  profilePic: { type: String, default: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKBVax3l4oTAvil48p2QCRiCQKrDXztDImKpZVUD1tXcCUBc8ssG1m9Oq4YslmTs5F0m4&usqp=CAU" },
  username: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
 followers: [{ type: String }],   // מי עוקב אחרי המשתמש
  following: [{ type: String }]  ,  // אחרי מי המשתמש עוקב
groups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }]

}, { timestamps: true });


module.exports = mongoose.model('User', userSchema);

