import Item from "../models/Item.js";
import Quotation from "../models/Quotation.js";
import { asyncHandler, httpError } from "../middleware/error.js";

function readItem(body) {
  const name = String(body.name || "").trim();
  const rate = Number(body.rate);
  const gstPercent = Number(body.gstPercent);
  if (!name) throw httpError(400, "Item name is required");
  if (!Number.isFinite(rate) || rate < 0) throw httpError(400, "Rate must be a number");
  if (!Number.isFinite(gstPercent) || gstPercent < 0) throw httpError(400, "GST percent must be a number");
  return {
    name,
    description: String(body.description || "").trim(),
    unit: String(body.unit || "unit").trim() || "unit",
    rate,
    gstPercent,
  };
}

export const listItems = asyncHandler(async (req, res) => {
  res.json(await Item.find().sort({ name: 1 }));
});

export const getItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) throw httpError(404, "Item not found");
  res.json(item);
});

export const createItem = asyncHandler(async (req, res) => {
  const item = await Item.create(readItem(req.body));
  res.status(201).json(item);
});

export const updateItem = asyncHandler(async (req, res) => {
  const item = await Item.findByIdAndUpdate(req.params.id, readItem(req.body), {
    new: true,
    runValidators: true,
  });
  if (!item) throw httpError(404, "Item not found");
  res.json(item);
});

export const deleteItem = asyncHandler(async (req, res) => {
  const used = await Quotation.countDocuments({ "lineItems.item": req.params.id });
  if (used) throw httpError(400, "This item is used on a quotation");
  const item = await Item.findByIdAndDelete(req.params.id);
  if (!item) throw httpError(404, "Item not found");
  res.json({ message: "Item removed" });
});
