import { Router } from "express";
import {
  updateActivityInstance,
  deleteActivityInstance,
  toggleCompleteActivity,
  catalogList,
  catalogGet,
  catalogCreate,
  catalogUpdate,
  catalogDelete,
} from "../controllers/activityController.js";

const router = Router();

router.put("/:instanceId", updateActivityInstance);
router.delete("/:instanceId", deleteActivityInstance);
router.post("/:instanceId/complete", toggleCompleteActivity);

// Catalog
router.get("/", catalogList);
router.get("/:id", catalogGet);
router.post("/", catalogCreate);
router.put("/:id", catalogUpdate);
router.delete("/:id", catalogDelete);

export default router;
