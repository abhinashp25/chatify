import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { extractFirstUrl, fetchLinkPreview } from "../lib/linkPreview.js";

export const getAllContacts = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select("-password");
    res.json(users);
  } catch (e) { res.status(500).json({ message: "Server error" }); }
};

export const getChatPartners = async (req, res) => {
  try {
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [{ senderId: myId }, { receiverId: myId }],
      isDeletedForAll: false,
    }).sort({ createdAt: -1 });

    const partnerLastMsg = {};
    for (const msg of messages) {
      const partnerId = msg.senderId.equals(myId)
        ? msg.receiverId.toString()
        : msg.senderId.toString();
      if (!partnerLastMsg[partnerId]) partnerLastMsg[partnerId] = msg;
    }

    const partnerIds = Object.keys(partnerLastMsg);
    if (!partnerIds.length) return res.json([]);

    const partners = await User.find({ _id: { $in: partnerIds } }).select("-password");

    const unreadCounts = {};
    for (const msg of messages) {
      const isFromOther = !msg.senderId.equals(myId);
      if (isFromOther && !msg.isRead && !msg.isDeletedForAll) {
        const partnerId = msg.senderId.toString();
        unreadCounts[partnerId] = (unreadCounts[partnerId] || 0) + 1;
      }
    }

    const currentUser = await User.findById(myId).select("archivedChats disappearTimers");
    const archivedSet = new Set((currentUser.archivedChats || []).map(String));

    const enriched = partners.map((p) => {
      const lastMsg = partnerLastMsg[p._id.toString()];
      const disappearSeconds = currentUser.disappearTimers?.get(p._id.toString()) || 0;
      return {
        ...p.toObject(),
        lastMessage: {
          text:      lastMsg.isDeletedForAll ? "This message was deleted" :
                     lastMsg.audio ? "🎤 Voice message" :
                     lastMsg.image ? "📷 Photo" :
                     lastMsg.text || "",
          createdAt: lastMsg.createdAt,
          isMine:    lastMsg.senderId.equals(myId),
          isRead:    lastMsg.isRead,
          isDeleted: lastMsg.isDeletedForAll,
        },
        unreadCount:      unreadCounts[p._id.toString()] || 0,
        isArchived:       archivedSet.has(p._id.toString()),
        disappearSeconds, // let frontend show the timer icon in sidebar
      };
    });

    enriched.sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));
    res.json(enriched);
  } catch (e) {
    console.error("getChatPartners error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
      deletedFor: { $nin: [myId] },
      isDeletedForAll: false,
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, audio, replyTo, isForwarded } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text && !image && !audio)
      return res.status(400).json({ message: "Message content required." });
    if (senderId.equals(receiverId))
      return res.status(400).json({ message: "Cannot message yourself." });

    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) return res.status(404).json({ message: "Receiver not found." });

    let imageUrl, audioUrl;
    if (image) { const r = await cloudinary.uploader.upload(image); imageUrl = r.secure_url; }
    if (audio) { const r = await cloudinary.uploader.upload(audio, { resource_type: "auto" }); audioUrl = r.secure_url; }

    const senderUser = await User.findById(senderId).select("disappearTimers");
    const disappearSeconds = senderUser.disappearTimers?.get(receiverId.toString()) || 0;
    let expiresAt = null;
    if (disappearSeconds > 0) {
      expiresAt = new Date(Date.now() + disappearSeconds * 1000);
    }

    const newMessage = new Message({
      senderId, receiverId, text, image: imageUrl, audio: audioUrl,
      replyTo: replyTo || undefined,
      isForwarded: isForwarded || false,
      expiresAt,
    });
    await newMessage.save();

    const urlInText = text ? extractFirstUrl(text) : null;
    if (urlInText) {
      fetchLinkPreview(urlInText).then(async (preview) => {
        if (!preview) return;
        await Message.findByIdAndUpdate(newMessage._id, { linkPreview: preview });
        const updatedMsg = await Message.findById(newMessage._id).lean();

        // Push preview update to both sender and receiver
        const receiverSocket = getReceiverSocketId(receiverId.toString());
        const senderSocket   = getReceiverSocketId(senderId.toString());
        if (receiverSocket) io.to(receiverSocket).emit("messageLinkPreview", updatedMsg);
        if (senderSocket)   io.to(senderSocket).emit("messageLinkPreview", updatedMsg);
      }).catch(() => {}); // silently ignore preview failures
    }

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) io.to(receiverSocketId).emit("newMessage", newMessage);

    res.status(201).json(newMessage);
  } catch (e) {
    console.error("sendMessage error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const receiverId = req.user._id;
    const { id: senderId } = req.params;
    const result = await Message.updateMany(
      { senderId, receiverId, isRead: false },
      { $set: { isRead: true } }
    );
    if (result.modifiedCount > 0) {
      const senderSocketId = getReceiverSocketId(senderId);
      if (senderSocketId) io.to(senderSocketId).emit("messagesRead", { by: receiverId.toString() });
    }
    res.json({ count: result.modifiedCount });
  } catch (e) { res.status(500).json({ error: "Internal server error" }); }
};

