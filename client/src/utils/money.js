export function inr(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(Number(n)) ? Number(n) : 0);
}

export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function dateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export function summarize(lines) {
  let subtotal = 0;
  let tax = 0;
  for (const line of lines) {
    const base = round2(Number(line.qty || 0) * Number(line.rate || 0));
    subtotal += base;
    tax += round2(base * (Number(line.gst || 0) / 100));
  }
  subtotal = round2(subtotal);
  tax = round2(tax);
  return { subtotal, tax, total: round2(subtotal + tax) };
}

export function paidOf(invoice) {
  return round2((invoice.payments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0));
}

export function isOverdue(invoice) {
  if (!invoice || invoice.status === "paid" || !invoice.dueDate) return false;
  const due = new Date(invoice.dueDate);
  due.setHours(23, 59, 59, 999);
  return due < new Date();
}
