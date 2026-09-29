import Client from "../models/Client.js";
import Quotation from "../models/Quotation.js";
import Invoice from "../models/Invoice.js";
import { asyncHandler, httpError } from "../middleware/error.js";

export const listClients = asyncHandler(async (req, res) => {
  const clients = await Client.find().sort({ createdAt: -1 });
  res.json(clients);
});

export const getClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) throw httpError(404, "Client not found");
  res.json(client);
});

export const createClient = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) throw httpError(400, "Client name is required");
  const client = await Client.create({
    name,
    phone: req.body.phone || "",
    email: req.body.email || "",
    address: req.body.address || "",
    gstin: String(req.body.gstin || "").toUpperCase(),
  });
  res.status(201).json(client);
});

export const updateClient = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) throw httpError(400, "Client name is required");
  const client = await Client.findByIdAndUpdate(
    req.params.id,
    {
      name,
      phone: req.body.phone || "",
      email: req.body.email || "",
      address: req.body.address || "",
      gstin: String(req.body.gstin || "").toUpperCase(),
    },
    { new: true, runValidators: true },
  );
  if (!client) throw httpError(404, "Client not found");
  res.json(client);
});

export const deleteClient = asyncHandler(async (req, res) => {
  const [quotes, invoices] = await Promise.all([
    Quotation.countDocuments({ client: req.params.id }),
    Invoice.countDocuments({ client: req.params.id }),
  ]);
  if (quotes || invoices) {
    throw httpError(400, "This client still has quotations or invoices");
  }
  const client = await Client.findByIdAndDelete(req.params.id);
  if (!client) throw httpError(404, "Client not found");
  res.json({ message: "Client removed" });
});
