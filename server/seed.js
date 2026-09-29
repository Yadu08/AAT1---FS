import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db.js";
import User from "./models/User.js";
import Client from "./models/Client.js";
import Item from "./models/Item.js";
import Quotation from "./models/Quotation.js";
import Invoice from "./models/Invoice.js";
import { invoiceStatus, paidTotal, summarize } from "./utils/totals.js";
import mongoose from "mongoose";

function line(item, qty, overrides = {}) {
  return {
    item: item?._id,
    name: overrides.name || item.name,
    qty,
    rate: overrides.rate ?? item.rate,
    gst: overrides.gst ?? item.gstPercent,
  };
}

function custom(name, rate, gst = 18) {
  return { name, qty: 1, rate, gst };
}

async function makeQuote({ number, client, lines, status, validUntil, notes, createdAt }) {
  const totals = summarize(lines);
  return Quotation.create({
    number,
    client: client._id,
    lineItems: lines,
    ...totals,
    status,
    validUntil,
    notes,
    createdAt,
  });
}

async function makeInvoice({
  number,
  client,
  quotation,
  lines,
  payments,
  dueDate,
  notes,
  createdAt,
}) {
  const totals = summarize(lines);
  const status = invoiceStatus(totals.total, payments);
  return Invoice.create({
    number,
    client: client._id,
    quotation: quotation?._id,
    lineItems: lines,
    ...totals,
    payments,
    status,
    dueDate,
    notes: notes || "",
    createdAt,
  });
}

