import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";

function lastSeenText(isoStr) {
  if (!isoStr) return "last seen a while ago";
  const d    = new Date(isoStr);
  const now  = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  if (mins < 2)  return "last seen just now";
  if (mins < 60) return `last seen ${mins} min ago`;
  if (hrs  < 24) return `last seen ${hrs}h ago`;
  return `last seen ${d.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
}

export default function ContactList() {
  const { getAllContacts, allContacts, setSelectedUser, isUsersLoading, selectedUser, sidebarSearch, lastSeenMap } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => { getAllContacts(); }, []);
  if (isUsersLoading) return <UsersLoadingSkeleton />;

  const filtered = allContacts.filter((c) =>
    !sidebarSearch || c.fullName.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  if (!filtered.length) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="text-4xl opacity-40">👥</div>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {sidebarSearch ? `No results for "${sidebarSearch}"` : "No contacts"}
      </p>
    </div>
  );

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
            const lastSeen = lastSeenMap[contact._id] || contact.lastSeen;

            return (
              <div key={contact._id} onClick={() => setSelectedUser(contact)}
                className={`chat-row ${isActive ? "active" : ""}`}>
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
                    {isOnline ? "Online" : lastSeenText(lastSeen)}
                  </p>
                </div>
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
