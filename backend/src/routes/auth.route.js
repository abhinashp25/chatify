import express from "express";
import {
  signup, login, logout, updateProfile,
  updatePrivacy, toggle2FA, verify2FALogin,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();
router.use(arcjetProtection);

router.post("/signup",         signup);
router.post("/login",          login);
router.post("/logout",         logout);
router.post("/2fa/verify",     verify2FALogin);
router.post("/2fa/toggle",     protectRoute, toggle2FA);
router.put("/update-profile",  protectRoute, updateProfile);
router.patch("/privacy",       protectRoute, updatePrivacy);
router.get("/check",           protectRoute, (req, res) => res.status(200).json(req.user));

export default router;
