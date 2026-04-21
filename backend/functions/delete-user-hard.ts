// Edge Function: delete-user
// POST JSON body: { userId: "..." } or { user_id: "..." }
// Requires Authorization: Bearer <user access token> header
// Only allows a user to delete their own account (userId === authenticated user's id)

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, content-type, x-client-info, apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

async function getUserFromAccessToken(accessToken: string) {
  if (!SUPABASE_URL) {
    throw new Error("Missing SUPABASE_URL");
  }
  if (!SUPABASE_ANON_KEY) {
    throw new Error("Missing SUPABASE_ANON_KEY");
  }

  const url = `${SUPABASE_URL.replace(/\/$/, "")}/auth/v1/user`;
  // Check if token looks like a JWT
  if (!/^[\w-]+\.[\w-]+\.[\w-]+$/.test(accessToken)) {
    throw new Error("Access token is not a valid JWT");
  }
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY,
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
  if (!SUPABASE_URL) {
    return { ok: false, status: 500, body: "Missing SUPABASE_URL" };
  }
  if (!SERVICE_ROLE_KEY) {
    return {
      ok: false,
      status: 500,
      body: "Missing SUPABASE_SERVICE_ROLE_KEY",
    };
  }

  const url = `${SUPABASE_URL.replace(
    /\/$/,
    "",
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

async function deleteUserRow(userId: string) {
  if (!SUPABASE_URL) {
    return { ok: false, status: 500, body: "Missing SUPABASE_URL" };
  }
  if (!SERVICE_ROLE_KEY) {
    return {
      ok: false,
      status: 500,
      body: "Missing SUPABASE_SERVICE_ROLE_KEY",
    };
  }

  const url = `${SUPABASE_URL.replace(
    /\/$/,
    "",
  )}/rest/v1/users?id=eq.${encodeURIComponent(userId)}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      Prefer: "return=representation",
    },
  });
  const text = await res.text().catch(() => "");
  let body: any = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {}
  return { ok: res.ok, status: res.status, body };
}

function isstringV4(str: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    str,
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
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    // Try both 'Authorization' and 'authorization'
    let authHeader =
      req.headers.get("Authorization") ??
      req.headers.get("authorization") ??
      "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "Missing Authorization Bearer token" }, 401);
    }
    const accessToken = authHeader.slice(7).trim();
    if (!accessToken) {
      return jsonResponse({ error: "Missing access token" }, 401);
    }

    // Validate token and get user
    let userInfo: any;
    try {
      userInfo = await getUserFromAccessToken(accessToken);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const status = message.startsWith("Missing SUPABASE_") ? 500 : 401;
      return jsonResponse({ error: message }, status);
    }

    const jwtUserId = userInfo?.id;
    if (!jwtUserId) {
      return jsonResponse(
        { error: "Could not determine authenticated user id" },
        401,
      );
    }

    const body = await req.json().catch(() => ({}));
    const userId = (body.userId ?? body.user_id) as string | undefined;
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      return jsonResponse(
        {
          error: "Missing or invalid user id (userId or user_id)",
        },
        400,
      );
    }

    if (!isstringV4(userId.trim())) {
      return jsonResponse(
        { error: "Invalid userId format (must be string v4)" },
        400,
      );
    }

    if (userId.trim() !== jwtUserId) {
      return jsonResponse(
        { error: "Forbidden: can only delete own user" },
        403,
      );
    }

    // Hard delete user row in users table
    const deleteUserResult = await deleteUserRow(userId.trim());
    if (!deleteUserResult.ok) {
      return jsonResponse(
        {
          error: deleteUserResult.body ?? "Failed to delete user row",
        },
        deleteUserResult.status,
      );
    }

    const result = await deleteAuthUser(userId.trim());
    if (!result.ok) {
      return jsonResponse(
        { error: result.body ?? "Failed to delete user" },
        result.status,
      );
    }

    return jsonResponse({ success: true }, 200);
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500);
  }
});