async function main() {
  await connectDB();
  await Promise.all([
    User.deleteMany({}),
    Client.deleteMany({}),
    Item.deleteMany({}),
    Quotation.deleteMany({}),
    Invoice.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash("ylabs@2026", 10);
  await User.create([
    { name: "Yadunandan S", email: "admin@ylabs.local", passwordHash, role: "admin" },
    { name: "Y Labs Staff", email: "staff@ylabs.local", passwordHash, role: "staff" },
  ]);

  const [kaveri, nimbus, brightpath, orbit] = await Client.create([
    {
      name: "Kaveri Textiles Pvt Ltd",
      phone: "+91 98450 11220",
      email: "accounts@kaveritextiles.example",
      address: "22 Lavelle Road, Bengaluru 560001",
      gstin: "29AADCK8821Q1Z2",
    },
    {
      name: "Nimbus Clinics",
      phone: "+91 98200 44118",
      email: "admin@nimbusclinics.example",
      address: "Nimbus House, Bandra West, Mumbai 400050",
      gstin: "27AABCN2291P1ZV",
    },
    {
      name: "BrightPath Academy",
      phone: "+91 99001 22884",
      email: "office@brightpath.example",
      address: "8 Church Street, Bengaluru 560001",
      gstin: "29AAFCB4410R1Z8",
    },
    {
      name: "Orbit Fintech",
      phone: "+91 98111 90332",
      email: "finance@orbitfintech.example",
      address: "4th Floor, Cyber Hub, Gurugram 122002",
      gstin: "06AADCO1102D1Z4",
    },
  ]);

  const items = await Item.create([
    { name: "Full-stack development", description: "React, Node and MongoDB build work", unit: "hour", rate: 1800, gstPercent: 18 },
    { name: "Web application penetration test", description: "OWASP-based test with a written report", unit: "app", rate: 45000, gstPercent: 18 },
    { name: "ML anomaly detection module", description: "Model training, API and dashboard hook", unit: "module", rate: 75000, gstPercent: 18 },
    { name: "Cloud and API security review", description: "Config, access and API hardening review", unit: "day", rate: 8000, gstPercent: 18 },
    { name: "Hardware security keys", description: "FIDO2 keys for staff accounts", unit: "unit", rate: 3200, gstPercent: 12 },
    { name: "Project management", description: "Planning, sprints and client reporting", unit: "day", rate: 5000, gstPercent: 18 },
  ]);
  const [dev, pentest, ml, review, keys, manage] = items;

  const q1 = await makeQuote({
    number: "QT-2026-001",
    client: kaveri,
    status: "accepted",
    validUntil: "2026-10-20",
    notes: "Includes one round of fixes and a retest report.",
    createdAt: "2026-09-02",
    lines: [line(dev, 80), line(pentest, 1), line(ml, 1), line(review, 2)],
  });
  await makeQuote({
    number: "QT-2026-002",
    client: nimbus,
    status: "sent",
    validUntil: "2026-10-15",
    notes: "Two web apps and one API. Excludes third-party licence costs.",
    createdAt: "2026-09-18",
    lines: [line(dev, 40), line(manage, 6), line(review, 3)],
  });
  await makeQuote({
    number: "QT-2026-003",
    client: brightpath,
    status: "draft",
    validUntil: "2026-10-30",
    notes: "Learning portal hardening.",
    createdAt: "2026-09-25",
    lines: [line(dev, 16), line(keys, 10)],
  });
  await makeQuote({
    number: "QT-2026-004",
    client: orbit,
    status: "rejected",
    validUntil: "2026-08-01",
    notes: "Client paused the project.",
    createdAt: "2026-07-12",
    lines: [line(pentest, 2), line(dev, 10)],
  });
  const q5 = await makeQuote({
    number: "QT-2026-005",
    client: brightpath,
    status: "accepted",
    validUntil: "2026-03-20",
    notes: "Initial assessment before the portal work.",
    createdAt: "2026-03-04",
    lines: [line(dev, 20), line(pentest, 1)],
  });

  const retainer = custom("Annual security retainer", 150000);
  await makeInvoice({
    number: "INV-2026-001",
    client: orbit,
    lines: [retainer],
    payments: [{ amount: summarize([retainer]).total, date: "2026-01-20", mode: "bank" }],
    dueDate: "2026-01-20",
    createdAt: "2026-01-20",
  });

  const lobby = custom("SIEM log pipeline setup", 110000);
  await makeInvoice({
    number: "INV-2026-002",
    client: nimbus,
    lines: [lobby],
    payments: [{ amount: summarize([lobby]).total, date: "2026-02-11", mode: "bank" }],
    dueDate: "2026-02-11",
    createdAt: "2026-02-11",
  });

  const survey = [line(dev, 20), line(pentest, 1)];
  await makeInvoice({
    number: "INV-2026-003",
    client: brightpath,
    quotation: q5,
    lines: survey,
    payments: [{ amount: summarize(survey).total, date: "2026-03-12", mode: "cash" }],
    dueDate: "2026-03-20",
    notes: q5.notes,
    createdAt: "2026-03-12",
  });

  const library = custom("Code security audit", 80000);
  await makeInvoice({
    number: "INV-2026-004",
    client: kaveri,
    lines: [library],
    payments: [{ amount: summarize([library]).total, date: "2026-05-16", mode: "upi" }],
    dueDate: "2026-05-16",
    createdAt: "2026-05-16",
  });

  const suites = custom("Penetration retest", 90000);
  await makeInvoice({
    number: "INV-2026-005",
    client: nimbus,
    lines: [suites],
    payments: [{ amount: summarize([suites]).total, date: "2026-06-09", mode: "bank" }],
    dueDate: "2026-06-09",
    createdAt: "2026-06-09",
  });

  const floors = custom("API integration sprint", 120000);
  await makeInvoice({
    number: "INV-2026-006",
    client: orbit,
    lines: [floors],
    payments: [{ amount: summarize([floors]).total, date: "2026-07-21", mode: "bank" }],
    dueDate: "2026-07-21",
    createdAt: "2026-07-21",
  });

  const shelves = custom("Dashboard module", 70000);
  await makeInvoice({
    number: "INV-2026-007",
    client: brightpath,
    lines: [shelves],
    payments: [{ amount: summarize([shelves]).total, date: "2026-08-14", mode: "upi" }],
    dueDate: "2026-08-14",
    createdAt: "2026-08-14",
  });

  const residence = [line(dev, 80), line(pentest, 1), line(ml, 1), line(review, 2)];
  const residenceTotal = summarize(residence).total;
  const partial = [
    { amount: 100000, date: "2026-09-06", mode: "upi" },
    { amount: 80000, date: "2026-09-18", mode: "bank" },
  ];
  if (paidTotal(partial) >= residenceTotal) {
    throw new Error("Seed partial payments must stay under the Kaveri total");
  }
  await makeInvoice({
    number: "INV-2026-008",
    client: kaveri,
    quotation: q1,
    lines: residence,
    payments: partial,
    dueDate: "2026-10-20",
    notes: q1.notes,
    createdAt: "2026-09-04",
  });

  const deposit = custom("Project kickoff deposit", 40000);
  await makeInvoice({
    number: "INV-2026-009",
    client: brightpath,
    lines: [deposit],
    payments: [],
    dueDate: "2026-10-12",
    notes: "Due before development starts.",
    createdAt: "2026-09-22",
  });

  const workshop = custom("Security awareness workshop", 35000);
  await makeInvoice({
    number: "INV-2026-010",
    client: orbit,
    lines: [workshop],
    payments: [],
    dueDate: "2026-09-15",
    notes: "Reminder sent on 22 Sep.",
    createdAt: "2026-09-01",
  });

  console.log("Seeded Y Labs ledger");
  console.log("Login  admin@ylabs.local  /  ylabs@2026");
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
