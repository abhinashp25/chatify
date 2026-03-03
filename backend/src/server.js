import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";

import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
// import { connect } from "http2";
import { connectDB } from "./lib/db.js";
import { ENV } from "./lib/env.js";

const app = express();

// ✅correct way to create __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = ENV.PORT || 3000;

app.use(express.json());  //REquest body parsing middleware
app.use(cors({origin: ENV.CLIENT_URL, credentials: true})); //CORS middleware
app.use(cookieParser()); //Cookie parsing middleware

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

console.log("CLIENT_URL:", ENV.CLIENT_URL);

// Make ready for deployment
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (_, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
  connectDB();
});