import { Router } from "express";
import {
  catalogList,
  catalogGet,
  catalogCreate,
  catalogUpdate,
  catalogDelete,
  updateActivityInstance,
  deleteActivityInstance,
  toggleCompleteActivity,
  addActivityToDay,
} from "../controllers/activityController.js";

const router = Router();

// Catalog
router.get("/", catalogList);
router.get("/:id", catalogGet);
router.post("/", catalogCreate);
router.put("/:id", catalogUpdate);
router.delete("/:id", catalogDelete);

// Instances (use distinct prefix to avoid conflicts with catalog :id)
router.put("/instances/:instanceId", updateActivityInstance);
router.delete("/instances/:instanceId", deleteActivityInstance);
router.post("/instances/:instanceId/complete", toggleCompleteActivity);
router.post("/day/:dayId/instances", addActivityToDay);

export default router;
