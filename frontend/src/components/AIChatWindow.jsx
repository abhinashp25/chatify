import { useState, useRef, useEffect } from "react";
import { useAIStore } from "../store/useAIStore";
import { SendIcon, XIcon, SparklesIcon, RefreshCwIcon } from "lucide-react";

export default function AIChatWindow({ onClose }) {
  const { aiMessages, isAILoading, sendAIMessage, clearAI } = useAIStore();
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMessages, isAILoading]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSend = async () => {
    if (!input.trim() || isAILoading) return;
    const text = input.trim();
    setInput("");
    await sendAIMessage(text);
  };

  const STARTERS = [
    "Help me write a message",
    "What can you do?",
    "Tell me a fun fact",
    "Help me plan my day",
  ];

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-primary)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-[64px] flex-shrink-0 relative"
        style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border)' }}>
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, #667eea 0%, #4fd1c5 100%)' }} />

        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #4fd1c5 100%)' }}>
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9l-1 2H8l1-2-1-2h4l1 2zm4 0l-1 2h-2l1-2-1-2h2l1 2z"/>
          </svg>
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px]"
            style={{ background: '#4fd1c5', border: '1.5px solid #0f1621' }}>✦</span>
        </div>
        <div className="flex-1">
          <p className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>Chatify AI</p>
          <p className="text-[11px]" style={{ color: '#4fd1c5' }}>Always online · Powered by Gemini AI</p>
        </div>
        <button onClick={clearAI} className="icon-btn" title="Clear chat">
          <RefreshCwIcon className="w-4 h-4" />
        </button>
        <button onClick={onClose} className="icon-btn" title="Close">
          <XIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {aiMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(102,126,234,0.2) 0%, rgba(79,209,197,0.2) 100%)', border: '1px solid rgba(79,209,197,0.2)' }}>
              <SparklesIcon className="w-9 h-9" style={{ color: '#4fd1c5' }} />
            </div>
            <div className="text-center">
              <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Hi! I'm Chatify AI</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Ask me anything — I'm here to help</p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {STARTERS.map((s) => (
                <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  className="text-left text-[12px] px-3 py-2.5 rounded-xl transition-all"
                  style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {aiMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #4fd1c5 100%)' }}>
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
              </div>
            )}
            <div
              className="px-4 py-2.5 text-[14px] leading-relaxed max-w-[80%]"
              style={{
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: msg.role === "user"
                  ? "linear-gradient(135deg, #226b59 0%, #1a4a3d 100%)"
                  : "var(--bg-panel)",
                color: 'var(--text-primary)',
                border: msg.role === "assistant" ? '1px solid var(--border)' : 'none',
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.role === "assistant" && msg.content.includes("GEMINI_API_KEY") ? (
                <span>
                  ⚠️ AI not configured yet.{" "}
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer"
                    style={{ color: '#4fd1c5', textDecoration: 'underline' }}>
                    Get your FREE Gemini key here
                  </a>
                  {" "}→ Add <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 4px', borderRadius: 4 }}>GEMINI_API_KEY=...</code> to backend .env
                </span>
              ) : msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isAILoading && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #4fd1c5 100%)' }}>
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
            </div>
            <div className="px-4 py-3 rounded-2xl flex gap-1.5 items-center"
              style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
              {[0, 150, 300].map((d) => (
                <span key={d} className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: '#4fd1c5', animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-3 py-3"
        style={{ background: 'var(--bg-header)', borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSend(); }}
            placeholder="Ask me anything…"
            className="msg-input"
            disabled={isAILoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isAILoading}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0"
            style={{
              background: input.trim() && !isAILoading
                ? 'linear-gradient(135deg, #667eea 0%, #4fd1c5 100%)'
                : 'var(--bg-input)',
              color: input.trim() && !isAILoading ? 'white' : 'var(--text-muted)',
              boxShadow: input.trim() && !isAILoading ? '0 4px 16px rgba(102,126,234,0.3)' : 'none',
            }}
          >
            <SendIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
