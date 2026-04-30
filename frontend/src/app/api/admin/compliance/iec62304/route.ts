/**
 * IEC 62304 API Proxy Route
 * Forwards requests to the IEC 62304 compliance service.
 */

const IEC_URL = process.env.VITE_IEC62304_URL || "http://localhost:8003";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const endpoint = url.searchParams.get("endpoint") || "/";

    const res = await fetch(`${IEC_URL}${endpoint}`, {
      headers: { "Content-Type": "application/json" },
    });

    // Handle CSV export
    if (endpoint.includes("export-csv")) {
      const blob = await res.blob();
      return new Response(blob, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="iec62304-traceability.csv"',
        },
      });
    }

    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
