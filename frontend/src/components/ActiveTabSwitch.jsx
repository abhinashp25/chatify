import { SearchIcon, XIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useGroupStore } from "../store/useGroupStore";

const TABS = ["chats", "contacts", "groups"];

export default function ActiveTabSwitch({ extraActions }) {
  const {
    activeTab, setActiveTab, activeFilter, setActiveFilter,
    chats, unreadCounts, sidebarSearch, setSidebarSearch,
  } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { groups } = useGroupStore();

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  const totalOnline = chats.filter((c) => onlineUsers.includes(c._id)).length;

  return (
    <div className="flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>

      {/* Tab row */}
      <div className="flex items-center" style={{ borderBottom: '1px solid var(--border)' }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSidebarSearch(""); }}
            className="flex-1 py-3 text-[12px] font-semibold transition-all relative capitalize"
            style={{ color: activeTab === tab ? '#4fd1c5' : 'var(--text-muted)' }}
          >
            {tab}
            {tab === "chats" && totalUnread > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] ml-1 font-bold text-white"
                style={{ background: '#4fd1c5' }}>{totalUnread > 9 ? "9+" : totalUnread}</span>
            )}
            {tab === "groups" && groups.length > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] ml-1 font-bold text-white"
                style={{ background: '#667eea' }}>{groups.length}</span>
            )}
            <span
              className="absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-full transition-all duration-300"
              style={{ background: activeTab === tab ? '#4fd1c5' : 'transparent' }}
            />
          </button>
        ))}
        {extraActions && <div className="pr-2 flex-shrink-0">{extraActions}</div>}
      </div>

      {/* Search bar — now connected to store ✅ */}
      <div className="px-3 py-2.5">
        <div className="relative">
          <SearchIcon
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            placeholder={
              activeTab === "chats"    ? "Search or start new chat" :
              activeTab === "contacts" ? "Search contacts…" :
                                        "Search groups…"
            }
            className="w-full py-2.5 pl-10 pr-9 text-sm border-none focus:outline-none transition-all"
            style={{ background: 'var(--bg-input)', borderRadius: '9999px', color: 'var(--text-primary)' }}
          />
          {sidebarSearch && (
            <button
              onClick={() => setSidebarSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter pills — only on Chats tab */}
      {activeTab === "chats" && (
        <div className="flex items-center gap-2 px-3 pb-2.5 overflow-x-auto no-scrollbar">
          <FilterPill label="All"    active={activeFilter === "all"}    onClick={() => setActiveFilter("all")} />
          <FilterPill
            label={`Unread${totalUnread > 0 ? ` ${totalUnread}` : ""}`}
            active={activeFilter === "unread"}
            onClick={() => setActiveFilter("unread")}
          />
          <FilterPill
            label={`Online${totalOnline > 0 ? ` ${totalOnline}` : ""}`}
            active={activeFilter === "online"}
            onClick={() => setActiveFilter("online")}
          />
        </div>
      )}
    </div>
  );
}

function FilterPill({ label, active, onClick }) {
  return (
    <button onClick={onClick} className={`filter-pill ${active ? "active" : ""}`}>{label}</button>
  );
}
