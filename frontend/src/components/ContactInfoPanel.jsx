import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import {
  XIcon, PhoneIcon, VideoIcon, StarIcon, ArchiveIcon,
  BellOffIcon, BellIcon, TrashIcon, ShieldIcon, ChevronRightIcon,
  MessageSquareXIcon, TimerIcon, Image, ClockIcon
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function ContactInfoPanel({ user, onClose, onClearChat, onArchive }) {
  const { onlineUsers } = useAuthStore();
  const { lastSeenMap, toggleStarMessage } = useChatStore();
  const [notifications, setNotifications] = useState(true);

  const isOnline = onlineUsers.includes(user._id);
  const lastSeen = lastSeenMap[user._id] || user.lastSeen;

  function lastSeenLabel(iso) {
    if (!iso) return "";
    const d = new Date(iso); const diff = new Date().getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 2) return "last seen just now";
    if (mins < 60) return `last seen ${mins} min ago`;
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24) return `last seen today at ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
    return `last seen ${d.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute top-0 right-0 bottom-0 z-40 flex flex-col w-full sm:w-[380px] bg-[#111111] border-l border-[#262626]"
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-5 h-16 sm:h-[68px] flex-shrink-0" style={{ background: "#111111", color: "white" }}>
        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
          <XIcon className="w-5 h-5 text-white" />
        </button>
        <p className="text-[16px] font-medium">Contact info</p>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ background: "#000000" }}>
        
        {/* Profile Card */}
        <div className="flex flex-col items-center py-8 px-6 bg-[#0a0a0a] shadow-sm mb-2">
          <img src={user.profilePic || "/avatar.png"} alt={user.fullName}
            className="w-48 h-48 rounded-full object-cover mb-5" />
          
          <h2 className="text-2xl text-white font-medium text-center">{user.fullName}</h2>
          <p className="text-[15px] text-[#a3a3a3] mt-1">{user.email}</p>
          <p className="text-[14px] mt-1" style={{ color: isOnline ? '#ffffff' : '#a3a3a3' }}>
            {isOnline ? "online" : lastSeenLabel(lastSeen)}
          </p>

          <div className="flex w-full items-center justify-center gap-8 mt-6">
            <button className="flex flex-col items-center gap-2 text-[#ffffff] hover:opacity-80 transition-opacity">
              <div className="p-3 bg-[#000000] rounded-xl"><PhoneIcon size={24} /></div>
              <span className="text-[13px] font-medium">Audio</span>
            </button>
            <button className="flex flex-col items-center gap-2 text-[#ffffff] hover:opacity-80 transition-opacity">
              <div className="p-3 bg-[#000000] rounded-xl"><VideoIcon size={24} /></div>
              <span className="text-[13px] font-medium">Video</span>
            </button>
            <button className="flex flex-col items-center gap-2 text-[#ffffff] hover:opacity-80 transition-opacity">
              <div className="p-3 bg-[#000000] rounded-xl"><XIcon className="rotate-45" size={24} /></div>
              <span className="text-[13px] font-medium">Search</span>
            </button>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-[#0a0a0a] px-5 py-4 shadow-sm mb-2">
          <p className="text-[#a3a3a3] text-sm mb-1">About</p>
          <p className="text-white text-[15px]">{user.bio || user.status || "Hey there! I am using Chatify."}</p>
        </div>

        {/* Media, links and docs */}
        <button className="w-full flex items-center justify-between bg-[#0a0a0a] px-5 py-4 shadow-sm mb-2 hover:bg-[#111111] transition-colors">
          <span className="text-white text-[15px]">Media, links and docs</span>
          <div className="flex items-center gap-2 text-[#a3a3a3]">
            <span className="text-xs">0</span>
            <ChevronRightIcon size={16} />
          </div>
        </button>

        {/* Config Section 1 */}
        <div className="bg-[#0a0a0a] shadow-sm mb-2">
          <button 
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#111111] transition-colors"
            onClick={() => setNotifications(!notifications)}
          >
            <div className="flex items-center gap-4">
              <div className="text-[#a3a3a3]">{notifications ? <BellIcon size={20} /> : <BellOffIcon size={20} />}</div>
              <span className="text-white text-[15px]">Mute notifications</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
              <input type="checkbox" className="sr-only peer" checked={!notifications} readOnly />
              <div className="w-9 h-5 bg-[#333] rounded-full peer peer-checked:after:translate-x-[18px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ffffff]"></div>
            </label>
          </button>

          <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#111111] transition-colors">
            <div className="flex items-center gap-4">
              <div className="text-[#a3a3a3]"><StarIcon size={20} /></div>
              <span className="text-white text-[15px]">Starred messages</span>
            </div>
            <ChevronRightIcon size={16} className="text-[#a3a3a3]" />
          </button>
        </div>

        {/* Config Section 2 */}
        <div className="bg-[#0a0a0a] shadow-sm mb-2">
          <button className="w-full flex flex-col items-start px-5 py-4 hover:bg-[#111111] transition-colors">
            <div className="flex items-center gap-4 mb-1">
              <div className="text-[#a3a3a3]"><TimerIcon size={20} /></div>
              <span className="text-white text-[15px]">Disappearing messages</span>
            </div>
            <p className="text-[#a3a3a3] text-[13px] pl-9">Off</p>
          </button>
        </div>

        {/* Danger Actions */}
        <div className="bg-[#0a0a0a] shadow-sm mb-6">
          <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#111111] transition-colors text-[#ef4444]">
            <MessageSquareXIcon size={20} />
            <span className="text-[15px]">Block {user.fullName}</span>
          </button>
          <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#111111] transition-colors text-[#ef4444]">
            <TrashIcon size={20} />
            <span className="text-[15px]">Report {user.fullName}</span>
          </button>
          {onClearChat && (
            <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#111111] transition-colors text-[#ef4444]" onClick={onClearChat}>
              <XIcon size={20} />
              <span className="text-[15px]">Clear chat</span>
            </button>
          )}
        </div>

      </div>
    </motion.div>
  );
}
