import { useState, useEffect } from "react";
import { useChatStore }   from "../store/useChatStore";
import { useGroupStore }  from "../store/useGroupStore";
import ProfileHeader      from "../components/ProfileHeader";
import ActiveTabSwitch    from "../components/ActiveTabSwitch";
import ChatsList          from "../components/ChatsList";
import ContactList        from "../components/ContactList";
import ChatContainer      from "../components/ChatContainer";
import GroupChatWindow    from "../components/GroupChatWindow";
import AIChatWindow       from "../components/AIChatWindow";
import ArchivedChats      from "../components/ArchivedChats";
import CreateGroupModal   from "../components/CreateGroupModal";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";
import { UsersIcon, BotIcon, ArchiveIcon, PlusIcon } from "lucide-react";

function ChatPage() {
  const { activeTab, selectedUser } = useChatStore();
  const {
    groups, selectedGroup, setSelectedGroup,
    fetchGroups, subscribeToGroupMessages, unsubscribeFromGroupMessages,
  } = useGroupStore();

  const [showAI,       setShowAI]       = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);

  useEffect(() => {
    fetchGroups();
    subscribeToGroupMessages();
    return () => unsubscribeFromGroupMessages();
  }, []);

  // Decide what the right panel shows
  const rightPanel = () => {
    if (showAI)       return <AIChatWindow onClose={() => setShowAI(false)} />;
    if (selectedGroup) return <GroupChatWindow group={selectedGroup} onClose={() => setSelectedGroup(null)} />;
    if (selectedUser)  return <ChatContainer />;
    return <NoConversationPlaceholder />;
  };

  if (showArchived) {
    return (
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        <aside className="flex-shrink-0 flex flex-col w-full sm:w-[360px] md:w-[400px]"
          style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}>
          <ArchivedChats onClose={() => setShowArchived(false)} />
        </aside>
        <main className="flex-1 hidden sm:flex flex-col chat-bg">
          <NoConversationPlaceholder />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>

      <aside
        className={`flex-shrink-0 flex flex-col w-full sm:w-[360px] md:w-[400px]
          ${(selectedUser || selectedGroup || showAI) ? "hidden sm:flex" : "flex"}`}
        style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}
      >
        <ProfileHeader
          onShowAI={() => { setShowAI(true); setSelectedGroup(null); }}
          onShowArchived={() => setShowArchived(true)}
        />
        <ActiveTabSwitch extraActions={
          <button onClick={() => setShowNewGroup(true)} className="icon-btn" title="New group">
            <PlusIcon className="w-4 h-4" />
          </button>
        }/>

        <div className="flex-1 overflow-y-auto">
          {/* Tab content */}
          {activeTab === "chats" && <ChatsList />}
          {activeTab === "contacts" && <ContactList />}
          {activeTab === "groups" && <GroupsList groups={groups} selected={selectedGroup} onSelect={(g) => { setSelectedGroup(g); setShowAI(false); }} />}
        </div>

        <div className="flex items-center justify-around px-4 py-2 flex-shrink-0"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-header)' }}>
          <QuickBtn
            icon={<BotIcon className="w-5 h-5" />}
            label="AI Chat"
            active={showAI}
            onClick={() => { setShowAI(true); setSelectedGroup(null); }}
          />
          <QuickBtn
            icon={<ArchiveIcon className="w-5 h-5" />}
            label="Archived"
            onClick={() => setShowArchived(true)}
          />
          <QuickBtn
            icon={<UsersIcon className="w-5 h-5" />}
            label="Groups"
            onClick={() => setShowNewGroup(true)}
          />
        </div>
      </aside>

      <main
        className={`flex-1 flex flex-col min-w-0 chat-bg
          ${(selectedUser || selectedGroup || showAI) ? "flex" : "hidden sm:flex"}`}
      >
        {rightPanel()}
      </main>

      {/* Create group modal */}
      {showNewGroup && <CreateGroupModal onClose={() => setShowNewGroup(false)} />}
    </div>
  );
}

function GroupsList({ groups, selected, onSelect }) {
  if (!groups.length) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <UsersIcon className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No groups yet</p>
      <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Use the + button to create one</p>
    </div>
  );
  return (
    <div>
      {groups.map((g) => (
        <div key={g._id} onClick={() => onSelect(g)}
          className={`chat-row ${selected?._id === g._id ? "active" : ""}`}>
          {g.groupPic ? (
            <img src={g.groupPic} alt={g.name}
              className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold"
              style={{ background: 'linear-gradient(135deg, #667eea, #4fd1c5)', color: 'white' }}>
              {g.name[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {g.name}
            </p>
            <p className="text-[12px] truncate" style={{ color: 'var(--text-muted)' }}>
              {g.lastMessage || `${g.members.length} members`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function QuickBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick}
      className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all"
      style={{
        color: active ? '#4fd1c5' : 'var(--text-muted)',
        background: active ? 'rgba(79,209,197,0.1)' : 'transparent',
      }}>
      {icon}
      <span className="text-[9px] font-semibold">{label}</span>
    </button>
  );
}

export default ChatPage;
