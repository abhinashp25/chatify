import express from "express";
import {
  deleteMessage, getAllContacts, getChatPartners,
  getMessagesByUserId, markMessagesAsRead, sendMessage,
  toggleReaction, toggleArchiveChat, getArchivedChats,
  toggleStarMessage, getStarredMessages, togglePinMessage,
  clearChat, editMessage, blockUser, unblockUser, getBlockedUsers,
  searchGifs,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();
router.use(arcjetProtection, protectRoute);

// read-only
router.get("/contacts",            getAllContacts);
router.get("/chats",               getChatPartners);
router.get("/archived",            getArchivedChats);
router.get("/starred",             getStarredMessages);
router.get("/blocked",             getBlockedUsers);
router.get("/gifs",                searchGifs);
router.get("/:id",                 getMessagesByUserId);

// writes
router.post("/send/:id",           sendMessage);
router.patch("/:id",               editMessage);
router.put("/read/:id",            markMessagesAsRead);
router.put("/react/:id",           toggleReaction);
router.put("/star/:id",            toggleStarMessage);
router.put("/pin/:id",             togglePinMessage);
router.put("/archive/:partnerId",  toggleArchiveChat);
router.post("/block/:userId",      blockUser);
router.delete("/block/:userId",    unblockUser);
router.delete("/clear/:userId",    clearChat);
router.delete("/:id",             deleteMessage);

export default router;
