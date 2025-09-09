import jwt from "jsonwebtoken";

const { JWT_SECRET = "dev-secret" } = process.env;

export function requireAuth(req, res, next) {
  try {
    const token =
      req.cookies?.accessToken ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : null);
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.sub,
      email: payload.email,
      supabaseUserId: payload.supabaseUserId,
    };
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
