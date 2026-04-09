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
import LinkPreviewCard   from "./LinkPreviewCard";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, ChevronDown } from "lucide-react";

const REACTION_EMOJIS = ["👍","❤️","😂","😮","😢","🔥"];

/* ── AI Summary Overlay ───────────────────────────────────────────────── */
function AISummaryOverlay({ messages, user, onClose }) {
  const recentTexts = messages.filter(m => m.text && !m.isDeletedForAll).slice(-20);
  const totalMsgs   = messages.length;
  const myMsgs      = messages.filter(m => m.isMine).length;

  // Simple keyword extraction
  const allText  = recentTexts.map(m => m.text).join(" ");
  const keywords = Array.from(new Set(
    allText.toLowerCase().match(/\b[a-z]{5,}\b/g) || []
  )).slice(0, 6);

  const lastSender = recentTexts[recentTexts.length - 1];
  const sentiment  = totalMsgs > 30 ? "Active" : totalMsgs > 10 ? "Engaged" : "New";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ backdropFilter: "blur(20px)", background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-sm mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#111111", border: "1px solid #262626" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ background: "#0a0a0a", borderBottom: "1px solid #262626" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)" }}>
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white text-[13px] font-semibold leading-none">AI Conversation Intel</p>
              <p className="text-white/60 text-[11px] mt-0.5">with {user?.fullName}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <X size={14} className="text-white" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 p-4">
          {[
            { label: "Messages", value: totalMsgs },
            { label: "Sent", value: myMsgs },
            { label: "Received", value: totalMsgs - myMsgs }
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "#1a1a1a" }}>
              <p className="text-[20px] font-bold text-white">{s.value}</p>
              <p className="text-[11px] text-[#a3a3a3] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Sentiment + Status */}
        <div className="px-4 pb-3">
          <div className="rounded-xl p-3.5 flex items-center gap-3" style={{ background: "#1a1a1a" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.1)" }}>
              <span className="text-xl">{sentiment === "Active" ? "🔥" : sentiment === "Engaged" ? "💬" : "✨"}</span>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#e9edef]">Conversation Status</p>
              <p className="text-[12px] text-white">{sentiment} · {totalMsgs} total messages</p>
            </div>
          </div>
        </div>

        {/* Keywords */}
        {keywords.length > 0 && (
          <div className="px-4 pb-4">
            <p className="text-[11px] font-semibold text-[#a3a3a3] uppercase tracking-wider mb-2">Key Topics</p>
            <div className="flex flex-wrap gap-2">
              {keywords.map(k => (
                <span key={k} className="px-2.5 py-1 rounded-full text-[12px] font-medium capitalize"
                  style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}>
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Last message preview */}
        {lastSender?.text && (
          <div className="px-4 pb-4">
            <p className="text-[11px] font-semibold text-[#a3a3a3] uppercase tracking-wider mb-2">Latest Message</p>
            <div className="rounded-xl p-3" style={{ background: "#1a1a1a" }}>
              <p className="text-[13px] text-[#d1d7db] line-clamp-2">{lastSender.text}</p>
            </div>
          </div>
        )}

        <div className="px-4 pb-4">
          <p className="text-[11px] text-center text-[#667781]">AI-powered conversation insights</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ChatContainer() {
  const {
    selectedUser, getMessagesByUserId, markMessagesAsRead,
    messages, isMessagesLoading, subscribeToMessages, unsubscribeFromMessages,
    toggleReaction, deleteMessage, searchQuery,
    setReplyingTo, toggleStarMessage, togglePinMessage, pinnedMessage, typingUsers
  } = useChatStore();
  const { authUser } = useAuthStore();

  const bottomRef    = useRef(null);
  const containerRef = useRef(null);
  const holdTimer    = useRef(null);

  const [ctx,           setCtx]           = useState(null);
  const [hoveredMsg,    setHovered]        = useState(null);
  const [forwardMsg,    setForwardMsg]     = useState(null);
  const [currentInput,  setCurrentInput]   = useState("");
  const [showScrollBtn, setShowScrollBtn]  = useState(false);
  const [showAISummary, setShowAISummary]  = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    getMessagesByUserId(selectedUser._id);
    subscribeToMessages();
    markMessagesAsRead(selectedUser._id);
    return () => unsubscribeFromMessages();
  }, [selectedUser._id]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 300);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!showScrollBtn) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const disappearLabel = (msg) => {
    if (!msg.expiresAt) return null;
    const diff = new Date(msg.expiresAt) - new Date();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (d > 1) return `${d}d`;
    if (h > 0) return `${h}h`;
    const m = Math.floor(diff / 60000);
    return `${m}m`;
  };

  // Group messages by date
  const groupedMessages = visible.reduce((acc, msg, idx) => {
    const showDate = idx === 0 || !sameDay(new Date(visible[idx - 1]?.createdAt), new Date(msg.createdAt));
    if (showDate) acc.push({ type: 'date', id: `date-${idx}`, date: msg.createdAt });
    acc.push({ type: 'message', ...msg });
    return acc;
  }, []);

  return (
    <div className="flex flex-col h-full relative" onClick={() => setCtx(null)}>
      <ChatHeader onAISummary={() => setShowAISummary(true)} />

      {/* Pinned message banner */}
      {pinnedMessage && !pinnedMessage.isDeletedForAll && (
        <div className="flex items-center gap-3 px-4 py-2 cursor-pointer flex-shrink-0 pinned-glass"
          onClick={() => {
            const el = document.getElementById(`msg-${pinnedMessage._id}`);
            el?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}>
          <div className="w-0.5 h-7 rounded-full flex-shrink-0" style={{ background: "white" }} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white">📌 Pinned Message</p>
            <p className="text-[12px] truncate text-[#a3a3a3]">
              {pinnedMessage.document ? "📄 Document" : pinnedMessage.image ? "📷 Photo" : pinnedMessage.audio ? "🎤 Voice" : pinnedMessage.text}
            </p>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-2 sm:px-3 py-3 chat-bg no-scrollbar">
        {isMessagesLoading ? <MessagesLoadingSkeleton /> :
         visible.length === 0 && searchQuery ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="text-5xl opacity-30">🔍</div>
            <p className="text-sm text-[#a3a3a3]">No results for "{searchQuery}"</p>
          </div>
        ) : visible.length === 0 ? (
          <NoChatHistoryPlaceholder name={selectedUser.fullName} />
        ) : (
          <div className="max-w-[760px] mx-auto">
            <AnimatePresence initial={false}>
            {groupedMessages.map((item) => {
              if (item.type === 'date') {
                return <DatePill key={item.id} date={item.date} />;
              }
              const msg       = item;
              const isMine    = msg.senderId === authUser._id || msg.senderId?._id === authUser._id;
              const myReaction= myReactionOn(msg);
              const grouped   = groupReactions(msg.reactions);
              const hasReacts = Object.keys(grouped).length > 0;
              const isHovered = hoveredMsg === msg._id;
              const timeLeft  = disappearLabel(msg);

              return (
                <motion.div
                  key={msg._id}
                  id={`msg-${msg._id}`}
                  initial={{ opacity: 0, y: 8, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={`flex ${isMine ? "justify-end" : "justify-start"} mb-[2px] px-2`}
                  onTouchStart={() => {
                    holdTimer.current = setTimeout(() => {
                      setCtx({ msgId: msg._id, isMine, touch: true, x: 100, y: 300 });
                    }, 500);
                  }}
                  onTouchEnd={() => clearTimeout(holdTimer.current)}
                >
                  <div className="relative" style={{ maxWidth: "min(72%, 500px)" }}
                    onMouseEnter={() => setHovered(msg._id)}
                    onMouseLeave={() => setHovered(null)}>

                    {/* Reaction emoji tray */}
                    <AnimatePresence>
                      {!msg.isDeletedForAll && !msg.isOptimistic && isHovered && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.85, y: 4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.85, y: 4 }}
                          transition={{ duration: 0.12 }}
                          className={`absolute z-30 -top-9 ${isMine ? "right-0" : "left-0"} flex items-center gap-[2px] px-2 py-1.5 rounded-full shadow-2xl`}
                          style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 4px 20px rgba(0,0,0,0.6)" }}
                          onMouseEnter={() => setHovered(msg._id)}
                          onMouseLeave={() => setHovered(null)}
                        >
                          {REACTION_EMOJIS.map((emoji) => (
                            <button key={emoji}
                              onClick={(e) => { e.stopPropagation(); toggleReaction(msg._id, emoji); setHovered(null); }}
                              className="text-[18px] leading-none p-1 rounded-full transition-transform duration-100 hover:scale-125"
                              style={{ background: myReaction === emoji ? "rgba(0,168,132,0.2)" : "transparent" }}
                            >{emoji}</button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Bubble */}
                    <div
                      className={`${isMine ? "bubble-mine" : "bubble-theirs"} 
                        ${searchQuery && msg.text?.toLowerCase().includes(searchQuery.toLowerCase()) ? "ring-2 ring-yellow-400/40" : ""} 
                        ${msg.isPinned ? "ring-1 ring-white/30" : ""} bubble ${msg.isWhisper ? "whisper-blur" : ""}`}
                      onContextMenu={(e) => {
                        if (msg.isOptimistic || msg.isDeletedForAll) return;
                        e.preventDefault(); e.stopPropagation();
                        setCtx({ msgId: msg._id, x: e.clientX, y: e.clientY, isMine, msg });
                      }}
                    >
                      {/* Forwarded label */}
                      {msg.isForwarded && !msg.isDeletedForAll && (
                        <p className="text-[11px] italic mb-1.5 flex items-center gap-1 text-[#a3a3a3]">
                          <span className="opacity-60">↪</span> Forwarded
                        </p>
                      )}

                      {/* Reply quote */}
                      {msg.replyTo?.senderName && !msg.isDeletedForAll && (
                        <div className="mb-2 px-2.5 py-1.5 rounded-lg relative overflow-hidden"
                          style={{ background: isMine ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.25)", borderLeft: "3px solid white" }}>
                          <p className="text-[11px] font-semibold mb-0.5 text-white">{msg.replyTo.senderName}</p>
                          {msg.replyTo.image && <p className="text-[12px] text-[#a3a3a3]">📷 Photo</p>}
                          {msg.replyTo.audio && <p className="text-[12px] text-[#a3a3a3]">🎤 Voice message</p>}
                          {msg.replyTo.document && <p className="text-[12px] text-[#a3a3a3]">📄 Document</p>}
                          {msg.replyTo.text && <p className="text-[12px] text-[#d1d7db] line-clamp-2">{msg.replyTo.text}</p>}
                        </div>
                      )}

                      {msg.isDeletedForAll ? (
                        <p className="text-[13px] italic text-[#a3a3a3] flex items-center gap-1.5">
                          <span className="text-base">🚫</span> This message was deleted
                        </p>
                      ) : (
                        <>
                          {msg.image    && <ImageBubble src={msg.image} isMine={isMine} />}
                          {msg.audio    && <AudioBubble src={msg.audio} isMine={isMine} />}
                          {msg.document && <DocumentBubble doc={msg.document} isMine={isMine} />}
                          {msg.text && (
                            <p className="text-[14.2px] leading-[1.5] break-words whitespace-pre-wrap">
                              {searchQuery ? highlightMatch(msg.text, searchQuery) : msg.text}
                            </p>
                          )}
                          {msg.linkPreview?.title && (
                            <LinkPreviewCard preview={msg.linkPreview} isMine={isMine} />
                          )}
                        </>
                      )}

                      {msg._starred && (
                        <span className="text-[10px] absolute -top-2 -right-1">⭐</span>
                      )}

                      {/* Time + ticks */}
                      <div className={`flex items-center justify-end gap-1 mt-1 select-none`}>
                        {msg.isPinned && <span className="text-[9px]">📌</span>}
                        {timeLeft && (
                          <span className="text-[9px] flex items-center gap-0.5 opacity-60">
                            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                            </svg>
                            {timeLeft}
                          </span>
                        )}
                        <span className="text-[11px]" style={{ color: isMine ? "rgba(255,255,255,0.45)" : "#a3a3a3" }}>
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
                              background: myReaction === emoji ? "rgba(255,255,255,0.15)" : "rgba(26,34,53,0.85)",
                              borderColor: myReaction === emoji ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)",
                              color: "var(--text-primary)",
                            }}>
                            {emoji}{count > 1 ? ` ${count}` : ""}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
            
            {typingUsers[selectedUser._id] && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className="flex justify-start mb-[4px] px-2"
              >
                <div className="typing-bubble gap-1.5 shadow-[0_4px_15px_rgba(0,0,0,0.2)] border border-white/5 backdrop-blur-md rounded-2xl p-4 bg-white/5">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full typing-dot"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full typing-dot"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full typing-dot"></span>
                </div>
              </motion.div>
            )}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Scroll-to-bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="absolute bottom-24 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-lg z-20"
            style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}>
            <ChevronDown size={18} className="text-[#aebac1]" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Context menu */}
      <AnimatePresence>
        {ctx && (
          <motion.div
            initial={{ opacity: 0, scale: 0.93 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.93 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 rounded-lg overflow-hidden shadow-2xl py-1.5"
            style={{
              top: Math.min(ctx.y, window.innerHeight - 260),
              left: Math.min(ctx.x, window.innerWidth - 225),
              background: "#233138",
              minWidth: 205,
              boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
              border: "1px solid rgba(255,255,255,0.07)"
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
            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "4px 0" }} />
            <CtxItem emoji="🗑️" label="Delete for me"
              onClick={() => { deleteMessage(ctx.msgId, false); setCtx(null); }} />
            {ctx.isMine && (
              <CtxItem emoji="🚫" label="Unsend for everyone" danger
                onClick={() => { deleteMessage(ctx.msgId, true); setCtx(null); }} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* AI Summary */}
      <AnimatePresence>
        {showAISummary && (
          <AISummaryOverlay
            messages={messages}
            user={selectedUser}
            onClose={() => setShowAISummary(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CtxItem({ emoji, label, onClick, danger }) {
  return (
    <button onClick={onClick}
      className="w-full text-left px-4 py-2.5 text-[13.5px] flex items-center gap-3 transition-colors hover:bg-white/5"
      style={{ color: danger ? "#fc8181" : "#d1d7db" }}>
      <span className="text-base w-5 text-center">{emoji}</span>
      {label}
    </button>
  );
}

function DatePill({ date }) {
  const d = new Date(date); const now = new Date();
  let label;
  if (sameDay(d, now)) label = "Today";
  else {
    const y = new Date(); y.setDate(now.getDate() - 1);
    label = sameDay(d, y) ? "Yesterday" : d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  }
  return (
    <div className="flex justify-center my-4">
      <span className="text-[12px] px-4 py-1 rounded-full select-none"
        style={{ background: "#111111", color: "#a3a3a3", border: "1px solid rgba(255,255,255,0.06)" }}>
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

function ImageBubble({ src }) {
  const [opened, setOpened] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  if (!opened) {
    return (
      <div className="relative rounded-xl overflow-hidden mb-1.5 cursor-pointer group"
        style={{ width: 220, height: 185, background: "rgba(0,0,0,0.35)" }}
        onClick={() => setOpened(true)}>
        <img src={src} alt="img" className="w-full h-full object-cover" style={{ filter: "blur(14px)", transform: "scale(1.12)" }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)", border: "1.5px solid rgba(255,255,255,0.25)" }}>
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v12m0 0l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/>
            </svg>
          </div>
          <span className="text-[11px] text-white/70 font-medium">Click to view</span>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="relative rounded-xl overflow-hidden mb-1.5 cursor-zoom-in group" onClick={() => setLightbox(true)}>
        <img src={src} alt="img" className="rounded-xl max-h-[260px] w-full object-cover" />
        <a href={src} download target="_blank" rel="noreferrer"
          className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: "rgba(0,0,0,0.6)" }} onClick={(e) => e.stopPropagation()}>
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2v12m0 0l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/>
          </svg>
        </a>
      </div>
      {lightbox && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.94)" }} onClick={() => setLightbox(false)}>
          <img src={src} alt="full" className="max-w-[90vw] max-h-[88vh] rounded-2xl object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
          <div className="absolute top-4 right-4 flex gap-2">
            <a href={src} download target="_blank" rel="noreferrer"
              className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)" }} onClick={(e) => e.stopPropagation()}>
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v12m0 0l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/>
              </svg>
            </a>
            <button onClick={() => setLightbox(false)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)" }}>
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
  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play().then(() => setPlaying(true)).catch(() => {}); }
  };

  const fmtTime = (s) => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  const pct  = duration > 0 ? (progress / duration) * 100 : 0;
  const BARS = [3,5,8,6,9,4,7,10,6,8,5,4,9,7,6,8,5,3,7,9,4,6,8,5,7,9,6,4,8,6];

  return (
    <div className="flex items-center gap-2.5 mb-1" style={{ minWidth: 230, maxWidth: 290 }}>
      <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden"
        style={{ background: isMine ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.15)" }}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full p-2"
          style={{ color: isMine ? "rgba(255,255,255,0.7)" : "white" }}>
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
        </svg>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          <button onClick={toggle}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
            style={{ background: isMine ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.15)" }}>
            {playing ? (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" style={{ color: "white" }}>
                <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 ml-0.5" viewBox="0 0 24 24" fill="currentColor" style={{ color: "white" }}>
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            )}
          </button>
          <div className="flex items-center gap-[2px] flex-1 cursor-pointer h-8"
            onClick={(e) => {
              if (!audioRef.current || !duration) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const p = (e.clientX - rect.left) / rect.width;
              audioRef.current.currentTime = p * duration;
              setProgress(p * duration);
            }}>
            {BARS.map((h, i) => {
              const barPct = (i / BARS.length) * 100;
              const active = barPct <= pct;
              return (
                <div key={i} className="rounded-full flex-1 transition-all"
                  style={{
                    height: `${h * 2.5}px`,
                    background: active
                      ? (isMine ? "rgba(255,255,255,0.9)" : "white")
                      : (isMine ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.2)"),
                  }} />
              );
            })}
          </div>
        </div>
        <p className="text-[10px] mt-0.5 pl-10" style={{ color: isMine ? "rgba(255,255,255,0.5)" : "#a3a3a3" }}>
          {fmtTime(playing || progress > 0 ? progress : duration)}
        </p>
      </div>
      <audio ref={audioRef} src={src} preload="metadata"
        onLoadedMetadata={() => { if (audioRef.current) setDuration(audioRef.current.duration); }}
        onTimeUpdate={() => { if (audioRef.current) setProgress(audioRef.current.currentTime); }}
        onEnded={() => { setPlaying(false); setProgress(0); }}
        className="hidden" />
    </div>
  );
}

function DocumentBubble({ doc, isMine }) {
  const ext = (doc.filename || "").split('.').pop().toLowerCase();
  
  // Choose an icon based on extension
  let IconSVG;
  if (['pdf'].includes(ext)) {
    IconSVG = (
      <svg className="w-5 h-5" style={{ color: "#ef4444" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M10 18v-2h4v2" />
        <path d="M8 18v-2h2v2" />
      </svg>
    );
  } else if (['doc', 'docx'].includes(ext)) {
    IconSVG = (
      <svg className="w-5 h-5" style={{ color: "#3b82f6" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M16 13l-4 4-4-4" />
      </svg>
    );
  } else if (['xls', 'xlsx', 'csv'].includes(ext)) {
    IconSVG = (
      <svg className="w-5 h-5" style={{ color: "#10b981" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h2v4H8z" />
        <path d="M14 13h2v4h-2z" />
      </svg>
    );
  } else if (['zip', 'rar', '7z', 'tar'].includes(ext)) {
    IconSVG = (
      <svg className="w-5 h-5" style={{ color: "#eab308" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M8 10h8" />
        <path d="M8 14h8" />
        <path d="M8 18h8" />
      </svg>
    );
  } else {
    IconSVG = (
      <svg className="w-5 h-5" style={{ color: "#9ca3af" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    );
  }

  return (
    <a href={doc.url} target="_blank" rel="noreferrer" download={doc.filename}
      className="flex items-center gap-3 p-3 mb-1.5 rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
      style={{ background: isMine ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.2)", maxWidth: 290, minWidth: 240 }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: isMine ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.1)" }}>
        {IconSVG}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium truncate text-white">{doc.filename || "Document"}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] uppercase font-bold" style={{ color: isMine ? "rgba(255,255,255,0.55)" : "#a3a3a3" }}>
            {ext || "?"}
          </span>
          <span className="text-[10px]" style={{ color: isMine ? "rgba(255,255,255,0.4)" : "#667781" }}>
            • {(doc.size / 1024).toFixed(1)} KB
          </span>
        </div>
      </div>
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors hover:bg-black/40"
        style={{ background: isMine ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.05)" }}>
        <svg className="w-4 h-4 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </div>
    </a>
  );
}
