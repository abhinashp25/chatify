import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, UserPlus, FileText } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";

export default function AddContactModal({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [allContacts, setAllContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { setSelectedUser } = useChatStore();

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      axiosInstance.get("/messages/contacts").then(res => {
        setAllContacts(res.data);
      }).catch(e => {
        toast.error("Failed to load contacts list");
      }).finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = allContacts.filter(c => c.fullName?.toLowerCase().includes(query.toLowerCase()) || c.email?.toLowerCase().includes(query.toLowerCase()));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-[#233138] rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[80vh]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#202c33]">
            <h2 className="text-lg font-semibold text-gray-200">Start new chat</h2>
            <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
              <X size={20} />
            </button>
          </div>

          /* Search Bar */
          <div className="p-4 border-b border-white/5">
            <div className="relative flex items-center bg-[#2a3942] rounded-xl overflow-hidden h-[44px]">
              <div className="pl-4 pr-3 text-gray-400"><Search size={18} /></div>
              <input
                type="text"
                placeholder="Search name or email"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-[14px] text-gray-200 placeholder-gray-500 focus:outline-none"
              />
            </div>
          </div>

          /* Contact List */
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin"/></div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <span className="text-4xl mb-3 opacity-30">🔍</span>
                <p className="text-sm text-gray-400">No contacts found for "{query}"</p>
              </div>
            ) : (
              filtered.map(contact => (
                <button
                  key={contact._id}
                  onClick={() => { setSelectedUser(contact); onClose(); }}
                  className="w-full flex items-center gap-4 p-3 hover:bg-[#2a3942] rounded-xl transition-colors text-left group"
                >
                  <img src={contact.profilePic || "/avatar.png"} alt={contact.fullName} className="w-12 h-12 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-gray-200 truncate">{contact.fullName}</p>
                    <p className="text-[13px] text-gray-400 truncate">{contact.email}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
