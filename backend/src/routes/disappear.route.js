import express from "express";
import { setDisappearTimer, getDisappearTimer } from "../controllers/disappear.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();
router.use(arcjetProtection, protectRoute);

router.get("/:partnerId",  getDisappearTimer);
router.put("/:partnerId",  setDisappearTimer);

export default router;
