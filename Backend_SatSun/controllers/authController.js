import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { supabase } from "../db/supabaseClient.js";

const {
  JWT_SECRET = "dev-secret",
  JWT_EXPIRES_IN = "60m",
  JWT_REFRESH_EXPIRES_IN = "7d",
} = process.env;

function signTokens(user) {
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      supabaseUserId: user.supabase_user_id || null,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  const refreshToken = jwt.sign({ sub: user.id, type: "refresh" }, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
  return { accessToken, refreshToken };
}

// Cookie options helper: allow cross-site in production
const isProd = process.env.NODE_ENV === "production";
const baseCookieOptions = {
  httpOnly: true,
  sameSite: isProd ? "none" : "lax",
  secure: isProd,
  path: "/",
};

export async function register(req, res) {
  try {
    const { email, name, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "email and password required" });

    const { data: existing, error: findErr } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (findErr) throw findErr;
    if (existing)
      return res.status(409).json({ error: "Email already registered" });

    const password_hash = await bcrypt.hash(password, 10);

    const { data: user, error } = await supabase
      .from("users")
      .insert({ email, name, password_hash })
      .select()
      .single();
    if (error) throw error;

    const tokens = signTokens(user);
    await supabase
      .from("users")
      .update({ refresh_token: tokens.refreshToken })
      .eq("id", user.id);

  res.cookie("accessToken", tokens.accessToken, baseCookieOptions);
  res.cookie("refreshToken", tokens.refreshToken, baseCookieOptions);
    return res.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (e) {
    console.error('register error:', e);
    return res.status(500).json({
      error: 'register failed',
      detail: process.env.NODE_ENV !== 'production' ? (e?.message || String(e)) : undefined
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "email and password required" });
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();
    if (error) throw error;
    if (!user || !user.password_hash)
      return res.status(401).json({ error: "invalid credentials" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "invalid credentials" });

    const tokens = signTokens(user);
    await supabase
      .from("users")
      .update({ refresh_token: tokens.refreshToken })
      .eq("id", user.id);

  res.cookie("accessToken", tokens.accessToken, baseCookieOptions);
  res.cookie("refreshToken", tokens.refreshToken, baseCookieOptions);
    return res.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (e) {
    return res.status(500).json({ error: "login failed" });
  }
}

export async function refresh(req, res) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: "missing refresh token" });
    const payload = jwt.verify(token, JWT_SECRET);
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", payload.sub)
      .maybeSingle();
    if (error) throw error;
    if (!user || user.refresh_token !== token)
      return res.status(401).json({ error: "invalid refresh token" });

    const tokens = signTokens(user);
    await supabase
      .from("users")
      .update({ refresh_token: tokens.refreshToken })
      .eq("id", user.id);
  res.cookie("accessToken", tokens.accessToken, baseCookieOptions);
  res.cookie("refreshToken", tokens.refreshToken, baseCookieOptions);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(401).json({ error: "refresh failed" });
  }
}

export async function logout(req, res) {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        await supabase
          .from("users")
          .update({ refresh_token: null })
          .eq("id", payload.sub);
      } catch {}
    }
  // Clear with the same attributes to ensure deletion across sites
  res.clearCookie("accessToken", baseCookieOptions);
  res.clearCookie("refreshToken", baseCookieOptions);
    return res.json({ ok: true });
  } catch {
    return res.json({ ok: true });
  }
}
