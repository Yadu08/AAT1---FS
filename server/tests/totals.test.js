import test from "node:test";
import assert from "node:assert/strict";
import { summarize, invoiceStatus, isOverdue, paidTotal } from "../utils/totals.js";

test("summarize applies GST per line, not on the whole quote", () => {
  const lines = [
    { qty: 10, rate: 3200, gst: 12 }, // 32,000 + 3,840
    { qty: 2, rate: 1000, gst: 18 }, //  2,000 +   360
  ];
  assert.deepEqual(summarize(lines), { subtotal: 34000, tax: 4200, total: 38200 });
});

test("invoiceStatus moves unpaid -> partial -> paid", () => {
  assert.equal(invoiceStatus(1000, []), "unpaid");
  assert.equal(invoiceStatus(1000, [{ amount: 400 }]), "partial");
  assert.equal(invoiceStatus(1000, [{ amount: 400 }, { amount: 600 }]), "paid");
});

test("paidTotal sums payments", () => {
  assert.equal(paidTotal([{ amount: 100.5 }, { amount: 50 }]), 150.5);
});

test("isOverdue flags unpaid invoices past their due date only", () => {
  const today = new Date("2026-09-29");
  assert.equal(isOverdue({ status: "unpaid", dueDate: "2026-09-15" }, today), true);
  assert.equal(isOverdue({ status: "partial", dueDate: "2026-09-15" }, today), true);
  assert.equal(isOverdue({ status: "paid", dueDate: "2026-09-15" }, today), false);
  assert.equal(isOverdue({ status: "unpaid", dueDate: "2026-10-12" }, today), false);
});
