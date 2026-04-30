import { motion } from "motion/react";
import { Database, RefreshCw, CheckCircle, AlertCircle, Search } from "lucide-react";
import { Card } from "../../components/ui/card";
import { useState } from "react";

const resources = [
  { id: "patient-001", type: "Patient", version: "R4", status: "Valid", updated: "2026-04-29" },
  { id: "obs-diagnostic-047", type: "Observation", version: "R4", status: "Valid", updated: "2026-04-28" },
  { id: "appt-2026-0312", type: "Appointment", version: "R4", status: "Valid", updated: "2026-04-27" },
  { id: "med-req-0189", type: "MedicationRequest", version: "R4", status: "Needs Review", updated: "2026-04-20" },
  { id: "cond-retinopathy-22", type: "Condition", version: "R4", status: "Valid", updated: "2026-04-15" },
];

export default function AdminFHIRResourceManager() {
  const [query, setQuery] = useState("");
  const filtered = resources.filter(r =>
    r.id.toLowerCase().includes(query.toLowerCase()) ||
    r.type.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] mb-1">FHIR Resource Manager</h1>
        <p className="text-[#64748B] text-sm">HL7 FHIR R4 Interoperability — Resource Browser &amp; Validation</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-white border border-gray-100">
          <Database className="w-6 h-6 text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-[#0F172A]">1,284</p>
          <p className="text-sm text-[#64748B]">Total FHIR Resources</p>
        </Card>
        <Card className="p-5 bg-white border border-gray-100">
          <CheckCircle className="w-6 h-6 text-green-500 mb-2" />
          <p className="text-2xl font-bold text-[#0F172A]">98.2%</p>
          <p className="text-sm text-[#64748B]">Validation Pass Rate</p>
        </Card>
        <Card className="p-5 bg-white border border-gray-100">
          <RefreshCw className="w-6 h-6 text-teal-500 mb-2" />
          <p className="text-2xl font-bold text-[#0F172A]">R4</p>
          <p className="text-sm text-[#64748B]">FHIR Version</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-[#0F172A]">Resource Browser</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search resources..."
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-[#64748B]">
                <th className="pb-3 pr-4">Resource ID</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Version</th>
                <th className="pb-3 pr-4">Last Updated</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 pr-4 font-mono text-xs">{r.id}</td>
                  <td className="py-3 pr-4">{r.type}</td>
                  <td className="py-3 pr-4 text-[#64748B]">{r.version}</td>
                  <td className="py-3 pr-4 text-[#64748B]">{r.updated}</td>
                  <td className="py-3">
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium w-fit ${r.status === "Valid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {r.status === "Valid" ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {r.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
