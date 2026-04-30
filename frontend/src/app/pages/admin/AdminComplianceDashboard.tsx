import { motion } from "motion/react";
import { Shield, CheckCircle, Clock, AlertCircle, GitBranch, Lock, Activity } from "lucide-react";
import { Card } from "../../components/ui/card";

const complianceAreas = [
  { name: "FDA APM (21 CFR 820)", score: 94, icon: Shield, color: "text-blue-600", bg: "bg-blue-50" },
  { name: "IEC 62304 Software Lifecycle", score: 87, icon: GitBranch, color: "text-purple-600", bg: "bg-purple-50" },
  { name: "SOC 2 Type II", score: 91, icon: Lock, color: "text-green-600", bg: "bg-green-50" },
  { name: "HIPAA Security Rule", score: 96, icon: Activity, color: "text-teal-600", bg: "bg-teal-50" },
  { name: "FHIR R4 Interoperability", score: 98, icon: CheckCircle, color: "text-indigo-600", bg: "bg-indigo-50" },
  { name: "Complaint Management", score: 80, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
];

export default function AdminComplianceDashboard() {
  const overallScore = Math.round(complianceAreas.reduce((s, c) => s + c.score, 0) / complianceAreas.length);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] mb-1">Compliance Dashboard</h1>
        <p className="text-[#64748B] text-sm">Enterprise Healthcare Compliance — FDA, IEC 62304, SOC 2, HIPAA &amp; FHIR</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-teal-50 to-blue-50 border-0 col-span-1">
          <p className="text-sm text-[#64748B] mb-1">Overall Compliance Score</p>
          <p className="text-5xl font-extrabold text-teal-600">{overallScore}%</p>
          <p className="text-xs text-[#64748B] mt-2">Across {complianceAreas.length} regulatory frameworks</p>
        </Card>
        <Card className="p-5 bg-white border border-gray-100">
          <CheckCircle className="w-6 h-6 text-green-500 mb-2" />
          <p className="text-2xl font-bold text-[#0F172A]">5/6</p>
          <p className="text-sm text-[#64748B]">Frameworks Passing</p>
        </Card>
        <Card className="p-5 bg-white border border-gray-100">
          <Clock className="w-6 h-6 text-amber-500 mb-2" />
          <p className="text-2xl font-bold text-[#0F172A]">3</p>
          <p className="text-sm text-[#64748B]">Open Action Items</p>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {complianceAreas.map((area, i) => {
          const Icon = area.icon;
          return (
            <motion.div key={area.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="p-5 bg-white border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                <div className={`w-10 h-10 rounded-xl ${area.bg} ${area.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="font-semibold text-[#0F172A] text-sm mb-3">{area.name}</p>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div className={`h-2 rounded-full ${area.score >= 90 ? "bg-green-500" : area.score >= 80 ? "bg-teal-500" : "bg-amber-500"}`}
                    style={{ width: `${area.score}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#0F172A]">{area.score}%</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${area.score >= 90 ? "bg-green-100 text-green-700" : area.score >= 80 ? "bg-teal-100 text-teal-700" : "bg-amber-100 text-amber-700"}`}>
                    {area.score >= 90 ? "Excellent" : area.score >= 80 ? "Good" : "Needs Work"}
                  </span>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
