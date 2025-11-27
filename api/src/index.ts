import { GmailService } from "./email/gmail";

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 5; // requests
const RATE_WINDOW = 60_000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_WINDOW);

  if (recent.length >= RATE_LIMIT) return true;

  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

// CORS headers
function corsHeaders(origin: string) {
  const allowed = process.env.ALLOWED_ORIGIN || "http://localhost:3000";
  return {
    "Access-Control-Allow-Origin": origin === allowed ? allowed : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

const server = Bun.serve({
  port: process.env.PORT || 3001,

  async fetch(req) {
    const url = new URL(req.url);
    const origin = req.headers.get("origin") || "";

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    // Health check
    if (url.pathname === "/health") {
      return Response.json({ status: "ok" });
    }

    // Form submission endpoint
    if (url.pathname === "/submit" && req.method === "POST") {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";

      if (isRateLimited(ip)) {
        return Response.json(
          { error: "Too many requests" },
          { status: 429, headers: corsHeaders(origin) }
        );
      }

      try {
        const body = await req.json();
        const { name, email, message } = body;

        // Validation
        if (!name || !email) {
          return Response.json(
            { error: "Name and email required" },
            { status: 400, headers: corsHeaders(origin) }
          );
        }

        // Send notification email
        await GmailService.send({
          to: process.env.GMAIL_USER!,
          subject: `[SellerSquared] Interest from ${name}`,
          text: `Name: ${name}\nEmail: ${email}\nMessage: ${message || "N/A"}`,
          html: `
            <h2>New Interest Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong> ${message || "N/A"}</p>
          `,
        });

        return Response.json(
          { success: true },
          { headers: corsHeaders(origin) }
        );
      } catch (err) {
        console.error("Submit error:", err);
        return Response.json(
          { error: "Failed to process request" },
          { status: 500, headers: corsHeaders(origin) }
        );
      }
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
});

console.log(`Server running on port ${server.port}`);
