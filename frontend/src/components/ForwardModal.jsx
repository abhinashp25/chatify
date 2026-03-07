import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { XIcon, SendIcon, SearchIcon } from "lucide-react";
import toast from "react-hot-toast";

export default function ForwardModal({ message, onClose }) {
  const { allContacts, getAllContacts, sendMessage, setSelectedUser } = useChatStore();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [sending, setSending] = useState(false);

  useState(() => { getAllContacts(); }, []);

  const filtered = allContacts.filter((c) =>
    c.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id) =>
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  const handleForward = async () => {
    if (!selected.length) return;
    setSending(true);
    // Forward = send the message content to each selected contact
    for (const contactId of selected) {
      // Temporarily set selectedUser to send
      const contact = allContacts.find((c) => c._id === contactId);
      if (!contact) continue;
      
      // Use axiosInstance directly so we don't change selectedUser
      const { axiosInstance } = await import("../lib/axios");
      await axiosInstance.post(`/messages/send/${contactId}`, {
        text: message.text || undefined,
        image: message.image || undefined,
        audio: message.audio || undefined,
        isForwarded: true,
      }).catch(() => {});
    }
    setSending(false);
    toast.success(`Forwarded to ${selected.length} chat${selected.length > 1 ? "s" : ""}`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <p className="font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>Forward message</p>
            {selected.length > 0 && (
              <p className="text-[11px] mt-0.5" style={{ color: '#4fd1c5' }}>{selected.length} selected</p>
            )}
          </div>
          <button onClick={onClose} className="icon-btn"><XIcon className="w-4 h-4" /></button>
        </div>

        {/* Message preview */}
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="px-3 py-2 rounded-xl text-[13px]" style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)', borderLeft: '3px solid var(--border)' }}>
            {message.image && <span>📷 Photo </span>}
            {message.audio && <span>🎤 Voice message</span>}
            {message.text && <span className="line-clamp-2">{message.text}</span>}
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts…"
              className="w-full py-2 pl-9 pr-4 text-sm rounded-full border-none focus:outline-none"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {/* Contact list */}
        <div className="max-h-56 overflow-y-auto">
          {filtered.map((c) => (
            <div key={c._id} onClick={() => toggle(c._id)}
              className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-white/5">
              <div className="relative flex-shrink-0">
                <img src={c.profilePic || "/avatar.png"} className="w-10 h-10 rounded-full object-cover" alt="" />
                {selected.includes(c._id) && (
                  <div className="absolute inset-0 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(79,209,197,0.85)' }}>
                    <span className="text-white text-lg">✓</span>
                  </div>
                )}
              </div>
              <p className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>{c.fullName}</p>
            </div>
          ))}
        </div>

        {/* Send btn */}
        <div className="px-5 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={handleForward}
            disabled={!selected.length || sending}
            className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all"
            style={{
              background: selected.length && !sending ? 'linear-gradient(135deg, #4fd1c5, #38b2ac)' : 'var(--bg-input)',
              color: selected.length && !sending ? 'white' : 'var(--text-muted)',
            }}
          >
            <SendIcon className="w-4 h-4" />
            {sending ? "Forwarding…" : `Forward${selected.length > 0 ? ` to ${selected.length}` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
