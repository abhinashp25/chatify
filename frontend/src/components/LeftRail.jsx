import { MessageSquare, Phone, Users, CircleDot, Archive, Settings } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

export default function LeftRail({ activeTab, setActiveTab }) {
  const { unreadCounts } = useChatStore();
  const { authUser } = useAuthStore();
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  return (
    <div
      className="flex flex-col items-center py-3 gap-1 flex-shrink-0"
      style={{
        width: 72,
        background: "#202c33",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Profile Avatar — top */}
      <button
        onClick={() => setActiveTab("profile")}
        className="w-10 h-10 rounded-full overflow-hidden mb-3 flex-shrink-0 border-2 transition-all"
        style={{ borderColor: activeTab === "profile" ? "#00a884" : "transparent" }}
      >
        <img src={authUser?.profilePic || "/avatar.png"} alt="me" className="w-full h-full object-cover" />
      </button>

      {/* Primary Nav */}
      <NavBtn
        label="Chats"
        active={!activeTab || activeTab === "chats"}
        badge={totalUnread}
        onClick={() => setActiveTab("chats")}
      >
        <MessageSquare size={22} />
      </NavBtn>

      <NavBtn label="Calls" active={activeTab === "calls"} onClick={() => setActiveTab("calls")}>
        <Phone size={22} />
      </NavBtn>

      <NavBtn label="Status" active={activeTab === "status"} onClick={() => setActiveTab("status")}>
        <CircleDot size={22} />
      </NavBtn>

      <NavBtn label="Communities" active={activeTab === "communities"} onClick={() => setActiveTab("communities")}>
        <Users size={22} />
      </NavBtn>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Chatify AI animated ring */}
      <button
        title="Ask Chatify AI"
        onClick={() => setActiveTab("chatify-ai")}
        className="relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all hover:bg-white/5 group"
        style={{ background: activeTab === "chatify-ai" ? "rgba(0,168,132,0.12)" : "transparent" }}
      >
        {/* spinning gradient ring */}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{
            background: "conic-gradient(from 0deg, #00a884, #4fd1c5, #667eea, #00a884)",
            animation: "spin-ring 3s linear infinite",
            padding: 2,
          }}
        >
          <div className="w-full h-full rounded-full" style={{ background: "#202c33" }} />
        </div>
        {activeTab === "chatify-ai" && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ background: "#00a884" }} />
        )}
      </button>

      <NavBtn label="Archive" active={activeTab === "archived"} onClick={() => setActiveTab("archived")}>
        <Archive size={22} />
      </NavBtn>

      <NavBtn label="Settings" active={activeTab === "settings"} onClick={() => setActiveTab("settings")}>
        <Settings size={22} />
      </NavBtn>
    </div>
  );
}

function NavBtn({ children, label, active, badge, onClick }) {
  return (
    <button
      title={label}
      onClick={onClick}
      className="relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all"
      style={{
        background: active ? "rgba(255,255,255,0.08)" : "transparent",
        color: active ? "#e9edef" : "#8696a0",
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      {children}
      {badge > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
          style={{ background: "#00a884", color: "#111b21" }}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ background: "#00a884" }} />
      )}
    </button>
  );
}
