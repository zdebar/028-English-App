// Edge Function: delete-user
// POST JSON body: { userId: "..." } or { user_id: "..." }
// Requires Authorization: Bearer <user access token> header

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, content-type, x-client-info, apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
        Connection: "keep-alive",
      },
    });
  }

  try {
    const authHeader =
      req.headers.get("Authorization") ??
      req.headers.get("authorization") ??
      "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization Bearer token" }),
        {
          status: 401,
          headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json",
            Connection: "keep-alive",
          },
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const userId = (body.userId ?? body.user_id) as string | undefined;
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      return new Response(
        JSON.stringify({
          error: "Missing or invalid user id (userId or user_id)",
        }),
        {
          status: 400,
          headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json",
            Connection: "keep-alive",
          },
        }
      );
    }

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
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
        Connection: "keep-alive",
      },
    });
  }
});
