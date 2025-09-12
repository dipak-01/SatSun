import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_KEY, VERCEL } = process.env;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  const msg = "Missing SUPABASE_URL or SUPABASE_KEY.";
  if (VERCEL) {
    // In Vercel, log a warning instead of exiting to allow project to boot
    console.warn(msg);
  } else {
    throw new Error(msg);
  }
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
