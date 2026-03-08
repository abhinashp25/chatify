import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";


export function GroupReadBadge({ groupId, messageId, memberCount, readBy = [] }) {
  const [open, setOpen]   = useState(false);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  // readBy already includes sender
  const readCount = readBy.length;
  if (memberCount <= 1 || readCount === 0) return null;

  const fetchDetail = async () => {
    if (detail) { setOpen((v) => !v); return; }
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages/${messageId}/read`);
      setDetail(res.data);
      setOpen(true);
    } catch {
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const allRead = readCount >= memberCount;

  return (
    <div className="relative inline-flex">
      <button
        onClick={(e) => { e.stopPropagation(); fetchDetail(); }}
        className="flex items-center gap-1 px-1.5 py-0.5 rounded-full transition-colors hover:bg-white/10"
        title={`Seen by ${readCount} of ${memberCount}`}
      >
        {loading ? (
          <span className="w-2.5 h-2.5 border border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "currentColor", borderTopColor: "transparent" }} />
        ) : (
          // Double tick icon
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ color: allRead ? "#48bb78" : "rgba(255,255,255,0.45)" }}>
            <polyline points="20 6 9 17 4 12"/>
            {allRead && <polyline points="20 6 9 17 4 12" style={{ transform: "translateX(-3px)" }} />}
          </svg>
        )}
        <span className="text-[9px] font-bold"
          style={{ color: allRead ? "#48bb78" : "rgba(255,255,255,0.45)" }}>
          {readCount}/{memberCount}
        </span>
      </button>

      {/* Popover */}
      {open && detail && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute bottom-full right-0 mb-2 z-50 rounded-2xl overflow-hidden py-2"
            style={{
              background: "var(--bg-panel)",
              border: "1px solid var(--border)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
              minWidth: 200,
              maxWidth: 260,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
              Seen by {detail.readBy.length} of {detail.memberCount}
            </p>
            <div className="max-h-48 overflow-y-auto">
              {detail.readBy.map((r) => (
                <div key={r.userId?._id || r.userId} className="flex items-center gap-2.5 px-3 py-2.5">
                  <img
                    src={r.userId?.profilePic || "/avatar.png"}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {r.userId?.fullName || "Unknown"}
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {new Date(r.readAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" style={{ color: "#48bb78" }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
