// Edge Function: demo-session
// POST JSON body: { captchaToken: "..." }
// Returns: { access_token, refresh_token, expires_in, token_type }

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

type SessionResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
};

type SignInResult =
  | { ok: true; payload: SessionResponse }
  | { ok: false; status: number; detail: string };

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, content-type, x-client-info, apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// prefer a non-reserved secret name. SUPABASE_ prefix is blocked for secrets,
// so we support PUBLISHABLE_KEY and fallbacks to common names if present.
const PUBLISHABLE_KEY =
  Deno.env.get("PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
  "";
// allow an explicit anon key env as well; fall back to the publishable key
const SUPABASE_ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("ANON_KEY") ??
  PUBLISHABLE_KEY;
const DEMO_EMAIL = Deno.env.get("DEMO_EMAIL") ?? "";
const DEMO_PASSWORD = Deno.env.get("DEMO_PASSWORD") ?? "";
const TURNSTILE_SECRET_KEY = Deno.env.get("TURNSTILE_SECRET_KEY") ?? "";

function jsonResponse(
  body: unknown,
  status: number,
  extraHeaders?: Record<string, string>,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}

async function signInDemoUser(captchaToken: string): Promise<SignInResult> {
  const url = `${SUPABASE_URL.replace(/\/$/, "")}/auth/v1/token?grant_type=password`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      // Use the anon/publishable key as the apikey header. We prefer an explicit
      // anon key but fall back to the (publishable) key stored in PUBLISHABLE_KEY.
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      captcha_token: captchaToken,
      gotrue_meta_security: {
        captcha_token: captchaToken,
      },
    }),
  });

  const text = await response.text().catch(() => "");
  // Try to parse JSON payload for normal flow
  let payload: SessionResponse = {};
  try {
    payload = (text && JSON.parse(text)) || {};
  } catch (err) {
    console.error("Failed to parse auth token response", { err, text });
  }

  if (!response.ok) {
    console.error("Auth token request failed", {
      status: response.status,
      body: text,
    });
    return {
      ok: false,
      status: response.status,
      detail: text || "Auth token request failed",
    };
  }

  return { ok: true, payload };
}

function validateEnvironment(): string | null {
  if (!SUPABASE_URL) return "Missing SUPABASE_URL";
  if (!SUPABASE_ANON_KEY && !PUBLISHABLE_KEY)
    return "Missing PUBLISHABLE_KEY or SUPABASE_ANON_KEY";
  if (!DEMO_EMAIL) return "Missing DEMO_EMAIL";
  if (!DEMO_PASSWORD) return "Missing DEMO_PASSWORD";
  if (!TURNSTILE_SECRET_KEY) return "Missing TURNSTILE_SECRET_KEY";
  return null;
}

async function verifyTurnstileToken(
  token: string,
  remoteip?: string,
): Promise<{ success: boolean; detail?: string }> {
  const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
  const params = new URLSearchParams();
  params.append("secret", TURNSTILE_SECRET_KEY);
  params.append("response", token);
  if (remoteip) params.append("remoteip", remoteip);

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await resp.json().catch(() => ({}));
    if (resp.ok && data && data.success) {
      return { success: true };
    }

    const detail = Array.isArray(data["error-codes"])
      ? data["error-codes"].join(", ")
      : JSON.stringify(data);
    return { success: false, detail };
  } catch (err) {
    console.error("Turnstile siteverify failed", err);
    return { success: false, detail: String(err) };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const envError = validateEnvironment();
  if (envError) {
    return jsonResponse({ error: envError }, 500);
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      captchaToken?: unknown;
    };
    const captchaToken =
      typeof body.captchaToken === "string" ? body.captchaToken.trim() : "";
    if (!captchaToken) {
      return jsonResponse({ error: "Missing captchaToken" }, 400);
    }

    const signInResult = await signInDemoUser(captchaToken);
    if (!signInResult.ok) {
      return jsonResponse(
        {
          error: "Demo authentication failed",
          detail: signInResult.detail,
        },
        signInResult.status,
      );
    }

    const demoSession = signInResult.payload;
    if (!demoSession.access_token || !demoSession.refresh_token) {
      console.error("Demo session payload is invalid", {
        payload: demoSession,
      });
      return jsonResponse({ error: "Demo session payload is invalid" }, 500);
    }

    return jsonResponse(
      {
        access_token: demoSession.access_token,
        refresh_token: demoSession.refresh_token,
        expires_in: demoSession.expires_in,
        token_type: demoSession.token_type,
      },
      200,
    );
  } catch (err) {
    // Log full error server-side for diagnostics
    console.error("Unable to create demo session", err);
    // Return limited detail to client to help debugging (safe to include message).
    const detail = err instanceof Error ? err.message : String(err);
    return jsonResponse(
      { error: "Unable to create demo session", detail },
      500,
    );
  }
});
