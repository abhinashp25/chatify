import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { Edit, MoreVertical, Search } from "lucide-react";
import toast from "react-hot-toast";

function timeAgo(iso) {
  if (!iso) return "";
  const d    = new Date(iso);
  const now  = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1)  return "now";
  if (mins < 60) return `${mins}m`;
  if (hrs  < 24) return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  if (days < 7)  return d.toLocaleDateString(undefined, { weekday: "short" });
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default function ChatsList({ onSelectUser }) {
  const {
    getMyChatPartners, chats, isUsersLoading, setSelectedUser,
    selectedUser, unreadCounts, activeFilter, setActiveFilter, sidebarSearch, setSidebarSearch
  } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => { getMyChatPartners(); }, []);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  const visible = chats.filter((c) => {
    if (c.isArchived) return false;
    if (sidebarSearch && !c.fullName.toLowerCase().includes(sidebarSearch.toLowerCase())) return false;
    if (activeFilter === "unread") return (unreadCounts[c._id] ?? c.unreadCount ?? 0) > 0;
    if (activeFilter === "online") return onlineUsers.includes(c._id);
    return true;
  });

  if (!chats.length) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 px-6">
      <div className="text-5xl">💬</div>
      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No chats yet</p>
      <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
        Go to Contacts and tap someone to start chatting
      </p>
    </div>
  );

  if (!visible.length) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="text-4xl opacity-40">🔍</div>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {sidebarSearch ? `No results for "${sidebarSearch}"` : `No ${activeFilter} chats`}
      </p>
    </div>
  );


  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 relative">
        <h1 className="text-[22px] font-bold text-gray-200">Chats</h1>
        <div className="flex items-center gap-3 text-gray-400 relative">
          <button 
            onClick={() => toast("Drafting new broadcast...", { icon: "✏️" })}
            className="hover:bg-white/10 p-1.5 rounded-full transition-colors">
            <Edit size={20} />
          </button>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="hover:bg-white/10 p-1.5 rounded-full transition-colors relative">
            <MoreVertical size={20} />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-10 w-48 py-2 rounded-lg shadow-xl border border-white/5 z-50 animate-fade-in"
              style={{ background: "#233138" }}>
              <button 
                onClick={() => { setShowMenu(false); toast.success("Marked all as read"); }}
                className="w-full text-left px-4 py-2 hover:bg-white/5 text-[14.5px] text-gray-200 transition-colors">
                Mark all as read
              </button>
              <button 
                onClick={() => { setShowMenu(false); toast("Settings opened"); }}
                className="w-full text-left px-4 py-2 hover:bg-white/5 text-[14.5px] text-gray-200 transition-colors">
                Select chats
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 mb-3">
        <div className="relative flex items-center bg-[#202c33] rounded-lg overflow-hidden h-[36px]">
          <div className="pl-4 pr-3 text-gray-400"><Search size={16} /></div>
          <input 
            type="text" 
            placeholder="Search or start a new chat" 
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            className="w-full bg-transparent text-[13px] text-gray-200 placeholder-gray-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Pill Filters */}
      <div className="flex items-center gap-2 px-4 mb-2 pb-2 overflow-x-auto no-scrollbar border-b border-[rgba(255,255,255,0.05)]">
        <FilterPill label="All" active={activeFilter === "all" || !activeFilter} onClick={() => setActiveFilter("all")} />
        <FilterPill label="Unread" badge={visible.filter(c => (unreadCounts[c._id] ?? c.unreadCount) > 0).length} active={activeFilter === "unread"} onClick={() => setActiveFilter("unread")} />
        <FilterPill label="Favourites" active={activeFilter === "favourites"} onClick={() => setActiveFilter("favourites")} />
        <FilterPill label="Groups" active={activeFilter === "groups"} onClick={() => setActiveFilter("groups")} />
      </div>

      {/* Chat Rows */}
      <div className="flex-1 overflow-y-auto w-full">
      {visible.map((chat) => {
        const isOnline = onlineUsers.includes(chat._id);
        const isActive = selectedUser?._id === chat._id;
        const unread   = unreadCounts[chat._id] ?? chat.unreadCount ?? 0;
        const lastMsg  = chat.lastMessage;

        return (
          <div key={chat._id} onClick={() => onSelectUser ? onSelectUser(chat) : setSelectedUser(chat)}
            className={`chat-row ${isActive ? "active" : ""}`}>

            {/* Avatar with online dot */}
            <div className="relative flex-shrink-0">
              <img src={chat.profilePic || "/avatar.png"} alt={chat.fullName}
                className="w-12 h-12 rounded-full object-cover"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }} />
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                  style={{ background: '#00a884', borderColor: '#111b21' }} />
              )}
            </div>

            {/* Name + last message */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {sidebarSearch ? highlight(chat.fullName, sidebarSearch) : chat.fullName}
                </p>
                {lastMsg && (
                  <span className="text-[11px] flex-shrink-0"
                    style={{ color: unread > 0 ? '#00a884' : '#8696a0' }}>
                    {timeAgo(lastMsg.createdAt)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p className="text-[12px] truncate flex-1"
                  style={{ color: lastMsg?.isDeleted ? 'var(--text-muted)' : unread > 0 ? 'var(--text-secondary)' : 'var(--text-muted)',
                    fontStyle: lastMsg?.isDeleted ? 'italic' : 'normal',
                    fontWeight: unread > 0 ? '500' : '400',
                  }}>
                  {lastMsg ? (
                    <>
                      {lastMsg.isMine && !lastMsg.isDeleted && (
                        <span style={{ color: '#8696a0' }}>You: </span>
                      )}
                      {lastMsg.text}
                    </>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Start chatting</span>
                  )}
                </p>
                {unread > 0 && (
                  <span className="unread-badge flex-shrink-0">{unread > 99 ? "99+" : unread}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}

function FilterPill({ label, badge, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors flex flex-shrink-0 items-center justify-center gap-1.5
        ${active ? "bg-[#00a884]/20 text-[#00a884]" : "bg-[#202c33] text-gray-400 hover:bg-[#202c33]/80"}`}
    >
      {label}
      {badge > 0 && <span className="text-[11px] font-bold" style={{ color: active ? "inherit" : "#00a884" }}>{badge}</span>}
    </button>
  );
}

function highlight(text, query) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-400/30 text-inherit rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}
