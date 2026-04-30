/**
 * SOC 2 API Proxy Route
 * Forwards requests to the SOC 2 compliance service.
 */

const SOC2_URL = process.env.VITE_SOC2_URL || "http://localhost:8004";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const endpoint = url.searchParams.get("endpoint") || "/";

    const res = await fetch(`${SOC2_URL}${endpoint}`, {
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    return Response.json(data, { status: res.status });
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

    const res = await fetch(`${SOC2_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
