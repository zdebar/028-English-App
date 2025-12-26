// Edge Function: delete-user
// POST JSON body: { userId: "..." } or { user_id: "..." }
// Requires Authorization: Bearer <user access token> header
// Only allows a user to delete their own account (userId === authenticated user's id)

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, content-type, x-client-info, apikey",
};

async function getUserFromAccessToken(accessToken: string) {
  const url = `${SUPABASE_URL.replace(/\/$/, "")}/auth/v1/user`;
  // Check if token looks like a JWT
  if (!/^[\w-]+\.[\w-]+\.[\w-]+$/.test(accessToken)) {
    throw new Error("Access token is not a valid JWT");
  }
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SERVICE_ROLE_KEY,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to validate access token: ${res.status} ${text}`);
  }
  return res.json();
}

async function deleteAuthUser(userId: string) {
  const url = `${SUPABASE_URL.replace(
    /\/$/,
    ""
  )}/auth/v1/admin/users/${encodeURIComponent(userId)}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      Accept: "application/json",
    },
  });
  const text = await res.text().catch(() => "");
  let body: any = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {}
  return { ok: res.ok, status: res.status, body };
}

function isUuidV4(str: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    str
  );
}

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
    // Try both 'Authorization' and 'authorization'
    let authHeader =
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
    const accessToken = authHeader.slice(7).trim();
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Missing access token" }), {
        status: 401,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
          Connection: "keep-alive",
        },
      });
    }

    // Validate token and get user
    let userInfo: any;
    try {
      userInfo = await getUserFromAccessToken(accessToken);
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 401,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
          Connection: "keep-alive",
        },
      });
    }

    const jwtUserId = userInfo?.id;
    if (!jwtUserId) {
      return new Response(
        JSON.stringify({ error: "Could not determine authenticated user id" }),
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

    if (!isUuidV4(userId.trim())) {
      return new Response(
        JSON.stringify({ error: "Invalid userId format (must be UUID v4)" }),
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

    if (userId.trim() !== jwtUserId) {
      return new Response(
        JSON.stringify({ error: "Forbidden: can only delete own user" }),
        {
          status: 403,
          headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json",
            Connection: "keep-alive",
          },
        }
      );
    }

    const result = await deleteAuthUser(userId.trim());
    if (!result.ok) {
      return new Response(
        JSON.stringify({ error: result.body ?? "Failed to delete user" }),
        {
          status: result.status,
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
