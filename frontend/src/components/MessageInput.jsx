import { useRef, useState, useCallback, useEffect } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore }  from "../store/useChatStore";
import { axiosInstance } from "../lib/axios";
import VoiceRecorder     from "./VoiceRecorder";
import EmojiPicker       from "./EmojiPicker";
import ReplyBar          from "./ReplyBar";
import ScheduleModal     from "./ScheduleModal";
import GifPicker         from "./GifPicker";
import toast from "react-hot-toast";
import { Mic, MicOff, Send, PenTool, EyeOff, Film } from "lucide-react";
import { motion } from "framer-motion";
import SketchCanvas from "./SketchCanvas";

const STOP_DELAY = 1500;

// Tone dot colors
const TONE_COLORS = {
  warm:       "#10b981",
  neutral:    null,          // no dot for neutral
  cold:       "#f59e0b",
  aggressive: "#ef4444",
};

export default function MessageInput({ onTextChange }) {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText]             = useState("");
  const [imgPreview, setImgPreview] = useState(null);
  const [docPreview, setDocPreview] = useState(null);
  const [emojiOpen, setEmojiOpen]   = useState(false);
  const [gifOpen,   setGifOpen]     = useState(false);
  const [sketchOpen, setSketchOpen] = useState(false);
  const [isWhisper, setIsWhisper]   = useState(false);
  const [voiceMode, setVoiceMode]   = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [isRecording, setIsRecording]   = useState(false);

  // Tone Advisor
  const [toneScore, setToneScore]     = useState(null);
  const [toneTip,   setToneTip]       = useState(null);
  const [showToneTip, setShowToneTip] = useState(false);
  const toneTimer   = useRef(null);

  const fileRef     = useRef(null);
  const inputRef    = useRef(null);
  const timerRef    = useRef(null);
  const holdTimer   = useRef(null);
  const typingRef   = useRef(false);
  const recognitionRef = useRef(null);

  const {
    sendMessage, isSoundEnabled, emitTyping, emitStopTyping,
    pendingInput, clearPendingInput, replyingTo,
    selectedUser, disappearSeconds,
  } = useChatStore();

  useEffect(() => {
    if (pendingInput !== null) {
      setText(pendingInput);
      onTextChange?.(pendingInput);
      clearPendingInput();
      inputRef.current?.focus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingInput]);

  // ── Tone analysis — debounced 1.2s after stop typing ──────────────────
  const analyzeTone = useCallback((val) => {
    clearTimeout(toneTimer.current);
    if (val.length < 12) { setToneScore(null); setToneTip(null); return; }
    toneTimer.current = setTimeout(async () => {
      try {
        const res = await axiosInstance.post("/ai/tone", { text: val });
        setToneScore(res.data.score);
        setToneTip(res.data.suggestion);
      } catch { /* silent — never block sending */ }
    }, 1200);
  }, []);

  const handleTyping = useCallback((val) => {
    onTextChange?.(val);
    analyzeTone(val);
    if (val.length > 0 && !typingRef.current) { typingRef.current = true; emitTyping(); }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { typingRef.current = false; emitStopTyping(); }, STOP_DELAY);
    if (val.length === 0) { clearTimeout(timerRef.current); typingRef.current = false; emitStopTyping(); }
  }, [emitTyping, emitStopTyping, onTextChange, analyzeTone]);

  const toggleVoiceTyping = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.error("Voice typing is not supported in this browser.");
      return;
    }
    if (recognitionRef.current) {
      setIsRecording(false);
      recognitionRef.current.stop();
      recognitionRef.current = null;
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (e) => {
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
      }
      if (final) {
        setText(prev => prev + (prev ? " " : "") + final);
        handleTyping(text + final);
      }
    };
    recognition.onerror = () => { setIsRecording(false); recognitionRef.current = null; };
    recognition.onend   = () => { setIsRecording(false); recognitionRef.current = null; };
    recognition.start();
    setIsRecording(true);
    recognitionRef.current = recognition;
    toast.success("Voice typing started. Speak now...", { icon: "🎤" });
  };

  const handleSend = () => {
    if (!text.trim() && !imgPreview && !docPreview) return;
    if (isSoundEnabled) {
      const s = new Audio("/sounds/notification.mp3");
      s.volume = 0.4;
      s.play().catch(() => {});
    }
    clearTimeout(timerRef.current);
    typingRef.current = false;
    emitStopTyping();
    sendMessage({ text: text.trim(), image: imgPreview, document: docPreview, isWhisper });
    setText(""); setImgPreview(null); setDocPreview(null);
    setEmojiOpen(false); setGifOpen(false); setIsWhisper(false);
    setToneScore(null); setToneTip(null);
    onTextChange?.("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleVoiceSend = (audioBase64) => {
    sendMessage({ audio: audioBase64, isWhisper });
    setVoiceMode(false);
    setIsWhisper(false);
  };

  const handleSketchSend = (dataUrl) => {
    sendMessage({ image: dataUrl, isWhisper });
    setSketchOpen(false);
    setIsWhisper(false);
  };

  const handleGifSelect = (gifUrl) => {
    // Send GIF as image (Tenor CDN URL — no re-upload needed)
    sendMessage({ image: gifUrl, isWhisper });
    setGifOpen(false);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File too large (max 10MB)"); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (file.type.startsWith("image/")) setImgPreview(reader.result);
      else setDocPreview({ filename: file.name, size: file.size, data: reader.result });
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

  const onSendPointerDown = () => {
    if (!canSend) return;
    holdTimer.current = setTimeout(() => { holdTimer.current = null; setShowSchedule(true); }, 600);
  };
  const onSendPointerUp = () => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; handleSend(); }
  };
  const onSendPointerLeave = () => { clearTimeout(holdTimer.current); holdTimer.current = null; };

  const canSend = text.trim() || imgPreview || docPreview;
  const disappearLabel = disappearSeconds === 0 ? null
    : disappearSeconds === 3600    ? "1h"
    : disappearSeconds === 86400   ? "24h"
    : disappearSeconds === 604800  ? "7d"
    : disappearSeconds === 2592000 ? "30d" : "90d";

  const toneDotColor = toneScore ? TONE_COLORS[toneScore] : null;

  return (
    <div className="flex-shrink-0 safe-bottom" style={{ background: "var(--bg-secondary)", borderTop: "1px solid var(--border)" }}>

      {replyingTo && <ReplyBar />}

      {imgPreview && (
        <div className="px-4 pt-3">
          <div className="relative inline-block">
            <img src={imgPreview} alt="Preview" className="w-20 h-20 object-cover rounded-xl"
              style={{ border: "2px solid var(--accent)" }} />
            <button type="button" onClick={() => { setImgPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold bg-[#ef4444]">
              ×
            </button>
          </div>
        </div>
      )}

      {docPreview && (
        <div className="px-4 pt-3">
          <div className="relative inline-flex items-center gap-3 p-3 rounded-xl bg-[#141414] border border-[#262626] pr-10">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/5">
              <svg className="w-5 h-5 text-[#a3a3a3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div className="flex flex-col max-w-[200px]">
              <span className="text-[13px] text-white truncate font-medium">{docPreview.filename}</span>
              <span className="text-[11px] text-[#737373]">{(docPreview.size / 1024).toFixed(1)} KB</span>
            </div>
            <button type="button" onClick={() => { setDocPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold bg-[#ef4444]">
              ×
            </button>
          </div>
        </div>
      )}

      {emojiOpen && (
        <div className="px-3 pt-2 absolute bottom-20 left-0 bg-[#0d0d0d] rounded-t-2xl shadow-2xl z-40 border border-white/5 w-full">
          <EmojiPicker onSelect={insertEmoji} onClose={() => setEmojiOpen(false)} />
        </div>
      )}

      {sketchOpen && <SketchCanvas onSend={handleSketchSend} onCancel={() => setSketchOpen(false)} />}

      {gifOpen && (
        <GifPicker onSelect={handleGifSelect} onClose={() => setGifOpen(false)} />
      )}

      {disappearLabel && (
        <div className="flex items-center gap-1.5 px-4 pt-2">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ color: "var(--accent)" }}>
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="text-[11px] font-semibold" style={{ color: "var(--accent)" }}>
            Messages disappear after {disappearLabel}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 px-3 py-2.5">
        <button type="button" onClick={() => setIsWhisper(v => !v)}
          className={`icon-btn flex-shrink-0 ${isWhisper ? "text-indigo-400 bg-indigo-500/10" : ""}`}
          title={isWhisper ? "Whisper mode on" : "Whisper mode off"}>
          <EyeOff size={18} />
        </button>

        <button type="button" onClick={() => setSketchOpen(v => !v)}
          className="icon-btn flex-shrink-0" title="Draw a sketch">
          <PenTool size={18} />
        </button>

        <button type="button" onClick={() => fileRef.current?.click()}
          className="icon-btn flex-shrink-0" title="Attach file">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>

        {voiceMode ? (
          <VoiceRecorder onSend={handleVoiceSend} onCancel={() => setVoiceMode(false)} />
        ) : (
          <>
            <div className="flex-1 flex items-center gap-2 rounded-full px-4 h-[44px] input-pill-glass">
              {/* Emoji */}
              <button type="button" onClick={() => { setEmojiOpen(v => !v); setGifOpen(false); }}
                className="flex-shrink-0 transition-colors"
                style={{ color: emojiOpen ? "#e5e5e5" : "#737373" }} title="Emoji">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 13s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              </button>

              {/* GIF button */}
              <button type="button" onClick={() => { setGifOpen(v => !v); setEmojiOpen(false); }}
                className="flex-shrink-0 transition-colors"
                style={{ color: gifOpen ? "#e5e5e5" : "#737373" }} title="Send a GIF">
                <Film size={17} />
              </button>

              <input ref={inputRef} type="text" value={text}
                onChange={e => { setText(e.target.value); handleTyping(e.target.value); if (isSoundEnabled) playRandomKeyStrokeSound?.(); }}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Type a message"
                className="flex-1 bg-transparent border-none focus:outline-none text-[14.5px] leading-none"
                style={{ color: "var(--text-primary)", fontFamily: "inherit" }}
              />

              {/* Voice typing */}
              <button type="button" onClick={toggleVoiceTyping}
                className="flex-shrink-0 transition-colors"
                style={{ color: isRecording ? "#ef4444" : "#737373" }}
                title={isRecording ? "Stop voice typing" : "Voice type"}>
                {isRecording ? <Mic size={18} className="animate-pulse" /> : <MicOff size={18} />}
              </button>

              {/* Tone dot — only shows for non-neutral tones */}
              {toneDotColor && text.length > 12 && (
                <div className="relative flex-shrink-0 group">
                  <button type="button"
                    className="w-4 h-4 rounded-full transition-all"
                    style={{ background: toneDotColor, opacity: 0.85 }}
                    onClick={() => setShowToneTip(v => !v)}
                    title="Message tone"
                  />
                  {(showToneTip || toneTip) && toneTip && (
                    <div
                      className="absolute bottom-7 right-0 w-52 p-3 rounded-xl text-xs text-white z-50 pointer-events-none
                        opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "#1a1a1a", border: "1px solid #262626" }}>
                      <p className="font-semibold mb-1 capitalize" style={{ color: toneDotColor }}>
                        {toneScore} tone
                      </p>
                      <p className="text-[#a3a3a3] leading-relaxed">{toneTip}</p>
                    </div>
                  )}
                </div>
              )}

              <input type="file" ref={fileRef} onChange={handleFile} className="hidden" />
            </div>

            <div className="relative flex-shrink-0">
              <motion.button type="button" whileTap={{ scale: 0.88 }}
                onPointerDown={canSend ? onSendPointerDown : undefined}
                onPointerUp={canSend ? onSendPointerUp : undefined}
                onPointerLeave={canSend ? onSendPointerLeave : undefined}
                onClick={canSend ? undefined : () => setVoiceMode(true)}
                className="w-11 h-11 rounded-full flex items-center justify-center transition-all select-none"
                style={{
                  background: canSend ? "#ffffff" : "#1a1a1a",
                  color:      canSend ? "#000000" : "#737373",
                  border:     canSend ? "none" : "1px solid #262626",
                  touchAction: "none",
                }}
                title={canSend ? "Send (hold to schedule)" : "Record voice"}>
                {canSend ? <Send size={17} className="ml-0.5" /> : <Mic size={18} />}
              </motion.button>
            </div>
          </>
        )}
      </div>

      {showSchedule && selectedUser && (
        <ScheduleModal
          text={text} image={imgPreview} receiverId={selectedUser._id}
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
