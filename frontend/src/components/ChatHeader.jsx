import { useState, useEffect, useRef } from "react";
import {
  ArrowLeftIcon, PhoneIcon, VideoIcon, MoreVerticalIcon,
  SearchIcon, XIcon, ArchiveIcon, UserIcon, MessageSquareXIcon,
  StarIcon,
} from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import StarredMessages   from "./StarredMessages";
import ContactInfoPanel  from "./ContactInfoPanel";
import toast from "react-hot-toast";

export default function ChatHeader() {
  const {
    selectedUser, setSelectedUser, setSearchQuery, searchQuery,
    typingUsers, getMyChatPartners, lastSeenMap, clearChat,
  } = useChatStore();
  const { onlineUsers } = useAuthStore();

  const [menuOpen,       setMenuOpen]       = useState(false);
  const [searchOpen,     setSearchOpen]     = useState(false);
  const [showStarred,    setShowStarred]    = useState(false);
  const [showContactInfo,setShowContactInfo] = useState(false);
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
      <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'var(--bg-secondary)' }}>
        <StarredMessages onClose={() => setShowStarred(false)} />
      </div>
    );
  }

  const handleArchive = async () => {
    try {
      await axiosInstance.put(`/messages/archive/${selectedUser._id}`);
      toast.success("Chat archived");
      await getMyChatPartners();
      setSelectedUser(null);
    } catch { toast.error("Failed to archive"); }
    setMenuOpen(false);
  };

  return (
    <>
      <div className="flex-shrink-0" style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 px-3 h-[64px] relative">
          <div className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: 'linear-gradient(90deg, #4fd1c5, #667eea)', opacity: 0.5 }} />

          <button onClick={() => setSelectedUser(null)} className="icon-btn sm:hidden">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>

          {/* Avatar — clicking opens contact info */}
          <div className="relative flex-shrink-0 cursor-pointer" onClick={() => setShowContactInfo(true)}>
            <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName}
              className="w-10 h-10 rounded-full object-cover hover:opacity-90 transition-opacity"
              style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }} />
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                style={{ background: '#48bb78', borderColor: 'var(--bg-header)' }} />
            )}
          </div>

          {/* Name + status — also opens contact info */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowContactInfo(true)}>
            <p className="text-[15px] font-bold truncate hover:opacity-80 transition-opacity"
              style={{ color: 'var(--text-primary)' }}>
              {selectedUser.fullName}
            </p>
            {isTyping ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[12px]" style={{ color: '#4fd1c5' }}>typing</span>
                <span className="flex gap-0.5">{[0,100,200].map((d) => (
                  <span key={d} className="w-1 h-1 rounded-full animate-bounce"
                    style={{ background: '#4fd1c5', animationDelay: `${d}ms` }} />
                ))}</span>
              </div>
            ) : (
              <p className="text-[12px]" style={{ color: isOnline ? '#48bb78' : 'var(--text-muted)' }}>
                {isOnline ? "Online" : lastSeenLabel(lastSeen)}
              </p>
            )}
          </div>

          <button className="icon-btn" title="Voice call" onClick={() => toast("Voice calls coming soon! 📞", { icon: "📞" })}>
            <PhoneIcon className="w-[17px] h-[17px]" />
          </button>
          <button className="icon-btn" title="Video call" onClick={() => toast("Video calls coming soon! 📹", { icon: "📹" })}>
            <VideoIcon className="w-[17px] h-[17px]" />
          </button>

          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen((v) => !v)} className={`icon-btn ${menuOpen ? "active" : ""}`}>
              <MoreVerticalIcon className="w-[17px] h-[17px]" />
            </button>
            {menuOpen && (
              <div className="dropdown-menu animate-dropdown" style={{ top: 44, right: 0, minWidth: 210 }}>
                <MenuItem icon={<UserIcon className="w-4 h-4" />} label="Contact info"
                  onClick={() => { setShowContactInfo(true); setMenuOpen(false); }} />
                <MenuItem icon={<SearchIcon className="w-4 h-4" />} label="Search messages"
                  onClick={() => { setSearchOpen(true); setMenuOpen(false); }} />
                <MenuItem icon={<StarIcon className="w-4 h-4" />} label="Starred messages"
                  onClick={() => { setShowStarred(true); setMenuOpen(false); }} />
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
                style={{ color: 'var(--text-muted)' }} />
              <input ref={searchRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in conversation…"
                className="w-full py-2 pl-9 pr-8 text-sm rounded-full border-none focus:outline-none"
                style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }} />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button onClick={() => setSearchOpen(false)} className="icon-btn"><XIcon className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      {/* Contact info panel */}
      {showContactInfo && (
        <ContactInfoPanel
          user={selectedUser}
          onClose={() => setShowContactInfo(false)}
          onClearChat={() => clearChat(selectedUser._id)}
          onArchive={handleArchive}
        />
      )}
    </>
  );
}

function MenuItem({ icon, label, onClick, danger }) {
  return (
    <button onClick={onClick} className="dropdown-item" style={{ color: danger ? '#fc8181' : 'var(--text-primary)' }}>
      <span style={{ color: danger ? '#fc8181' : 'var(--text-muted)' }}>{icon}</span>
      {label}
    </button>
  );
}
