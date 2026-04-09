import { useChatStore } from "../store/useChatStore";

export default function NoChatHistoryPlaceholder({ name }) {
  const { sendMessage } = useChatStore();
  const quickSend = (text) => sendMessage({ text, image: null });

  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 p-8 select-none">
      <div className="w-16 h-16 rounded-full bg-[#111111] flex items-center justify-center">
        <svg className="w-8 h-8 text-slate-600" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <div className="text-center">
        <p className="text-slate-300 font-medium">Start chatting with {name}</p>
        <p className="text-slate-600 text-[13px] mt-1">Messages are sent in real-time</p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {["👋 Say Hello", "😊 How are you?", "📅 Meet up soon?"].map((msg) => (
          <button key={msg} onClick={() => quickSend(msg)}
            className="pill-btn pill-btn-secondary text-[12px]">
            {msg}
          </button>
        ))}
      </div>
    </div>
  );
}
