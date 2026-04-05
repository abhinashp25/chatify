import { useState, useEffect } from "react";
import { useChatStore }   from "../store/useChatStore";
import { useGroupStore }  from "../store/useGroupStore";
import { useAuthStore }   from "../store/useAuthStore";
import { useSettingsStore } from "../store/useSettingsStore";
import ProfileHeader      from "../components/ProfileHeader";
import ActiveTabSwitch    from "../components/ActiveTabSwitch";
import ChatsList          from "../components/ChatsList";
import ContactList        from "../components/ContactList";
import ChatContainer      from "../components/ChatContainer";
import GroupChatWindow    from "../components/GroupChatWindow";
import AIChatWindow       from "../components/AIChatWindow";
import ArchivedChats      from "../components/ArchivedChats";
import StarredMessages    from "../components/StarredMessages";
import StatusTray         from "../components/StatusTray";
import CreateGroupModal   from "../components/CreateGroupModal";
import NativeEmptyState   from "../components/NativeEmptyState";
import LeftRail           from "../components/LeftRail";
import CallsList          from "../components/CallsList";
import SettingsPage       from "./SettingsPage";

function ChatPage() {
  const { activeTab, setActiveTab, selectedUser, setSelectedUser, chats, unreadCounts } = useChatStore();
  const {
    groups, selectedGroup, setSelectedGroup,
    fetchGroups, subscribeToGroupMessages, unsubscribeFromGroupMessages,
  } = useGroupStore();
  const { applyStoredTheme } = useSettingsStore();

  const [showAI,       setShowAI]       = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showStarred,  setShowStarred]  = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchGroups();
    subscribeToGroupMessages();
    applyStoredTheme();
    return () => unsubscribeFromGroupMessages();
  }, []);

  const totalUnread   = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  const archivedCount = chats.filter(c => c.isArchived).length;
  const groupCount    = groups.length;

  // ── When user clicks a chat: clear group + AI so chat opens properly ──
  const openChat = (user) => {
    setSelectedUser(user);
    setSelectedGroup(null);
    setShowAI(false);
  };

  // ── When user clicks a group: clear selectedUser + AI ─────────────────
  const openGroup = (group) => {
    setSelectedGroup(group);
    setSelectedUser(null);
    setShowAI(false);
  };

  const rightPanel = () => {
    if (activeTab === "chatify-ai" || showAI) return <AIChatWindow onClose={() => { setShowAI(false); setActiveTab("chats"); }} />;
    if (selectedGroup) return <GroupChatWindow group={selectedGroup} onClose={() => setSelectedGroup(null)} />;
    if (selectedUser)  return <ChatContainer />;
    return <NativeEmptyState onActivateMetaAI={() => setActiveTab("chatify-ai")} />;
  };

  const panelOpen = selectedUser || selectedGroup || showAI;

  if (showArchived) {
    return (
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        <aside className="flex-shrink-0 flex flex-col w-full sm:w-[360px] md:w-[400px] sidebar-glass">
          <ArchivedChats onClose={() => setShowArchived(false)} />
        </aside>
        <main className="flex-1 hidden sm:flex flex-col chat-bg"><NoConversationPlaceholder /></main>
      </div>
    );
  }

  if (showStarred) {
    return (
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        <aside className="flex-shrink-0 flex flex-col w-full sm:w-[360px] md:w-[400px] sidebar-glass">
          <StarredMessages onClose={() => setShowStarred(false)} />
        </aside>
        <main className="flex-1 hidden sm:flex flex-col chat-bg"><NoConversationPlaceholder /></main>
      </div>
    );
  }

  return (
    <div className="flex w-full h-screen overflow-hidden text-white bg-[#0b141a]">

      {/* Column 1: Native 60px Nav Rail */}
      <LeftRail activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Column 2: Middle Chat List Panel */}
      <aside
        className={`flex-shrink-0 flex flex-col w-full sm:w-[340px] md:w-[380px] z-10
          ${panelOpen ? "hidden sm:flex" : "flex"}`}
        style={{ background: "#111b21", borderRight: "1px solid rgba(255,255,255,0.05)" }}
      >
        {(!activeTab || ["chats", "chatify-ai", "settings"].includes(activeTab)) && <ChatsList onSelectUser={openChat} />}
        {activeTab === "contacts"    && <div className="flex-1 overflow-y-auto"><ContactList /></div>}
        {activeTab === "communities" && (
          <div className="flex-1 overflow-y-auto">
            <GroupsList groups={groups} selected={selectedGroup} onSelect={openGroup} />
          </div>
        )}
        {activeTab === "calls"    && <CallsList />}
        {activeTab === "archived" && <ArchivedChats onClose={() => setActiveTab("chats")} />}
        {activeTab === "status"   && <div className="flex-1 overflow-y-auto"><StatusTray /></div>}
      </aside>

      {/* Column 3: Main panel / Conversation area */}
      <main className={`flex-1 flex flex-col min-w-0 bg-[#0b141a] relative ${panelOpen ? "flex" : "hidden sm:flex"}`}>
        {rightPanel()}
      </main>

      {showNewGroup  && <CreateGroupModal onClose={() => setShowNewGroup(false)} />}
      {(showSettings || activeTab === "settings") && <SettingsPage onClose={() => { setShowSettings(false); setActiveTab("chats"); }} />}
    </div>
  );
}


function GroupsList({ groups, selected, onSelect }) {
  if (!groups.length) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No communities yet</p>
    </div>
  );

  return (
    <div>
      {groups.map((g) => (
        <div key={String(g._id)} onClick={() => onSelect(g)}
          className={`chat-row ${selected?._id === g._id || String(selected?._id) === String(g._id) ? "active" : ""}`}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-bold"
            style={{ background: 'linear-gradient(135deg, #00A884, #008f6f)', color: 'white' }}>
            {g.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{g.name}</p>
            <p className="text-[12px] truncate" style={{ color: 'var(--text-muted)' }}>
              {g.lastMessage || `${g.members?.length || 0} members`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ChatPage;
