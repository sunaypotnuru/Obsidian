import { motion } from "motion/react";
import { Shield, CheckCircle, AlertCircle, FileText, Activity } from "lucide-react";
import { Card } from "../../components/ui/card";

const metrics = [
  { label: "FDA APM Compliance Score", value: "94%", status: "good", icon: CheckCircle },
  { label: "Open Post-Market Issues", value: "3", status: "warn", icon: AlertCircle },
  { label: "Reports Filed (YTD)", value: "12", status: "good", icon: FileText },
  { label: "Monitoring Sessions", value: "847", status: "good", icon: Activity },
];

export default function AdminFDAApmMonitoring() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] mb-1">FDA APM Monitoring</h1>
        <p className="text-[#64748B] text-sm">FDA 21 CFR Part 820 Post-Market Surveillance &amp; Adverse Event Tracking</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div key={m.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="p-5 bg-white border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <Icon className={`w-5 h-5 ${m.status === "good" ? "text-green-500" : "text-amber-500"}`} />
                  <span className="text-xs text-[#64748B]">{m.label}</span>
                </div>
                <p className="text-2xl font-bold text-[#0F172A]">{m.value}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-[#0F172A]">Post-Market Surveillance Events</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-[#64748B]">
                <th className="pb-3 pr-4">Event ID</th>
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Severity</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: "APM-2026-001", date: "2026-04-15", type: "Adverse Event Report", severity: "Moderate", status: "Under Review" },
                { id: "APM-2026-002", date: "2026-04-20", type: "Device Malfunction", severity: "Minor", status: "Resolved" },
                { id: "APM-2026-003", date: "2026-04-28", type: "Complaint", severity: "Low", status: "Open" },
              ].map(row => (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 pr-4 font-mono text-xs">{row.id}</td>
                  <td className="py-3 pr-4">{row.date}</td>
                  <td className="py-3 pr-4">{row.type}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${row.severity === "Moderate" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                      {row.severity}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${row.status === "Resolved" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
