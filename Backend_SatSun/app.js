import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes/index.js";
import { supabase } from "./db/supabaseClient.js";

// Validate env (don't hard exit in serverless)
const { SUPABASE_URL, SUPABASE_KEY, PORT = 3000 } = process.env;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn(
    "Warning: SUPABASE_URL or SUPABASE_KEY not set. Configure env in Vercel project settings."
  );
}

// Create Express app
const app = express();
// Manual CORS to reflect Origin and allow credentials (prevents wildcard '*')
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
    res.header("Access-Control-Allow-Credentials", "true");
    const reqHeaders = req.headers["access-control-request-headers"]; // echo requested headers
    res.header(
      "Access-Control-Allow-Headers",
      reqHeaders || "Content-Type, Authorization, X-Requested-With"
    );
    res.header(
      "Access-Control-Allow-Methods",
      "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS"
    );
    if (req.method === "OPTIONS") return res.sendStatus(204);
  }
  next();
});
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);
app.use(cookieParser());
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    console.error("JSON parse error:", err.message, "raw:", req.rawBody);
    return res.status(400).json({ error: "Invalid JSON", detail: err.message });
  }
  next(err);
});

// Basic routes
app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Backend_SatSun server is running." });
});

app.get("/api/health", async (_req, res) => {
  try {
    const projectRef = SUPABASE_URL
      ? new URL(SUPABASE_URL).host.split(".")[0]
      : null;
    return res.json({ ok: true, supabase: { projectRef }, port: Number(PORT) });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Health check failed" });
  }
});

// Expose the supabase client if needed elsewhere
export { supabase };

// API routes
app.use("/api", router);

export default app;
