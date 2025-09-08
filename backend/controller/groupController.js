const User = require("../models/userModel");
const Group = require("../models/groupModel");

async function findGroup(identifier) {
  if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
    return await Group.findById(identifier);
  } else {
    return await Group.findOne({ name: identifier });
  }
}

const groupController = {
  // Create a group that auto-includes all users the creator follows
  createGroupFromFollowing: async (req, res) => {
    try {
      const { username, name, description = "", includeSelf = true, isPublic = false } = req.body || {};

      if (!username || !name) {
        return res.status(400).json({ success: false, error: "username and name are required" });
      }

      const user = await User.findOne({ username });
      if (!user) return res.status(404).json({ success: false, error: "User not found" });

      const existing = await Group.findOne({ name });
      if (existing) return res.status(400).json({ success: false, error: "Group name already taken" });

      const followingUsernames = Array.isArray(user.following) ? user.following : [];
      const followingUsers = await User.find({ username: { $in: followingUsernames } }, { _id: 1 });
      const followingIds = followingUsers.map(u => u._id);

      const membersSet = new Set(followingIds.map(id => id.toString()));
      if (includeSelf) membersSet.add(user._id.toString());

      const members = Array.from(membersSet).map(id => id);

      const group = new Group({
        name,
        description,
        isPublic: Boolean(isPublic),
        owner: user._id,
        admins: [user._id],
        members
      });

      await group.save();

      // also attach group to owner profile groups array if not present
      if (!Array.isArray(user.groups)) user.groups = [];
      if (!user.groups.find(gid => gid.toString() === group._id.toString())) {
        user.groups.push(group._id);
        await user.save();
      }

      return res.status(201).json({ success: true, message: "Group created from following", group });
    } catch (err) {
      return res.status(500).json({ success: false, error: "Server error", details: err.message });
    }
  },

  createGroup: async (req, res) => {
    try {
      const { username, name, description } = req.body;
      const user = await User.findOne({ username });
      if (!user)
        return res
          .status(404)
          .json({ success: false, error: "User not found" });

      const existing = await Group.findOne({ name });
      if (existing)
        return res
          .status(400)
          .json({ success: false, error: "Group name already taken" });

      const group = new Group({
        name,
        description,
        owner: user._id,
        admins: [user._id],
        members: [user._id],
      });

      await group.save();
      res.status(201).json({ success: true, message: "Group created", group });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, error: "Server error", details: err.message });
    }
  },

  joinGroup: async (req, res) => {
    try {
      const { username, group } = req.body;
      const user = await User.findOne({ username });
      const groupObj = await findGroup(group);

      if (!user || !groupObj)
        return res.status(404).json({ success: false, error: "Not found" });

      if (!groupObj.members.includes(user._id)) {
        groupObj.members.push(user._id);
        user.groups.push(groupObj._id); 
        await groupObj.save();
        await user.save();
      }

      res.json({
        success: true,
        message: `${username} joined ${groupObj.name}`,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: "Server error" });
    }
  },

  addMember: async (req, res) => {
    try {
      const { adminUsername, targetUsername, group } = req.body;
      const admin = await User.findOne({ username: adminUsername });
      const target = await User.findOne({ username: targetUsername });
      const groupObj = await findGroup(group);

      if (!admin || !target || !groupObj)
        return res.status(404).json({ success: false, error: "Not found" });
      if (!groupObj.admins.includes(admin._id))
        return res
          .status(403)
          .json({ success: false, error: "Not authorized" });

      if (!groupObj.members.includes(target._id)) {
        groupObj.members.push(target._id);
        await groupObj.save();
      }

      res.json({
        success: true,
        message: `${targetUsername} added to ${groupObj.name}`,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: "Server error" });
    }
  },

  removeMember: async (req, res) => {
    try {
      const { adminUsername, targetUsername, group } = req.body;
      const admin = await User.findOne({ username: adminUsername });
      const target = await User.findOne({ username: targetUsername });
      const groupObj = await findGroup(group);

      if (!admin || !target || !groupObj)
        return res.status(404).json({ success: false, error: "Not found" });
      if (!groupObj.admins.includes(admin._id))
        return res
          .status(403)
          .json({ success: false, error: "Not authorized" });

      groupObj.members = groupObj.members.filter(
        (m) => m.toString() !== target._id.toString()
      );
      await groupObj.save();

      res.json({
        success: true,
        message: `${targetUsername} removed from ${groupObj.name}`,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: "Server error" });
    }
  },

  getGroup: async (req, res) => {
    try {
      const groupObj = await findGroup(req.params.group);
      if (!groupObj)
        return res
          .status(404)
          .json({ success: false, error: "Group not found" });

      await groupObj.populate(
        "owner admins members",
        "username fullName profilePic"
      );

      res.json({ success: true, group: groupObj });
    } catch (err) {
      res.status(500).json({ success: false, error: "Server error" });
    }
  },

  addMessage: async (req, res) => {
    try {
      const { groupId } = req.params;
      const { username, text } = req.body;

      const user = await User.findOne({ username });
      if (!user) return res.status(404).json({ success: false, error: "User not found" });

      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ success: false, error: "Group not found" });

      // בדיקה שהמשתמש חבר בקבוצה
      if (!group.members.includes(user._id) && group.owner.toString() !== user._id.toString()) {
        return res.status(403).json({ success: false, error: "Not a member of the group" });
      }

      const newMessage = {
        userId: user._id,
        username: user.username,
        text
      };

      group.messages.push(newMessage);
      await group.save();

      res.status(201).json({ success: true, message: "Message sent", data: newMessage });
    } catch (err) {
      console.error("❌ addMessage error:", err);
      res.status(500).json({ success: false, error: "Server error" });
    }
  },

  // ✅ עריכת הודעה
  editMessage: async (req, res) => {
    try {
      const { groupId, messageId } = req.params;
      const { username, text } = req.body;

      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ success: false, error: "Group not found" });

      const message = group.messages.id(messageId);
      if (!message) return res.status(404).json({ success: false, error: "Message not found" });

      if (message.username !== username) {
        return res.status(403).json({ success: false, error: "You can only edit your own messages" });
      }

      message.text = text;
      await group.save();

      res.json({ success: true, message: "Message updated", data: message });
    } catch (err) {
      console.error("❌ editMessage error:", err);
      res.status(500).json({ success: false, error: "Server error" });
    }
  },

  // ✅ מחיקת הודעה
  deleteMessage: async (req, res) => {
    try {
      const { groupId, messageId } = req.params;
      const { username } = req.body;

      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ success: false, error: "Group not found" });

      const message = group.messages.id(messageId);
      if (!message) return res.status(404).json({ success: false, error: "Message not found" });

      if (message.username !== username) {
        return res.status(403).json({ success: false, error: "You can only delete your own messages" });
      }

      message.deleteOne();
      await group.save();

      res.json({ success: true, message: "Message deleted" });
    } catch (err) {
      console.error("❌ deleteMessage error:", err);
      res.status(500).json({ success: false, error: "Server error" });
    }
  },

  // ✅ קבלת כל ההודעות בקבוצה
  getMessages: async (req, res) => {
    try {
      const { groupId } = req.params;

      const group = await Group.findById(groupId).populate("messages.userId", "username profilePic");
      if (!group) return res.status(404).json({ success: false, error: "Group not found" });

      res.json({ success: true, messages: group.messages });
    } catch (err) {
      console.error("❌ getMessages error:", err);
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
};

module.exports = groupController;
