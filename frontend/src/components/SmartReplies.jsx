import { useEffect } from "react";
import { useAIStore } from "../store/useAIStore";
import { SparklesIcon } from "lucide-react";

export default function SmartReplies({ lastMessage, onSelect }) {
  const { smartReplies, fetchSmartReplies, clearSmartReplies } = useAIStore();

  useEffect(() => {
    if (lastMessage) fetchSmartReplies(lastMessage);
    else clearSmartReplies();
  }, [lastMessage]);

  if (!smartReplies.length) return null;

  return (
    <div className="px-3 pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
      <SparklesIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#4fd1c5' }} />
      {smartReplies.map((r, i) => (
        <button
          key={i}
          onClick={() => { onSelect(r); clearSmartReplies(); }}
          className="text-[12px] px-3 py-1.5 rounded-full whitespace-nowrap transition-all flex-shrink-0"
          style={{
            background: 'rgba(79,209,197,0.1)',
            border: '1px solid rgba(79,209,197,0.25)',
            color: '#4fd1c5',
          }}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
