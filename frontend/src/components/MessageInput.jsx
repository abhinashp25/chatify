import { useRef, useState, useCallback, useEffect } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore }  from "../store/useChatStore";
import VoiceRecorder     from "./VoiceRecorder";
import toast from "react-hot-toast";
import { ImageIcon, SendIcon, XIcon, SmileIcon, PaperclipIcon } from "lucide-react";

const STOP_DELAY   = 1500;
const QUICK_EMOJIS = ["😊","😂","❤️","👍","🔥","😢","😮","🙏","😍","🎉","👏","😎","🤔","😅","🥳","💯","🫡","🥹","💀","🤣","😭","🙌","✨","💪","👀","🎯","💬","🫶"];

export default function MessageInput({ onTextChange }) {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText]             = useState("");
  const [imgPreview, setImgPreview] = useState(null);
  const [emojiOpen, setEmojiOpen]   = useState(false);
  const [voiceMode, setVoiceMode]   = useState(false);
  const fileRef   = useRef(null);
  const inputRef  = useRef(null);
  const timerRef  = useRef(null);
  const typingRef = useRef(false);

  const { sendMessage, isSoundEnabled, emitTyping, emitStopTyping, pendingInput, clearPendingInput } = useChatStore();

  // When SmartReplies sets a pendingInput, pick it up here
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

  const handleSend = (e) => {
    e?.preventDefault();
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
    const newText = text + em;
    setText(newText);
    handleTyping(newText);
    setEmojiOpen(false);
    inputRef.current?.focus();
  };

  const canSend = text.trim() || imgPreview;

  return (
    <div className="flex-shrink-0 px-3 py-3 safe-bottom"
      style={{ background: 'var(--bg-header)', borderTop: '1px solid var(--border)' }}>

      {/* Image preview */}
      {imgPreview && (
        <div className="mb-2.5 flex items-start">
          <div className="relative">
            <img src={imgPreview} alt="Preview" className="w-20 h-20 object-cover rounded-xl border" style={{ borderColor: 'var(--border)' }} />
            <button type="button"
              onClick={() => { setImgPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white border"
              style={{ background: 'var(--bg-panel)', borderColor: 'var(--border)' }}>
              <XIcon className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Emoji tray */}
      {emojiOpen && (
        <div className="mb-2.5 flex gap-1 flex-wrap rounded-2xl p-3 border"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}>
          {QUICK_EMOJIS.map((em) => (
            <button key={em} onClick={() => insertEmoji(em)}
              className="text-xl hover:scale-125 transition-transform p-1.5 rounded-xl hover:bg-white/5">
              {em}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setEmojiOpen((v) => !v)}
          className={`icon-btn flex-shrink-0 ${emojiOpen ? "active" : ""}`} title="Emoji">
          <SmileIcon className="w-5 h-5" />
        </button>

        {voiceMode ? (
          <VoiceRecorder onSend={handleVoiceSend} onCancel={() => setVoiceMode(false)} />
        ) : (
          <>
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => { setText(e.target.value); handleTyping(e.target.value); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSend(e); }}
              placeholder="Type a message…"
              className="msg-input"
            />

            <button type="button" onClick={() => fileRef.current?.click()}
              className="icon-btn flex-shrink-0" title="Attach image">
              <ImageIcon className="w-5 h-5" />
            </button>
            <input type="file" accept="image/*" ref={fileRef} onChange={handleImage} className="hidden" />

            {canSend ? (
              <button type="button" onClick={handleSend}
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{ background: 'linear-gradient(135deg, #4fd1c5, #38b2ac)', boxShadow: '0 4px 16px rgba(79,209,197,0.3)' }}>
                <SendIcon className="w-4 h-4 text-white" />
              </button>
            ) : (
              <button type="button" onClick={() => setVoiceMode(true)}
                className="icon-btn flex-shrink-0" title="Voice message">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
                </svg>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
