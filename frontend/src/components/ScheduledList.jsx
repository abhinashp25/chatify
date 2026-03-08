import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

function timeLabel(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function TimeLeft({ scheduledAt }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(scheduledAt) - new Date();
      if (diff <= 0) { setLabel("Sending now…"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 0) setLabel(`in ${h}h ${m}m`);
      else if (m > 0) setLabel(`in ${m}m ${s}s`);
      else setLabel(`in ${s}s`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [scheduledAt]);

  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: "rgba(79,209,197,0.15)", color: "var(--accent)" }}>
      {label}
    </span>
  );
}

export default function ScheduledList({ onClose }) {
  const [msgs, setMsgs]     = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/scheduled");
      setMsgs(res.data);
    } catch { toast.error("Could not load scheduled messages"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const cancel = async (id) => {
    try {
      await axiosInstance.delete(`/scheduled/${id}/cancel`);
      setMsgs((prev) => prev.filter((m) => m._id !== id));
      toast.success("Scheduled message cancelled");
    } catch { toast.error("Could not cancel"); }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-secondary)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-header)" }}>
        <button onClick={onClose} className="icon-btn">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div>
          <h2 className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>
            Scheduled Messages
          </h2>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {msgs.length} pending
          </p>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
          </div>
        )}

        {!loading && msgs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="text-5xl opacity-20">📅</div>
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              No scheduled messages
            </p>
            <p className="text-xs text-center px-8" style={{ color: "var(--text-muted)" }}>
              Hold the send button in a chat to schedule a message for later
            </p>
          </div>
        )}

        {msgs.map((msg) => (
          <div key={msg._id} className="flex items-start gap-3 px-4 py-4"
            style={{ borderBottom: "1px solid var(--border)" }}>
            {/* Avatar */}
            <img
              src={msg.receiverId?.profilePic || "/avatar.png"}
              alt=""
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            {/* Body */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-[14px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                  {msg.receiverId?.fullName || "Unknown"}
                </p>
                <TimeLeft scheduledAt={msg.scheduledAt} />
              </div>
              <p className="text-[12px] truncate mb-1" style={{ color: "var(--text-secondary)" }}>
                {msg.image ? "📷 Image" : msg.text}
              </p>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                📅 {timeLabel(msg.scheduledAt)}
              </p>
            </div>
            {/* Cancel */}
            <button
              onClick={() => cancel(msg._id)}
              className="flex-shrink-0 p-2 rounded-full transition-colors hover:bg-red-500/20"
              style={{ color: "#fc8181" }}
              title="Cancel scheduled message"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
