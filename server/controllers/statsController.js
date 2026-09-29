import Client from "../models/Client.js";
import Item from "../models/Item.js";
import Quotation from "../models/Quotation.js";
import Invoice from "../models/Invoice.js";
import { asyncHandler } from "../middleware/error.js";
import { paidTotal, round2 } from "../utils/totals.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function ymd(date) {
  const d = new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export const stats = asyncHandler(async (req, res) => {
  const [clients, items, quotations, invoices, recentRaw] = await Promise.all([
    Client.countDocuments(),
    Item.countDocuments(),
    Quotation.countDocuments(),
    Invoice.countDocuments(),
    Quotation.find().populate("client", "name").sort({ createdAt: -1 }).limit(5),
  ]);

  const allQuotes = await Quotation.find({ status: { $in: ["draft", "sent"] } });
  const quotePipeline = round2(allQuotes.reduce((sum, quote) => sum + quote.total, 0));

  const openInvoices = await Invoice.find({ status: { $ne: "paid" } }).populate("client", "name");
  const outstanding = round2(
    openInvoices.reduce((sum, invoice) => sum + (invoice.total - paidTotal(invoice.payments)), 0),
  );

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const allInvoices = await Invoice.find();
  let collectedThisMonth = 0;
  const monthlyRevenue = MONTHS.map((label) => ({ month: label, collected: 0 }));
  for (const invoice of allInvoices) {
    for (const payment of invoice.payments) {
      const date = new Date(payment.date);
      if (date.getFullYear() !== year) continue;
      monthlyRevenue[date.getMonth()].collected = round2(
        monthlyRevenue[date.getMonth()].collected + payment.amount,
      );
      if (date.getMonth() === month) collectedThisMonth = round2(collectedThisMonth + payment.amount);
    }
  }

  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 21);
  const horizonKey = ymd(horizon);
  const dueSoon = openInvoices
    .filter((invoice) => invoice.dueDate && ymd(invoice.dueDate) <= horizonKey)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5)
    .map((invoice) => ({
      _id: invoice._id,
      number: invoice.number,
      clientName: invoice.client?.name || "",
      dueDate: invoice.dueDate,
      balance: round2(invoice.total - paidTotal(invoice.payments)),
      status: invoice.status,
    }));

  res.json({
    clients,
    items,
    quotations,
    invoices,
    quotePipeline,
    outstanding,
    collectedThisMonth,
    monthlyRevenue,
    recentQuotations: recentRaw.map((quote) => ({
      _id: quote._id,
      number: quote.number,
      status: quote.status,
      total: quote.total,
      clientName: quote.client?.name || "",
      createdAt: quote.createdAt,
    })),
    dueSoon,
  });
});
