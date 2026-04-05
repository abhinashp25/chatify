import { useState, useEffect, useRef } from "react";
import {
  ArrowLeftIcon, PhoneIcon, VideoIcon, MoreVerticalIcon,
  SearchIcon, XIcon, ArchiveIcon, UserIcon, MessageSquareXIcon,
  StarIcon, TimerIcon, ClockIcon,
} from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useCallStore } from "../store/useCallStore";
import { axiosInstance } from "../lib/axios";
import StarredMessages    from "./StarredMessages";
import ContactInfoPanel   from "./ContactInfoPanel";
import DisappearTimerPicker from "./DisappearTimerPicker";
import ScheduledList      from "./ScheduledList";
import toast from "react-hot-toast";

export default function ChatHeader() {
  const {
    selectedUser, setSelectedUser, setSearchQuery, searchQuery,
    typingUsers, getMyChatPartners, lastSeenMap, clearChat,
    markChatArchived, disappearSeconds, setDisappearSeconds,
  } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { startCall } = useCallStore();

  const [menuOpen,         setMenuOpen]         = useState(false);
  const [searchOpen,       setSearchOpen]        = useState(false);
  const [showStarred,      setShowStarred]       = useState(false);
  const [showContactInfo,  setShowContactInfo]   = useState(false);
  const [showDisappear,    setShowDisappear]     = useState(false);
  const [showScheduledList,setShowScheduledList] = useState(false);
  const menuRef   = useRef(null);
  const searchRef = useRef(null);

  const isOnline = onlineUsers.includes(selectedUser._id);
  const isTyping = typingUsers[selectedUser._id];
  const lastSeen = lastSeenMap[selectedUser._id] || selectedUser.lastSeen;

  function lastSeenLabel(iso) {
    if (!iso) return "last seen a while ago";
    const d = new Date(iso); const diff = Date.now() - d;
    const mins = Math.floor(diff / 60000);
    if (mins < 2)  return "last seen just now";
    if (mins < 60) return `last seen ${mins} min ago`;
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24)  return `last seen today at ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
    return `last seen ${d.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
  }

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50);
    else setSearchQuery("");
  }, [searchOpen]);

  if (showStarred) {
    return (
      <div style={{ position: "absolute", inset: 0, zIndex: 20, background: "var(--bg-secondary)" }}>
        <StarredMessages onClose={() => setShowStarred(false)} />
      </div>
    );
  }

  if (showScheduledList) {
    return (
      <div style={{ position: "absolute", inset: 0, zIndex: 20, background: "var(--bg-secondary)" }}>
        <ScheduledList onClose={() => setShowScheduledList(false)} />
      </div>
    );
  }

  const handleArchive = async () => {
    try {
      const res = await axiosInstance.put(`/messages/archive/${selectedUser._id}`);
      const isNowArchived = res.data?.archived ?? true;
      markChatArchived(selectedUser._id, isNowArchived);
      toast.success(isNowArchived ? "Chat archived" : "Chat unarchived");
      setSelectedUser(null);
    } catch { toast.error("Failed to archive"); }
    setMenuOpen(false);
  };

  const disappearLabel =
    disappearSeconds === 0 ? null
    : disappearSeconds === 3600    ? "1h"
    : disappearSeconds === 86400   ? "24h"
    : disappearSeconds === 604800  ? "7d"
    : disappearSeconds === 2592000 ? "30d"
    : "90d";

  return (
    <>
      <div className="flex-shrink-0" style={{ background: "#202c33", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2 px-3 h-[64px] relative">
          <div className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: "linear-gradient(90deg, #4fd1c5, #667eea)", opacity: 0.5 }} />

          <button onClick={() => setSelectedUser(null)} className="icon-btn sm:hidden">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>

          <div className="relative flex-shrink-0 cursor-pointer" onClick={() => setShowContactInfo(true)}>
            <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName}
              className="w-10 h-10 rounded-full object-cover hover:opacity-90 transition-opacity"
              style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }} />
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                style={{ background: "#48bb78", borderColor: "var(--bg-header)" }} />
            )}
          </div>

          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowContactInfo(true)}>
            <div className="flex items-center gap-1.5">
              <p className="text-[15px] font-bold truncate hover:opacity-80 transition-opacity"
                style={{ color: "var(--text-primary)" }}>
                {selectedUser.fullName}
              </p>
              {/* Disappear timer badge */}
              {disappearLabel && (
                <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: "rgba(79,209,197,0.15)", color: "var(--accent)" }}>
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {disappearLabel}
                </span>
              )}
            </div>
            {isTyping ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[12px]" style={{ color: "#4fd1c5" }}>typing</span>
                <span className="flex gap-0.5">{[0,100,200].map((d) => (
                  <span key={d} className="w-1 h-1 rounded-full animate-bounce"
                    style={{ background: "#4fd1c5", animationDelay: `${d}ms` }} />
                ))}</span>
              </div>
            ) : (
              <p className="text-[12px]" style={{ color: isOnline ? "#48bb78" : "var(--text-muted)" }}>
                {isOnline ? "Online" : lastSeenLabel(lastSeen)}
              </p>
            )}
          </div>

          <button className="icon-btn" title="Voice call" onClick={() => startCall(selectedUser._id, false)}>
            <PhoneIcon className="w-[17px] h-[17px]" />
          </button>
          <button className="icon-btn" title="Video call" onClick={() => startCall(selectedUser._id, true)}>
            <VideoIcon className="w-[17px] h-[17px]" />
          </button>

          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen((v) => !v)} className={`icon-btn ${menuOpen ? "active" : ""}`}>
              <MoreVerticalIcon className="w-[17px] h-[17px]" />
            </button>
            {menuOpen && (
              <div className="dropdown-menu animate-dropdown" style={{ top: 44, right: 0, minWidth: 220 }}>
                <MenuItem icon={<UserIcon className="w-4 h-4" />} label="Contact info"
                  onClick={() => { setShowContactInfo(true); setMenuOpen(false); }} />
                <MenuItem icon={<SearchIcon className="w-4 h-4" />} label="Search messages"
                  onClick={() => { setSearchOpen(true); setMenuOpen(false); }} />
                <MenuItem icon={<StarIcon className="w-4 h-4" />} label="Starred messages"
                  onClick={() => { setShowStarred(true); setMenuOpen(false); }} />
                <MenuItem icon={<ClockIcon className="w-4 h-4" />} label="Scheduled messages"
                  onClick={() => { setShowScheduledList(true); setMenuOpen(false); }} />
                <MenuItem
                  icon={<TimerIcon className="w-4 h-4" />}
                  label={disappearLabel ? `Disappear: ${disappearLabel}` : "Disappearing messages"}
                  onClick={() => { setShowDisappear(true); setMenuOpen(false); }}
                />
                <MenuItem icon={<ArchiveIcon className="w-4 h-4" />} label="Archive chat"
                  onClick={handleArchive} />
                <div className="dropdown-divider" />
                <MenuItem icon={<MessageSquareXIcon className="w-4 h-4" />} label="Close chat" danger
                  onClick={() => { setSelectedUser(null); setMenuOpen(false); }} />
              </div>
            )}
          </div>
        </div>

        {searchOpen && (
          <div className="flex items-center gap-2 px-3 pb-2.5">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: "var(--text-muted)" }} />
              <input ref={searchRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in conversation…"
                className="w-full py-2 pl-9 pr-8 text-sm rounded-full border-none focus:outline-none"
                style={{ background: "var(--bg-input)", color: "var(--text-primary)" }} />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button onClick={() => setSearchOpen(false)} className="icon-btn"><XIcon className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      {showContactInfo && (
        <ContactInfoPanel
          user={selectedUser}
          onClose={() => setShowContactInfo(false)}
          onClearChat={() => clearChat(selectedUser._id)}
          onArchive={handleArchive}
        />
      )}

      {showDisappear && (
        <DisappearTimerPicker
          partnerId={selectedUser._id}
          onClose={() => setShowDisappear(false)}
          onChanged={(s) => setDisappearSeconds(s)}
        />
      )}
    </>
  );
}

function MenuItem({ icon, label, onClick, danger }) {
  return (
    <button onClick={onClick} className="dropdown-item" style={{ color: danger ? "#fc8181" : "var(--text-primary)" }}>
      <span style={{ color: danger ? "#fc8181" : "var(--text-muted)" }}>{icon}</span>
      {label}
    </button>
  );
}
