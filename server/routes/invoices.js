import { Router } from "express";
import { addPayment, exportInvoicesCsv, getInvoice, invoicePdf, listInvoices } from "../controllers/invoiceController.js";
import { protect } from "../middleware/auth.js";

const router = Router();
router.use(protect);
router.get("/", listInvoices);
router.get("/export/csv", exportInvoicesCsv);
router.get("/:id/pdf", invoicePdf);
router.post("/:id/payments", addPayment);
router.get("/:id", getInvoice);
export default router;
