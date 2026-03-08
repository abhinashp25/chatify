import cloudinary from "../lib/cloudinary.js";
import { io } from "../lib/socket.js";
import Group from "../models/Group.js";
import GroupMessage from "../models/GroupMessage.js";
import User from "../models/User.js";

export const createGroup = async (req, res) => {
  try {
    const { name, description, memberIds, groupPic } = req.body;
    const creatorId = req.user._id;

    if (!name?.trim()) return res.status(400).json({ message: "Group name is required." });

    let picUrl = "";
    if (groupPic) {
      const upload = await cloudinary.uploader.upload(groupPic);
      picUrl = upload.secure_url;
    }

    const allMembers = [...new Set([creatorId.toString(), ...(memberIds || [])])];

    const group = new Group({
      name: name.trim(), description: description || "",
      groupPic: picUrl, createdBy: creatorId,
      admins: [creatorId], members: allMembers,
    });
    await group.save();
    const populated = await Group.findById(group._id).populate("members", "-password");

    allMembers.forEach((memberId) => {
      io.to(`user:${memberId}`).emit("groupCreated", populated);
    });

    res.status(201).json(populated);
  } catch (e) {
    console.error("createGroup error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate("members", "-password")
      .sort({ lastMessageAt: -1 });
    res.json(groups);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const myId = req.user._id;

    const group = await Group.findOne({ _id: groupId, members: myId });
    if (!group) return res.status(403).json({ message: "Not a member." });

    const messages = await GroupMessage.find({
      groupId,
      deletedFor: { $nin: [myId] },
      isDeletedForAll: false,
    }).populate("senderId", "fullName profilePic");

    res.json(messages);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { text, image, audio } = req.body;
    const { groupId } = req.params;
    const senderId = req.user._id;

    const group = await Group.findOne({ _id: groupId, members: senderId });
    if (!group) return res.status(403).json({ message: "Not a member." });

    let imageUrl, audioUrl;
    if (image) { const r = await cloudinary.uploader.upload(image); imageUrl = r.secure_url; }
    if (audio) { const r = await cloudinary.uploader.upload(audio, { resource_type: "auto" }); audioUrl = r.secure_url; }

    const msg = new GroupMessage({
      groupId, senderId, text, image: imageUrl, audio: audioUrl,
      // Sender has automatically "read" their own message
      readBy: [{ userId: senderId, readAt: new Date() }],
    });
    await msg.save();
    await msg.populate("senderId", "fullName profilePic");

    await Group.findByIdAndUpdate(groupId, {
      lastMessage: text || (imageUrl ? "📷 Image" : "🎤 Voice message"),
      lastMessageAt: new Date(),
    });

    io.to(`group:${groupId}`).emit("newGroupMessage", msg);
    res.status(201).json(msg);
  } catch (e) {
    console.error("sendGroupMessage error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

export const markGroupMessagesRead = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findOne({ _id: groupId, members: userId });
    if (!group) return res.status(403).json({ message: "Not a member." });

    await GroupMessage.updateMany(
      {
        groupId,
        isDeletedForAll: false,
        "readBy.userId": { $ne: userId },
      },
      {
        $push: { readBy: { userId, readAt: new Date() } },
      }
    );

    const memberCount = group.members.length;

    io.to(`group:${groupId}`).emit("groupMessagesRead", {
      groupId,
      byUserId: userId.toString(),
      memberCount,
    });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessageReadBy = async (req, res) => {
  try {
    const { groupId, messageId } = req.params;
    const userId = req.user._id;

    const group = await Group.findOne({ _id: groupId, members: userId });
    if (!group) return res.status(403).json({ message: "Not a member." });

    const msg = await GroupMessage.findById(messageId)
      .populate("readBy.userId", "fullName profilePic");
    if (!msg) return res.status(404).json({ message: "Not found." });

    res.json({
      readBy: msg.readBy,
      memberCount: group.members.length,
    });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};

export const addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const group = await Group.findOne({ _id: groupId, admins: req.user._id });
    if (!group) return res.status(403).json({ message: "Admins only." });

    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }
    const populated = await Group.findById(groupId).populate("members", "-password");
    io.to(`group:${groupId}`).emit("groupUpdated", populated);
    res.json(populated);
  } catch (e) { res.status(500).json({ message: "Server error" }); }
};

export const removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const group = await Group.findOne({ _id: groupId, admins: req.user._id });
    if (!group) return res.status(403).json({ message: "Admins only." });

    group.members = group.members.filter((m) => m.toString() !== userId);
    await group.save();
    const populated = await Group.findById(groupId).populate("members", "-password");
    io.to(`group:${groupId}`).emit("groupUpdated", populated);
    res.json(populated);
  } catch (e) { res.status(500).json({ message: "Server error" }); }
};

export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    group.members = group.members.filter((m) => !m.equals(userId));
    group.admins  = group.admins.filter((a) => !a.equals(userId));
    if (group.admins.length === 0 && group.members.length > 0) {
      group.admins.push(group.members[0]);
    }
    await group.save();
    const populated = await Group.findById(groupId).populate("members", "-password");
    io.to(`group:${groupId}`).emit("groupUpdated", populated);
    res.json({ message: "Left group." });
  } catch (e) { res.status(500).json({ message: "Server error" }); }
};
