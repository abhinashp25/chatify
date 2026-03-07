import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

export const useAIStore = create((set, get) => ({
  aiMessages:   [],   // [{ role: "user"|"assistant", content }]
  isAILoading:  false,
  smartReplies: [],

  clearAI: () => set({ aiMessages: [], smartReplies: [] }),

  sendAIMessage: async (userText) => {
    if (!userText.trim()) return;

    const newMsg = { role: "user", content: userText, id: Date.now() };
    const history = [...get().aiMessages, newMsg];
    set({ aiMessages: history, isAILoading: true, smartReplies: [] });

    try {
      const res = await axiosInstance.post("/ai/chat", {
        messages: history.map(({ role, content }) => ({ role, content })),
      });
      const aiMsg = { role: "assistant", content: res.data.reply, id: Date.now() + 1 };
      set({ aiMessages: [...get().aiMessages, aiMsg] });
    } catch (e) {
      const errText = e?.response?.data?.message || "Unknown error";
      const errMsg = {
        role: "assistant",
        content: `⚠️ ${errText}`,
        id: Date.now() + 1,
      };
      set({ aiMessages: [...get().aiMessages, errMsg] });
    } finally {
      set({ isAILoading: false });
    }
  },

  fetchSmartReplies: async (lastMessage) => {
    if (!lastMessage?.trim()) return;
    try {
      const res = await axiosInstance.post("/ai/smart-replies", { lastMessage });
      set({ smartReplies: res.data.suggestions || [] });
    } catch {
      set({ smartReplies: ["👍", "Thanks!", "Sure!", "Got it!"] });
    }
  },

  clearSmartReplies: () => set({ smartReplies: [] }),
}));
