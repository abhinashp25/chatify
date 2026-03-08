import { useState, useRef, useEffect, useCallback } from "react";
import { axiosInstance } from "../lib/axios";
import { useChatStore } from "../store/useChatStore";

function highlight(text, query) {
  if (!text || !query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-400/40 text-inherit rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function timeLabel(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0)
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: "short" });
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default function GlobalSearch({ onClose }) {
  const [query, setQuery]   = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal]   = useState(0);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);
  const debounce = useRef(null);

  const { setSelectedUser, setActiveTab } = useChatStore();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const search = useCallback(async (q) => {
    if (q.trim().length < 2) {
      setResults([]); setTotal(0); setSearched(false); return;
    }
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/search?q=${encodeURIComponent(q.trim())}`);
      setResults(res.data.results || []);
      setTotal(res.data.total || 0);
      setSearched(true);
    } catch {
      setResults([]); setSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(val), 350);
  };

  const openChat = (partner) => {
    setActiveTab("chats");
    setSelectedUser(partner);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-16 px-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
          maxHeight: "75vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search bar */}
        <div className="flex items-center gap-3 px-4 py-3.5"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" style={{ color: "var(--accent)" }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="Search messages across all chats…"
            className="flex-1 bg-transparent border-none focus:outline-none text-[15px]"
            style={{ color: "var(--text-primary)", fontFamily: "inherit" }}
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin flex-shrink-0"
              style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
          )}
          <button onClick={onClose} className="flex-shrink-0 p-1 rounded-full transition-colors hover:bg-white/10"
            style={{ color: "var(--text-muted)" }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1">
          {!searched && !loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="text-5xl opacity-20">🔍</div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Search across all your conversations
              </p>
            </div>
          )}

          {searched && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="text-5xl opacity-20">💬</div>
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                No messages found for "{query}"
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Try different keywords
              </p>
            </div>
          )}

          {results.length > 0 && (
            <>
              <div className="px-4 py-2.5 flex items-center justify-between"
                style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--text-muted)" }}>
                  {total} result{total !== 1 ? "s" : ""} found
                </span>
              </div>

              {results.map(({ partner, messages }) => (
                <div key={partner._id}>
                  {/* Conversation header — clicking opens that chat */}
                  <button
                    onClick={() => openChat(partner)}
                    className="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5 text-left"
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <img
                      src={partner.profilePic || "/avatar.png"}
                      alt={partner.fullName}
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                        {partner.fullName}
                      </p>
                      <p className="text-[11px]" style={{ color: "var(--accent)" }}>
                        {messages.length} matching message{messages.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" style={{ color: "var(--text-muted)" }}>
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>

                  {/* Individual matching messages */}
                  {messages.map((msg) => (
                    <button
                      key={msg._id}
                      onClick={() => openChat(partner)}
                      className="w-full flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/5 text-left"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      {/* Alignment bar */}
                      <div className="w-0.5 h-full rounded-full mt-1 flex-shrink-0"
                        style={{
                          background: msg.isMine ? "var(--accent)" : "rgba(255,255,255,0.2)",
                          alignSelf: "stretch",
                          minHeight: 16,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-[11px] font-semibold"
                            style={{ color: msg.isMine ? "var(--accent)" : "var(--text-secondary)" }}>
                            {msg.isMine ? "You" : partner.fullName}
                          </span>
                          <span className="text-[10px] flex-shrink-0"
                            style={{ color: "var(--text-muted)" }}>
                            {timeLabel(msg.createdAt)}
                          </span>
                        </div>
                        <p className="text-[13px] leading-relaxed break-words"
                          style={{ color: "var(--text-secondary)" }}>
                          {msg.image && <span className="opacity-60">📷 Photo — </span>}
                          {msg.audio && <span className="opacity-60">🎤 Voice — </span>}
                          {msg.text && highlight(msg.text, query)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
