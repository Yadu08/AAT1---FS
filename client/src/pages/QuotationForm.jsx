import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { apiError, downloadPdf } from "../api/axios";
import LineItemsForm, { blankLine } from "../components/LineItemsForm";
import StatusBadge from "../components/StatusBadge";
import { dateInput } from "../utils/money";

export default function QuotationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [items, setItems] = useState([]);
  const [quote, setQuote] = useState(null);
  const [client, setClient] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState([blankLine()]);
  const [locked, setLocked] = useState(false);
  const [invoiceId, setInvoiceId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    async function boot() {
      try {
        const [clientRes, itemRes] = await Promise.all([api.get("/clients"), api.get("/items")]);
        if (!live) return;
        setClients(clientRes.data);
        setItems(itemRes.data);
        if (!id) {
          setClient(clientRes.data[0]?._id || "");
          const due = new Date();
          due.setDate(due.getDate() + 21);
          setValidUntil(dateInput(due));
          setLoading(false);
          return;
        }
        const { data } = await api.get(`/quotations/${id}`);
        if (!live) return;
        setQuote(data);
        setClient(data.client?._id || data.client);
        setValidUntil(dateInput(data.validUntil));
        setNotes(data.notes || "");
        setLines(
          data.lineItems.map((line) => ({
            key: line._id || crypto.randomUUID(),
            item: line.item || "",
            name: line.name,
            qty: line.qty,
            rate: line.rate,
            gst: line.gst,
          })),
        );
        const invoices = await api.get("/invoices");
        const linked = invoices.data.find((row) => (row.quotation?._id || row.quotation) === data._id);
        if (linked) {
          setLocked(true);
          setInvoiceId(linked._id);
        }
        setLoading(false);
      } catch (err) {
        if (live) {
          setError(apiError(err));
          setLoading(false);
        }
      }
    }
    boot();
    return () => {
      live = false;
    };
  }, [id]);

  function payload(status) {
    return {
      client,
      validUntil,
      notes,
      status,
      lineItems: lines.map((line) => ({
        item: line.item || undefined,
        name: line.name,
        qty: Number(line.qty),
        rate: Number(line.rate),
        gst: Number(line.gst),
      })),
    };
  }

  async function save(status) {
    setError("");
    try {
      if (id) {
        const { data } = await api.put(`/quotations/${id}`, payload(status || quote.status));
        setQuote(data);
      } else {
        const { data } = await api.post("/quotations", payload(status || "draft"));
        navigate(`/quotations/${data._id}`);
      }
    } catch (err) {
      setError(apiError(err));
    }
  }

  async function mark(status) {
    try {
      const { data } = await api.patch(`/quotations/${id}/status`, { status });
      setQuote(data);
    } catch (err) {
      setError(apiError(err));
    }
  }

  async function convert() {
    try {
      const { data } = await api.post(`/quotations/${id}/convert`);
      navigate(`/invoices/${data._id}`);
    } catch (err) {
      setError(apiError(err));
    }
  }

  async function remove() {
    try {
      await api.delete(`/quotations/${id}`);
      navigate("/quotations");
    } catch (err) {
      setError(apiError(err));
    }
  }

  if (loading) return <p className="muted">Loading quotation…</p>;

  return (
    <>
      <p className="kicker">Quotation</p>
      <h1>{quote?.number || "New quotation"}</h1>
      {quote ? <StatusBadge status={quote.status} /> : null}
      {locked ? (
        <p className="hint">This quotation is locked because it was converted. {invoiceId ? <Link to={`/invoices/${invoiceId}`}>Open invoice</Link> : null}</p>
      ) : null}
      <div className="split" style={{ marginTop: "1rem" }}>
        <label>
          <span>Client</span>
          <select value={client} disabled={locked} onChange={(e) => setClient(e.target.value)}>
            {clients.map((row) => (
              <option key={row._id} value={row._id}>{row.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Valid until</span>
          <input type="date" value={validUntil} disabled={locked} onChange={(e) => setValidUntil(e.target.value)} />
        </label>
      </div>
      <div style={{ marginTop: "1rem" }}>
        <LineItemsForm items={items} lines={lines} onChange={setLines} disabled={locked} />
      </div>
      <label style={{ marginTop: "1rem" }}>
        <span>Notes</span>
        <textarea value={notes} disabled={locked} onChange={(e) => setNotes(e.target.value)} />
      </label>
      {error ? <p className="error">{error}</p> : null}
      <div className="actions" style={{ marginTop: "1rem" }}>
        {!locked ? <button className="btn" type="button" onClick={() => save(quote?.status)}>Save</button> : null}
        {!locked && (!quote || quote.status === "draft") ? (
          <button className="btn brass" type="button" onClick={() => save("sent")}>Save and mark sent</button>
        ) : null}
        {quote && !locked
          ? ["draft", "sent", "accepted", "rejected"]
              .filter((status) => status !== quote.status)
              .map((status) => (
                <button key={status} className="btn line" type="button" onClick={() => mark(status)}>
                  Mark {status}
                </button>
              ))
          : null}
        {quote && (quote.status === "sent" || quote.status === "accepted") && !locked ? (
          <button className="btn" type="button" onClick={convert}>Convert to invoice</button>
        ) : null}
        {quote?.status === "draft" ? (
          <button className="btn danger" type="button" onClick={remove}>Delete draft</button>
        ) : null}
        {quote ? (
          <button className="btn line" type="button" onClick={() => downloadPdf(`/quotations/${quote._id}/pdf`, `${quote.number}.pdf`)}>
            Download PDF
          </button>
        ) : null}
      </div>
    </>
  );
}
