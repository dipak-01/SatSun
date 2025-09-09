import { Router } from "express";
import authRoutes from "./auth.js";
import weekendRoutes from "./weekends.js";
import dayRoutes from "./days.js";
import activityRoutes from "./activities.js";
import miscRoutes from "./misc.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/weekends", requireAuth, weekendRoutes);
router.use("/days", requireAuth, dayRoutes);
router.use("/activities", requireAuth, activityRoutes);
router.use("/", miscRoutes);

export default router;
