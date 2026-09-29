import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    unit: { type: String, default: "unit" },
    rate: { type: Number, required: true, min: 0 },
    gstPercent: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

export default mongoose.model("Item", itemSchema);
