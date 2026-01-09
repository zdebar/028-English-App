import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { CORS_HEADERS } from "../shared/constants.ts";

interface reqPayload {
  name: string;
}

console.info("server started");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  const { name }: reqPayload = await req.json();
  const data = {
    message: `Hello ${name}!`,
  };

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
      Connection: "keep-alive",
    },
  });
});
