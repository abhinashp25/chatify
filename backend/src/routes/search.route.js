import express from "express";
import { globalSearch } from "../controllers/search.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();
router.use(arcjetProtection, protectRoute);

router.get("/", globalSearch);  

export default router;
