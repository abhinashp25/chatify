import { useState } from "react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

// Preset quick-pick times
function getPresets() {
  const now = new Date();
  const add = (mins) => {
    const d = new Date(now.getTime() + mins * 60000);
    return d;
  };
  const startOf = (offsetDays, hour, min = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offsetDays);
    d.setHours(hour, min, 0, 0);
    return d;
  };

  const presets = [];

  // 30 min / 1h / 2h / Tonight 9 PM / Tomorrow 9 AM / Next Monday 9 AM
  if (add(30) > now) presets.push({ label: "In 30 min", date: add(30) });
  presets.push({ label: "In 1 hour",  date: add(60) });
  presets.push({ label: "In 2 hours", date: add(120) });

  const tonight = startOf(0, 21);
  if (tonight > now) presets.push({ label: "Tonight 9 PM", date: tonight });

  presets.push({ label: "Tomorrow 9 AM", date: startOf(1, 9) });

  // Next Monday
  const daysToMon = ((1 - now.getDay()) + 7) % 7 || 7;
  presets.push({ label: "Next Monday 9 AM", date: startOf(daysToMon, 9) });

  return presets;
}

function toLocalInput(date) {
  // Convert Date to YYYY-MM-DDTHH:MM for <input type="datetime-local">
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatConfirm(date) {
  return date.toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ScheduleModal({ text, image, receiverId, onClose, onScheduled }) {
  const presets = getPresets();
  const minDate = toLocalInput(new Date(Date.now() + 60000)); // at least 1 min from now
  const maxDate = `${new Date().getFullYear() + 1}-12-31T23:59`;

  const [selectedDate, setSelectedDate] = useState(presets[1].date); // default: 1 hour
  const [customMode, setCustomMode]     = useState(false);
  const [loading, setLoading]           = useState(false);

  const handlePreset = (date) => {
    setSelectedDate(date);
    setCustomMode(false);
  };

  const handleCustomChange = (e) => {
    const d = new Date(e.target.value);
    if (!isNaN(d)) setSelectedDate(d);
  };

  const handleSchedule = async () => {
    if (!selectedDate || selectedDate <= new Date())
      return toast.error("Please pick a future time.");

    setLoading(true);
    try {
      await axiosInstance.post(`/scheduled/${receiverId}`, {
        text, image, scheduledAt: selectedDate.toISOString(),
      });
      toast.success(`Message scheduled for ${formatConfirm(selectedDate)} ✅`);
      onScheduled?.();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not schedule message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 flex flex-col gap-5"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-bold" style={{ color: "var(--text-primary)" }}>
              📅 Schedule Message
            </h3>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
              Your message sends automatically at the chosen time
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
            style={{ color: "var(--text-muted)" }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Message preview */}
        {(text || image) && (
          <div className="px-3 py-2.5 rounded-xl"
            style={{ background: "rgba(79,209,197,0.08)", border: "1px solid rgba(79,209,197,0.2)" }}>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-1"
              style={{ color: "var(--accent)" }}>Message preview</p>
            {image && <p className="text-[12px] opacity-60">📷 Image attached</p>}
            {text && (
              <p className="text-[13px] truncate" style={{ color: "var(--text-secondary)" }}>{text}</p>
            )}
          </div>
        )}

        {/* Quick presets */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2"
            style={{ color: "var(--text-muted)" }}>Quick pick</p>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((p) => {
              const active = !customMode && selectedDate?.getTime() === p.date.getTime();
              return (
                <button
                  key={p.label}
                  onClick={() => handlePreset(p.date)}
                  className="text-left px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all"
                  style={{
                    background: active ? "rgba(79,209,197,0.15)" : "var(--bg-panel)",
                    border: active ? "1px solid rgba(79,209,197,0.4)" : "1px solid var(--border)",
                    color: active ? "var(--accent)" : "var(--text-secondary)",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom date-time */}
        <div>
          <button
            onClick={() => setCustomMode((v) => !v)}
            className="flex items-center gap-2 text-[12px] font-semibold transition-colors mb-2"
            style={{ color: customMode ? "var(--accent)" : "var(--text-muted)" }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Custom date & time
          </button>
          {customMode && (
            <input
              type="datetime-local"
              min={minDate}
              max={maxDate}
              defaultValue={toLocalInput(selectedDate)}
              onChange={handleCustomChange}
              className="w-full px-3 py-2.5 rounded-xl text-[13px] border-none focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
              style={{
                background: "var(--bg-input)",
                color: "var(--text-primary)",
                colorScheme: "dark",
              }}
            />
          )}
        </div>

        {/* Confirm line */}
        {selectedDate && (
          <p className="text-[12px] text-center" style={{ color: "var(--text-muted)" }}>
            Will send on{" "}
            <strong style={{ color: "var(--accent)" }}>{formatConfirm(selectedDate)}</strong>
          </p>
        )}

        {/* Send button */}
        <button
          onClick={handleSchedule}
          disabled={loading || !selectedDate}
          className="w-full py-3 rounded-xl font-bold text-[14px] text-white transition-all active:scale-95"
          style={{
            background: "linear-gradient(135deg, var(--accent), #38b2ac)",
            boxShadow: "0 4px 18px rgba(79,209,197,0.3)",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Scheduling…" : "Schedule Message"}
        </button>
      </div>
    </div>
  );
}
