import { Router } from "express";
import {
  convertQuotation,
  createQuotation,
  deleteQuotation,
  getQuotation,
  listQuotations,
  patchStatus,
  quotationPdf,
  updateQuotation,
} from "../controllers/quotationController.js";
import { protect } from "../middleware/auth.js";

const router = Router();
router.use(protect);
router.get("/", listQuotations);
router.post("/", createQuotation);
router.get("/:id/pdf", quotationPdf);
router.patch("/:id/status", patchStatus);
router.post("/:id/convert", convertQuotation);
router.get("/:id", getQuotation);
router.put("/:id", updateQuotation);
router.delete("/:id", deleteQuotation);
export default router;
