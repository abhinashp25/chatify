import { useRef, useState, useCallback, useEffect } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore }  from "../store/useChatStore";
import VoiceRecorder     from "./VoiceRecorder";
import EmojiPicker       from "./EmojiPicker";
import ReplyBar          from "./ReplyBar";
import ScheduleModal     from "./ScheduleModal";
import toast from "react-hot-toast";

const STOP_DELAY = 1500;

export default function MessageInput({ onTextChange }) {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText]             = useState("");
  const [imgPreview, setImgPreview] = useState(null);
  const [emojiOpen, setEmojiOpen]   = useState(false);
  const [voiceMode, setVoiceMode]   = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const fileRef   = useRef(null);
  const inputRef  = useRef(null);
  const timerRef  = useRef(null);
  const holdTimer = useRef(null);  // for long-press on send
  const typingRef = useRef(false);

  const {
    sendMessage, isSoundEnabled, emitTyping, emitStopTyping,
    pendingInput, clearPendingInput, replyingTo, clearReply,
    selectedUser, disappearSeconds,
  } = useChatStore();

  useEffect(() => {
    if (pendingInput !== null) {
      setText(pendingInput);
      onTextChange?.(pendingInput);
      clearPendingInput();
      inputRef.current?.focus();
    }
  }, [pendingInput]);

  const handleTyping = useCallback((val) => {
    onTextChange?.(val);
    if (val.length > 0 && !typingRef.current) { typingRef.current = true; emitTyping(); }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { typingRef.current = false; emitStopTyping(); }, STOP_DELAY);
    if (val.length === 0) { clearTimeout(timerRef.current); typingRef.current = false; emitStopTyping(); }
  }, [emitTyping, emitStopTyping, onTextChange]);

  const handleSend = () => {
    if (!text.trim() && !imgPreview) return;
    if (isSoundEnabled) playRandomKeyStrokeSound();
    clearTimeout(timerRef.current); typingRef.current = false; emitStopTyping();
    sendMessage({ text: text.trim(), image: imgPreview });
    setText(""); setImgPreview(null); setEmojiOpen(false);
    onTextChange?.("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleVoiceSend = (audioBase64) => {
    sendMessage({ audio: audioBase64 });
    setVoiceMode(false);
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    const reader = new FileReader();
    reader.onloadend = () => setImgPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const insertEmoji = (em) => {
    const pos = inputRef.current?.selectionStart ?? text.length;
    const newText = text.slice(0, pos) + em + text.slice(pos);
    setText(newText);
    handleTyping(newText);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(pos + em.length, pos + em.length);
    }, 0);
  };

  // Long-press on send button → schedule modal
  const onSendPointerDown = () => {
    if (!canSend) return; // only schedule if there's content
    holdTimer.current = setTimeout(() => {
      holdTimer.current = null;
      setShowSchedule(true);
    }, 600);
  };
  const onSendPointerUp = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
      handleSend(); // short tap = send immediately
    }
  };
  const onSendPointerLeave = () => {
    clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };

  const canSend = text.trim() || imgPreview;

  // Disappear timer label for display in input area
  const disappearLabel = disappearSeconds === 0 ? null
    : disappearSeconds === 3600    ? "1h"
    : disappearSeconds === 86400   ? "24h"
    : disappearSeconds === 604800  ? "7d"
    : disappearSeconds === 2592000 ? "30d"
    : "90d";

  return (
    <div className="flex-shrink-0 safe-bottom"
      style={{ background: "var(--bg-header)", borderTop: "1px solid var(--border)" }}>

      {/* Reply preview */}
      {replyingTo && <ReplyBar />}

      {/* Image preview */}
      {imgPreview && (
        <div className="px-4 pt-3">
          <div className="relative inline-block">
            <img src={imgPreview} alt="Preview"
              className="w-20 h-20 object-cover rounded-xl"
              style={{ border: "2px solid var(--accent)" }} />
            <button type="button"
              onClick={() => { setImgPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: "#fc8181" }}>
              ×
            </button>
          </div>
        </div>
      )}

      {/* Emoji picker */}
      {emojiOpen && (
        <div className="px-3 pt-2">
          <EmojiPicker onSelect={insertEmoji} onClose={() => setEmojiOpen(false)} />
        </div>
      )}

      {/* Disappear timer badge — shows when timer is active */}
      {disappearLabel && (
        <div className="flex items-center gap-1.5 px-4 pt-2">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ color: "var(--accent)" }}>
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span className="text-[11px] font-semibold" style={{ color: "var(--accent)" }}>
            Messages disappear after {disappearLabel}
          </span>
        </div>
      )}

      {/* Main input row */}
      <div className="flex items-end gap-2 px-3 py-2">

        <button type="button"
          onClick={() => setEmojiOpen((v) => !v)}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all"
          style={{ color: emojiOpen ? "var(--accent)" : "var(--text-muted)" }}>
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 13s1.5 2 4 2 4-2 4-2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/>
            <line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
        </button>

        {voiceMode ? (
          <VoiceRecorder onSend={handleVoiceSend} onCancel={() => setVoiceMode(false)} />
        ) : (
          <>
            <div className="flex-1 flex items-end rounded-[22px] px-4 py-2 min-h-[44px]"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => { setText(e.target.value); handleTyping(e.target.value); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Type a message"
                className="flex-1 bg-transparent border-none focus:outline-none text-[14px] leading-[1.4]"
                style={{ color: "var(--text-primary)", fontFamily: "inherit", minWidth: 0 }}
              />
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex-shrink-0 ml-2 mb-0.5"
                style={{ color: "var(--text-muted)" }}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </button>
              <input type="file" accept="image/*" ref={fileRef} onChange={handleImage} className="hidden" />
            </div>

            {/* Send / Mic — long-press send to schedule */}
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onPointerDown={canSend ? onSendPointerDown : undefined}
                onPointerUp={canSend ? onSendPointerUp : undefined}
                onPointerLeave={canSend ? onSendPointerLeave : undefined}
                onClick={canSend ? undefined : () => setVoiceMode(true)}
                className="w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 select-none"
                style={{
                  background: "linear-gradient(135deg, var(--accent), var(--accent-hover, #38b2ac))",
                  boxShadow: "0 4px 14px rgba(79,209,197,0.35)",
                  touchAction: "none",
                }}
                title={canSend ? "Send (hold to schedule)" : "Record voice"}
              >
                {canSend ? (
                  <svg className="w-5 h-5 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
                  </svg>
                )}
              </button>
              {/* Schedule tooltip hint */}
              {canSend && (
                <div className="absolute -top-7 right-0 whitespace-nowrap px-2 py-1 rounded text-[9px] font-medium pointer-events-none opacity-0 hover:opacity-100"
                  style={{ background: "rgba(0,0,0,0.7)", color: "white" }}>
                  Hold to schedule
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Schedule modal */}
      {showSchedule && selectedUser && (
        <ScheduleModal
          text={text}
          image={imgPreview}
          receiverId={selectedUser._id}
          onClose={() => setShowSchedule(false)}
          onScheduled={() => {
            setText(""); setImgPreview(null);
            if (fileRef.current) fileRef.current.value = "";
          }}
        />
      )}
    </div>
  );
}
