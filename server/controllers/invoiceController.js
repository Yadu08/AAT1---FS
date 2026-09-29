import Invoice from "../models/Invoice.js";
import { asyncHandler, httpError } from "../middleware/error.js";
import { invoiceStatus, isOverdue, paidTotal, round2 } from "../utils/totals.js";
import { sendInvoicePdf } from "../utils/pdf.js";

const MODES = ["upi", "bank", "cash", "card", "cheque"];

export const listInvoices = asyncHandler(async (req, res) => {
  const rows = await Invoice.find()
    .populate("client", "name email")
    .populate("quotation", "number")
    .sort({ createdAt: -1 });
  res.json(rows);
});

export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate("client")
    .populate("quotation", "number");
  if (!invoice) throw httpError(404, "Invoice not found");
  res.json(invoice);
});

export const addPayment = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) throw httpError(404, "Invoice not found");
  const amount = round2(Number(req.body.amount));
  if (!Number.isFinite(amount) || amount <= 0) throw httpError(400, "Enter an amount greater than zero");
  const mode = req.body.mode || "bank";
  if (!MODES.includes(mode)) throw httpError(400, "Unknown payment mode");
  const due = round2(invoice.total - paidTotal(invoice.payments));
  if (amount - due > 0.01) throw httpError(400, "That payment is larger than the balance due");
  invoice.payments.push({
    amount,
    date: req.body.date ? new Date(req.body.date) : new Date(),
    mode,
  });
  invoice.status = invoiceStatus(invoice.total, invoice.payments);
  await invoice.save();
  await invoice.populate([
    { path: "client" },
    { path: "quotation", select: "number" },
  ]);
  res.json(invoice);
});

export const invoicePdf = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate("client");
  if (!invoice) throw httpError(404, "Invoice not found");
  sendInvoicePdf(res, invoice);
});

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Download every invoice as a CSV file (for accounts and GST filing). */
export const exportInvoicesCsv = asyncHandler(async (req, res) => {
  const rows = await Invoice.find().populate("client", "name").populate("quotation", "number").sort({ createdAt: 1 });
  const head = ["Invoice", "Client", "Quotation", "Issued", "Due", "Subtotal", "GST", "Total", "Paid", "Balance", "Status", "Overdue"];
  const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
  const lines = rows.map((inv) => {
    const paid = paidTotal(inv.payments);
    return [
      inv.number,
      inv.client?.name,
      inv.quotation?.number,
      day(inv.createdAt),
      day(inv.dueDate),
      inv.subtotal,
      inv.tax,
      inv.total,
      paid,
      round2(inv.total - paid),
      inv.status,
      isOverdue(inv) ? "yes" : "no",
    ].map(csvCell).join(",");
  });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="ylabs-invoices.csv"');
  res.send([head.join(","), ...lines].join("\n"));
});
