export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

export function notFound(req, res) {
  res.status(404).json({ message: "Route not found" });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "value";
    res.status(400).json({ message: `That ${field} is already in use` });
    return;
  }
  if (err.name === "ValidationError") {
    res.status(400).json({ message: err.message });
    return;
  }
  if (err.name === "CastError") {
    res.status(400).json({ message: "Invalid id" });
    return;
  }
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || "Server error" });
}
