import mongoose from "mongoose";

const groupMessageSchema = new mongoose.Schema(
  {
    groupId:  { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },
    text:     { type: String, trim: true, maxlength: 2000 },
    image:    { type: String },
    audio:    { type: String },  
    reactions: [
      {
        emoji:  { type: String, required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      },
    ],
    deletedFor:    [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isDeletedForAll: { type: Boolean, default: false },

    readBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        readAt:  { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const GroupMessage = mongoose.model("GroupMessage", groupMessageSchema);
export default GroupMessage;
