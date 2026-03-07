import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import { StarIcon, XIcon, ArrowLeftIcon } from "lucide-react";
import toast from "react-hot-toast";

export default function StarredMessages({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const { authUser } = useAuthStore();

  useEffect(() => {
    axiosInstance.get("/messages/starred")
      .then((r) => setMessages(r.data))
      .catch(() => toast.error("Could not load starred messages"))
      .finally(() => setLoading(false));
  }, []);

  const unstar = async (id) => {
    await axiosInstance.put(`/messages/star/${id}`).catch(() => {});
    setMessages((m) => m.filter((msg) => msg._id !== id));
    toast("Unstarred", { duration: 1200 });
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-secondary)' }}>
      <div className="flex items-center gap-3 px-4 h-[64px] flex-shrink-0"
        style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border)' }}>
        <button onClick={onClose} className="icon-btn"><ArrowLeftIcon className="w-5 h-5" /></button>
        <StarIcon className="w-5 h-5" style={{ color: '#f6e05e' }} />
        <p className="font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>Starred Messages</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: '#4fd1c5', borderTopColor: 'transparent' }} />
          </div>
        )}
        {!loading && !messages.length && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <StarIcon className="w-12 h-12" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No starred messages yet</p>
            <p className="text-[12px] text-center max-w-[200px]" style={{ color: 'var(--text-muted)' }}>
              Long press or right-click a message to star it
            </p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === authUser._id || msg.senderId?._id === authUser._id;
          return (
            <div key={msg._id} className="rounded-2xl p-3.5 relative"
              style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold mb-1" style={{ color: isMine ? '#4fd1c5' : '#a0aec0' }}>
                    {isMine ? "You" : "Them"}
                  </p>
                  {msg.image && <img src={msg.image} className="rounded-lg max-h-32 mb-1 object-cover" alt="starred" />}
                  {msg.audio && <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>🎤 Voice message</p>}
                  {msg.text && <p className="text-[14px] break-words" style={{ color: 'var(--text-primary)' }}>{msg.text}</p>}
                  <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                    {new Date(msg.createdAt).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <button onClick={() => unstar(msg._id)} className="icon-btn flex-shrink-0 mt-0.5">
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
