import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";

export default function ContactList() {
  const { getAllContacts, allContacts, setSelectedUser, isUsersLoading, selectedUser, sidebarSearch } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => { getAllContacts(); }, [getAllContacts]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  // Filter from store — reactive ✅
  const filtered = allContacts.filter((c) =>
    !sidebarSearch || c.fullName.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 px-6">
        <div className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: 'var(--bg-panel)' }}>
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
            style={{ color: 'var(--text-muted)' }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
          {sidebarSearch ? `No contacts match "${sidebarSearch}"` : "No contacts yet"}
        </p>
      </div>
    );
  }

  // Group A–Z
  const groups = filtered.reduce((acc, c) => {
    const letter = c.fullName[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(c);
    return acc;
  }, {});

  return (
    <div>
      {Object.keys(groups).sort().map((letter) => (
        <div key={letter}>
          <div className="section-header">{letter}</div>
          {groups[letter].map((contact) => {
            const isOnline = onlineUsers.includes(contact._id);
            const isActive = selectedUser?._id === contact._id;
            return (
              <div
                key={contact._id}
                onClick={() => setSelectedUser(contact)}
                className={`chat-row ${isActive ? "active" : ""}`}
              >
                <div className="relative flex-shrink-0">
                  <img src={contact.profilePic || "/avatar.png"} alt={contact.fullName}
                    className="w-12 h-12 rounded-full object-cover"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }} />
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                      style={{ background: '#48bb78', borderColor: 'var(--bg-secondary)' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {sidebarSearch ? highlight(contact.fullName, sidebarSearch) : contact.fullName}
                  </p>
                  <p className="text-[12px] mt-0.5 truncate"
                    style={{ color: isOnline ? '#48bb78' : 'var(--text-muted)' }}>
                    {isOnline ? "Online" : "Tap to start chatting"}
                  </p>
                </div>
                {isOnline && (
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#48bb78' }} />
                )}
              </div>
            );
          })}
        </div>
      ))}
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
