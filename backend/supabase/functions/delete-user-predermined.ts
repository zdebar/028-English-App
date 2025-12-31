import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DAYS_BEFORE_DELETION = 30;
const MS_IN_DAY = 24 * 60 * 60 * 1000;

serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const client = createClient(supabaseUrl, supabaseKey);

  const cutoffDate = new Date(
    Date.now() - DAYS_BEFORE_DELETION * MS_IN_DAY
  ).toISOString();

  const { data: users, error } = await client
    .from("users")
    .select("id, deleted_at")
    .not("deleted_at", "is", null)
    .lt("deleted_at", cutoffDate);

  if (error) {
    return new Response(`Error fetching users: ${error.message}`, {
      status: 500,
    });
  }

  for (const user of users) {
    await client.auth.admin.deleteUser(user.id);
  }

  return new Response(`Deleted ${users.length} users`, { status: 200 });
});
