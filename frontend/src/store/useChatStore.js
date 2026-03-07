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
  sidebarSearch:     "",      // ← sidebar contact/chat search
  unreadCounts:      {},

  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },

  setActiveTab:    (tab)  => set({ activeTab: tab }),
  setActiveFilter: (f)    => set({ activeFilter: f }),
  setSelectedUser: (user) => {
    set({ selectedUser: user });
    if (user) set({ unreadCounts: { ...get().unreadCounts, [user._id]: 0 } });
  },
  setSearchQuery:   (q) => set({ searchQuery: q }),
  setSidebarSearch: (q) => set({ sidebarSearch: q }),  // ← explicitly defined

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (e) { toast.error(e.response?.data?.message || "Something went wrong"); }
    finally { set({ isUsersLoading: false }); }
  },

  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
    } catch (e) { toast.error(e.response?.data?.message || "Something went wrong"); }
    finally { set({ isUsersLoading: false }); }
  },

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (e) { toast.error(e.response?.data?.message || "Something went wrong"); }
    finally { set({ isMessagesLoading: false }); }
  },

  sendMessage: async (messageData) => {
    const { selectedUser } = get();
    const { authUser }     = useAuthStore.getState();
    const tempId           = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id, receiverId: selectedUser._id,
      text: messageData.text, image: messageData.image, audio: messageData.audio,
      createdAt: new Date().toISOString(), isOptimistic: true, isRead: false, reactions: [],
    };
    set({ messages: [...get().messages, optimisticMessage] });
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: get().messages.map((m) => m._id === tempId ? res.data : m) });
      const already = get().chats.find((c) => c._id === selectedUser._id);
      if (!already) set({ chats: [selectedUser, ...get().chats] });
    } catch (e) {
      set({ messages: get().messages.filter((m) => m._id !== tempId) });
      toast.error(e.response?.data?.message || "Something went wrong");
    }
  },

  markMessagesAsRead: async (senderId) => {
    try {
      await axiosInstance.put(`/messages/read/${senderId}`);
      set({
        messages: get().messages.map((m) => m.senderId === senderId && !m.isRead ? { ...m, isRead: true } : m),
        unreadCounts: { ...get().unreadCounts, [senderId]: 0 },
      });
    } catch (e) { console.error("markAsRead error:", e); }
  },

  toggleReaction: async (messageId, emoji) => {
    try {
      const res = await axiosInstance.put(`/messages/react/${messageId}`, { emoji });
      set({ messages: get().messages.map((m) => m._id === messageId ? { ...m, reactions: res.data.reactions } : m) });
    } catch (e) { toast.error(e.response?.data?.message || "Could not add reaction"); }
  },

  deleteMessage: async (messageId, deleteForEveryone) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`, { data: { deleteForEveryone } });
      if (deleteForEveryone) {
        set({ messages: get().messages.map((m) =>
          m._id === messageId ? { ...m, isDeletedForAll: true, text: null, image: null } : m
        )});
      } else {
        set({ messages: get().messages.filter((m) => m._id !== messageId) });
      }
    } catch (e) { toast.error(e.response?.data?.message || "Could not delete message"); }
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
    socket.on("messagesRead", ({ by }) => {
      if (by !== selectedUser._id) return;
      set({ messages: get().messages.map((m) => m.receiverId === by && !m.isRead ? { ...m, isRead: true } : m) });
    });
    socket.on("messageReaction", ({ messageId, reactions }) => {
      set({ messages: get().messages.map((m) => m._id === messageId ? { ...m, reactions } : m) });
    });
    socket.on("messageDeleted", ({ messageId, deletedForAll }) => {
      if (deletedForAll) {
        set({ messages: get().messages.map((m) => m._id === messageId ? { ...m, isDeletedForAll: true, text: null, image: null } : m) });
      } else {
        set({ messages: get().messages.filter((m) => m._id !== messageId) });
      }
    });
    socket.on("userTyping",        ({ from }) => { if (from !== selectedUser._id) return; set({ typingUsers: { ...get().typingUsers, [from]: true } }); });
    socket.on("userStoppedTyping", ({ from }) => { const n = { ...get().typingUsers }; delete n[from]; set({ typingUsers: n }); });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    ["newMessage","messagesRead","messageReaction","messageDeleted","userTyping","userStoppedTyping"]
      .forEach((ev) => socket?.off(ev));
  },
}));
