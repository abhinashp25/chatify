import mongoose from "mongoose";

const scheduledMessageSchema = new mongoose.Schema(
  {
    senderId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text:       { type: String, trim: true, maxlength: 2000 },
    image:      { type: String },
    audio:      { type: String },
    scheduledAt:{ type: Date, required: true },   // when to fire
    status:     { type: String, enum: ["pending","sent","cancelled"], default: "pending" },
    sentMessageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" }, // filled after sent
  },
  { timestamps: true }
);

scheduledMessageSchema.index({ scheduledAt: 1, status: 1 });

const ScheduledMessage = mongoose.model("ScheduledMessage", scheduledMessageSchema);
export default ScheduledMessage;
