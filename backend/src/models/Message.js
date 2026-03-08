import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {      
      type: String,
      trim: true,
      maxlength: 2000,
    },
    image: {
      type: String,
    },
    
    audio: {
      type: String, 
    },

    replyTo: {
      messageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
      text:      { type: String },        // snapshot of original text
      senderName:{ type: String },        // snapshot of original sender name
      image:     { type: String },        // snapshot if it was an image
    },
    
    isForwarded: { type: Boolean, default: false },

    starredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    isPinned: { type: Boolean, default: false },

    isRead: {
      type: Boolean,
      default: false,
    },

    reactions: [
      {
        emoji: { type: String, required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      },
    ],

     deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isDeletedForAll: {
      type: Boolean,
      default: false,
    },

    linkPreview: {
      url:         { type: String },
      title:       { type: String },
      description: { type: String },
      image:       { type: String },
      siteName:    { type: String },
      favicon:     { type: String },
    },

    
    expiresAt: { type: Date, default: null, index: { expireAfterSeconds: 0, sparse: true } },

  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;