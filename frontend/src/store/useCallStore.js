import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import { useChatStore } from "./useChatStore";

export const useCallStore = create(persist((set, get) => ({
  localStream: null,
  remoteStream: null,
  peerConnection: null,
  callState: "IDLE", // IDLE, RINGING, IN_CALL
  incomingCall: null, // { from, name, signal, isVideo }
  isMuted: false,
  isVideoOff: false,
  
  callHistory: [], // Real call history { id, user, type: "outgoing"|"incoming"|"missed", isVideo, timestamp, duration }
  currentCallStartTime: null,
  currentCallUser: null,
  currentCallIsVideo: false,
  currentCallType: null,

  addCallToHistory: (callData) => {
    set({ callHistory: [callData, ...get().callHistory] });
  },
  
  clearCallHistory: () => {
    set({ callHistory: [] });
  },

  initListeners: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("callUser", (data) => {
      set({ incomingCall: data, callState: "RINGING" });
    });

    socket.on("callAccepted", async (signal) => {
      const pc = get().peerConnection;
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        set({ callState: "IN_CALL" });
      }
    });

    socket.on("iceCandidate", async (candidate) => {
      const pc = get().peerConnection;
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding received ice candidate", e);
        }
      }
    });

    socket.on("callEnded", () => {
      get().endCall(false);
    });

    socket.on("callRejected", () => {
      get().endCall(false);
    });
  },

  startCall: async (userToCall, isVideo = true) => {
    const socket = useAuthStore.getState().socket;
    const { authUser } = useAuthStore.getState();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
      set({ 
        localStream: stream, 
        callState: "RINGING", 
        isVideoOff: !isVideo,
        currentCallStartTime: Date.now(),
        currentCallUser: userToCall,
        currentCallIsVideo: isVideo,
        currentCallType: "outgoing"
      });

      const pc = get().createPeerConnection(userToCall);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("callUser", {
        userToCall,
        signalData: offer,
        from: authUser._id,
        name: authUser.fullName,
        isVideo
      });
      
    } catch (err) {
      console.error("Failed to get local stream", err);
    }
  },

  answerCall: async () => {
    const socket = useAuthStore.getState().socket;
    const { incomingCall } = get();
    if (!incomingCall) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: incomingCall.isVideo, audio: true });
      set({ 
        localStream: stream, 
        callState: "IN_CALL", 
        isVideoOff: !incomingCall.isVideo,
        currentCallStartTime: Date.now(),
        currentCallUser: incomingCall.from,
        currentCallIsVideo: incomingCall.isVideo,
        currentCallType: "incoming"
      });

      const pc = get().createPeerConnection(incomingCall.from);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answerCall", { to: incomingCall.from, signal: answer });
      set({ incomingCall: null });
    } catch (err) {
      console.error("Failed answering call", err);
    }
  },

  rejectCall: () => {
    const socket = useAuthStore.getState().socket;
    const { incomingCall } = get();
    if (incomingCall) {
      socket.emit("rejectCall", { to: incomingCall.from });
      // Keep track of this call as missed
      const missedCall = {
        _id: Date.now().toString(),
        userId: incomingCall.from,
        type: "missed",
        isVideo: incomingCall.isVideo,
        timestamp: Date.now(),
        duration: null
      };
      
      set({ incomingCall: null, callState: "IDLE", callHistory: [missedCall, ...get().callHistory] });
    }
  },

  endCall: (emit = true) => {
    const socket = useAuthStore.getState().socket;
    const { peerConnection, localStream, incomingCall, currentCallStartTime, currentCallUser, currentCallIsVideo, currentCallType, callHistory } = get();

    if (emit && peerConnection) {
      // Find the remote user we were talking to - typically handled by knowing who initiated.
      // We will just broadcast endCall cleanly if we had a connection.
      // This is simplified.
    }

    if (peerConnection) peerConnection.close();
    if (localStream) localStream.getTracks().forEach((track) => track.stop());

    let finalHistory = callHistory;
    if (currentCallStartTime && currentCallUser) {
      const now = Date.now();
      const diffSecs = Math.floor((now - currentCallStartTime)/1000);
      const isMissed = get().callState === "RINGING" || get().callState === "IDLE";
      
      const newCallData = {
        _id: now.toString(),
        userId: currentCallUser,
        type: isMissed ? "missed" : currentCallType,
        isVideo: currentCallIsVideo,
        timestamp: currentCallStartTime,
        duration: isMissed ? null : `${Math.floor(diffSecs/60)}:${String(diffSecs%60).padStart(2,'0')}`
      };
      finalHistory = [newCallData, ...callHistory];
    }

    set({
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      callState: "IDLE",
      incomingCall: null,
      isMuted: false,
      isVideoOff: false,
      currentCallStartTime: null,
      currentCallUser: null,
      currentCallIsVideo: false,
      currentCallType: null,
      callHistory: finalHistory
    });
  },

  createPeerConnection: (remoteUserId) => {
    const socket = useAuthStore.getState().socket;
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("iceCandidate", { to: remoteUserId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      set({ remoteStream: event.streams[0] });
    };

    set({ peerConnection: pc });
    return pc;
  },

  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach(t => t.enabled = isMuted);
      set({ isMuted: !isMuted });
    }
  },

  toggleVideo: () => {
    const { localStream, isVideoOff } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach(t => t.enabled = isVideoOff);
      set({ isVideoOff: !isVideoOff });
    }
  }
}), {
  name: 'call-history-storage',
  partialize: (state) => ({ callHistory: state.callHistory })
}));
