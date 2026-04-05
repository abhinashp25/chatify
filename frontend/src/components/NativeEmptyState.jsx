import { FileText, UserPlus } from "lucide-react";
import { useState } from "react";
import AddContactModal from "./AddContactModal";
import toast from "react-hot-toast";

export default function NativeEmptyState({ onActivateMetaAI }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-6"
      style={{ background: "#222e35" }}
    >
      {/* Lock / encryption badge */}
      <div className="flex flex-col items-center gap-5 max-w-md text-center px-8">
        <div className="w-[280px] h-[280px] rounded-full flex items-center justify-center mb-2"
          style={{ background: "rgba(0,168,132,0.06)", border: "1px solid rgba(0,168,132,0.1)" }}>
          {/* WhatsApp-style illustration placeholder */}
          <svg viewBox="0 0 200 200" className="w-48 h-48 opacity-40" fill="none">
            <circle cx="100" cy="100" r="80" stroke="#00a884" strokeWidth="2" strokeDasharray="6 4"/>
            <path d="M60 100 Q100 60 140 100 Q100 140 60 100Z" fill="#00a884" opacity="0.3"/>
            <circle cx="100" cy="100" r="20" fill="#00a884" opacity="0.5"/>
            <path d="M88 100 L96 108 L114 92" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h2 className="text-[22px] font-light" style={{ color: "#e9edef" }}>
          Chatify for Desktop
        </h2>
        <p className="text-[14px] leading-relaxed" style={{ color: "#8696a0" }}>
          Send and receive messages without keeping your phone online.<br/>
          Use Chatify on up to 4 linked devices and 1 phone simultaneously.
        </p>

        {/* Encrypted badge */}
        <div className="flex items-center gap-2 mt-2">
          <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="#8696a0">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4.18L19 8.3V11c0 3.9-2.65 7.56-7 8.93-4.35-1.37-7-5.03-7-8.93V8.3L12 5.18z"/>
            <path d="M10 14.7l-2.7-2.7-1.4 1.4 4.1 4.1 7.1-7.1-1.4-1.4z"/>
          </svg>
          <span className="text-[12.5px]" style={{ color: "#8696a0" }}>
            Your personal messages are end-to-end encrypted
          </span>
        </div>
      </div>

      {/* Action tiles */}
      <div className="flex items-center gap-4 mt-2">
        <ActionTile
          icon={<FileText size={22} style={{ color: "#00a884" }} />}
          label="Send document"
          onClick={() => toast("Please start or select a chat first to attach documents.", { icon: "📄" })}
        />
        <ActionTile
          icon={<UserPlus size={22} style={{ color: "#00a884" }} />}
          label="Add contact"
          onClick={() => setModalOpen(true)}
        />
        <ActionTile
          icon={
            <div className="w-6 h-6 rounded-full" style={{
              background: "conic-gradient(from 0deg, #00a884, #4fd1c5, #667eea, #00a884)",
              animation: "spin-ring 3s linear infinite",
              padding: 2.5,
            }}>
              <div className="w-full h-full rounded-full" style={{ background: "#2a3942" }} />
            </div>
          }
          label="Ask Chatify AI"
          onClick={onActivateMetaAI}
        />
      </div>
      <AddContactModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

function ActionTile({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-3 px-5 py-5 rounded-2xl transition-all hover:scale-105 active:scale-95"
      style={{
        background: "#2a3942",
        border: "1px solid rgba(255,255,255,0.06)",
        minWidth: 110,
        color: "#e9edef",
      }}
    >
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ background: "rgba(0,168,132,0.1)" }}>
        {icon}
      </div>
      <span className="text-[13px] font-medium text-center leading-tight" style={{ color: "#d1d7db" }}>
        {label}
      </span>
    </button>
  );
}
