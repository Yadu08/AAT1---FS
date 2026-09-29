import { useEffect, useState } from "react";
import api, { apiError } from "../api/axios";
import DataTable from "../components/DataTable";
import { inr } from "../utils/money";

const empty = { name: "", description: "", unit: "unit", rate: 0, gstPercent: 18 };

export default function Items() {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  function load() {
    api.get("/items").then((res) => setRows(res.data)).catch((err) => setError(apiError(err)));
  }
  useEffect(load, []);

  async function save(event) {
    event.preventDefault();
    try {
      if (editing._id) await api.put(`/items/${editing._id}`, editing);
      else await api.post("/items", editing);
      setEditing(null);
      load();
    } catch (err) {
      setError(apiError(err));
    }
  }

  async function remove(id) {
    try {
      await api.delete(`/items/${id}`);
      load();
    } catch (err) {
      setError(apiError(err));
    }
  }

  return (
    <>
      <div className="page-head" style={{ paddingLeft: 0 }}>
        <div>
          <p className="kicker">Rates we quote</p>
          <h1>Catalogue</h1>
        </div>
        <button className="btn" type="button" onClick={() => { setError(""); setEditing({ ...empty }); }}>
          New item
        </button>
      </div>
      {error ? <p className="error">{error}</p> : null}
      <DataTable
        rows={rows}
        empty="Empty catalogue"
        columns={[
          {
            key: "name",
            label: "Item",
            render: (row) => (
              <>
                <strong>{row.name}</strong>
                <div className="muted">{row.description}</div>
              </>
            ),
          },
          { key: "unit", label: "Unit" },
          { key: "rate", label: "Rate", render: (row) => inr(row.rate) },
          { key: "gstPercent", label: "GST", render: (row) => `${row.gstPercent}%` },
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
            <h2>{editing._id ? "Edit item" : "New item"}</h2>
            <label><span>Name</span><input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></label>
            <label><span>Description</span><input value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></label>
            <label><span>Unit</span><input value={editing.unit} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} /></label>
            <label><span>Rate</span><input type="number" min="0" value={editing.rate} onChange={(e) => setEditing({ ...editing, rate: Number(e.target.value) })} /></label>
            <label><span>GST %</span><input type="number" min="0" value={editing.gstPercent} onChange={(e) => setEditing({ ...editing, gstPercent: Number(e.target.value) })} /></label>
            <div className="actions">
              <button className="btn" type="submit">Save item</button>
              <button className="btn line" type="button" onClick={() => setEditing(null)}>Close</button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
