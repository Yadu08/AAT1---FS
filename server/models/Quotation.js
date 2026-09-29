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

const quotationSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    lineItems: { type: [lineSchema], default: [] },
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["draft", "sent", "accepted", "rejected"],
      default: "draft",
    },
    validUntil: { type: Date },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("Quotation", quotationSchema);
