import { inr, summarize } from "../utils/money";

export function blankLine() {
  return { key: crypto.randomUUID(), item: "", name: "", qty: 1, rate: 0, gst: 18 };
}

export default function LineItemsForm({ items, lines, onChange, disabled }) {
  const sums = summarize(lines.filter((line) => line.name));

  function update(key, patch) {
    onChange(lines.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function pick(key, itemId) {
    const item = items.find((row) => row._id === itemId);
    if (!item) {
      update(key, { item: "" });
      return;
    }
    update(key, { item: item._id, name: item.name, rate: item.rate, gst: item.gstPercent });
  }

  return (
    <div className="lines">
      {lines.map((line, index) => (
        <div className="line" key={line.key}>
          <label>
            <span>Catalogue · line {index + 1}</span>
            <select value={line.item || ""} disabled={disabled} onChange={(e) => pick(line.key, e.target.value)}>
              <option value="">Custom line</option>
              {items.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Description</span>
            <input value={line.name} disabled={disabled} onChange={(e) => update(line.key, { name: e.target.value })} />
          </label>
          <label>
            <span>Qty</span>
            <input type="number" min="0" value={line.qty} disabled={disabled} onChange={(e) => update(line.key, { qty: Number(e.target.value) })} />
          </label>
          <label>
            <span>Rate</span>
            <input type="number" min="0" step="0.01" value={line.rate} disabled={disabled} onChange={(e) => update(line.key, { rate: Number(e.target.value) })} />
          </label>
          <label>
            <span>GST %</span>
            <select value={line.gst} disabled={disabled} onChange={(e) => update(line.key, { gst: Number(e.target.value) })}>
              {[0, 5, 12, 18, 28].map((gst) => (
                <option key={gst} value={gst}>
                  {gst}%
                </option>
              ))}
            </select>
          </label>
          <div>
            {!disabled && lines.length > 1 ? (
              <button type="button" className="linkish" onClick={() => onChange(lines.filter((row) => row.key !== line.key))}>
                Remove
              </button>
            ) : null}
            <strong>{inr((Number(line.qty) || 0) * (Number(line.rate) || 0))}</strong>
          </div>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        {!disabled ? (
          <button type="button" className="btn line" onClick={() => onChange([...lines, blankLine()])}>
            Add line
          </button>
        ) : (
          <span />
        )}
        <div className="totals">
          <div><span className="muted">Subtotal</span><span>{inr(sums.subtotal)}</span></div>
          <div><span className="muted">GST</span><span>{inr(sums.tax)}</span></div>
          <div><strong>Total</strong><strong>{inr(sums.total)}</strong></div>
        </div>
      </div>
    </div>
  );
}
