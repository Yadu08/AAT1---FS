import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { apiError, downloadPdf } from "../api/axios";
import StatusBadge from "../components/StatusBadge";
import { formatDate, inr, isOverdue, paidOf } from "../utils/money";

export default function Invoices() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/invoices").then((res) => setRows(res.data)).catch((err) => setError(apiError(err)));
  }, []);

  return (
    <>
      <p className="kicker">What is owed</p>
      <div className="actions" style={{ justifyContent: "space-between" }}>
        <h1>Invoices</h1>
        <button
          className="btn ghost"
          type="button"
          onClick={() => downloadPdf("/invoices/export/csv", "ylabs-invoices.csv").catch((err) => setError(apiError(err)))}
        >
          Export CSV
        </button>
      </div>
      {error ? <p className="error">{error}</p> : null}
      <div className="card">
        <ul className="list">
          {rows.map((invoice) => {
            const paid = paidOf(invoice);
            return (
              <li key={invoice._id}>
                <Link to={`/invoices/${invoice._id}`}>
                  <span>
                    <strong>{invoice.number}</strong>
                    <span className="muted" style={{ display: "block" }}>
                      {invoice.client?.name || "Client"} · due {formatDate(invoice.dueDate)}
                    </span>
                  </span>
                  <span style={{ textAlign: "right" }}>
                    <span className="actions">
                      {isOverdue(invoice) ? <StatusBadge status="overdue" /> : null}
                      <StatusBadge status={invoice.status} />
                      <strong>{inr(invoice.total)}</strong>
                    </span>
                    <span className="muted" style={{ display: "block" }}>
                      Received {inr(paid)} · due {inr(invoice.total - paid)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        {rows.length === 0 ? <p className="empty muted">No invoices yet.</p> : null}
      </div>
    </>
  );
}
