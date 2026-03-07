import { useEffect, useRef, useState } from "react";
import { useAuthStore }  from "../store/useAuthStore";
import { useChatStore }  from "../store/useChatStore";
import ChatHeader        from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput      from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import MessageTicks      from "./MessageTicks";
import SmartReplies      from "./SmartReplies";
import ReplyBar          from "./ReplyBar";
import ForwardModal      from "./ForwardModal";

const REACTION_EMOJIS = ["👍","❤️","😂","😮","😢","🔥"];

export default function ChatContainer() {
  const {
    selectedUser, getMessagesByUserId, markMessagesAsRead,
    messages, isMessagesLoading, subscribeToMessages, unsubscribeFromMessages,
    toggleReaction, deleteMessage, searchQuery,
    setReplyingTo, toggleStarMessage, togglePinMessage, pinnedMessage,
  } = useChatStore();
  const { authUser } = useAuthStore();

  const bottomRef      = useRef(null);
  const [ctx, setCtx]  = useState(null);
  const [hoveredMsg, setHovered] = useState(null);
  const [forwardMsg, setForwardMsg] = useState(null);
  const [currentInput, setCurrentInput] = useState("");
  const holdTimer = useRef(null);

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

  const handleReply = (msg) => {
    const isMine = msg.senderId === authUser._id || msg.senderId?._id === authUser._id;
    setReplyingTo({
      messageId:  msg._id,
      text:       msg.text || null,
      image:      msg.image || null,
      audio:      msg.audio || null,
      senderName: isMine ? "You" : selectedUser.fullName,
    });
    setCtx(null);
  };

  return (
    <div className="flex flex-col h-full" onClick={() => setCtx(null)}>
      <ChatHeader />

      {/* Pinned message banner */}
      {pinnedMessage && !pinnedMessage.isDeletedForAll && (
        <div className="flex items-center gap-2.5 px-4 py-2 cursor-pointer flex-shrink-0"
          style={{ background: 'rgba(79,209,197,0.08)', borderBottom: '1px solid rgba(79,209,197,0.15)' }}
          onClick={() => {
            const el = document.getElementById(`msg-${pinnedMessage._id}`);
            el?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}>
          <div className="w-0.5 h-7 rounded-full flex-shrink-0" style={{ background: '#4fd1c5' }} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#4fd1c5' }}>📌 Pinned Message</p>
            <p className="text-[12px] truncate" style={{ color: 'var(--text-secondary)' }}>
              {pinnedMessage.image ? "📷 Photo" : pinnedMessage.audio ? "🎤 Voice" : pinnedMessage.text}
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 chat-bg">
        {isMessagesLoading ? <MessagesLoadingSkeleton /> :
         visible.length === 0 && searchQuery ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="text-5xl opacity-30">🔍</div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No results for "{searchQuery}"</p>
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
                new Date(visible[idx - 1]?.createdAt), new Date(msg.createdAt)
              );

              return (
                <div key={msg._id} id={`msg-${msg._id}`}>
                  {showDate && <DatePill date={msg.createdAt} />}

                  <div
                    className={`flex ${isMine ? "justify-end" : "justify-start"} mb-0.5`}
                    onTouchStart={() => { holdTimer.current = setTimeout(() => { setCtx({ msgId: msg._id, isMine, touch: true, x: 100, y: 300 }); }, 500); }}
                    onTouchEnd={() => clearTimeout(holdTimer.current)}
                  >
                    <div className="relative" style={{ maxWidth: "min(76%, 520px)" }}
                      onMouseEnter={() => setHovered(msg._id)}
                      onMouseLeave={() => setHovered(null)}>

                      {/* Emoji tray on hover */}
                      {!msg.isDeletedForAll && !msg.isOptimistic && isHovered && (
                        <div
                          className={`absolute z-30 -top-9 ${isMine ? "right-0" : "left-0"} flex items-center gap-0.5 px-2 py-1.5 rounded-full shadow-2xl`}
                          style={{ background: 'var(--bg-panel)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                          onMouseEnter={() => setHovered(msg._id)}
                          onMouseLeave={() => setHovered(null)}
                        >
                          {REACTION_EMOJIS.map((emoji) => (
                            <button key={emoji}
                              onClick={(e) => { e.stopPropagation(); toggleReaction(msg._id, emoji); setHovered(null); }}
                              className="text-[18px] leading-none p-0.5 rounded-full transition-transform duration-100"
                              style={{ background: myReaction === emoji ? 'rgba(79,209,197,0.25)' : 'transparent' }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.35)'}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >{emoji}</button>
                          ))}
                        </div>
                      )}

                      {/* Bubble */}
                      <div
                        className={`${isMine ? "bubble-mine" : "bubble-theirs"} ${searchQuery && msg.text?.toLowerCase().includes(searchQuery.toLowerCase()) ? "ring-2 ring-yellow-400/50" : ""} ${msg.isPinned ? "ring-1 ring-cyan-400/30" : ""}`}
                        onContextMenu={(e) => {
                          if (msg.isOptimistic || msg.isDeletedForAll) return;
                          e.preventDefault(); e.stopPropagation();
                          setCtx({ msgId: msg._id, x: e.clientX, y: e.clientY, isMine, msg });
                        }}
                      >
                        {/* Forwarded label */}
                        {msg.isForwarded && !msg.isDeletedForAll && (
                          <p className="text-[10px] italic mb-1 opacity-50 flex items-center gap-1">
                            <span>↪</span> Forwarded
                          </p>
                        )}

                        {/* Reply quote */}
                        {msg.replyTo?.senderName && !msg.isDeletedForAll && (
                          <div className="mb-2 px-2.5 py-1.5 rounded-lg"
                            style={{ background: 'rgba(0,0,0,0.2)', borderLeft: '2px solid rgba(79,209,197,0.6)' }}>
                            <p className="text-[10px] font-bold mb-0.5" style={{ color: '#4fd1c5' }}>
                              {msg.replyTo.senderName}
                            </p>
                            {msg.replyTo.image && <p className="text-[11px] opacity-60">📷 Photo</p>}
                            {msg.replyTo.audio && <p className="text-[11px] opacity-60">🎤 Voice message</p>}
                            {msg.replyTo.text && (
                              <p className="text-[12px] opacity-70 line-clamp-2">{msg.replyTo.text}</p>
                            )}
                          </div>
                        )}

                        {msg.isDeletedForAll ? (
                          <p className="text-[13px] italic opacity-40">This message was unsent.</p>
                        ) : (
                          <>
                            {msg.image && <ImageBubble src={msg.image} isMine={isMine} />}
                            {msg.audio && <AudioBubble src={msg.audio} isMine={isMine} />}
                            {msg.text && (
                              <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap">
                                {searchQuery ? highlightMatch(msg.text, searchQuery) : msg.text}
                              </p>
                            )}
                          </>
                        )}

                        {/* Star indicator */}
                        {msg._starred && <span className="text-[10px] absolute -top-2 -right-1">⭐</span>}

                        {/* Time + ticks */}
                        <div className={`flex items-center justify-end gap-1 mt-1 ${isMine ? "opacity-50" : "opacity-40"}`}>
                          {msg.isPinned && <span className="text-[9px]">📌</span>}
                          <span className="text-[10px]">
                            {new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {isMine && <MessageTicks message={msg} />}
                        </div>
                      </div>

                      {/* Reactions row */}
                      {hasReacts && !msg.isDeletedForAll && (
                        <div className={`flex gap-1 mt-1 flex-wrap ${isMine ? "justify-end" : "justify-start"}`}>
                          {Object.entries(grouped).map(([emoji, count]) => (
                            <button key={emoji}
                              onClick={(e) => { e.stopPropagation(); toggleReaction(msg._id, emoji); }}
                              className="text-[12px] px-2 py-0.5 rounded-full border transition-all"
                              style={{
                                background: myReaction === emoji ? 'rgba(79,209,197,0.18)' : 'rgba(26,34,53,0.85)',
                                borderColor: myReaction === emoji ? 'rgba(79,209,197,0.4)' : 'rgba(255,255,255,0.08)',
                                color: 'var(--text-primary)',
                              }}>
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

      {/* Context menu */}
      {ctx && (
        <div className="fixed z-50 rounded-xl overflow-hidden shadow-2xl py-1"
          style={{
            top: Math.min(ctx.y, window.innerHeight - 230),
            left: Math.min(ctx.x, window.innerWidth - 220),
            background: 'var(--bg-panel)', border: '1px solid rgba(255,255,255,0.1)',
            minWidth: 200, boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
          }}
          onClick={(e) => e.stopPropagation()}>
          <CtxItem emoji="↩️" label="Reply"
            onClick={() => { handleReply(ctx.msg || messages.find(m=>m._id===ctx.msgId)); setCtx(null); }} />
          <CtxItem emoji="↪️" label="Forward"
            onClick={() => { setForwardMsg(ctx.msg || messages.find(m=>m._id===ctx.msgId)); setCtx(null); }} />
          <CtxItem emoji="⭐" label="Star message"
            onClick={() => { toggleStarMessage(ctx.msgId); setCtx(null); }} />
          <CtxItem emoji="📌" label={messages.find(m=>m._id===ctx.msgId)?.isPinned ? "Unpin" : "Pin message"}
            onClick={() => { togglePinMessage(ctx.msgId); setCtx(null); }} />
          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
          <CtxItem emoji="🗑️" label="Delete for me"
            onClick={() => { deleteMessage(ctx.msgId, false); setCtx(null); }} />
          {ctx.isMine && (
            <CtxItem emoji="↩️" label="Unsend for everyone" danger
              onClick={() => { deleteMessage(ctx.msgId, true); setCtx(null); }} />
          )}
        </div>
      )}

      {/* Smart replies */}
      {!searchQuery && messages.length > 0 && !currentInput && (
        <SmartReplies
          lastMessage={messages.filter((m) => {
            const sid = m.senderId?._id || m.senderId;
            return sid !== authUser._id && m.text;
          }).slice(-1)[0]?.text}
        />
      )}

      <ReplyBar />
      <MessageInput onTextChange={setCurrentInput} />

      {forwardMsg && <ForwardModal message={forwardMsg} onClose={() => setForwardMsg(null)} />}
    </div>
  );
}

function CtxItem({ emoji, label, onClick, danger }) {
  return (
    <button onClick={onClick}
      className="w-full text-left px-4 py-2.5 text-[13px] flex items-center gap-3 transition-colors hover:bg-white/5"
      style={{ color: danger ? '#fc8181' : 'var(--text-primary)' }}>
      <span className="text-base w-5 text-center">{emoji}</span>
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
      <span className="text-[11px] px-4 py-1.5 rounded-full select-none"
        style={{ background: 'rgba(26,34,53,0.85)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
        {label}
      </span>
    </div>
  );
}

function sameDay(a, b) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

function highlightMatch(text, query) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (<>{text.slice(0, idx)}<mark className="bg-yellow-400/40 text-inherit rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>{text.slice(idx + query.length)}</>);
}


function ImageBubble({ src, isMine }) {
  const [opened, setOpened] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  if (!opened) {
    return (
      <div
        className="relative rounded-xl overflow-hidden mb-1.5 cursor-pointer group"
        style={{ width: 200, height: 180, background: 'rgba(0,0,0,0.3)' }}
        onClick={() => setOpened(true)}
      >
        {/* Blurred preview */}
        <img src={src} alt="img" className="w-full h-full object-cover" style={{ filter: 'blur(12px)', transform: 'scale(1.1)' }} />
        {/* Download icon overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.55)', border: '2px solid rgba(255,255,255,0.3)' }}>
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v12m0 0l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/>
            </svg>
          </div>
          <span className="text-[11px] text-white/70 font-medium">Tap to download</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative rounded-xl overflow-hidden mb-1.5 cursor-zoom-in group" onClick={() => setLightbox(true)}>
        <img src={src} alt="img" className="rounded-xl max-h-[260px] w-full object-cover" />
        {/* Download button top-right */}
        <a
          href={src} download target="_blank" rel="noreferrer"
          className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2v12m0 0l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/>
          </svg>
        </a>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={() => setLightbox(false)}>
          <img src={src} alt="full" className="max-w-[90vw] max-h-[88vh] rounded-2xl object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
          <div className="absolute top-4 right-4 flex gap-2">
            <a href={src} download target="_blank" rel="noreferrer"
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.12)' }}
              onClick={(e) => e.stopPropagation()}>
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v12m0 0l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/>
              </svg>
            </a>
            <button onClick={() => setLightbox(false)}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.12)' }}>
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function AudioBubble({ src, isMine }) {
  const [loaded, setLoaded]   = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const toggle = () => {
    if (!loaded) { setLoaded(true); return; }
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setProgress(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
    audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
  };

  const handleEnded = () => setPlaying(false);

  const fmtTime = (s) => {
    const m = Math.floor((s || 0) / 60);
    const sec = Math.floor((s || 0) % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 mb-1" style={{ minWidth: 200 }}>
      {/* Play/Pause button */}
      <button onClick={toggle}
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
        style={{
          background: isMine ? 'rgba(255,255,255,0.2)' : 'rgba(79,209,197,0.25)',
        }}>
        {playing ? (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" style={{ color: isMine ? 'white' : '#4fd1c5' }}>
            <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
          </svg>
        ) : (
          <svg className="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor" style={{ color: isMine ? 'white' : '#4fd1c5' }}>
            <polygon points="5,3 19,12 5,21"/>
          </svg>
        )}
      </button>

      {/* Waveform + progress */}
      <div className="flex-1">
        <div className="relative h-2 rounded-full overflow-hidden mb-1.5 cursor-pointer"
          style={{ background: isMine ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)' }}
          onClick={(e) => {
            if (!audioRef.current || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            audioRef.current.currentTime = pct * duration;
            setProgress(pct * duration);
          }}>
          <div className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: isMine ? 'rgba(255,255,255,0.8)' : '#4fd1c5' }} />
        </div>
        <p className="text-[10px] opacity-50">
          {playing || progress > 0 ? fmtTime(progress) : fmtTime(duration)} {!loaded && "· tap to play"}
        </p>
      </div>

      {/* Hidden audio element — only loaded when user taps play */}
      {loaded && (
        <audio ref={audioRef} src={src} preload="metadata"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          className="hidden" />
      )}

      {/* Mic icon */}
      <svg className="w-4 h-4 flex-shrink-0 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      </svg>
    </div>
  );
}
