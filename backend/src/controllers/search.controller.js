import Message from "../models/Message.js";
import User from "../models/User.js";

// Searches across ALL conversations the user is part of.
export const globalSearch = async (req, res) => {
  try {
    const myId = req.user._id;
    const { q } = req.query;

    if (!q || q.trim().length < 2)
      return res.status(400).json({ message: "Query must be at least 2 characters." });

    const query = q.trim();

    const messages = await Message.find({
      $or: [{ senderId: myId }, { receiverId: myId }],
      text: { $regex: query, $options: "i" },
      isDeletedForAll: false,
      deletedFor: { $nin: [myId] },
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    if (!messages.length) return res.json({ results: [], total: 0 });

    const partnerIdSet = new Set();
    for (const m of messages) {
      const pid = m.senderId.equals(myId) ? m.receiverId : m.senderId;
      partnerIdSet.add(pid.toString());
    }

    const partners = await User.find({ _id: { $in: [...partnerIdSet] } })
      .select("fullName profilePic")
      .lean();
    const partnerMap = Object.fromEntries(partners.map((p) => [p._id.toString(), p]));

    const grouped = {};
    for (const m of messages) {
      const partnerId = m.senderId.toString() === myId.toString()
        ? m.receiverId.toString()
        : m.senderId.toString();

      if (!grouped[partnerId]) {
        grouped[partnerId] = {
          partner: partnerMap[partnerId] || { _id: partnerId, fullName: "Unknown" },
          messages: [],
        };
      }

      if (grouped[partnerId].messages.length < 5) {
        grouped[partnerId].messages.push({
          _id:       m._id,
          text:      m.text,
          image:     m.image,
          audio:     m.audio,
          isMine:    m.senderId.toString() === myId.toString(),
          createdAt: m.createdAt,
        });
      }
    }

    const results = Object.values(grouped);
    res.json({ results, total: messages.length, query });
  } catch (e) {
    console.error("globalSearch:", e);
    res.status(500).json({ message: "Server error" });
  }
};
