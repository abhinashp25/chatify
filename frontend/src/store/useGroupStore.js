import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

export const useGroupStore = create((set, get) => ({
  groups:           [],
  selectedGroup:    null,
  groupMessages:    {},   // { groupId: [messages] }
  isGroupsLoading:  false,
  isMsgLoading:     false,
  groupTypingUsers: {},   // { groupId: { userId: name } }

  setSelectedGroup: (group) => set({ selectedGroup: group }),

  fetchGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data });
      // Join socket rooms
      const socket = useAuthStore.getState().socket;
      res.data.forEach((g) => socket?.emit("joinGroup", g._id));
    } catch (e) {
      toast.error("Could not load groups");
    } finally { set({ isGroupsLoading: false }); }
  },

  fetchGroupMessages: async (groupId) => {
    set({ isMsgLoading: true });
    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages`);
      set({ groupMessages: { ...get().groupMessages, [groupId]: res.data } });
    } catch (e) {
      toast.error("Could not load messages");
    } finally { set({ isMsgLoading: false }); }
  },

  sendGroupMessage: async (groupId, data) => {
    const { authUser } = useAuthStore.getState();
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      _id: tempId, groupId, senderId: authUser, isOptimistic: true,
      text: data.text, image: data.image, audio: data.audio,
      createdAt: new Date().toISOString(), reactions: [],
    };
    const cur = get().groupMessages[groupId] || [];
    set({ groupMessages: { ...get().groupMessages, [groupId]: [...cur, optimistic] } });

    try {
      const res = await axiosInstance.post(`/groups/${groupId}/messages`, data);
      const msgs = (get().groupMessages[groupId] || []).map((m) =>
        m._id === tempId ? res.data : m
      );
      set({ groupMessages: { ...get().groupMessages, [groupId]: msgs } });
    } catch (e) {
      const msgs = (get().groupMessages[groupId] || []).filter((m) => m._id !== tempId);
      set({ groupMessages: { ...get().groupMessages, [groupId]: msgs } });
      toast.error("Could not send message");
    }
  },

  createGroup: async (data) => {
    try {
      const res = await axiosInstance.post("/groups", data);
      set({ groups: [res.data, ...get().groups] });
      useAuthStore.getState().socket?.emit("joinGroup", res.data._id);
      toast.success(`Group "${res.data.name}" created! 🎉`);
      return res.data;
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not create group");
    }
  },

  leaveGroup: async (groupId) => {
    try {
      await axiosInstance.post(`/groups/${groupId}/leave`);
      set({ groups: get().groups.filter((g) => g._id !== groupId) });
      if (get().selectedGroup?._id === groupId) set({ selectedGroup: null });
      useAuthStore.getState().socket?.emit("leaveGroup", groupId);
      toast.success("Left group");
    } catch (e) { toast.error("Could not leave group"); }
  },

  emitGroupTyping: (groupId) => {
    useAuthStore.getState().socket?.emit("groupTyping", { groupId });
  },
  emitGroupStopTyping: (groupId) => {
    useAuthStore.getState().socket?.emit("groupStopTyping", { groupId });
  },

  subscribeToGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newGroupMessage", (msg) => {
      const groupId = msg.groupId;
      const cur = get().groupMessages[groupId] || [];
      set({ groupMessages: { ...get().groupMessages, [groupId]: [...cur, msg] } });
      // Update group's last message in list
      set({
        groups: get().groups.map((g) =>
          g._id === groupId
            ? { ...g, lastMessage: msg.text || "📷", lastMessageAt: msg.createdAt }
            : g
        ),
      });
    });

    socket.on("groupCreated", (group) => {
      const already = get().groups.find((g) => g._id === group._id);
      if (!already) set({ groups: [group, ...get().groups] });
      socket.emit("joinGroup", group._id);
    });

    socket.on("groupUpdated", (group) => {
      set({ groups: get().groups.map((g) => g._id === group._id ? group : g) });
      if (get().selectedGroup?._id === group._id) set({ selectedGroup: group });
    });

    socket.on("groupUserTyping", ({ groupId, from, name }) => {
      const cur = get().groupTypingUsers[groupId] || {};
      set({ groupTypingUsers: { ...get().groupTypingUsers, [groupId]: { ...cur, [from]: name } } });
    });

    socket.on("groupUserStoppedTyping", ({ groupId, from }) => {
      const cur = { ...(get().groupTypingUsers[groupId] || {}) };
      delete cur[from];
      set({ groupTypingUsers: { ...get().groupTypingUsers, [groupId]: cur } });
    });
  },

  unsubscribeFromGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    ["newGroupMessage","groupCreated","groupUpdated","groupUserTyping","groupUserStoppedTyping"]
      .forEach((ev) => socket?.off(ev));
  },
}));
