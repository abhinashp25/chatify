import express from "express";
import {
  createGroup, getMyGroups, getGroupMessages, sendGroupMessage,
  addMember, removeMember, leaveGroup,
  markGroupMessagesRead, getMessageReadBy,
} from "../controllers/group.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();
router.use(arcjetProtection, protectRoute);

router.post("/",                                createGroup);
router.get("/",                                 getMyGroups);
router.get("/:groupId/messages",                getGroupMessages);
router.post("/:groupId/messages",               sendGroupMessage);
router.put("/:groupId/read",                    markGroupMessagesRead);
router.get("/:groupId/messages/:messageId/read",getMessageReadBy);
router.post("/:groupId/members",                addMember);
router.delete("/:groupId/members/:userId",      removeMember);
router.post("/:groupId/leave",                  leaveGroup);

export default router;
