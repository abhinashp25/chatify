import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

function MessageTicks({ message }) {
  const { onlineUsers } = useAuthStore();
  const { selectedUser } = useChatStore();

  // If it's a group, the "delivered/read" logic is incredibly complex (array of readBy, deliveredTo).
  // Assuming basic 1-to-1 logic for now.
  const receiverId = typeof message.receiverId === 'object' ? message.receiverId._id : message.receiverId;
  
  // Delivered if the receiver is online.
  const isDelivered = onlineUsers.includes(receiverId || selectedUser?._id);

  if (message.isOptimistic) {
    return (
      <span className="inline-flex items-center opacity-60" title="Sending...">
        <svg className="w-3.5 h-3.5 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </span>
    );
  }

  if (message.isRead) {
    return (
      <span className="inline-flex items-center" style={{ color: "#53bdeb" }} title="Read" aria-label="Read">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="2 13 7 18 16 7" />
          <polyline points="8 13 13 18 22 7" />
        </svg>
      </span>
    );
  }

  if (isDelivered) {
    return (
      <span className="inline-flex items-center text-[#a3a3a3]" title="Delivered" aria-label="Delivered">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="2 13 7 18 16 7" />
          <polyline points="8 13 13 18 22 7" />
        </svg>
      </span>
    );
  }

  // Single grey tick
  return (
    <span className="inline-flex items-center text-[#a3a3a3]" title="Sent" aria-label="Sent">
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="5 13 10 18 20 7" />
      </svg>
    </span>
  );
}

export default MessageTicks;
