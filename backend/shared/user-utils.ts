import { CORS_HEADERS } from "./constants.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

export async function softDeleteUser(userId: string): Promise<Response> {
  const url = `${SUPABASE_URL.replace(
    /\/$/,
    ""
  )}/rest/v1/users?id=eq.${encodeURIComponent(userId.trim())}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ deleted_at: new Date().toISOString() }),
  });
  const text = await res.text().catch(() => "");
  let bodyRes: any = text;
  try {
    bodyRes = text ? JSON.parse(text) : null;
  } catch {}
  if (!res.ok) {
    return new Response(
      JSON.stringify({
        error: bodyRes ?? "Failed to mark user as deleted",
      }),
      {
        status: res.status,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
          Connection: "keep-alive",
        },
      }
    );
  }
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
      Connection: "keep-alive",
    },
  });
}
