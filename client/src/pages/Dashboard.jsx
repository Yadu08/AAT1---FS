import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api, { apiError } from "../api/axios";
import StatusBadge from "../components/StatusBadge";
import { formatDate, inr } from "../utils/money";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/stats")
      .then((res) => setData(res.data))
      .catch((err) => setError(apiError(err)));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Loading the desk…</p>;

  const month = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <>
      <p className="kicker">{month}</p>
      <h1>The desk</h1>
      <section className="stats">
        <article className="card stat">
          <span className="kicker">Open quotations</span>
          <strong>{inr(data.quotePipeline)}</strong>
          <p className="muted">Drafts and quotes still out</p>
        </article>
        <article className="card stat">
          <span className="kicker">Outstanding</span>
          <strong>{inr(data.outstanding)}</strong>
          <p className="muted">Not yet collected</p>
        </article>
        <article className="card stat">
          <span className="kicker">Collected this month</span>
          <strong>{inr(data.collectedThisMonth)}</strong>
          <p className="muted">Payments dated this month</p>
        </article>
        <article className="card stat">
          <span className="kicker">Clients</span>
          <strong>{data.clients}</strong>
          <p className="muted">{data.quotations} quotations · {data.invoices} invoices</p>
        </article>
      </section>
      <section className="panel">
        <h2>Collections, {new Date().getFullYear()}</h2>
        <p className="muted">What actually landed in the account, by month.</p>
        <div className="chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.monthlyRevenue}>
              <CartesianGrid stroke="#e4dcd0" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#6f675e", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6f675e", fontSize: 12 }} axisLine={false} tickLine={false} width={56} />
              <Tooltip formatter={(value) => inr(Number(value || 0))} />
              <Bar dataKey="collected" fill="#1f6a4a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <div className="split">
        <section className="panel">
          <h2>Recent quotations</h2>
          <ul className="list">
            {data.recentQuotations.map((quote) => (
              <li key={quote._id}>
                <Link to={`/quotations/${quote._id}`}>
                  <span>
                    <strong>{quote.number}</strong>
                    <span className="muted" style={{ display: "block" }}>{quote.clientName}</span>
                  </span>
                  <span className="actions">
                    <StatusBadge status={quote.status} />
                    <strong>{inr(quote.total)}</strong>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel">
          <h2>Due soon</h2>
          {data.dueSoon.length === 0 ? (
            <p className="muted">Nothing due in the next three weeks.</p>
          ) : (
            <ul className="list">
              {data.dueSoon.map((invoice) => (
                <li key={invoice._id}>
                  <Link to={`/invoices/${invoice._id}`}>
                    <span>
                      <strong>{invoice.number}</strong>
                      <span className="muted" style={{ display: "block" }}>
                        {invoice.clientName} · {formatDate(invoice.dueDate)}
                      </span>
                    </span>
                    <strong>{inr(invoice.balance)}</strong>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
