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
      type: String, // base64 or Cloudinary URL
    },
    
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
    // isDeletedForAll: sender chose "unsend" — hidden for everyone
    isDeletedForAll: {
      type: Boolean,
      default: false,
    },

  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;