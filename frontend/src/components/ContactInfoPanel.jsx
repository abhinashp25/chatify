import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import {
  XIcon, PhoneIcon, VideoIcon, StarIcon, BellOffIcon, BellIcon,
  TrashIcon, MessageSquareXIcon, TimerIcon, ChevronRightIcon,
  QrCodeIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import StarredMessages from "./StarredMessages";
import DisappearTimerPicker from "./DisappearTimerPicker";
import ContactQRModal from "./ContactQRModal";

export default function ContactInfoPanel({ user, onClose, onClearChat, onArchive }) {
  const { onlineUsers } = useAuthStore();
  const { lastSeenMap, toggleStarMessage, disappearSeconds, setDisappearSeconds,
          blockUser, unblockUser, isUserBlocked } = useChatStore();

  const [notifications, setNotifications]   = useState(true);
  const [showStarred,   setShowStarred]     = useState(false);
  const [showDisappear, setShowDisappear]   = useState(false);
  const [showQR,        setShowQR]          = useState(false);
  const [blocked,       setBlocked]         = useState(isUserBlocked(user._id));

  const isOnline = onlineUsers.includes(user._id);
  const lastSeen = lastSeenMap[user._id] || user.lastSeen;

  useEffect(() => {
    setBlocked(isUserBlocked(user._id));
  }, [user._id]);

  function lastSeenLabel(iso) {
    if (!iso) return "";
    const d    = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 2)  return "last seen just now";
    if (mins < 60) return `last seen ${mins} min ago`;
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24)  return `last seen today at ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
    return `last seen ${d.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
  }

  const disappearLabel =
    disappearSeconds === 0       ? "Off"
    : disappearSeconds === 3600   ? "1 hour"
    : disappearSeconds === 86400  ? "24 hours"
    : disappearSeconds === 604800 ? "7 days"
    : "Custom";

  const handleBlock = async () => {
    if (blocked) {
      await unblockUser(user._id);
      setBlocked(false);
    } else {
      await blockUser(user._id);
      setBlocked(true);
    }
  };

  if (showStarred) {
    return (
      <motion.div className="absolute inset-0 z-50" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}>
        <StarredMessages onClose={() => setShowStarred(false)} />
      </motion.div>
    );
  }

  if (showDisappear) {
    return (
      <DisappearTimerPicker
        partnerId={user._id}
        onClose={() => setShowDisappear(false)}
        onChanged={s => setDisappearSeconds(s)}
      />
    );
  }

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute top-0 right-0 bottom-0 z-40 flex flex-col w-full sm:w-[380px] bg-[#111111] border-l border-[#262626]"
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-5 h-[64px] flex-shrink-0 bg-[#111111]">
        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
          <XIcon className="w-5 h-5 text-white" />
        </button>
        <p className="text-[16px] font-medium text-white">Contact info</p>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#000000]">

        {/* Profile card */}
        <div className="flex flex-col items-center py-8 px-6 bg-[#0a0a0a] mb-2">
          <img src={user.profilePic || "/avatar.png"} alt={user.fullName}
            className="w-44 h-44 rounded-full object-cover mb-5" />
          <h2 className="text-2xl text-white font-semibold text-center">{user.fullName}</h2>
          <p className="text-[15px] text-[#a3a3a3] mt-1">{user.email}</p>
          <p className="text-[13px] mt-1" style={{ color: isOnline ? "#10b981" : "#a3a3a3" }}>
            {isOnline ? "Online now" : lastSeenLabel(lastSeen)}
          </p>

          {/* Quick-action buttons */}
          <div className="flex items-center justify-center gap-6 mt-6">
            {[
              { icon: <PhoneIcon size={22} />, label: "Audio" },
              { icon: <VideoIcon size={22} />, label: "Video" },
              { icon: <QrCodeIcon size={22} />, label: "QR Code", action: () => setShowQR(true) },
            ].map(btn => (
              <button key={btn.label}
                onClick={btn.action}
                className="flex flex-col items-center gap-2 text-white hover:opacity-75 transition-opacity">
                <div className="p-3 bg-[#1a1a1a] rounded-xl border border-[#262626]">{btn.icon}</div>
                <span className="text-[12px] font-medium">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="bg-[#0a0a0a] px-5 py-4 mb-2">
          <p className="text-[#a3a3a3] text-xs mb-1">About</p>
          <p className="text-white text-[15px]">{user.bio || user.status || "Hey there! I am using Chatify."}</p>
        </div>

        {/* Config section */}
        <div className="bg-[#0a0a0a] mb-2 divide-y divide-[#141414]">
          <button onClick={() => setNotifications(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#111111] transition-colors">
            <div className="flex items-center gap-4">
              <div className="text-[#a3a3a3]">
                {notifications ? <BellIcon size={20} /> : <BellOffIcon size={20} />}
              </div>
              <span className="text-white text-[15px]">Mute notifications</span>
            </div>
            <label className="relative inline-flex items-center pointer-events-none">
              <input type="checkbox" className="sr-only peer" checked={!notifications} readOnly />
              <div className="w-9 h-5 bg-[#333] rounded-full peer peer-checked:after:translate-x-[18px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white" />
            </label>
          </button>

          <button onClick={() => setShowStarred(true)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#111111] transition-colors">
            <div className="flex items-center gap-4">
              <StarIcon size={20} className="text-[#a3a3a3]" />
              <span className="text-white text-[15px]">Starred messages</span>
            </div>
            <ChevronRightIcon size={16} className="text-[#a3a3a3]" />
          </button>

          <button onClick={() => setShowDisappear(true)}
            className="w-full flex flex-col items-start px-5 py-4 hover:bg-[#111111] transition-colors">
            <div className="flex items-center gap-4 w-full justify-between">
              <div className="flex items-center gap-4">
                <TimerIcon size={20} className="text-[#a3a3a3]" />
                <span className="text-white text-[15px]">Disappearing messages</span>
              </div>
              <ChevronRightIcon size={16} className="text-[#a3a3a3]" />
            </div>
            <p className="text-[#a3a3a3] text-[13px] pl-9 mt-0.5">{disappearLabel}</p>
          </button>
        </div>

        {/* Danger actions */}
        <div className="bg-[#0a0a0a] mb-8 divide-y divide-[#141414]">
          <button onClick={handleBlock}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#111111] transition-colors text-[#ef4444]">
            <MessageSquareXIcon size={20} />
            <span className="text-[15px]">{blocked ? `Unblock ${user.fullName}` : `Block ${user.fullName}`}</span>
          </button>
          {onClearChat && (
            <button onClick={onClearChat}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#111111] transition-colors text-[#ef4444]">
              <TrashIcon size={20} />
              <span className="text-[15px]">Clear chat</span>
            </button>
          )}
        </div>
      </div>

      {/* QR Modal */}
      <AnimatePresence>
        {showQR && <ContactQRModal user={user} onClose={() => setShowQR(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
