import { CORS_HEADERS } from "./constants.ts";

export function validateBearerToken(req: Request): string | Response {
  const authHeader =
    req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";
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
  return authHeader.slice(7); // Return the token
}
