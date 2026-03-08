import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/Message.js";
import ScheduledMessage from "../models/ScheduledMessage.js";
import User from "../models/User.js";

export const createScheduledMessage = async (req, res) => {
  try {
    const { text, image, scheduledAt } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text && !image)
      return res.status(400).json({ message: "Message content required." });

    const fireAt = new Date(scheduledAt);
    if (isNaN(fireAt) || fireAt <= new Date())
      return res.status(400).json({ message: "scheduledAt must be a future date." });

    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    if (fireAt > maxDate)
      return res.status(400).json({ message: "Cannot schedule more than 1 year ahead." });

    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) return res.status(404).json({ message: "Receiver not found." });

    let imageUrl;
    if (image) {
      const r = await cloudinary.uploader.upload(image);
      imageUrl = r.secure_url;
    }

    const msg = new ScheduledMessage({
      senderId, receiverId, text, image: imageUrl, scheduledAt: fireAt,
    });
    await msg.save();

    res.status(201).json(msg);
  } catch (e) {
    console.error("createScheduledMessage:", e);
    res.status(500).json({ message: "Server error" });
  }
};

export const getScheduledMessages = async (req, res) => {
  try {
    const msgs = await ScheduledMessage.find({
      senderId: req.user._id,
      status: "pending",
    })
      .populate("receiverId", "fullName profilePic")
      .sort({ scheduledAt: 1 });
    res.json(msgs);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};

export const cancelScheduledMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const msg = await ScheduledMessage.findOne({ _id: id, senderId: req.user._id });
    if (!msg) return res.status(404).json({ message: "Not found." });
    if (msg.status !== "pending") return res.status(400).json({ message: "Already sent or cancelled." });

    msg.status = "cancelled";
    await msg.save();
    res.json({ message: "Cancelled." });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};

// Called once from server.js after DB connects.
export function startScheduler() {
  const tick = async () => {
    try {
      const now = new Date();
      const due = await ScheduledMessage.find({
        status: "pending",
        scheduledAt: { $lte: now },
      });

      for (const sm of due) {
        try {
          // Build and persist the real message
          const newMsg = new Message({
            senderId:   sm.senderId,
            receiverId: sm.receiverId,
            text:       sm.text,
            image:      sm.image,
            audio:      sm.audio,
          });
          await newMsg.save();

          // Push via socket if receiver is online
          const receiverSocketId = getReceiverSocketId(sm.receiverId.toString());
          if (receiverSocketId) io.to(receiverSocketId).emit("newMessage", newMsg);

          // Also notify sender so their chat list updates
          const senderSocketId = getReceiverSocketId(sm.senderId.toString());
          if (senderSocketId) io.to(senderSocketId).emit("scheduledMessageSent", {
            scheduledId: sm._id,
            message: newMsg,
          });

          sm.status = "sent";
          sm.sentMessageId = newMsg._id;
          await sm.save();
        } catch (innerErr) {
          console.error("Scheduler fire error for", sm._id, innerErr.message);
        }
      }
    } catch (e) {
      console.error("Scheduler tick error:", e.message);
    }
  };

  // First run immediately, then every 30s
  tick();
  setInterval(tick, 30_000);
  console.log("📅 Message scheduler started (30s interval)");
}
