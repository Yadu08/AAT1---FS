export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export function lineBase(line) {
  return round2(Number(line.qty) * Number(line.rate));
}

export function lineTax(line) {
  return round2(lineBase(line) * (Number(line.gst) / 100));
}

/** Sum of line bases and per-line GST. Lines may use different GST rates. */
export function summarize(lineItems = []) {
  const subtotal = round2(lineItems.reduce((sum, line) => sum + lineBase(line), 0));
  const tax = round2(lineItems.reduce((sum, line) => sum + lineTax(line), 0));
  return { subtotal, tax, total: round2(subtotal + tax) };
}

export function paidTotal(payments = []) {
  return round2(payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0));
}

export function invoiceStatus(total, payments) {
  const paid = paidTotal(payments);
  if (paid <= 0.009) return "unpaid";
  if (paid + 0.009 >= Number(total)) return "paid";
  return "partial";
}

/** An invoice is overdue when it is not fully paid and its due date has passed. */
export function isOverdue(invoice, today = new Date()) {
  if (!invoice || invoice.status === "paid" || !invoice.dueDate) return false;
  const due = new Date(invoice.dueDate);
  due.setHours(23, 59, 59, 999);
  return due < today;
}
