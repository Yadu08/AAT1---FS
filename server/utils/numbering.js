export async function nextNumber(Model, prefix) {
  const year = new Date().getFullYear();
  const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`);
  const latest = await Model.find({ number: pattern }).sort({ number: -1 }).limit(1);
  let seq = 1;
  if (latest[0]) {
    const match = String(latest[0].number).match(pattern);
    if (match) seq = Number.parseInt(match[1], 10) + 1;
  }
  return `${prefix}-${year}-${String(seq).padStart(3, "0")}`;
}
