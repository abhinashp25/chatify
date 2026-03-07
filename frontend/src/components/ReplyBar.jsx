import { XIcon, CornerUpLeftIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

export default function ReplyBar() {
  const { replyingTo, clearReply } = useChatStore();
  if (!replyingTo) return null;

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 mx-3 mb-1 rounded-xl"
      style={{
        background: 'var(--bg-input)',
        borderLeft: '3px solid #4fd1c5',
      }}
    >
      <CornerUpLeftIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#4fd1c5' }} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold mb-0.5" style={{ color: '#4fd1c5' }}>
          {replyingTo.senderName}
        </p>
        {replyingTo.image && !replyingTo.text && (
          <p className="text-[12px] truncate" style={{ color: 'var(--text-muted)' }}>📷 Photo</p>
        )}
        {replyingTo.audio && (
          <p className="text-[12px] truncate" style={{ color: 'var(--text-muted)' }}>🎤 Voice message</p>
        )}
        {replyingTo.text && (
          <p className="text-[12px] truncate" style={{ color: 'var(--text-secondary)' }}>
            {replyingTo.text}
          </p>
        )}
      </div>
      {replyingTo.image && (
        <img src={replyingTo.image} alt="reply preview"
          className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
      )}
      <button onClick={clearReply} className="flex-shrink-0 icon-btn">
        <XIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
