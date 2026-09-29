import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api, { apiError, downloadPdf } from "../api/axios";
import { dateInput, formatDate, inr, paidOf } from "../utils/money";

export default function InvoiceView() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [company, setCompany] = useState({ name: "Y Labs", tagline: "", address: "", gstin: "" });
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(dateInput(new Date()));
  const [mode, setMode] = useState("upi");
  const [error, setError] = useState("");

  function load() {
    api
      .get(`/invoices/${id}`)
      .then((res) => setInvoice(res.data))
      .catch((err) => setError(apiError(err)));
  }
  useEffect(load, [id]);
  useEffect(() => {
    api.get("/company").then((res) => setCompany(res.data)).catch(() => {});
  }, []);

  async function pay(event) {
    event.preventDefault();
    setError("");
    try {
      const { data } = await api.post(`/invoices/${id}/payments`, { amount: Number(amount), date, mode });
      setInvoice(data);
      setAmount("");
    } catch (err) {
      setError(apiError(err));
    }
  }

  if (!invoice) return <p className="muted">{error || "Loading invoice…"}</p>;
  const paid = paidOf(invoice);
  const balance = invoice.total - paid;
  const client = invoice.client || {};

  return (
    <>
      <div className="page-head no-print" style={{ paddingLeft: 0 }}>
        <div>
          <p className="kicker">{invoice.quotation?.number ? `From ${invoice.quotation.number}` : "Tax invoice"}</p>
          <h1>{invoice.number}</h1>
        </div>
        <button className="btn line" type="button" onClick={() => downloadPdf(`/invoices/${invoice._id}/pdf`, `${invoice.number}.pdf`)}>
          Download PDF
        </button>
      </div>
      <div className="invoice-layout">
        <form className="card modal no-print" onSubmit={pay}>
          <h2>Record payment</h2>
          <label>
            <span>Amount</span>
            <input type="number" min="0" step="0.01" value={amount} disabled={balance <= 0.01} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label>
            <span>Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            <span>Mode</span>
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              {["upi", "bank", "cash", "card", "cheque"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn full" type="submit" disabled={balance <= 0.01}>
            {balance <= 0.01 ? "Paid in full" : "Add payment"}
          </button>
        </form>
        <article className="doc">
          <div className="doc-head">
            <div>
              <p className="kicker">QuoteFlow</p>
              <h2>{company.name}</h2>
              <p className="muted">{company.tagline}</p>
              <p className="muted">{company.address}</p>
              {company.gstin ? <p>GSTIN {company.gstin}</p> : null}
            </div>
            <div>
              <h2>Tax invoice</h2>
              <strong>{invoice.number}</strong>
              <p className="muted" style={{ textTransform: "capitalize" }}>Status · {invoice.status}</p>
            </div>
          </div>
          <div className="doc-meta" style={{ margin: "1rem 0" }}>
            <div>
              <p className="kicker">Bill to</p>
              <strong>{client.name}</strong>
              <p className="muted">{client.address}</p>
              <p className="muted">{client.email}</p>
              {client.gstin ? <p>GSTIN {client.gstin}</p> : null}
            </div>
            <div>
              <p>Issued {formatDate(invoice.createdAt)}</p>
              <p>Due {formatDate(invoice.dueDate)}</p>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>GST</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((line) => (
                  <tr key={line._id || line.name}>
                    <td>{line.name}</td>
                    <td>{line.qty}</td>
                    <td>{inr(line.rate)}</td>
                    <td>{line.gst}%</td>
                    <td>{inr(line.qty * line.rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="totals" style={{ marginTop: "1rem" }}>
            <div><span>Subtotal</span><span>{inr(invoice.subtotal)}</span></div>
            <div><span>GST</span><span>{inr(invoice.tax)}</span></div>
            <div><strong>Total</strong><strong>{inr(invoice.total)}</strong></div>
            <div><span>Received</span><span>{inr(paid)}</span></div>
            <div><strong>Balance due</strong><strong>{inr(balance)}</strong></div>
          </div>
          {invoice.payments?.length ? (
            <div style={{ marginTop: "1rem" }}>
              <p className="kicker">Payments</p>
              {invoice.payments.map((payment) => (
                <div key={payment._id} className="row" style={{ paddingLeft: 0 }}>
                  <span className="muted">{formatDate(payment.date)} · {payment.mode}</span>
                  <span>{inr(payment.amount)}</span>
                </div>
              ))}
            </div>
          ) : null}
          {invoice.notes ? <p className="muted">Notes. {invoice.notes}</p> : null}
        </article>
      </div>
    </>
  );
}
