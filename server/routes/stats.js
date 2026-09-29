import { Router } from "express";
import { stats } from "../controllers/statsController.js";
import { protect } from "../middleware/auth.js";

const router = Router();
router.get("/", protect, stats);
export default router;
