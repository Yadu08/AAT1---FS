import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { apiError } from "../api/axios";
import StatusBadge from "../components/StatusBadge";
import { formatDate, inr } from "../utils/money";

export default function Quotations() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/quotations").then((res) => setRows(res.data)).catch((err) => setError(apiError(err)));
  }, []);

  const visible = rows.filter((row) => status === "all" || row.status === status);

  return (
    <>
      <div className="page-head" style={{ paddingLeft: 0 }}>
        <div>
          <p className="kicker">Before the invoice</p>
          <h1>Quotations</h1>
        </div>
        <Link className="btn" to="/quotations/new">New quotation</Link>
      </div>
      {error ? <p className="error">{error}</p> : null}
      <div className="filters">
        {["all", "draft", "sent", "accepted", "rejected"].map((key) => (
          <button key={key} className={status === key ? "btn" : "btn line"} type="button" onClick={() => setStatus(key)}>
            {key}
          </button>
        ))}
      </div>
      <div className="card">
        <ul className="list">
          {visible.map((quote) => (
            <li key={quote._id}>
              <Link to={`/quotations/${quote._id}`}>
                <span>
                  <strong>{quote.number}</strong>
                  <span className="muted" style={{ display: "block" }}>
                    {quote.client?.name || "Client"} · valid {formatDate(quote.validUntil)}
                  </span>
                </span>
                <span className="actions">
                  <StatusBadge status={quote.status} />
                  <strong>{inr(quote.total)}</strong>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {visible.length === 0 ? <p className="empty muted">No quotations in this filter.</p> : null}
      </div>
    </>
  );
}
