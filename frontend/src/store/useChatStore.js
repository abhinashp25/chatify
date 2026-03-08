import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  allContacts:       [],
  chats:             [],
  messages:          [],
  activeTab:         "chats",
  activeFilter:      "all",
  selectedUser:      null,
  isUsersLoading:    false,
  isMessagesLoading: false,
  isSoundEnabled:    JSON.parse(localStorage.getItem("isSoundEnabled")) === true,
  typingUsers:       {},
  searchQuery:       "",
  sidebarSearch:     "",
  unreadCounts:      {},
  replyingTo:        null,
  pendingInput:      null,
  starredMessages:   [],
  lastSeenMap:       {},
  pinnedMessage:     null,
  disappearSeconds:  0,  

  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },
  setActiveTab:     (tab)  => set({ activeTab: tab }),
  setActiveFilter:  (f)    => set({ activeFilter: f }),
  setSelectedUser:  (user) => {
    set({ selectedUser: user, replyingTo: null, pinnedMessage: null, disappearSeconds: 0 });
    if (user) set({ unreadCounts: { ...get().unreadCounts, [user._id]: 0 } });
  },
  setSearchQuery:   (q) => set({ searchQuery: q }),
  setSidebarSearch: (q) => set({ sidebarSearch: q }),
  setReplyingTo:    (msg) => set({ replyingTo: msg }),
  clearReply:       () => set({ replyingTo: null }),
  setPendingInput:  (text) => set({ pendingInput: text }),
  clearPendingInput:() => set({ pendingInput: null }),
  setDisappearSeconds: (s) => set({ disappearSeconds: s }),

  clearChat: async (userId) => {
    try {
      await axiosInstance.delete(`/messages/clear/${userId}`);
      set({ messages: [] });
      set({ chats: get().chats.filter((c) => c._id !== userId) });
    } catch (e) { toast.error(e.response?.data?.message || "Could not clear chat"); }
  },

  markChatArchived: (userId, archived) => {
    set({ chats: get().chats.map((c) => c._id === userId ? { ...c, isArchived: archived } : c) });
  },

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (e) { toast.error(e.response?.data?.message || "Error"); }
    finally { set({ isUsersLoading: false }); }
  },

  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      const serverUnread = {};
      res.data.forEach((c) => { if (c.unreadCount > 0) serverUnread[c._id] = c.unreadCount; });
      set({ chats: res.data, unreadCounts: { ...serverUnread, ...get().unreadCounts } });
    } catch (e) { toast.error(e.response?.data?.message || "Error"); }
    finally { set({ isUsersLoading: false }); }
  },

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
      const pinned = res.data.find((m) => m.isPinned && !m.isDeletedForAll);
      set({ pinnedMessage: pinned || null });

      try {
        const d = await axiosInstance.get(`/disappear/${userId}`);
        set({ disappearSeconds: d.data.seconds || 0 });
      } catch { set({ disappearSeconds: 0 }); }
    } catch (e) { toast.error(e.response?.data?.message || "Error"); }
    finally { set({ isMessagesLoading: false }); }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, replyingTo } = get();
    const { authUser } = useAuthStore.getState();
    const tempId = `temp-${Date.now()}`;

    const payload = { ...messageData, replyTo: replyingTo || undefined };

    const optimistic = {
      _id: tempId,
      senderId: authUser._id, receiverId: selectedUser._id,
      text: messageData.text, image: messageData.image, audio: messageData.audio,
      replyTo: replyingTo || undefined,
      isForwarded: messageData.isForwarded || false,
      createdAt: new Date().toISOString(), isOptimistic: true, isRead: false, reactions: [],
    };

    set({ messages: [...get().messages, optimistic], replyingTo: null });

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, payload);
      set({ messages: get().messages.map((m) => m._id === tempId ? res.data : m) });
      get().getMyChatPartners();
    } catch (e) {
      set({ messages: get().messages.filter((m) => m._id !== tempId) });
      toast.error(e.response?.data?.message || "Send failed");
    }
  },

  markMessagesAsRead: async (senderId) => {
    try {
      await axiosInstance.put(`/messages/read/${senderId}`);
      set({
        messages: get().messages.map((m) => m.senderId === senderId && !m.isRead ? { ...m, isRead: true } : m),
        unreadCounts: { ...get().unreadCounts, [senderId]: 0 },
      });
    } catch {}
  },

  toggleReaction: async (messageId, emoji) => {
    try {
      const res = await axiosInstance.put(`/messages/react/${messageId}`, { emoji });
      set({ messages: get().messages.map((m) => m._id === messageId ? { ...m, reactions: res.data.reactions } : m) });
    } catch { toast.error("Could not react"); }
  },

  deleteMessage: async (messageId, deleteForEveryone) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`, { data: { deleteForEveryone } });
      if (deleteForEveryone) {
        set({ messages: get().messages.map((m) => m._id === messageId ? { ...m, isDeletedForAll: true, text: null, image: null, audio: null } : m) });
      } else {
        set({ messages: get().messages.filter((m) => m._id !== messageId) });
      }
    } catch { toast.error("Could not delete"); }
  },

  toggleStarMessage: async (messageId) => {
    try {
      const res = await axiosInstance.put(`/messages/star/${messageId}`);
      set({ messages: get().messages.map((m) => m._id === messageId ? { ...m, _starred: res.data.starred } : m) });
      toast(res.data.starred ? "⭐ Message starred" : "Unstarred", { duration: 1500 });
    } catch { toast.error("Could not star message"); }
  },

  togglePinMessage: async (messageId) => {
    try {
      const res = await axiosInstance.put(`/messages/pin/${messageId}`);
      const msgs = get().messages.map((m) => m._id === messageId ? { ...m, isPinned: res.data.isPinned } : m);
      set({ messages: msgs, pinnedMessage: res.data.isPinned ? msgs.find((m) => m._id === messageId) : null });
      toast(res.data.isPinned ? "📌 Message pinned" : "Unpinned", { duration: 1500 });
    } catch { toast.error("Could not pin message"); }
  },

  emitTyping: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    useAuthStore.getState().socket?.emit("typing", { to: selectedUser._id });
  },
  emitStopTyping: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    useAuthStore.getState().socket?.emit("stopTyping", { to: selectedUser._id });
  },

  subscribeToMessages: () => {
    const { selectedUser, isSoundEnabled } = get();
    if (!selectedUser) return;
    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (msg) => {
      if (msg.senderId !== selectedUser._id) {
        set({ unreadCounts: { ...get().unreadCounts, [msg.senderId]: (get().unreadCounts[msg.senderId] || 0) + 1 } });
        return;
      }
      set({ messages: [...get().messages, msg] });
      if (isSoundEnabled) { const s = new Audio("/sounds/notification.mp3"); s.currentTime = 0; s.play().catch(() => {}); }
      get().markMessagesAsRead(msg.senderId);
    });

    socket.on("messageLinkPreview", (updatedMsg) => {
      set({
        messages: get().messages.map((m) =>
          m._id === updatedMsg._id ? { ...m, linkPreview: updatedMsg.linkPreview } : m
        ),
      });
    });

    socket.on("scheduledMessageSent", ({ message }) => {
      const { selectedUser: su } = get();
      if (!su) return;
      const isThisChat =
        (message.senderId === useAuthStore.getState().authUser._id &&
         message.receiverId === su._id) ||
        (message.receiverId === useAuthStore.getState().authUser._id &&
         message.senderId === su._id);
      if (isThisChat) {
        set({ messages: [...get().messages, message] });
      }
      get().getMyChatPartners();
      toast("📅 Scheduled message sent!", { duration: 2000 });
    });

    // Disappear timer changed by partner
    socket.on("disappearTimerChanged", ({ byUserId, seconds }) => {
      if (byUserId === selectedUser._id) {
        // Partner changed timer — show a toast
        const label = seconds === 0 ? "disabled disappearing messages"
          : seconds === 86400 ? "set messages to disappear in 24 hours"
          : `set a disappear timer`;
        toast(`⏱ ${selectedUser.fullName} ${label}`, { duration: 3000 });
      }
    });

    socket.on("messagesRead", ({ by }) => {
      if (by !== selectedUser._id) return;
      set({ messages: get().messages.map((m) => m.receiverId === by && !m.isRead ? { ...m, isRead: true } : m) });
    });

    socket.on("messageReaction", ({ messageId, reactions }) => {
      set({ messages: get().messages.map((m) => m._id === messageId ? { ...m, reactions } : m) });
    });

    socket.on("messageDeleted", ({ messageId, deletedForAll }) => {
      if (deletedForAll) {
        set({ messages: get().messages.map((m) => m._id === messageId ? { ...m, isDeletedForAll: true, text: null, image: null, audio: null } : m) });
      } else {
        set({ messages: get().messages.filter((m) => m._id !== messageId) });
      }
    });

    socket.on("messagePinned", ({ messageId, isPinned }) => {
      const msgs = get().messages.map((m) => m._id === messageId ? { ...m, isPinned } : m);
      set({ messages: msgs, pinnedMessage: isPinned ? msgs.find((m) => m._id === messageId) : null });
    });

    socket.on("userLastSeen", ({ userId, lastSeen }) => {
      set({ lastSeenMap: { ...get().lastSeenMap, [userId]: lastSeen } });
    });

    socket.on("userTyping",        ({ from }) => { if (from !== selectedUser._id) return; set({ typingUsers: { ...get().typingUsers, [from]: true } }); });
    socket.on("userStoppedTyping", ({ from }) => { const n = { ...get().typingUsers }; delete n[from]; set({ typingUsers: n }); });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    [
      "newMessage","messageLinkPreview","scheduledMessageSent","disappearTimerChanged",
      "messagesRead","messageReaction","messageDeleted","messagePinned",
      "userLastSeen","userTyping","userStoppedTyping",
    ].forEach((ev) => socket?.off(ev));
  },
}));
