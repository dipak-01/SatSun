import { Router } from "express";
import {
  createWeekend,
  getWeekend,
  updateWeekend,
  deleteWeekend,
  duplicateWeekend,
  listDaysForWeekend,
  addDayToWeekend,
} from "../controllers/weekendController.js";

const router = Router();

router.post("/", createWeekend);
router.get("/:id", getWeekend);
router.put("/:id", updateWeekend);
router.delete("/:id", deleteWeekend);
router.post("/:id/duplicate", duplicateWeekend);

// Days under a weekend
router.get("/:id/days", listDaysForWeekend);
router.post("/:id/days", addDayToWeekend);

export default router;
