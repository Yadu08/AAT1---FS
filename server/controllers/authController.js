import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken } from "../middleware/auth.js";
import { asyncHandler, httpError } from "../middleware/error.js";

export const register = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!name || !email || password.length < 6) {
    throw httpError(400, "Name, email, and a password of at least 6 characters are required");
  }
  const existing = await User.findOne({ email });
  if (existing) throw httpError(400, "That email is already registered");
  const count = await User.countDocuments();
  const user = await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: count === 0 ? "admin" : "staff",
  });
  res.status(201).json({ token: signToken(user), user: user.toPublic() });
});

export const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw httpError(401, "Those credentials do not match a Y Labs account");
  }
  res.json({ token: signToken(user), user: user.toPublic() });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw httpError(401, "Account no longer exists");
  res.json({ user: user.toPublic() });
});
