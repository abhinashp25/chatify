import express from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import path from "path";
import cors from "cors";

import authRoutes      from "./routes/auth.route.js";
import messageRoutes   from "./routes/message.route.js";
import groupRoutes     from "./routes/group.route.js";
import aiRoutes        from "./routes/ai.route.js";
import scheduleRoutes  from "./routes/schedule.route.js";
import disappearRoutes from "./routes/disappear.route.js";
import searchRoutes    from "./routes/search.route.js";

import { connectDB } from "./lib/db.js";
import { ENV }       from "./lib/env.js";
import { app, server } from "./lib/socket.js";
import { startScheduler } from "./controllers/schedule.controller.js";

const __dirname = path.resolve();
const PORT = ENV.PORT || 3000;

app.use(express.json({ limit: "10mb" }));
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(cookieParser());

app.use("/api/auth",      authRoutes);
app.use("/api/messages",  messageRoutes);
app.use("/api/groups",    groupRoutes);
app.use("/api/ai",        aiRoutes);
app.use("/api/scheduled", scheduleRoutes);
app.use("/api/disappear", disappearRoutes);
app.use("/api/search",    searchRoutes);

if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("*", (_, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

mongoose.connection.once("open", () => {
  startScheduler();
});

server.listen(PORT, () => {
  console.log("Server running on port: " + PORT);
  connectDB();
});
