import { createClient } from "@supabase/supabase-js";

// Replace with your Supabase project details
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);
