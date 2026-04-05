import { useRef, useState, useCallback, useEffect } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore }  from "../store/useChatStore";
import VoiceRecorder     from "./VoiceRecorder";
import EmojiPicker       from "./EmojiPicker";
import ReplyBar          from "./ReplyBar";
import ScheduleModal     from "./ScheduleModal";
import toast from "react-hot-toast";
import { Mic, MicOff } from "lucide-react";

const STOP_DELAY = 1500;

export default function MessageInput({ onTextChange }) {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText]             = useState("");
  const [imgPreview, setImgPreview] = useState(null);
  const [docPreview, setDocPreview] = useState(null);
  const [emojiOpen, setEmojiOpen]   = useState(false);
  const [voiceMode, setVoiceMode]   = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const fileRef   = useRef(null);
  const inputRef  = useRef(null);
  const timerRef  = useRef(null);
  const holdTimer = useRef(null);
  const typingRef = useRef(false);
  const recognitionRef = useRef(null);

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

  const toggleVoiceTyping = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Voice typing is not supported in this browser.");
      return;
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
      }
      if (finalTranscript) {
        setText((prev) => prev + (prev ? " " : "") + finalTranscript);
        handleTyping(text + finalTranscript);
      }
    };

    recognition.onerror = () => {
      recognitionRef.current = null;
      toast.error("Voice typing error or interrupted");
    };

    recognition.onend = () => {
      recognitionRef.current = null;
    };

    recognition.start();
    recognitionRef.current = recognition;
    toast.success("Voice typing started. Speak now...", { icon: "🎤" });
  };

  const handleSend = () => {
    if (!text.trim() && !imgPreview && !docPreview) return;
    if (isSoundEnabled) playRandomKeyStrokeSound();
    clearTimeout(timerRef.current); typingRef.current = false; emitStopTyping();
    sendMessage({ text: text.trim(), image: imgPreview, document: docPreview });
    setText(""); setImgPreview(null); setDocPreview(null); setEmojiOpen(false);
    onTextChange?.("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleVoiceSend = (audioBase64) => {
    sendMessage({ audio: audioBase64 });
    setVoiceMode(false);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File too large (limit 10MB)"); return; }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (file.type.startsWith("image/")) {
        setImgPreview(reader.result);
      } else {
        setDocPreview({ filename: file.name, size: file.size, data: reader.result });
      }
    };
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

  const canSend = text.trim() || imgPreview || docPreview;

  // Disappear timer label for display in input area
  const disappearLabel = disappearSeconds === 0 ? null
    : disappearSeconds === 3600    ? "1h"
    : disappearSeconds === 86400   ? "24h"
    : disappearSeconds === 604800  ? "7d"
    : disappearSeconds === 2592000 ? "30d"
    : "90d";

  return (
    <div className="flex-shrink-0 safe-bottom" style={{ background: "#202c33", borderTop: "none" }}>

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

      {/* Document preview */}
      {docPreview && (
        <div className="px-4 pt-3">
          <div className="relative inline-flex items-center gap-3 p-3 rounded-xl bg-[#2a3942] border border-white/10 pr-8 shadow-sm">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5">
              <svg className="w-5 h-5 text-[#00a884]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <div className="flex flex-col max-w-[200px]">
              <span className="text-[13px] text-gray-200 truncate font-medium">{docPreview.filename}</span>
              <span className="text-[11px] text-gray-400">{(docPreview.size / 1024).toFixed(1)} KB</span>
            </div>
            <button type="button"
              onClick={() => { setDocPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: "#fc8181", boxShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
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
      <div className="flex items-end gap-2 px-2 py-2">

        {/* + / Attach */}
        <button type="button"
          onClick={() => fileRef.current?.click()}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all"
          style={{ color: "#8696a0" }}>
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        </button>

        {voiceMode ? (
          <VoiceRecorder onSend={handleVoiceSend} onCancel={() => setVoiceMode(false)} />
        ) : (
          <>
            <div className="flex-1 flex items-end rounded-[22px] px-4 py-2 min-h-[44px] input-pill-glass">
              {/* Emoji */}
              <button type="button"
                onClick={() => setEmojiOpen((v) => !v)}
                className="flex-shrink-0 mr-3 mb-0.5"
                style={{ color: emojiOpen ? "#00a884" : "#8696a0" }}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 13s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </button>
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => { setText(e.target.value); handleTyping(e.target.value); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Type a message"
                className="flex-1 bg-transparent border-none focus:outline-none text-[14px] leading-[1.4]"
                style={{ color: "#e9edef", fontFamily: "inherit", minWidth: 0 }}
              />
              <button type="button" onClick={toggleVoiceTyping} className="flex-shrink-0 ml-2" style={{ color: recognitionRef.current ? "#00a884" : "#8696a0" }}>
                {recognitionRef.current ? <Mic size={20} className="animate-pulse" /> : <MicOff size={20} />}
              </button>
              <input type="file" ref={fileRef} onChange={handleFile} className="hidden" />
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
                  background: "#00a884",
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
            setText(""); setImgPreview(null); setDocPreview(null);
            if (fileRef.current) fileRef.current.value = "";
          }}
        />
      )}
    </div>
  );
}
