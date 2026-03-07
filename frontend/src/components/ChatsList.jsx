import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";

export default function ChatsList() {
  const {
    getMyChatPartners, chats, isUsersLoading, setSelectedUser,
    selectedUser, unreadCounts, activeFilter, sidebarSearch,
  } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => { getMyChatPartners(); }, [getMyChatPartners]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (chats.length === 0) return <NoChatsFound />;

  // Filter by search + active filter — reads from STORE (reactive ✅)
  const visible = chats.filter((c) => {
    if (sidebarSearch && !c.fullName.toLowerCase().includes(sidebarSearch.toLowerCase())) return false;
    if (activeFilter === "unread")  return (unreadCounts[c._id] || 0) > 0;
    if (activeFilter === "online")  return onlineUsers.includes(c._id);
    return true;
  });

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 px-6">
        <div className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: 'var(--bg-panel)' }}>
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
            style={{ color: 'var(--text-muted)' }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
          {sidebarSearch ? `No chats match "${sidebarSearch}"` :
           activeFilter !== "all" ? `No ${activeFilter} chats` : "No chats found"}
        </p>
      </div>
    );
  }

  return (
    <div>
      {visible.map((chat) => {
        const isOnline = onlineUsers.includes(chat._id);
        const isActive = selectedUser?._id === chat._id;
        const unread   = unreadCounts[chat._id] || 0;

        return (
          <div
            key={chat._id}
            onClick={() => setSelectedUser(chat)}
            className={`chat-row ${isActive ? "active" : ""}`}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <img src={chat.profilePic || "/avatar.png"} alt={chat.fullName}
                className="w-12 h-12 rounded-full object-cover"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }} />
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                  style={{ background: '#48bb78', borderColor: 'var(--bg-secondary)' }} />
              )}
            </div>

            {/* Name + status */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {sidebarSearch ? highlight(chat.fullName, sidebarSearch) : chat.fullName}
                </p>
                {isOnline && (
                  <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: '#48bb78' }}>
                    online
                  </span>
                )}
              </div>
              <p className="text-[12px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {isOnline ? "Active now" : "Tap to chat"}
              </p>
            </div>

            {/* Unread badge */}
            {unread > 0 && (
              <div className="unread-badge flex-shrink-0">{unread > 99 ? "99+" : unread}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Highlight matching text in name
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
