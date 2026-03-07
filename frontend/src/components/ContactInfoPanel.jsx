import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { axiosInstance } from "../lib/axios";
import {
  XIcon, PhoneIcon, VideoIcon, StarIcon, ArchiveIcon,
  BellOffIcon, BellIcon, TrashIcon, ShieldIcon, ChevronRightIcon,
  MessageSquareXIcon,
} from "lucide-react";
import toast from "react-hot-toast";

export default function ContactInfoPanel({ user, onClose, onClearChat, onArchive }) {
  const { onlineUsers } = useAuthStore();
  const { lastSeenMap, toggleStarMessage } = useChatStore();
  const [notifications, setNotifications] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);

  const isOnline = onlineUsers.includes(user._id);
  const lastSeen = lastSeenMap[user._id] || user.lastSeen;

  function lastSeenLabel(iso) {
    if (!iso) return "last seen a while ago";
    const d = new Date(iso); const diff = Date.now() - d;
    const mins = Math.floor(diff / 60000);
    if (mins < 2) return "last seen just now";
    if (mins < 60) return `last seen ${mins} min ago`;
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24) return `last seen today at ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
    return `last seen ${d.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />

      {/* Panel — slides in from right */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col overflow-y-auto"
        style={{
          width: 'min(360px, 100vw)',
          background: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border)',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.4)',
          animation: 'slideInRight 0.22s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-[64px] flex-shrink-0"
          style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border)' }}>
          <button onClick={onClose} className="icon-btn"><XIcon className="w-5 h-5" /></button>
          <p className="font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>Contact info</p>
        </div>

        {/* Avatar + name */}
        <div className="flex flex-col items-center py-8 px-6"
          style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)' }}>
          <div className="relative mb-4">
            <img src={user.profilePic || "/avatar.png"} alt={user.fullName}
              className="w-24 h-24 rounded-full object-cover"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4)', border: '3px solid var(--border)' }} />
            {isOnline && (
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2"
                style={{ background: '#48bb78', borderColor: 'var(--bg-secondary)' }} />
            )}
          </div>
          <p className="text-[20px] font-bold text-center" style={{ color: 'var(--text-primary)' }}>{user.fullName}</p>
          <p className="text-[13px] mt-1 text-center"
            style={{ color: isOnline ? '#48bb78' : 'var(--text-muted)' }}>
            {isOnline ? "Online" : lastSeenLabel(lastSeen)}
          </p>
          {user.status && (
            <p className="text-[13px] mt-3 text-center italic px-4"
              style={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              "{user.status}"
            </p>
          )}
        </div>

        {/* Quick action row */}
        <div className="flex items-center justify-around px-4 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <QuickAction icon={<PhoneIcon className="w-5 h-5" />} label="Call"
            onClick={() => toast("Voice calls coming soon! 📞", { icon: "📞" })} />
          <QuickAction icon={<VideoIcon className="w-5 h-5" />} label="Video"
            onClick={() => toast("Video calls coming soon! 🎥", { icon: "🎥" })} />
          <QuickAction icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
          } label="Message" onClick={onClose} />
        </div>

        {/* Account info */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#4fd1c5' }}>About</p>
          <div className="space-y-3">
            <InfoRow label="Email" value={user.email || "—"} />
            <InfoRow label="Bio" value={user.bio || "Hey there! I am using Chatify."} />
            <InfoRow label="Member since" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "—"} />
          </div>
        </div>

        {/* Settings toggles */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#4fd1c5' }}>Settings</p>
          <div className="space-y-1">
            <ToggleRow
              icon={notifications ? <BellIcon className="w-4 h-4" /> : <BellOffIcon className="w-4 h-4" />}
              label="Notifications"
              value={notifications}
              onToggle={() => { setNotifications(v => !v); toast(notifications ? "Muted" : "Unmuted", { duration: 1200 }); }}
            />
            <ActionRow icon={<StarIcon className="w-4 h-4" style={{ color: '#f6e05e' }} />} label="Starred messages"
              onClick={() => { onClose(); }} />
            <ActionRow icon={<ArchiveIcon className="w-4 h-4" />} label="Archive chat"
              onClick={() => { onArchive?.(); onClose(); }} />
          </div>
        </div>

        {/* Encryption notice */}
        <div className="mx-5 my-4 px-4 py-3 rounded-xl flex items-center gap-3"
          style={{ background: 'rgba(79,209,197,0.06)', border: '1px solid rgba(79,209,197,0.15)' }}>
          <ShieldIcon className="w-4 h-4 flex-shrink-0" style={{ color: '#4fd1c5' }} />
          <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
            Messages are end-to-end encrypted. No one outside this chat can read them.
          </p>
        </div>

        {/* Danger zone */}
        <div className="px-5 pb-6 space-y-1 mt-auto">
          {!confirmClear ? (
            <DangerRow icon={<MessageSquareXIcon className="w-4 h-4" />} label="Clear chat"
              onClick={() => setConfirmClear(true)} />
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(252,129,129,0.3)' }}>
              <p className="px-4 py-3 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                Clear all messages with {user.fullName}?
              </p>
              <div className="flex">
                <button onClick={() => setConfirmClear(false)}
                  className="flex-1 py-2.5 text-[13px] transition-colors hover:bg-white/5"
                  style={{ color: 'var(--text-muted)', borderRight: '1px solid var(--border)' }}>
                  Cancel
                </button>
                <button onClick={() => { onClearChat?.(); setConfirmClear(false); onClose(); }}
                  className="flex-1 py-2.5 text-[13px] font-bold transition-colors hover:bg-red-500/10"
                  style={{ color: '#fc8181' }}>
                  Clear
                </button>
              </div>
            </div>
          )}
          {!confirmBlock ? (
            <DangerRow icon={<ShieldIcon className="w-4 h-4" />} label={`Block ${user.fullName}`}
              onClick={() => setConfirmBlock(true)} />
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(252,129,129,0.3)' }}>
              <p className="px-4 py-3 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                Block {user.fullName}? They won't be able to message you.
              </p>
              <div className="flex">
                <button onClick={() => setConfirmBlock(false)}
                  className="flex-1 py-2.5 text-[13px] transition-colors hover:bg-white/5"
                  style={{ color: 'var(--text-muted)', borderRight: '1px solid var(--border)' }}>
                  Cancel
                </button>
                <button onClick={() => { toast.success(`${user.fullName} blocked`); setConfirmBlock(false); onClose(); }}
                  className="flex-1 py-2.5 text-[13px] font-bold"
                  style={{ color: '#fc8181' }}>
                  Block
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

function QuickAction({ icon, label, onClick }) {
  return (
    <button onClick={onClick}
      className="flex flex-col items-center gap-2 px-5 py-3 rounded-2xl transition-all active:scale-95"
      style={{ background: 'var(--bg-input)' }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(79,209,197,0.1)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-input)'}>
      <span style={{ color: '#4fd1c5' }}>{icon}</span>
      <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </button>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-primary)' }}>{value}</p>
    </div>
  );
}

function ToggleRow({ icon, label, value, onToggle }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-1">
      <div className="flex items-center gap-3">
        <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
        <span className="text-[14px]" style={{ color: 'var(--text-primary)' }}>{label}</span>
      </div>
      <button onClick={onToggle}
        className="w-11 h-6 rounded-full relative transition-all duration-200 flex-shrink-0"
        style={{ background: value ? '#4fd1c5' : 'var(--bg-input)', border: '1px solid var(--border)' }}>
        <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200"
          style={{ left: value ? '22px' : '2px' }} />
      </button>
    </div>
  );
}

function ActionRow({ icon, label, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center justify-between py-2.5 px-1 rounded-xl transition-colors hover:bg-white/5">
      <div className="flex items-center gap-3">
        <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
        <span className="text-[14px]" style={{ color: 'var(--text-primary)' }}>{label}</span>
      </div>
      <ChevronRightIcon className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
    </button>
  );
}

function DangerRow({ icon, label, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 py-3 px-1 rounded-xl transition-colors hover:bg-red-500/5">
      <span style={{ color: '#fc8181' }}>{icon}</span>
      <span className="text-[14px]" style={{ color: '#fc8181' }}>{label}</span>
    </button>
  );
}
