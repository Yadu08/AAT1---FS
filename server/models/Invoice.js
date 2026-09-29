import mongoose from "mongoose";

const lineSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0 },
    gst: { type: Number, required: true, min: 0 },
  },
  { _id: true },
);

const paymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    mode: { type: String, enum: ["upi", "bank", "cash", "card", "cheque"], required: true },
  },
  { _id: true },
);

const invoiceSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true },
    quotation: { type: mongoose.Schema.Types.ObjectId, ref: "Quotation" },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    lineItems: { type: [lineSchema], default: [] },
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
    payments: { type: [paymentSchema], default: [] },
    status: { type: String, enum: ["unpaid", "partial", "paid"], default: "unpaid" },
    dueDate: { type: Date },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("Invoice", invoiceSchema);
