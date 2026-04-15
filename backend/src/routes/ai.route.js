import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  sendAIMessage, getSmartReplies,
  analyzeTone, generateDigest, translateMessage,
} from "../controllers/ai.controller.js";

const router = express.Router();
router.use(protectRoute);

router.post("/chat",          sendAIMessage);
router.post("/smart-replies", getSmartReplies);
router.post("/tone",          analyzeTone);
router.post("/digest",        generateDigest);
router.post("/translate",     translateMessage);

export default router;
