import PDFDocument from "pdfkit";
import { lineBase, lineTax, paidTotal } from "./totals.js";
import { getCompany } from "../config/company.js";


function inr(n) {
  return `Rs. ${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function day(value) {
  if (!value) return "—";
  const date = new Date(value);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function draw(doc, title, number, party, meta, lines, totals, extra) {
  const company = getCompany();
  doc.font("Helvetica-Bold").fontSize(18).text(company.name, 48, 48);
  doc.font("Helvetica").fontSize(9).fillColor("#444");
  doc.text(company.tagline, 48, 70);
  doc.text(company.address);
  const contact = [company.email, company.phone].filter(Boolean).join("  ·  ");
  if (contact) doc.text(contact);
  if (company.gstin) doc.text(`GSTIN ${company.gstin}`);

  doc.fillColor("#1f6a4a").font("Helvetica-Bold").fontSize(16).text(title, 360, 48, { align: "right" });
  doc.fillColor("#111").font("Helvetica").fontSize(11).text(number, 360, 70, { align: "right" });
  doc.fontSize(9).fillColor("#444").text(`Status  ${meta.status}`, 360, 88, { align: "right" });
  doc.fillColor("#111");

  let y = 130;
  doc.moveTo(48, y).lineTo(547, y).strokeColor("#e4dcd0").stroke();
  y += 16;
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#6f675e").text("BILL TO", 48, y);
  doc.font("Helvetica").fontSize(11).fillColor("#111").text(party?.name || "Client", 48, y + 16);
  doc.fontSize(9).fillColor("#444");
  doc.text(party?.address || "", 48, y + 32, { width: 240 });
  if (party?.email) doc.text(party.email, 48, doc.y + 2);
  if (party?.gstin) doc.text(`GSTIN ${party.gstin}`, 48, doc.y + 2);

  doc.fontSize(9).fillColor("#111");
  doc.text(`Issued    ${day(meta.issued)}`, 360, y + 16, { align: "right" });
  doc.text(`${meta.dateLabel}    ${day(meta.dateValue)}`, 360, y + 32, { align: "right" });

  y = Math.max(doc.y + 24, 230);
  const cols = [48, 250, 300, 360, 420, 490];
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#6f675e");
  doc.text("DESCRIPTION", cols[0], y);
  doc.text("QTY", cols[1], y, { width: 40, align: "right" });
  doc.text("RATE", cols[2], y, { width: 50, align: "right" });
  doc.text("GST", cols[3], y, { width: 40, align: "right" });
  doc.text("AMOUNT", cols[4], y, { width: 70, align: "right" });
  y += 16;
  doc.moveTo(48, y).lineTo(547, y).strokeColor("#e4dcd0").stroke();
  y += 8;

  doc.font("Helvetica").fontSize(9).fillColor("#111");
  for (const line of lines) {
    if (y > 720) {
      doc.addPage();
      y = 48;
    }
    doc.text(line.name, cols[0], y, { width: 190 });
    const rowY = y;
    doc.text(String(line.qty), cols[1], rowY, { width: 40, align: "right" });
    doc.text(inr(line.rate), cols[2], rowY, { width: 50, align: "right" });
    doc.text(`${line.gst}%`, cols[3], rowY, { width: 40, align: "right" });
    doc.text(inr(lineBase(line)), cols[4], rowY, { width: 70, align: "right" });
    doc.fillColor("#6f675e").fontSize(8).text(`tax ${inr(lineTax(line))}`, cols[4], rowY + 12, {
      width: 70,
      align: "right",
    });
    doc.fillColor("#111").fontSize(9);
    y = Math.max(doc.y, rowY + 28);
  }

  y += 8;
  doc.moveTo(340, y).lineTo(547, y).strokeColor("#e4dcd0").stroke();
  y += 10;
  const totalRow = (label, value, bold = false) => {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 12 : 10);
    doc.text(label, 340, y, { width: 90 });
    doc.text(value, 430, y, { width: 117, align: "right" });
    y += bold ? 22 : 16;
  };
  totalRow("Subtotal", inr(totals.subtotal));
  totalRow("GST", inr(totals.tax));
  totalRow("Total", inr(totals.total), true);

  if (extra) extra(doc, () => y, (next) => { y = next; });

  if (meta.notes) {
    y += 12;
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#111").text("Notes", 48, y);
    doc.font("Helvetica").fontSize(9).fillColor("#444").text(meta.notes, 48, y + 14, { width: 500 });
  }
  doc.end();
}

function pipe(res, filename) {
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.pdf"`);
  doc.pipe(res);
  return doc;
}

export function sendQuotationPdf(res, quote) {
  const doc = pipe(res, quote.number);
  const client = quote.client && typeof quote.client === "object" ? quote.client : null;
  draw(
    doc,
    "QUOTATION",
    quote.number,
    client,
    {
      status: quote.status,
      issued: quote.createdAt,
      dateLabel: "Valid until",
      dateValue: quote.validUntil,
      notes: quote.notes,
    },
    quote.lineItems,
    quote,
  );
}

export function sendInvoicePdf(res, invoice) {
  const doc = pipe(res, invoice.number);
  const client = invoice.client && typeof invoice.client === "object" ? invoice.client : null;
  const paid = paidTotal(invoice.payments);
  const balance = Math.round((invoice.total - paid) * 100) / 100;
  draw(
    doc,
    "TAX INVOICE",
    invoice.number,
    client,
    {
      status: invoice.status,
      issued: invoice.createdAt,
      dateLabel: "Due",
      dateValue: invoice.dueDate,
      notes: invoice.notes,
    },
    invoice.lineItems,
    invoice,
    (pdf, getY, setY) => {
      let y = getY() + 4;
      pdf.font("Helvetica").fontSize(10).fillColor("#111");
      pdf.text("Received", 340, y, { width: 90 });
      pdf.text(inr(paid), 430, y, { width: 117, align: "right" });
      y += 16;
      pdf.font("Helvetica-Bold").fillColor("#1f6a4a");
      pdf.text("Balance due", 340, y, { width: 90 });
      pdf.text(inr(balance), 430, y, { width: 117, align: "right" });
      y += 22;
      pdf.fillColor("#111");
      if (invoice.payments?.length) {
        pdf.font("Helvetica-Bold").fontSize(9).text("Payments", 48, y);
        y += 14;
        pdf.font("Helvetica").fontSize(9);
        for (const payment of invoice.payments) {
          pdf.fillColor("#444").text(`${day(payment.date)}   ${payment.mode}`, 48, y);
          pdf.fillColor("#111").text(inr(payment.amount), 430, y, { width: 117, align: "right" });
          y += 14;
        }
      }
      setY(y);
    },
  );
}
