import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import {
  requestNotificationPermission,
  subscribeToNotifications,
} from "../hooks/usePushNotifications";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000" : "/";

export const useAuthStore = create((set, get) => ({
  authUser:         null,
  isCheckingAuth:   true,
  isSigningUp:      false,
  isLoggingIn:      false,
  isUpdatingProfile: false,
  socket:           null,
  onlineUsers:      [],
  _contactsCache:   {},

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch {
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      await axiosInstance.post("/auth/signup", data);
      toast.success("Account created! Please login.");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);

      // 2FA — server needs OTP before issuing cookie
      if (res.data.requiresOTP) {
        set({ isLoggingIn: false });
        return { requiresOTP: true, userId: res.data.userId };
      }

      set({ authUser: res.data });
      toast.success("Logged in successfully");
      get().connectSocket();
      return { requiresOTP: false };
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  verify2FA: async (userId, otp) => {
    try {
      const res = await axiosInstance.post("/auth/2fa/verify", { userId, otp });
      set({ authUser: res.data });
      toast.success("Verified! Welcome back.");
      get().connectSocket();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid code");
      return false;
    }
  },

  toggle2FA: async (password) => {
    try {
      const res = await axiosInstance.post("/auth/2fa/toggle", { password });
      set({ authUser: { ...get().authUser, twoFA: { ...get().authUser?.twoFA, enabled: res.data.enabled } } });
      toast.success(res.data.enabled ? "Two-factor auth enabled" : "Two-factor auth disabled");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to toggle 2FA");
      return false;
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch {
      toast.error("Error logging out");
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  updatePrivacy: async (updates) => {
    try {
      const res = await axiosInstance.patch("/auth/privacy", updates);
      set({ authUser: res.data });
    } catch (error) {
      toast.error("Could not save privacy settings");
      throw error;
    }
  },

  cacheContact: (userId, name) => {
    set({ _contactsCache: { ...get()._contactsCache, [userId]: name } });
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, { withCredentials: true });
    socket.connect();
    set({ socket });
    socket.on("getOnlineUsers", (userIds) => set({ onlineUsers: userIds }));
    requestNotificationPermission();
    subscribeToNotifications(socket, (senderId) => get()._contactsCache[senderId]);
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
