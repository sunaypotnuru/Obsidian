/**
 * System Health API Route
 * Returns real-time system health metrics for the admin dashboard.
 */

const BACKEND_URL = process.env.VITE_API_URL || "http://localhost:8000";

const SERVICES = [
  { name: "Backend API", url: `${BACKEND_URL}/health` },
  { name: "FDA APM Service", url: "http://localhost:8002/health" },
  { name: "IEC 62304 Service", url: "http://localhost:8003/health" },
  { name: "SOC 2 Service", url: "http://localhost:8004/health" },
];

async function checkService(
  name: string,
  url: string
): Promise<{ name: string; status: string; latency: number }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return { name, status: res.ok ? "healthy" : "degraded", latency: Date.now() - start };
  } catch {
    return { name, status: "unreachable", latency: Date.now() - start };
  }
}

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const metric = url.searchParams.get("metric");

    const services =
      metric === "services" || !metric
        ? await Promise.all(SERVICES.map((s) => checkService(s.name, s.url)))
        : [];

    const now = new Date().toISOString();

    // System metrics (simulated — replace with real OS metrics in production)
    const system = {
      cpu: { usage: Math.random() * 40 + 10, cores: 4 },
      memory: {
        used: Math.round(Math.random() * 2048 + 512),
        total: 8192,
        unit: "MB",
      },
      disk: {
        used: Math.round(Math.random() * 50 + 20),
        total: 100,
        unit: "GB",
      },
    };

    return Response.json({
      success: true,
      data: {
        timestamp: now,
        system,
        ...(services.length > 0 ? { services } : {}),
      },
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
