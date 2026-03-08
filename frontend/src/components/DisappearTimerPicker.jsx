import { useState, useEffect } from "react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const OPTIONS = [
  { seconds: 0,       label: "Off",     sub: "Messages kept forever" },
  { seconds: 3600,    label: "1 Hour",  sub: "Disappears in 1 hour"  },
  { seconds: 86400,   label: "24 Hours",sub: "Disappears after a day" },
  { seconds: 604800,  label: "7 Days",  sub: "Disappears in a week"  },
  { seconds: 2592000, label: "30 Days", sub: "Disappears in a month" },
  { seconds: 7776000, label: "90 Days", sub: "Disappears in 3 months"},
];

export default function DisappearTimerPicker({ partnerId, onClose, onChanged }) {
  const [current, setCurrent] = useState(null);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    axiosInstance.get(`/disappear/${partnerId}`)
      .then((r) => setCurrent(r.data.seconds))
      .catch(() => setCurrent(0));
  }, [partnerId]);

  const select = async (seconds) => {
    setSaving(true);
    try {
      await axiosInstance.put(`/disappear/${partnerId}`, { seconds });
      setCurrent(seconds);
      const label = OPTIONS.find((o) => o.seconds === seconds)?.label || "Off";
      toast.success(seconds === 0 ? "Disappearing messages off" : `Messages disappear after ${label}`);
      onChanged?.(seconds);
    } catch {
      toast.error("Could not update timer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-bold" style={{ color: "var(--text-primary)" }}>
              ⏱ Disappearing Messages
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10"
              style={{ color: "var(--text-muted)" }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <p className="text-[12px] mt-1.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            New messages will automatically delete after the selected time. 
            This applies to messages you send in this conversation.
          </p>
        </div>

        {/* Options */}
        <div className="py-2">
          {current === null ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
            </div>
          ) : OPTIONS.map((opt) => {
            const active = current === opt.seconds;
            return (
              <button
                key={opt.seconds}
                onClick={() => !saving && select(opt.seconds)}
                className="w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-white/5"
                style={{ opacity: saving ? 0.6 : 1 }}
              >
                {/* Radio circle */}
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    borderColor: active ? "var(--accent)" : "var(--border)",
                    background: active ? "var(--accent)" : "transparent",
                  }}>
                  {active && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold"
                    style={{ color: active ? "var(--accent)" : "var(--text-primary)" }}>
                    {opt.label}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {opt.sub}
                  </p>
                </div>
                {opt.seconds === 86400 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                    style={{ background: "rgba(79,209,197,0.15)", color: "var(--accent)" }}>
                    Popular
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
