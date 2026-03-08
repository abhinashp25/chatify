import express from "express";
import { createScheduledMessage, getScheduledMessages, cancelScheduledMessage } from "../controllers/schedule.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();
router.use(arcjetProtection, protectRoute);

router.get("/",              getScheduledMessages);
router.post("/:id",          createScheduledMessage);   
router.delete("/:id/cancel", cancelScheduledMessage);

export default router;