export const toggleReaction = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: messageId } = req.params;
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ message: "Emoji required." });

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found." });

    const isParticipant = message.senderId.equals(userId) || message.receiverId.equals(userId);
    if (!isParticipant) return res.status(403).json({ message: "Not allowed." });

    const existingIdx = message.reactions.findIndex((r) => r.userId.equals(userId));
    if (existingIdx !== -1) {
      if (message.reactions[existingIdx].emoji === emoji) message.reactions.splice(existingIdx, 1);
      else message.reactions[existingIdx].emoji = emoji;
    } else {
      message.reactions.push({ emoji, userId });
    }
    await message.save();

    const payload = { messageId: message._id.toString(), reactions: message.reactions };
    const otherUserId = message.senderId.equals(userId) ? message.receiverId : message.senderId;
    const s1 = getReceiverSocketId(otherUserId.toString());
    const s2 = getReceiverSocketId(userId.toString());
    if (s1) io.to(s1).emit("messageReaction", payload);
    if (s2) io.to(s2).emit("messageReaction", payload);

    res.json(message);
  } catch (e) { res.status(500).json({ error: "Internal server error" }); }
};

export const deleteMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: messageId } = req.params;
    const { deleteForEveryone } = req.body;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found." });

    const isSender   = message.senderId.equals(userId);
    const isReceiver = message.receiverId.equals(userId);
    if (!isSender && !isReceiver) return res.status(403).json({ message: "Not allowed." });
    if (deleteForEveryone && !isSender) return res.status(403).json({ message: "Only sender can unsend." });

    if (deleteForEveryone) {
      message.isDeletedForAll = true;
    } else {
      if (!message.deletedFor.includes(userId)) message.deletedFor.push(userId);
    }
    await message.save();

    const otherId = isSender ? message.receiverId.toString() : message.senderId.toString();
    const otherSocketId = getReceiverSocketId(otherId);
    if (otherSocketId) io.to(otherSocketId).emit("messageDeleted", { messageId: message._id.toString(), deletedForAll: deleteForEveryone });

    res.json({ message: "Deleted.", deletedForAll: deleteForEveryone });
  } catch (e) { res.status(500).json({ error: "Internal server error" }); }
};

export const toggleStarMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: messageId } = req.params;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Not found." });

    const isStarred = message.starredBy.some((id) => id.equals(userId));
    if (isStarred) message.starredBy = message.starredBy.filter((id) => !id.equals(userId));
    else message.starredBy.push(userId);
    await message.save();

    res.json({ starred: !isStarred, messageId });
  } catch (e) { res.status(500).json({ message: "Server error" }); }
};

export const getStarredMessages = async (req, res) => {
  try {
    const msgs = await Message.find({ starredBy: req.user._id, isDeletedForAll: false })
      .sort({ createdAt: -1 }).limit(100);
    res.json(msgs);
  } catch (e) { res.status(500).json({ message: "Server error" }); }
};

export const togglePinMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Not found." });

    const isParticipant = message.senderId.equals(req.user._id) || message.receiverId.equals(req.user._id);
    if (!isParticipant) return res.status(403).json({ message: "Not allowed." });

    message.isPinned = !message.isPinned;
    await message.save();

    const otherId = message.senderId.equals(req.user._id) ? message.receiverId : message.senderId;
    const otherSocket = getReceiverSocketId(otherId.toString());
    if (otherSocket) io.to(otherSocket).emit("messagePinned", { messageId, isPinned: message.isPinned });

    res.json({ isPinned: message.isPinned, messageId });
  } catch (e) { res.status(500).json({ message: "Server error" }); }
};

export const toggleArchiveChat = async (req, res) => {
  try {
    const userId = req.user._id;
    const { partnerId } = req.params;
    const user = await User.findById(userId);
    const isArchived = user.archivedChats.some((id) => id.equals(partnerId));
    if (isArchived) user.archivedChats = user.archivedChats.filter((id) => !id.equals(partnerId));
    else user.archivedChats.push(partnerId);
    await user.save();
    res.json({ archived: !isArchived, partnerId });
  } catch (e) { res.status(500).json({ message: "Server error" }); }
};

export const getArchivedChats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("archivedChats", "-password");
    res.json(user.archivedChats || []);
  } catch (e) { res.status(500).json({ message: "Server error" }); }
};

export const clearChat = async (req, res) => {
  try {
    const myId = req.user._id;
    const { userId } = req.params;
    await Message.updateMany(
      {
        $or: [
          { senderId: myId, receiverId: userId },
          { senderId: userId, receiverId: myId },
        ],
        deletedFor: { $nin: [myId] },
      },
      { $push: { deletedFor: myId } }
    );
    res.json({ message: "Chat cleared." });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};
