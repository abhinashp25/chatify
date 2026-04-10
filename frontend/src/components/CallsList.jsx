import { useState } from "react";
import { Phone, Video, PhoneIncoming, PhoneMissed, PhoneOutgoing, PlusCircle } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";

export default function CallsList() {
  const { chats } = useChatStore();
  const { startCall, callHistory } = useCallStore();
  const [activeCallFilter, setActiveCallFilter] = useState("all");

  const getUserData = (userId) => chats.find(c => c._id === userId) || { fullName: "Unknown User", profilePic: "/avatar.png", _id: userId };

  const enrichedHistory = callHistory.map(call => ({
    ...call,
    user: getUserData(call.userId),
    timestamp: new Date(call.timestamp)
  }));

  const filtered = activeCallFilter === "missed"
    ? enrichedHistory.filter(c => c.type === "missed")
    : enrichedHistory;

  function formatTime(date) {
    if (!date) return "";
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (days === 1) return "Yesterday";
    if (days < 7) return date.toLocaleDateString([], { weekday: "short" });
    return date.toLocaleDateString([], { day: "numeric", month: "short" });
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "#000000" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <h1 className="text-[22px] font-bold text-gray-200">Calls</h1>
        <button
          onClick={() => {}}
          className="hover:bg-white/10 p-2 rounded-full transition-colors text-gray-400"
          title="New call">
          <PlusCircle size={20} />
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 px-4 pb-3 flex-shrink-0">
        <button
          onClick={() => setActiveCallFilter("all")}
          className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
            activeCallFilter === "all" ? "bg-white text-black" : "bg-[#141414] text-[#a3a3a3]"
          }`}>
          All
        </button>
        <button
          onClick={() => setActiveCallFilter("missed")}
          className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
            activeCallFilter === "missed" ? "bg-red-500/20 text-red-500" : "bg-[#141414] text-[#a3a3a3]"
          }`}>
          Missed
        </button>
      </div>

      {/* Call list */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Phone size={40} className="text-gray-600" />
            <p className="text-sm text-gray-500">No call history</p>
          </div>
        )}
        {filtered.map((call) => (
          <div
            key={call._id}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer group transition-colors"
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <img
                src={call.user.profilePic || "/avatar.png"}
                alt={call.user.fullName}
                className="w-12 h-12 rounded-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className={`text-[14.5px] font-semibold truncate ${
                call.type === "missed" ? "text-red-400" : "text-gray-100"
              }`}>
                {call.user.fullName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <CallTypeIcon type={call.type} />
                <span className="text-[12px] text-gray-400">
                  {call.type === "missed" ? "Missed" : call.type === "incoming" ? "Incoming" : "Outgoing"}
                  {call.duration ? ` · ${call.duration}` : ""}
                  {call.isVideo ? " · Video" : " · Voice"}
                </span>
              </div>
            </div>

            {/* Timestamp + call button */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <span className="text-[11.5px] text-gray-500">{formatTime(call.timestamp)}</span>
              <button
                onClick={(e) => { e.stopPropagation(); startCall(call.user._id, call.isVideo); }}
                className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-[#1a1a1a] text-[#a3a3a3] hover:text-white transition-all"
                title={`${call.isVideo ? "Video" : "Voice"} call`}
              >
                {call.isVideo ? <Video size={18} /> : <Phone size={18} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CallTypeIcon({ type }) {
  if (type === "missed") return <PhoneMissed size={14} className="text-red-500 flex-shrink-0" />;
  if (type === "incoming") return <PhoneIncoming size={14} className="text-white flex-shrink-0" />;
  return <PhoneOutgoing size={14} className="text-[#a3a3a3] flex-shrink-0" />;
}
