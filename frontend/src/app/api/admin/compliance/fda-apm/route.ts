/**
 * FDA APM API Proxy Route
 * Forwards requests to the FDA APM microservice.
 */

const FDA_APM_URL = process.env.VITE_FDA_APM_URL || "http://localhost:8002";
const TIMEOUT_MS = 10000;

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const endpoint = url.searchParams.get("endpoint") || "/";
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(`${FDA_APM_URL}${endpoint}`, {
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timer);

      // Handle CSV export responses
      if (endpoint.includes("export-csv")) {
        const blob = await res.blob();
        return new Response(blob, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": 'attachment; filename="fda-apm-export.csv"',
          },
        });
      }

      const data = await res.json();
      return Response.json(data, { status: res.status });
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === "AbortError") {
        return Response.json({ success: false, error: "Request timeout" }, { status: 504 });
      }
      throw err;
    }
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const endpoint = url.searchParams.get("endpoint") || "/";
    const body = await request.text();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(`${FDA_APM_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: controller.signal,
      });
      clearTimeout(timer);
      const data = await res.json();
      return Response.json(data, { status: res.status });
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === "AbortError") {
        return Response.json({ success: false, error: "Request timeout" }, { status: 504 });
      }
      throw err;
    }
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
