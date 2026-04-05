import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useStatusStore } from "../store/useStatusStore";
import { useAuthStore } from "../store/useAuthStore";
import { motion, AnimatePresence } from "framer-motion";

export default function StatusTray() {
  const { statuses, fetchStatuses, uploadStatus, isUploading } = useStatusStore();
  const { authUser } = useAuthStore();
  const [activeStatus, setActiveStatus] = useState(null);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  // Group statuses by user
  const groupedStatuses = statuses.reduce((acc, status) => {
    if (!status.userId || !status.userId._id) return acc;
    const userId = status.userId._id;
    if (!acc[userId]) acc[userId] = { user: status.userId, items: [] };
    acc[userId].items.push(status);
    return acc;
  }, {});

  const handlePostStatus = async () => {
    const txt = prompt("What's on your mind?");
    if (txt) {
      await uploadStatus(txt, "text");
    }
  };

  return (
    <div className="py-3 px-2 border-b border-white/5 bg-transparent overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-3 w-max">
        {/* My Status Bubble */}
        <div className="flex flex-col items-center gap-1 cursor-pointer w-[60px]" onClick={handlePostStatus}>
          <div className="relative w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
            <img src={authUser.profilePic || "/avatar.png"} alt="Me" className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Plus className="text-white w-6 h-6" />
            </div>
          </div>
          <span className="text-[10px] text-gray-400 font-medium truncate w-full text-center">My Status</span>
        </div>

        {/* Other People's Statuses */}
        {Object.values(groupedStatuses).map(({ user, items }) => (
          <div 
            key={user._id} 
            className="flex flex-col items-center gap-1 cursor-pointer w-[60px]"
            onClick={() => setActiveStatus({ user, items, currentIndex: 0 })}
          >
            <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-premium-indigo hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full border-2 border-bg-primary overflow-hidden">
                <img src={user.profilePic || "/avatar.png"} alt={user.fullName} className="w-full h-full object-cover" />
              </div>
            </div>
            <span className="text-[10px] text-gray-200 font-medium truncate w-full text-center">{user.fullName.split(' ')[0]}</span>
          </div>
        ))}
      </div>

      {/* Status Viewer Modal */}
      <AnimatePresence>
        {activeStatus && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4"
          >
            {/* Progress Bars */}
            <div className="absolute top-4 left-4 right-4 flex gap-1 items-center z-50">
              {activeStatus.items.map((_, i) => (
                <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-300"
                    style={{ width: i < activeStatus.currentIndex ? '100%' : i === activeStatus.currentIndex ? '100%' : '0%' }}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="absolute top-8 left-4 flex items-center gap-2 z-50">
              <img src={activeStatus.user.profilePic || "/avatar.png"} className="w-10 h-10 rounded-full" />
              <div>
                <p className="text-white font-semibold text-sm">{activeStatus.user.fullName}</p>
                <p className="text-gray-400 text-xs text-left">
                  {new Date(activeStatus.items[activeStatus.currentIndex].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <button 
              className="absolute top-8 right-6 text-white bg-white/10 p-2 rounded-full z-50 hover:bg-white/20"
              onClick={() => setActiveStatus(null)}
            >
              <Plus className="rotate-45" />
            </button>

            {/* Content Viewer Navigation */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-1/2 z-40 cursor-w-resize"
              onClick={() => {
                if (activeStatus.currentIndex > 0) setActiveStatus(prev => ({ ...prev, currentIndex: prev.currentIndex - 1 }));
              }}
            />
             <div 
              className="absolute right-0 top-0 bottom-0 w-1/2 z-40 cursor-e-resize"
              onClick={() => {
                if (activeStatus.currentIndex < activeStatus.items.length - 1) {
                  setActiveStatus(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
                } else setActiveStatus(null);
              }}
            />

            {/* Render Content */}
            <div className="relative max-w-lg w-full aspect-[9/16] bg-slate-900 rounded-3xl overflow-hidden flex items-center justify-center text-center p-8 shadow-2xl">
              {activeStatus.items[activeStatus.currentIndex].type === "image" ? (
                <img src={activeStatus.items[activeStatus.currentIndex].content} className="w-full h-full object-cover" />
              ) : (
                <p className="text-white text-3xl font-medium" style={{ wordBreak: 'break-word' }}>
                  {activeStatus.items[activeStatus.currentIndex].content}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
