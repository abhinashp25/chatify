import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createGroup, getMyGroups, getGroupMessages,
  sendGroupMessage, addMember, removeMember, leaveGroup,
} from "../controllers/group.controller.js";

const router = express.Router();
router.use(protectRoute);

router.post("/",               createGroup);
router.get("/",                getMyGroups);
router.get("/:groupId/messages", getGroupMessages);
router.post("/:groupId/messages", sendGroupMessage);
router.post("/:groupId/members",  addMember);
router.delete("/:groupId/members/:userId", removeMember);
router.post("/:groupId/leave",    leaveGroup);

export default router;
