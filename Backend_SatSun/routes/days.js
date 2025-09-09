import { Router } from "express";
import { updateDay, deleteDay } from "../controllers/dayController.js";
import { addActivityToDay } from "../controllers/activityController.js";

const router = Router();

router.put("/:dayId", updateDay);
router.delete("/:dayId", deleteDay);
router.post("/:dayId/activities", addActivityToDay);

export default router;
