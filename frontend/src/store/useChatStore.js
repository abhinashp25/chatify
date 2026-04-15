import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  allContacts:       [],
  chats:             [],
  messages:          [],
  hasMoreMessages:   false,
  isLoadingMore:     false,
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
  favourites:        JSON.parse(localStorage.getItem("chatify-favourites")) || [],
  offlineQueue:      JSON.parse(localStorage.getItem("chatify-offline-queue")) || [],
  blockedUsers:      [],

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

  toggleFavourite: (id) => {
    const isFav = get().favourites.includes(id);
    const updated = isFav
      ? get().favourites.filter(f => f !== id)
      : [...get().favourites, id];
    localStorage.setItem("chatify-favourites", JSON.stringify(updated));
    set({ favourites: updated });
    toast(isFav ? "Removed from favourites" : "Added to favourites", { duration: 1500 });
  },

  clearChat: async (userId) => {
    try {
      await axiosInstance.delete(`/messages/clear/${userId}`);
      set({ messages: [] });
      set({ chats: get().chats.filter(c => c._id !== userId) });
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not clear chat");
    }
  },

  markChatArchived: (userId, archived) => {
    set({ chats: get().chats.map(c => c._id === userId ? { ...c, isArchived: archived } : c) });
  },

  // -- Blocking --
  fetchBlockedUsers: async () => {
    try {
      const res = await axiosInstance.get("/messages/blocked");
      set({ blockedUsers: res.data });
    } catch { /* silent */ }
  },

  blockUser: async (userId) => {
    try {
      await axiosInstance.post(`/messages/block/${userId}`);
      const user = await axiosInstance.get("/messages/blocked");
      set({ blockedUsers: user.data });
      toast.success("User blocked");
    } catch {
      toast.error("Could not block user");
    }
  },

  unblockUser: async (userId) => {
    try {
      await axiosInstance.delete(`/messages/block/${userId}`);
      set({ blockedUsers: get().blockedUsers.filter(u => u._id !== userId) });
      toast.success("User unblocked");
    } catch {
      toast.error("Could not unblock user");
    }
  },

  isUserBlocked: (userId) => get().blockedUsers.some(u => u._id === userId),

  // -- Contacts & Chats --
  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (e) {
      toast.error(e.response?.data?.message || "Error");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      const serverUnread = {};
      res.data.forEach(c => { if (c.unreadCount > 0) serverUnread[c._id] = c.unreadCount; });
      set({ chats: res.data, unreadCounts: { ...serverUnread, ...get().unreadCounts } });
    } catch (e) {
      toast.error(e.response?.data?.message || "Error");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // -- Messages with pagination --
  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true, hasMoreMessages: false });
    try {
      const res = await axiosInstance.get(`/messages/${userId}?limit=40`);
      set({
        messages: res.data.messages || [],
        hasMoreMessages: res.data.hasMore,
      });
      const pinned = res.data.messages.find(m => m.isPinned && !m.isDeletedForAll);
      set({ pinnedMessage: pinned || null });

      try {
        const d = await axiosInstance.get(`/disappear/${userId}`);
        set({ disappearSeconds: d.data.seconds || 0 });
      } catch { set({ disappearSeconds: 0 }); }
    } catch (e) {
      toast.error(e.response?.data?.message || "Error");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  loadMoreMessages: async () => {
    const { messages, selectedUser, hasMoreMessages, isLoadingMore } = get();
    if (!selectedUser || !hasMoreMessages || isLoadingMore) return;

    const oldest = messages[0];
    if (!oldest) return;
    set({ isLoadingMore: true });

    try {
      const res = await axiosInstance.get(`/messages/${selectedUser._id}?before=${oldest._id}&limit=40`);
      set({
        messages:        [...res.data.messages, ...messages],
        hasMoreMessages: res.data.hasMore,
        isLoadingMore:   false,
      });
    } catch {
      set({ isLoadingMore: false });
    }
  },

  // -- Offline queue --
  processOfflineQueue: async () => {
    const queue = get().offlineQueue;
    if (!queue.length || !window.navigator.onLine) return;
    toast.success(`Sending ${queue.length} queued message${queue.length > 1 ? "s" : ""}...`);
    for (const item of queue) {
      try {
        await axiosInstance.post(`/messages/send/${item.receiverId}`, item.payload);
      } catch (e) {
        console.error("Failed to send queued message", e);
      }
    }
    set({ offlineQueue: [] });
    localStorage.removeItem("chatify-offline-queue");
    get().getMyChatPartners();
    if (get().selectedUser) get().getMessagesByUserId(get().selectedUser._id);
  },

  sendMessage: async (messageData) => {
    const { selectedUser, replyingTo } = get();
    const { authUser } = useAuthStore.getState();
    const tempId = `temp-${Date.now()}`;
    const payload = { ...messageData, replyTo: replyingTo || undefined };

    const optimistic = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      audio: messageData.audio,
      replyTo: replyingTo || undefined,
      isForwarded: messageData.isForwarded || false,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      isRead: false,
      reactions: [],
    };

    set({ messages: [...(get().messages || []), optimistic], replyingTo: null });

    if (!window.navigator.onLine) {
      const newQueue = [...get().offlineQueue, { receiverId: selectedUser._id, payload }];
      set({ offlineQueue: newQueue });
      localStorage.setItem("chatify-offline-queue", JSON.stringify(newQueue));
      set({ messages: (get().messages || []).map(m => m._id === tempId ? { ...m, isPendingList: true } : m) });
      toast("Offline — message queued", { icon: "⏳" });
      return;
    }

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, payload);
      set({ messages: (get().messages || []).map(m => m._id === tempId ? res.data : m) });
      get().getMyChatPartners();
    } catch (e) {
      set({ messages: (get().messages || []).filter(m => m._id !== tempId) });
      toast.error(e.response?.data?.message || "Send failed");
    }
  },

  markMessagesAsRead: async (senderId) => {
    try {
      await axiosInstance.put(`/messages/read/${senderId}`);
      set({
        messages: (get().messages || []).map(m =>
          m.senderId === senderId && !m.isRead ? { ...m, isRead: true } : m
        ),
        unreadCounts: { ...get().unreadCounts, [senderId]: 0 },
      });
    } catch (e) {
      console.warn("Failed to mark read:", e);
    }
  },

  toggleReaction: async (messageId, emoji) => {
    try {
      const res = await axiosInstance.put(`/messages/react/${messageId}`, { emoji });
      set({ messages: (get().messages || []).map(m => m._id === messageId ? { ...m, reactions: res.data.reactions } : m) });
    } catch {
      toast.error("Could not react");
    }
  },

  deleteMessage: async (messageId, deleteForEveryone) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`, { data: { deleteForEveryone } });
      if (deleteForEveryone) {
        set({
          messages: (get().messages || []).map(m =>
            m._id === messageId ? { ...m, isDeletedForAll: true, text: null, image: null, audio: null } : m
          ),
        });
      } else {
        set({ messages: (get().messages || []).filter(m => m._id !== messageId) });
      }
    } catch {
      toast.error("Could not delete");
    }
  },

  editMessage: async (messageId, text) => {
    try {
      const res = await axiosInstance.patch(`/messages/${messageId}`, { text });
      set({
        messages: (get().messages || []).map(m =>
          m._id === messageId ? { ...m, text: res.data.text, editedAt: res.data.editedAt } : m
        ),
      });
    } catch {
      toast.error("Could not edit message");
    }
  },

  toggleStarMessage: async (messageId) => {
    try {
      const res = await axiosInstance.put(`/messages/star/${messageId}`);
      set({ messages: (get().messages || []).map(m => m._id === messageId ? { ...m, _starred: res.data.starred } : m) });
      toast(res.data.starred ? "⭐ Message starred" : "Unstarred", { duration: 1500 });
    } catch {
      toast.error("Could not star message");
    }
  },

  togglePinMessage: async (messageId) => {
    try {
      const res = await axiosInstance.put(`/messages/pin/${messageId}`);
      const msgs = (get().messages || []).map(m => m._id === messageId ? { ...m, isPinned: res.data.isPinned } : m);
      set({ messages: msgs, pinnedMessage: res.data.isPinned ? msgs.find(m => m._id === messageId) : null });
      toast(res.data.isPinned ? "📌 Message pinned" : "Unpinned", { duration: 1500 });
    } catch {
      toast.error("Could not pin message");
    }
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
      set({ messages: [...(get().messages || []), msg] });
      if (isSoundEnabled) { const s = new Audio("/sounds/notification.mp3"); s.currentTime = 0; s.play().catch(() => {}); }
      get().markMessagesAsRead(msg.senderId);
    });

    socket.on("messageLinkPreview", (updatedMsg) => {
      set({
        messages: (get().messages || []).map(m =>
          m._id === updatedMsg._id ? { ...m, linkPreview: updatedMsg.linkPreview } : m
        ),
      });
    });

    socket.on("scheduledMessageSent", ({ message }) => {
      const { selectedUser: su } = get();
      if (!su) return;
      const isThisChat =
        (message.senderId === useAuthStore.getState().authUser._id && message.receiverId === su._id) ||
        (message.receiverId === useAuthStore.getState().authUser._id && message.senderId === su._id);
      if (isThisChat) set({ messages: [...(get().messages || []), message] });
      get().getMyChatPartners();
      toast("📅 Scheduled message sent!", { duration: 2000 });
    });

    socket.on("messageEdited", ({ messageId, text, editedAt }) => {
      set({
        messages: (get().messages || []).map(m =>
          m._id === messageId ? { ...m, text, editedAt } : m
        ),
      });
    });

    socket.on("disappearTimerChanged", ({ byUserId, seconds }) => {
      if (byUserId === selectedUser._id) {
        const label = seconds === 0 ? "disabled disappearing messages"
          : seconds === 86400 ? "set messages to disappear in 24 hours"
          : "set a disappear timer";
        toast(`⏱ ${selectedUser.fullName} ${label}`, { duration: 3000 });
      }
    });

    socket.on("messagesRead", ({ by }) => {
      if (by !== selectedUser._id) return;
      set({ messages: (get().messages || []).map(m => m.receiverId === by && !m.isRead ? { ...m, isRead: true } : m) });
    });

    socket.on("messageReaction", ({ messageId, reactions }) => {
      set({ messages: (get().messages || []).map(m => m._id === messageId ? { ...m, reactions } : m) });
    });

    socket.on("messageDeleted", ({ messageId, deletedForAll }) => {
      if (deletedForAll) {
        set({
          messages: (get().messages || []).map(m =>
            m._id === messageId ? { ...m, isDeletedForAll: true, text: null, image: null, audio: null } : m
          ),
        });
      } else {
        set({ messages: (get().messages || []).filter(m => m._id !== messageId) });
      }
    });

    socket.on("messagePinned", ({ messageId, isPinned }) => {
      const msgs = (get().messages || []).map(m => m._id === messageId ? { ...m, isPinned } : m);
      set({ messages: msgs, pinnedMessage: isPinned ? msgs.find(m => m._id === messageId) : null });
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
      "newMessage", "messageLinkPreview", "scheduledMessageSent", "messageEdited",
      "disappearTimerChanged", "messagesRead", "messageReaction", "messageDeleted",
      "messagePinned", "userLastSeen", "userTyping", "userStoppedTyping",
    ].forEach(ev => socket?.off(ev));
  },
}));
