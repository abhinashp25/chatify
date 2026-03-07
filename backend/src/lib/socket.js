import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: [ENV.CLIENT_URL], credentials: true },
});

io.use(socketAuthMiddleware);

export function getReceiverSocketId(userId) {
  return userSocketMap[userId.toString()];
}

const userSocketMap = {};

io.on("connection", (socket) => {
  const userId = socket.userId;
  userSocketMap[userId] = socket.id;

  socket.join(`user:${userId}`);

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("joinGroup", (groupId) => {
    socket.join(`group:${groupId}`);
  });

  socket.on("leaveGroup", (groupId) => {
    socket.leave(`group:${groupId}`);
  });

  socket.on("typing", ({ to }) => {
    const receiverSocketId = userSocketMap[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", { from: userId, name: socket.user.fullName });
    }
  });

  socket.on("stopTyping", ({ to }) => {
    const receiverSocketId = userSocketMap[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userStoppedTyping", { from: userId });
    }
  });
  socket.on("groupTyping", ({ groupId }) => {
    socket.to(`group:${groupId}`).emit("groupUserTyping", {
      groupId, from: userId, name: socket.user.fullName,
    });
  });

  socket.on("groupStopTyping", ({ groupId }) => {
    socket.to(`group:${groupId}`).emit("groupUserStoppedTyping", { groupId, from: userId });
  });

  socket.on("disconnect", () => {
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
