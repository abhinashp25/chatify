import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";

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

export default function ChatsList() {
  const {
    getMyChatPartners, chats, isUsersLoading, setSelectedUser,
    selectedUser, unreadCounts, activeFilter, sidebarSearch,
  } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => { getMyChatPartners(); }, []);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  const visible = chats.filter((c) => {
    if (sidebarSearch && !c.fullName.toLowerCase().includes(sidebarSearch.toLowerCase())) return false;
    if (activeFilter === "unread") return (unreadCounts[c._id] || 0) > 0;
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
    <div>
      {visible.map((chat) => {
        const isOnline = onlineUsers.includes(chat._id);
        const isActive = selectedUser?._id === chat._id;
        const unread   = unreadCounts[chat._id] ?? chat.unreadCount ?? 0;
        const lastMsg  = chat.lastMessage;

        return (
          <div key={chat._id} onClick={() => setSelectedUser(chat)}
            className={`chat-row ${isActive ? "active" : ""}`}>

            {/* Avatar with online dot */}
            <div className="relative flex-shrink-0">
              <img src={chat.profilePic || "/avatar.png"} alt={chat.fullName}
                className="w-12 h-12 rounded-full object-cover"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }} />
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                  style={{ background: '#48bb78', borderColor: 'var(--bg-secondary)' }} />
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
                    style={{ color: unread > 0 ? '#4fd1c5' : 'var(--text-muted)' }}>
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
                        <span style={{ color: '#4fd1c5' }}>You: </span>
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
