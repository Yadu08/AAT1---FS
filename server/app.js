import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import clientRoutes from "./routes/clients.js";
import itemRoutes from "./routes/items.js";
import quotationRoutes from "./routes/quotations.js";
import invoiceRoutes from "./routes/invoices.js";
import statsRoutes from "./routes/stats.js";
import companyRoutes from "./routes/company.js";
import { errorHandler, notFound } from "./middleware/error.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  }),
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/company", companyRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
