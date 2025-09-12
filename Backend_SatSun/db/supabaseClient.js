import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_KEY, VERCEL } = process.env;
let supabase = null;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  const msg = "Missing SUPABASE_URL or SUPABASE_KEY.";
  if (VERCEL) {
    console.warn(msg);
  } else {
    console.warn(msg);
  }
} else {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (e) {
    console.error("Failed to init Supabase client:", e?.message || e);
  }
}

export { supabase };
