import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { sendAIMessage, getSmartReplies } from "../controllers/ai.controller.js";

const router = express.Router();
router.use(protectRoute);

router.post("/chat",         sendAIMessage);
router.post("/smart-replies", getSmartReplies);

export default router;
