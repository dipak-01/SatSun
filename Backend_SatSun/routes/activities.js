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

// Instances (registered after catalog to avoid route conflicts)
router.put("/:instanceId", updateActivityInstance);
router.delete("/:instanceId", deleteActivityInstance);
router.post("/:instanceId/complete", toggleCompleteActivity);
router.post("/day/:dayId/instances", addActivityToDay);

export default router;
