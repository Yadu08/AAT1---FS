import { Router } from "express";
import { getCompany } from "../config/company.js";
import { protect } from "../middleware/auth.js";

const router = Router();
router.get("/", protect, (req, res) => res.json(getCompany()));
export default router;
