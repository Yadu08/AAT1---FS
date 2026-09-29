import Quotation from "../models/Quotation.js";
import Invoice from "../models/Invoice.js";
import { asyncHandler, httpError } from "../middleware/error.js";
import { nextNumber } from "../utils/numbering.js";
import { summarize } from "../utils/totals.js";
import { sendQuotationPdf } from "../utils/pdf.js";

const STATUSES = ["draft", "sent", "accepted", "rejected"];

function normalizeLines(raw) {
  if (!Array.isArray(raw)) throw httpError(400, "lineItems must be a list");
  const lines = raw
    .map((line) => ({
      item: line.item || undefined,
      name: String(line.name || "").trim(),
      qty: Number(line.qty),
      rate: Number(line.rate),
      gst: Number(line.gst ?? 0),
    }))
    .filter((line) => line.name && line.qty > 0);
  if (!lines.length) throw httpError(400, "Add at least one line with a name and quantity");
  for (const line of lines) {
    if (!Number.isFinite(line.qty) || !Number.isFinite(line.rate) || line.rate < 0) {
      throw httpError(400, "Each line needs a numeric rate");
    }
    if (!Number.isFinite(line.gst) || line.gst < 0) throw httpError(400, "Each line needs a GST percent");
  }
  return lines;
}

export const listQuotations = asyncHandler(async (req, res) => {
  const rows = await Quotation.find().populate("client", "name email phone").sort({ createdAt: -1 });
  res.json(rows);
});

export const getQuotation = asyncHandler(async (req, res) => {
  const quote = await Quotation.findById(req.params.id).populate("client");
  if (!quote) throw httpError(404, "Quotation not found");
  res.json(quote);
});

export const createQuotation = asyncHandler(async (req, res) => {
  if (!req.body.client) throw httpError(400, "Choose a client");
  const lineItems = normalizeLines(req.body.lineItems);
  const status = req.body.status && STATUSES.includes(req.body.status) ? req.body.status : "draft";
  const quote = await Quotation.create({
    number: await nextNumber(Quotation, "QT"),
    client: req.body.client,
    lineItems,
    ...summarize(lineItems),
    status,
    validUntil: req.body.validUntil || undefined,
    notes: req.body.notes || "",
  });
  const populated = await quote.populate("client", "name email phone");
  res.status(201).json(populated);
});

export const updateQuotation = asyncHandler(async (req, res) => {
  const quote = await Quotation.findById(req.params.id);
  if (!quote) throw httpError(404, "Quotation not found");
  const invoiced = await Invoice.exists({ quotation: quote._id });
  if (invoiced) throw httpError(409, "This quotation already became an invoice");
  if (!req.body.client) throw httpError(400, "Choose a client");
  const lineItems = normalizeLines(req.body.lineItems);
  quote.client = req.body.client;
  quote.lineItems = lineItems;
  Object.assign(quote, summarize(lineItems));
  quote.validUntil = req.body.validUntil || undefined;
  quote.notes = req.body.notes || "";
  if (req.body.status && STATUSES.includes(req.body.status)) quote.status = req.body.status;
  await quote.save();
  await quote.populate("client", "name email phone");
  res.json(quote);
});

export const deleteQuotation = asyncHandler(async (req, res) => {
  const quote = await Quotation.findById(req.params.id);
  if (!quote) throw httpError(404, "Quotation not found");
  if (quote.status !== "draft") throw httpError(400, "Only drafts can be deleted");
  const invoiced = await Invoice.exists({ quotation: quote._id });
  if (invoiced) throw httpError(400, "An invoice already references this quotation");
  await quote.deleteOne();
  res.json({ message: "Quotation deleted" });
});

export const patchStatus = asyncHandler(async (req, res) => {
  if (!STATUSES.includes(req.body.status)) throw httpError(400, "Unknown status");
  const quote = await Quotation.findById(req.params.id);
  if (!quote) throw httpError(404, "Quotation not found");
  const invoiced = await Invoice.exists({ quotation: quote._id });
  if (invoiced && req.body.status !== "accepted") {
    throw httpError(400, "Invoiced quotations stay accepted");
  }
  quote.status = req.body.status;
  await quote.save();
  res.json(quote);
});

export const quotationPdf = asyncHandler(async (req, res) => {
  const quote = await Quotation.findById(req.params.id).populate("client");
  if (!quote) throw httpError(404, "Quotation not found");
  sendQuotationPdf(res, quote);
});

export const convertQuotation = asyncHandler(async (req, res) => {
  const quote = await Quotation.findById(req.params.id);
  if (!quote) throw httpError(404, "Quotation not found");
  if (quote.status === "draft" || quote.status === "rejected") {
    throw httpError(400, "Send the quotation before converting it");
  }
  const existing = await Invoice.findOne({ quotation: quote._id });
  if (existing) throw httpError(409, "An invoice already exists for this quotation");
  const due = new Date();
  due.setDate(due.getDate() + 14);
  const invoice = await Invoice.create({
    number: await nextNumber(Invoice, "INV"),
    quotation: quote._id,
    client: quote.client,
    lineItems: quote.lineItems.map((line) => ({
      item: line.item,
      name: line.name,
      qty: line.qty,
      rate: line.rate,
      gst: line.gst,
    })),
    subtotal: quote.subtotal,
    tax: quote.tax,
    total: quote.total,
    payments: [],
    status: "unpaid",
    dueDate: due,
    notes: quote.notes,
  });
  quote.status = "accepted";
  await quote.save();
  const populated = await invoice.populate([
    { path: "client", select: "name email phone gstin address" },
    { path: "quotation", select: "number" },
  ]);
  res.status(201).json(populated);
});
