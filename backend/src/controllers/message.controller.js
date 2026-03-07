import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in getAllContacts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
    });

    const chatPartnerIds = [
      ...new Set(
        messages.map((msg) =>
          msg.senderId.toString() === loggedInUserId.toString()
            ? msg.receiverId.toString()
            : msg.senderId.toString()
        )
      ),
    ];

    const chatPartners = await User.find({ _id: { $in: chatPartnerIds } }).select("-password");
    res.status(200).json(chatPartners);
  } catch (error) {
    console.error("Error in getChatPartners:", error.message);
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
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, audio } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text && !image) return res.status(400).json({ message: "Text or image is required." });
    if (senderId.equals(receiverId)) return res.status(400).json({ message: "Cannot send messages to yourself." });

    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) return res.status(404).json({ message: "Receiver not found." });

    let imageUrl, audioUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }
    if (audio) {
      const uploadResponse = await cloudinary.uploader.upload(audio, { resource_type: "auto" });
      audioUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({ senderId, receiverId, text, image: imageUrl, audio: audioUrl });
    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller:", error.message);
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
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesRead", { by: receiverId.toString() });
      }
    }

    res.status(200).json({ message: "Messages marked as read", count: result.modifiedCount });
  } catch (error) {
    console.log("Error in markMessagesAsRead controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const toggleReaction = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) return res.status(400).json({ message: "Emoji is required." });

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found." });

    const isParticipant =
      message.senderId.equals(userId) || message.receiverId.equals(userId);
    if (!isParticipant) return res.status(403).json({ message: "Not allowed." });

    const existingIdx = message.reactions.findIndex((r) => r.userId.equals(userId));

    if (existingIdx !== -1) {
      if (message.reactions[existingIdx].emoji === emoji) {
        message.reactions.splice(existingIdx, 1);
      } else {
        message.reactions[existingIdx].emoji = emoji;
      }
    } else {
      message.reactions.push({ emoji, userId });
    }

    await message.save();

    const otherUserId = message.senderId.equals(userId)
      ? message.receiverId.toString()
      : message.senderId.toString();

    const payload = { messageId: message._id.toString(), reactions: message.reactions };

    const otherSocketId = getReceiverSocketId(otherUserId);
    if (otherSocketId) io.to(otherSocketId).emit("messageReaction", payload);

    const reactorSocketId = getReceiverSocketId(userId.toString());
    if (reactorSocketId) io.to(reactorSocketId).emit("messageReaction", payload);

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in toggleReaction controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: messageId } = req.params;
    const { deleteForEveryone } = req.body; // boolean

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found." });

    const isSender = message.senderId.equals(userId);
    const isReceiver = message.receiverId.equals(userId);

    if (!isSender && !isReceiver) {
      return res.status(403).json({ message: "Not allowed." });
    }

    if (deleteForEveryone && !isSender) {
      return res.status(403).json({ message: "Only the sender can unsend a message." });
    }

    if (deleteForEveryone) {
      message.isDeletedForAll = true;
    } else {
      if (!message.deletedFor.includes(userId)) {
        message.deletedFor.push(userId);
      }
    }

    await message.save();

    const otherId = isSender
      ? message.receiverId.toString()
      : message.senderId.toString();

    const otherSocketId = getReceiverSocketId(otherId);
    if (otherSocketId) {
      io.to(otherSocketId).emit("messageDeleted", {
        messageId: message._id.toString(),
        deletedForAll: deleteForEveryone,
      });
    }

    res.status(200).json({ message: "Message deleted.", deletedForAll: deleteForEveryone });
  } catch (error) {
    console.log("Error in deleteMessage controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const toggleArchiveChat = async (req, res) => {
  try {
    const userId = req.user._id;
    const { partnerId } = req.params;
    const user = await User.findById(userId);
    const isArchived = user.archivedChats.some((id) => id.equals(partnerId));
    if (isArchived) {
      user.archivedChats = user.archivedChats.filter((id) => !id.equals(partnerId));
    } else {
      user.archivedChats.push(partnerId);
    }
    await user.save();
    res.json({ archived: !isArchived, partnerId });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getArchivedChats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("archivedChats", "-password");
    res.json(user.archivedChats || []);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};
