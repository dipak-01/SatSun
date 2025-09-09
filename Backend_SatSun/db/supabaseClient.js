import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY.");
  process.exit(1);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
