import { useEffect, useState } from "react";
import api, { apiError } from "../api/axios";
import DataTable from "../components/DataTable";

const empty = { name: "", phone: "", email: "", address: "", gstin: "" };

export default function Clients() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  function load() {
    api.get("/clients").then((res) => setRows(res.data)).catch((err) => setError(apiError(err)));
  }
  useEffect(load, []);

  const visible = rows.filter((row) =>
    `${row.name} ${row.email} ${row.gstin}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  async function save(event) {
    event.preventDefault();
    try {
      if (editing._id) await api.put(`/clients/${editing._id}`, editing);
      else await api.post("/clients", editing);
      setEditing(null);
      load();
    } catch (err) {
      setError(apiError(err));
    }
  }

  async function remove(id) {
    try {
      await api.delete(`/clients/${id}`);
      load();
    } catch (err) {
      setError(apiError(err));
    }
  }

  return (
    <>
      <div className="page-head" style={{ paddingLeft: 0 }}>
        <div>
          <p className="kicker">Who we bill</p>
          <h1>Clients</h1>
        </div>
        <button className="btn" type="button" onClick={() => { setError(""); setEditing({ ...empty }); }}>
          New client
        </button>
      </div>
      {error ? <p className="error">{error}</p> : null}
      <input className="search" placeholder="Search name, email, GSTIN" value={query} onChange={(e) => setQuery(e.target.value)} />
      <DataTable
        rows={visible}
        empty="No clients yet"
        columns={[
          { key: "name", label: "Name", render: (row) => <strong>{row.name}</strong> },
          { key: "phone", label: "Phone" },
          { key: "email", label: "Email" },
          { key: "gstin", label: "GSTIN" },
          {
            key: "actions",
            label: "",
            render: (row) => (
              <div className="actions">
                <button className="btn line" type="button" onClick={() => { setError(""); setEditing(row); }}>Edit</button>
                <button className="btn danger" type="button" onClick={() => remove(row._id)}>Delete</button>
              </div>
            ),
          },
        ]}
      />
      {editing ? (
        <div className="modal-back">
          <form className="card modal" onSubmit={save}>
            <h2>{editing._id ? "Edit client" : "New client"}</h2>
            {["name", "phone", "email", "address", "gstin"].map((field) => (
              <label key={field}>
                <span style={{ textTransform: "capitalize" }}>{field}</span>
                {field === "address" ? (
                  <textarea value={editing[field]} onChange={(e) => setEditing({ ...editing, [field]: e.target.value })} />
                ) : (
                  <input value={editing[field]} onChange={(e) => setEditing({ ...editing, [field]: e.target.value })} />
                )}
              </label>
            ))}
            <div className="actions">
              <button className="btn" type="submit">Save client</button>
              <button className="btn line" type="button" onClick={() => setEditing(null)}>Close</button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
