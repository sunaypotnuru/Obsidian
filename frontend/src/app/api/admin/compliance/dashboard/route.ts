/**
 * Compliance Dashboard API Route
 * Aggregates data from FDA APM, IEC 62304, and SOC 2 services.
 */

interface MetricsData {
  sensitivity?: number;
  specificity?: number;
  auc_roc?: number;
}

interface IEC62304Data {
  design_coverage?: string;
  test_coverage?: string;
  full_traceability?: string;
}

interface SOC2Data {
  implementation_rate?: string;
  test_pass_rate?: string;
}

interface FDAData {
  models?: unknown[];
}

const BACKEND_URL = process.env.VITE_API_URL || "http://localhost:8000";

export async function GET(_request: Request): Promise<Response> {
  try {
    const [fdaRes, iecRes, soc2Res, alertsRes, metricsRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/compliance/fda-apm/models`, { headers: { "Content-Type": "application/json" } }),
      fetch(`${BACKEND_URL}/api/compliance/iec62304/summary`, { headers: { "Content-Type": "application/json" } }),
      fetch(`${BACKEND_URL}/api/compliance/soc2/summary`, { headers: { "Content-Type": "application/json" } }),
      fetch(`${BACKEND_URL}/api/compliance/fda-apm/alerts`, { headers: { "Content-Type": "application/json" } }),
      fetch(`${BACKEND_URL}/api/compliance/fda-apm/metrics/diabetic_retinopathy/latest`, { headers: { "Content-Type": "application/json" } }),
    ]);

    const [fda, iec62304, soc2, alerts, metrics] = await Promise.all([
      fdaRes.ok ? fdaRes.json() as Promise<FDAData> : {},
      iecRes.ok ? iecRes.json() as Promise<IEC62304Data> : {},
      soc2Res.ok ? soc2Res.json() as Promise<SOC2Data> : {},
      alertsRes.ok ? alertsRes.json() as Promise<unknown[]> : [],
      metricsRes.ok ? metricsRes.json() as Promise<MetricsData> : {},
    ]);

    const metricsTyped = metrics as MetricsData;
    const iec62304Typed = iec62304 as IEC62304Data;
    const soc2Typed = soc2 as SOC2Data;
    const fdaTyped = fda as FDAData;

    const fdaScore = Math.round(
      (((metricsTyped.sensitivity || 0) + (metricsTyped.specificity || 0) + (metricsTyped.auc_roc || 0)) / 3) * 100
    );
    const iecScore = Math.round(
      ((parseFloat(iec62304Typed.design_coverage || "0") +
        parseFloat(iec62304Typed.test_coverage || "0") +
        parseFloat(iec62304Typed.full_traceability || "0")) / 3)
    );
    const soc2Score = Math.round(
      (parseFloat(soc2Typed.implementation_rate || "0") + parseFloat(soc2Typed.test_pass_rate || "0")) / 2
    );
    const overallScore = Math.round((fdaScore + iecScore + soc2Score) / 3);

    return Response.json({
      success: true,
      data: {
        overall: { score: overallScore || 1, status: overallScore >= 90 ? "excellent" : overallScore >= 70 ? "good" : "warning" },
        fda: { score: fdaScore, models: Array.isArray(fdaTyped.models) ? fdaTyped.models : [] },
        iec62304: { score: iecScore, ...iec62304 },
        soc2: { score: soc2Score, ...soc2 },
        alerts: Array.isArray(alerts) ? alerts : [],
      },
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    return Response.json({ success: true, data: body });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
