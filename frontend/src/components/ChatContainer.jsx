import { useEffect, useRef, useState } from "react";
import { useAuthStore }  from "../store/useAuthStore";
import { useChatStore }  from "../store/useChatStore";
import ChatHeader        from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput      from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import MessageTicks      from "./MessageTicks";
import SmartReplies      from "./SmartReplies";

const REACTION_EMOJIS = ["👍","❤️","😂","😮","😢","🔥"];

export default function ChatContainer() {
  const {
    selectedUser, getMessagesByUserId, markMessagesAsRead,
    messages, isMessagesLoading, subscribeToMessages,
    unsubscribeFromMessages, toggleReaction, deleteMessage, searchQuery,
  } = useChatStore();
  const { authUser, cacheContact } = useAuthStore();
  const bottomRef     = useRef(null);
  const [ctx, setCtx] = useState(null);           // right-click context menu
  const [hoveredMsg, setHoveredMsg] = useState(null); // which msg is hovered
  const [currentInput, setCurrentInput] = useState("");

  useEffect(() => { cacheContact(selectedUser._id, selectedUser.fullName); }, [selectedUser]);

  useEffect(() => {
    getMessagesByUserId(selectedUser._id);
    subscribeToMessages();
    markMessagesAsRead(selectedUser._id);
    return () => unsubscribeFromMessages();
  }, [selectedUser._id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const close = () => setCtx(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const visible = searchQuery.trim()
    ? messages.filter((m) => m.text?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const myReactionOn = (msg) =>
    msg.reactions?.find((r) => r.userId === authUser._id || r.userId?._id === authUser._id)?.emoji;

  const groupReactions = (reactions = []) =>
    reactions.reduce((acc, r) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {});

  return (
    <div className="flex flex-col h-full" onClick={() => setCtx(null)}>
      <ChatHeader />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 chat-bg">
        {isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : visible.length === 0 && searchQuery ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="text-5xl opacity-30">🔍</div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No messages match "{searchQuery}"</p>
          </div>
        ) : visible.length === 0 ? (
          <NoChatHistoryPlaceholder name={selectedUser.fullName} />
        ) : (
          <div className="max-w-3xl mx-auto">
            {visible.map((msg, idx) => {
              const isMine     = msg.senderId === authUser._id || msg.senderId?._id === authUser._id;
              const myReaction = myReactionOn(msg);
              const grouped    = groupReactions(msg.reactions);
              const hasReacts  = Object.keys(grouped).length > 0;
              const isHovered  = hoveredMsg === msg._id;

              const showDate = idx === 0 || !sameDay(
                new Date(visible[idx - 1]?.createdAt),
                new Date(msg.createdAt)
              );

              return (
                <div key={msg._id}>
                  {showDate && <DatePill date={msg.createdAt} />}

                  <div
                    className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}
                    onMouseEnter={() => setHoveredMsg(msg._id)}
                    onMouseLeave={() => setHoveredMsg(null)}
                  >
                    <div className="relative" style={{ maxWidth: "min(75%, 520px)" }}>

                      {/* ── Reaction hover tray ── */}
                      {!msg.isDeletedForAll && !msg.isOptimistic && isHovered && (
                        <div
                          className={`absolute z-30 -top-9 ${isMine ? "right-0" : "left-0"} 
                            flex items-center gap-0.5 px-2 py-1.5 rounded-full shadow-2xl`}
                          style={{
                            background: 'var(--bg-panel)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                          }}
                          onMouseEnter={() => setHoveredMsg(msg._id)}
                          onMouseLeave={() => setHoveredMsg(null)}
                        >
                          {REACTION_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={(e) => { e.stopPropagation(); toggleReaction(msg._id, emoji); setHoveredMsg(null); }}
                              className="text-[18px] leading-none transition-transform duration-100 p-0.5 rounded-full"
                              style={{
                                transform: 'scale(1)',
                                background: myReaction === emoji ? 'rgba(79,209,197,0.25)' : 'transparent',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.35)'}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* ── Bubble ── */}
                      <div
                        className={`${isMine ? "bubble-mine" : "bubble-theirs"} ${
                          searchQuery && msg.text?.toLowerCase().includes(searchQuery.toLowerCase())
                            ? "ring-2 ring-yellow-400/50" : ""
                        }`}
                        onContextMenu={(e) => {
                          if (msg.isOptimistic || msg.isDeletedForAll) return;
                          e.preventDefault();
                          e.stopPropagation();
                          setCtx({ msgId: msg._id, x: e.clientX, y: e.clientY, isMine });
                        }}
                      >
                        {msg.isDeletedForAll ? (
                          <p className="text-[13px] italic opacity-40">This message was unsent.</p>
                        ) : (
                          <>
                            {msg.image && (
                              <img src={msg.image} alt="Shared"
                                className="rounded-xl max-h-[260px] w-full object-cover mb-1.5"
                                style={{ cursor: 'zoom-in' }} />
                            )}
                            {msg.audio && (
                              <audio controls className="w-full max-w-[220px] h-8 mb-1.5"
                                style={{ accentColor: '#4fd1c5' }}>
                                <source src={msg.audio} />
                              </audio>
                            )}
                            {msg.text && (
                              <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap">
                                {searchQuery ? highlightMatch(msg.text, searchQuery) : msg.text}
                              </p>
                            )}
                          </>
                        )}

                        {/* Time + ticks */}
                        <div className={`flex items-center justify-end gap-1 mt-1 ${isMine ? "opacity-50" : "opacity-40"}`}>
                          <span className="text-[10px]">
                            {new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {isMine && <MessageTicks message={msg} />}
                        </div>
                      </div>

                      {/* ── Reaction bubbles row ── */}
                      {hasReacts && !msg.isDeletedForAll && (
                        <div className={`flex gap-1 mt-1 flex-wrap ${isMine ? "justify-end" : "justify-start"}`}>
                          {Object.entries(grouped).map(([emoji, count]) => (
                            <button
                              key={emoji}
                              onClick={(e) => { e.stopPropagation(); toggleReaction(msg._id, emoji); }}
                              className="text-[12px] px-2 py-0.5 rounded-full border transition-all"
                              style={{
                                background: myReaction === emoji ? 'rgba(79,209,197,0.18)' : 'rgba(26,34,53,0.85)',
                                borderColor: myReaction === emoji ? 'rgba(79,209,197,0.4)' : 'rgba(255,255,255,0.08)',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {emoji}{count > 1 ? ` ${count}` : ""}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Context menu (right-click) */}
      {ctx && (
        <div
          className="fixed z-50 overflow-hidden py-1.5 rounded-xl shadow-2xl"
          style={{
            top: Math.min(ctx.y, window.innerHeight - 100),
            left: Math.min(ctx.x, window.innerWidth - 200),
            background: 'var(--bg-panel)',
            border: '1px solid rgba(255,255,255,0.1)',
            minWidth: 180,
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <CtxBtn label="🗑️  Delete for me" onClick={() => { deleteMessage(ctx.msgId, false); setCtx(null); }} />
          {ctx.isMine && (
            <>
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <CtxBtn label="↩️  Unsend for everyone" danger onClick={() => { deleteMessage(ctx.msgId, true); setCtx(null); }} />
            </>
          )}
        </div>
      )}

      {/* Smart Replies */}
      {!searchQuery && messages.length > 0 && !currentInput && (
        <SmartReplies
          lastMessage={messages.filter(m => {
            const sid = m.senderId?._id || m.senderId;
            return sid !== authUser._id && m.text;
          }).slice(-1)[0]?.text}
          onSelect={(r) => {
            const inp = document.querySelector(".msg-input");
            if (inp) { inp.value = r; inp.focus(); }
            setCurrentInput(r);
          }}
        />
      )}

      <MessageInput onTextChange={setCurrentInput} />
    </div>
  );
}

function CtxBtn({ label, onClick, danger }) {
  return (
    <button onClick={onClick} className="w-full text-left px-4 py-2.5 text-[13px] transition-colors hover:bg-white/5"
      style={{ color: danger ? '#fc8181' : 'var(--text-primary)' }}>
      {label}
    </button>
  );
}

function DatePill({ date }) {
  const d = new Date(date); const now = new Date();
  let label;
  if (sameDay(d, now)) label = "Today";
  else { const y = new Date(); y.setDate(now.getDate() - 1); label = sameDay(d, y) ? "Yesterday" : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }); }
  return (
    <div className="flex justify-center my-4">
      <span className="text-[11px] px-4 py-1.5 rounded-full"
        style={{ background: 'rgba(26,34,53,0.85)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
        {label}
      </span>
    </div>
  );
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function highlightMatch(text, query) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-400/40 text-inherit rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}
