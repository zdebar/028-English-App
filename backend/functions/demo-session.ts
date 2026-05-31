// Edge Function: demo-session
// POST JSON body: {}
// Returns: { access_token, refresh_token, expires_in, token_type }

type SessionResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
};

type SignInSuccessResult = {
  ok: true;
  payload: SessionResponse;
};

type SignInErrorResult = {
  ok: false;
  status: number;
  detail: string;
};

type SignInResult = SignInSuccessResult | SignInErrorResult;

function isSignInErrorResult(result: SignInResult): result is SignInErrorResult {
  return result.ok === false;
}

type EdgeRuntime = {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

type RuntimeGlobals = typeof globalThis & {
  Deno?: EdgeRuntime;
  __demoSessionRateLimitStore?: Map<string, number[]>;
};

const runtimeGlobals = globalThis as RuntimeGlobals;
const edgeRuntime = runtimeGlobals.Deno;
const rateLimitStore = runtimeGlobals.__demoSessionRateLimitStore ??
  (runtimeGlobals.__demoSessionRateLimitStore = new Map<string, number[]>());

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, content-type, x-client-info, apikey",
};

const SUPABASE_URL = edgeRuntime?.env.get("SUPABASE_URL") ?? "";
// prefer a non-reserved secret name. SUPABASE_ prefix is blocked for secrets,
// so we support PUBLISHABLE_KEY and fallbacks to common names if present.
const PUBLISHABLE_KEY =
  edgeRuntime?.env.get("PUBLISHABLE_KEY") ??
  edgeRuntime?.env.get("SUPABASE_PUBLISHABLE_KEY") ??
  "";
// allow an explicit anon key env as well; fall back to the publishable key
const SUPABASE_ANON_KEY =
  edgeRuntime?.env.get("SUPABASE_ANON_KEY") ??
  edgeRuntime?.env.get("ANON_KEY") ??
  PUBLISHABLE_KEY;
const DEMO_EMAIL = edgeRuntime?.env.get("DEMO_EMAIL") ?? "";
const DEMO_PASSWORD = edgeRuntime?.env.get("DEMO_PASSWORD") ?? "";

function readEnvNumber(name: string, fallback: number): number {
  const rawValue = edgeRuntime?.env.get(name)?.trim();
  if (!rawValue) return fallback;

  const parsedValue = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
}

const RATE_LIMIT_BURST_WINDOW_MS = readEnvNumber(
  "DEMO_RATE_LIMIT_BURST_WINDOW_MS",
  30_000,
);
const RATE_LIMIT_BURST_MAX = readEnvNumber("DEMO_RATE_LIMIT_BURST_MAX", 4);
const RATE_LIMIT_WINDOW_MS = readEnvNumber("DEMO_RATE_LIMIT_WINDOW_MS", 600_000);
const RATE_LIMIT_MAX = readEnvNumber("DEMO_RATE_LIMIT_MAX", 10);

type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

function isRateLimitExceeded(
  result: RateLimitResult,
): result is { allowed: false; retryAfterSeconds: number } {
  return result.allowed === false;
}

function getClientIdentifier(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for") ?? "";
  const realIp = req.headers.get("x-real-ip") ?? "";
  const cfConnectingIp = req.headers.get("cf-connecting-ip") ?? "";
  const firstForwardedIp = forwardedFor.split(",")[0]?.trim() ?? "";
  const ipAddress = firstForwardedIp || realIp.trim() || cfConnectingIp.trim();

  if (ipAddress) {
    return `ip:${ipAddress}`;
  }

  const userAgent = req.headers.get("user-agent")?.trim() ?? "unknown";
  return `fallback:${userAgent}`;
}

function getRetryAfterSeconds(timestamps: number[], windowMs: number, now: number): number {
  if (timestamps.length === 0) return Math.ceil(windowMs / 1000);

  const oldestTimestamp = timestamps[0];
  return Math.max(1, Math.ceil((windowMs - (now - oldestTimestamp)) / 1000));
}

function checkRateLimit(req: Request): RateLimitResult {
  const clientIdentifier = getClientIdentifier(req);
  const now = Date.now();
  const storedTimestamps = rateLimitStore.get(clientIdentifier) ?? [];
  const longWindowTimestamps = storedTimestamps.filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );
  const burstWindowTimestamps = longWindowTimestamps.filter(
    (timestamp) => now - timestamp < RATE_LIMIT_BURST_WINDOW_MS,
  );

  if (burstWindowTimestamps.length >= RATE_LIMIT_BURST_MAX) {
    rateLimitStore.set(clientIdentifier, longWindowTimestamps);
    return {
      allowed: false,
      retryAfterSeconds: getRetryAfterSeconds(
        burstWindowTimestamps,
        RATE_LIMIT_BURST_WINDOW_MS,
        now,
      ),
    };
  }

  if (longWindowTimestamps.length >= RATE_LIMIT_MAX) {
    rateLimitStore.set(clientIdentifier, longWindowTimestamps);
    return {
      allowed: false,
      retryAfterSeconds: getRetryAfterSeconds(
        longWindowTimestamps,
        RATE_LIMIT_WINDOW_MS,
        now,
      ),
    };
  }

  longWindowTimestamps.push(now);
  rateLimitStore.set(clientIdentifier, longWindowTimestamps);

  return { allowed: true };
}

function logRateLimitExceeded(req: Request, retryAfterSeconds: number) {
  console.warn("Demo session rate limit exceeded", {
    clientIdentifier: getClientIdentifier(req),
    retryAfterSeconds,
    userAgent: req.headers.get("user-agent") ?? "unknown",
  });
}

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

async function signInDemoUser(): Promise<SignInResult> {
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
  return null;
}

if (!edgeRuntime) {
  throw new Error("Deno runtime is not available");
}

edgeRuntime.serve(async (req: Request) => {
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

  const rateLimitResult = checkRateLimit(req);
  if (isRateLimitExceeded(rateLimitResult)) {
    logRateLimitExceeded(req, rateLimitResult.retryAfterSeconds);
    return jsonResponse({ error: "Too many demo sign-in attempts" }, 429);
  }

  try {
    await req.json().catch(() => ({}));

    const signInResult = await signInDemoUser();
    if (isSignInErrorResult(signInResult)) {
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
