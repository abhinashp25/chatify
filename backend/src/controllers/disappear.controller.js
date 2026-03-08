import User from "../models/User.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// Valid timer options in seconds (0 = off)
const VALID_TIMERS = new Set([0, 3600, 86400, 604800, 2592000, 7776000]);
// 0=off, 1h, 24h, 7d, 30d, 90d

export const setDisappearTimer = async (req, res) => {
  try {
    const myId = req.user._id;
    const { partnerId } = req.params;
    const { seconds } = req.body; // 0 = off

    if (!VALID_TIMERS.has(Number(seconds)))
      return res.status(400).json({ message: "Invalid timer value." });

    const user = await User.findById(myId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (Number(seconds) === 0) {
      user.disappearTimers.delete(partnerId);
    } else {
      user.disappearTimers.set(partnerId, Number(seconds));
    }
    await user.save();

    const partnerSocketId = getReceiverSocketId(partnerId);
    if (partnerSocketId) {
      io.to(partnerSocketId).emit("disappearTimerChanged", {
        byUserId: myId.toString(),
        seconds: Number(seconds),
      });
    }

    res.json({ seconds: Number(seconds), partnerId });
  } catch (e) {
    console.error("setDisappearTimer:", e);
    res.status(500).json({ message: "Server error" });
  }
};

export const getDisappearTimer = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const user = await User.findById(req.user._id).select("disappearTimers");
    const seconds = user.disappearTimers?.get(partnerId) || 0;
    res.json({ seconds, partnerId });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};
