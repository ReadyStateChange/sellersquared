import { ActiveEmailService, verifyResend } from "./email/index";

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
      return Response.json({
        status: "ok",
        resendConfigured: !!process.env.RESEND_API_KEY,
        timestamp: new Date().toISOString(),
      });
    }

    // Simple config check
    if (url.pathname === "/debug/config") {
      const apiKey = process.env.RESEND_API_KEY;
      const fromEmail = process.env.RESEND_FROM_EMAIL;
      return Response.json({
        status: "ok",
        resend: {
          apiKey: apiKey ? `${apiKey.slice(0, 6)}***` : "NOT SET",
          fromEmail: fromEmail || "onboarding@resend.dev (default)",
        },
        env: process.env.NODE_ENV || "not set",
        timestamp: new Date().toISOString(),
      });
    }

    // Debug endpoint - check email config without sending
    if (url.pathname === "/debug/email" && req.method === "GET") {
      console.log("[Debug] /debug/email called");
      try {
        const result = await verifyResend();
        console.log("[Debug] verifyResend result:", result);
        return Response.json({
          status: result.verified ? "ok" : "config_error",
          message: result.verified
            ? "Resend API connection verified"
            : "Configuration issue",
          ...result,
        });
      } catch (err) {
        const e = err as any;
        console.error("[Debug] verifyResend error:", e);
        return Response.json(
          {
            status: "error",
            errorName: e?.name,
            errorMessage: e?.message,
          },
          { status: 500 }
        );
      }
    }

    // Form submission endpoint - accepts quickly, sends email async
    if (url.pathname === "/submit" && req.method === "POST") {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
      const requestId = crypto.randomUUID().slice(0, 8);

      console.log(`[${requestId}] POST /submit from ${ip}`);

      if (isRateLimited(ip)) {
        console.log(`[${requestId}] Rate limited`);
        return Response.json(
          { error: "Too many requests" },
          { status: 429, headers: corsHeaders(origin) }
        );
      }

      try {
        const body = (await req.json()) as {
          name?: string;
          email?: string;
          message?: string;
        };
        const { name, email, message } = body;

        console.log(`[${requestId}] Received:`, {
          name,
          email: email?.slice(0, 5) + "***",
        });

        // Validation
        if (!name || !email) {
          console.log(
            `[${requestId}] Validation failed: missing name or email`
          );
          return Response.json(
            { error: "Name and email required" },
            { status: 400, headers: corsHeaders(origin) }
          );
        }

        // Fire-and-forget: send email in background, respond immediately
        console.log(
          `[${requestId}] Queuing email, returning success immediately`
        );

        // Don't await - let it run in background
        ActiveEmailService.send({
          to: process.env.NOTIFICATION_EMAIL || process.env.RESEND_FROM_EMAIL!,
          subject: `[SellerSquared] Interest from ${name}`,
          text: `Name: ${name}\nEmail: ${email}\nMessage: ${message || "N/A"}`,
          html: `
            <h2>New Interest Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong> ${message || "N/A"}</p>
          `,
        })
          .then(() => console.log(`[${requestId}] Email sent successfully`))
          .catch((err) =>
            console.error(`[${requestId}] Email send FAILED:`, err)
          );

        return Response.json(
          { success: true, requestId },
          { headers: corsHeaders(origin) }
        );
      } catch (err) {
        console.error(`[${requestId}] Parse error:`, err);
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
