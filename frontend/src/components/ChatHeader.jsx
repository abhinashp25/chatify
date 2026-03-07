import { useState, useEffect, useRef } from "react";
import {
  ArrowLeftIcon, PhoneIcon, VideoIcon, MoreVerticalIcon,
  SearchIcon, XIcon, ArchiveIcon, UserIcon, MessageSquareXIcon,
} from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export default function ChatHeader() {
  const { selectedUser, setSelectedUser, setSearchQuery, searchQuery, typingUsers, getMyChatPartners } = useChatStore();
  const { onlineUsers } = useAuthStore();

  const [menuOpen,   setMenuOpen]   = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuRef  = useRef(null);
  const searchRef = useRef(null);

  const isOnline  = onlineUsers.includes(selectedUser._id);
  const isTyping  = typingUsers[selectedUser._id];

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50);
    else setSearchQuery("");
  }, [searchOpen]);

  const handleArchive = async () => {
    try {
      await axiosInstance.put(`/messages/archive/${selectedUser._id}`);
      toast.success(`Chat with ${selectedUser.fullName} archived`);
      await getMyChatPartners();
      setSelectedUser(null);
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not archive chat");
    }
    setMenuOpen(false);
  };

  return (
    <div className="flex-shrink-0" style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border)' }}>
      {/* Main header row */}
      <div className="flex items-center gap-2 px-3 h-[64px] relative">
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, #4fd1c5 0%, #667eea 100%)', opacity: 0.6 }} />

        {/* Back btn (mobile) */}
        <button onClick={() => setSelectedUser(null)} className="icon-btn sm:hidden">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <img
            src={selectedUser.profilePic || "/avatar.png"}
            alt={selectedUser.fullName}
            className="w-10 h-10 rounded-full object-cover"
            style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
          />
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: '#48bb78', borderColor: 'var(--bg-header)' }} />
          )}
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>
            {selectedUser.fullName}
          </p>
          {isTyping ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[12px]" style={{ color: '#4fd1c5' }}>typing</span>
              <span className="flex gap-0.5">
                {[0,100,200].map((d) => (
                  <span key={d} className="w-1 h-1 rounded-full animate-bounce"
                    style={{ background: '#4fd1c5', animationDelay: `${d}ms` }} />
                ))}
              </span>
            </div>
          ) : (
            <p className="text-[12px]" style={{ color: isOnline ? '#48bb78' : 'var(--text-muted)' }}>
              {isOnline ? "Online" : "Offline"}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <button className="icon-btn" title="Voice call" onClick={() => toast("Voice calls coming soon! 📞", { icon: "📞" })}>
          <PhoneIcon className="w-[17px] h-[17px]" />
        </button>
        <button className="icon-btn" title="Video call" onClick={() => toast("Video calls coming soon! 📹", { icon: "📹" })}>
          <VideoIcon className="w-[17px] h-[17px]" />
        </button>

        {/* 3-dot menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className={`icon-btn ${menuOpen ? "active" : ""}`}
          >
            <MoreVerticalIcon className="w-[17px] h-[17px]" />
          </button>

          {menuOpen && (
            <div className="dropdown-menu animate-dropdown" style={{ top: 44, right: 0, minWidth: 200 }}>
              <MenuItem icon={<UserIcon className="w-4 h-4" />} label="View contact"
                onClick={() => { toast(`${selectedUser.fullName}`, { icon: "👤" }); setMenuOpen(false); }} />
              <MenuItem icon={<SearchIcon className="w-4 h-4" />} label="Search messages"
                onClick={() => { setSearchOpen(true); setMenuOpen(false); }} />
              <MenuItem icon={<ArchiveIcon className="w-4 h-4" />} label="Archive chat"
                onClick={handleArchive} />
              <div className="dropdown-divider" />
              <MenuItem icon={<MessageSquareXIcon className="w-4 h-4" />} label="Close chat" danger
                onClick={() => { setSelectedUser(null); setMenuOpen(false); }} />
            </div>
          )}
        </div>
      </div>

      {/* Search bar (slides open) */}
      {searchOpen && (
        <div className="flex items-center gap-2 px-3 pb-2.5">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: 'var(--text-muted)' }} />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in conversation…"
              className="w-full py-2 pl-9 pr-8 text-sm rounded-full border-none focus:outline-none"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                <XIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button onClick={() => setSearchOpen(false)} className="icon-btn">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }) {
  return (
    <button onClick={onClick} className="dropdown-item"
      style={{ color: danger ? '#fc8181' : 'var(--text-primary)' }}>
      <span style={{ color: danger ? '#fc8181' : 'var(--text-muted)' }}>{icon}</span>
      {label}
    </button>
  );
}
