import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getMoods,
  setWeekendMood,
  getSuggestions,
} from "../controllers/moodController.js";
import {
  exportImage,
  shareWeekend,
  getSharedWeekend,
} from "../controllers/shareExportController.js";
import {
  getPreferences,
  updatePreferences,
} from "../controllers/preferencesController.js";

const router = Router();

router.get("/moods", getMoods);
router.post("/weekends/mood", requireAuth, setWeekendMood);
router.get("/weekends/suggestions", requireAuth, getSuggestions);

router.post("/weekends/export/image", requireAuth, exportImage);
router.post("/weekends/share", requireAuth, shareWeekend);
router.get("/share/:uuid", getSharedWeekend);

router.get("/user/preferences", requireAuth, getPreferences);
router.put("/user/preferences", requireAuth, updatePreferences);

export default router;
