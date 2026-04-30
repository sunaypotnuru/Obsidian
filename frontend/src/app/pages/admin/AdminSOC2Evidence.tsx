import { motion } from "motion/react";
import { Lock, CheckCircle, AlertCircle, ShieldCheck, FileCheck } from "lucide-react";
import { Card } from "../../components/ui/card";

const controls = [
  { category: "CC1 – Control Environment", score: 95, status: "Pass" },
  { category: "CC2 – Communication & Information", score: 92, status: "Pass" },
  { category: "CC3 – Risk Assessment", score: 88, status: "Pass" },
  { category: "CC4 – Monitoring Activities", score: 91, status: "Pass" },
  { category: "CC5 – Control Activities", score: 85, status: "Pass" },
  { category: "CC6 – Logical Access Controls", score: 97, status: "Pass" },
  { category: "CC7 – System Operations", score: 90, status: "Pass" },
  { category: "CC8 – Change Management", score: 78, status: "Needs Review" },
  { category: "CC9 – Risk Mitigation", score: 83, status: "Pass" },
];

export default function AdminSOC2Evidence() {
  const avg = Math.round(controls.reduce((s, c) => s + c.score, 0) / controls.length);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] mb-1">SOC 2 Evidence</h1>
        <p className="text-[#64748B] text-sm">SOC 2 Type II Trust Service Criteria — Evidence &amp; Compliance Tracking</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-white border border-gray-100">
          <ShieldCheck className="w-6 h-6 text-green-500 mb-2" />
          <p className="text-3xl font-bold text-[#0F172A]">{avg}%</p>
          <p className="text-sm text-[#64748B]">Overall Compliance Score</p>
        </Card>
        <Card className="p-5 bg-white border border-gray-100">
          <CheckCircle className="w-6 h-6 text-green-500 mb-2" />
          <p className="text-3xl font-bold text-[#0F172A]">8</p>
          <p className="text-sm text-[#64748B]">Controls Passing</p>
        </Card>
        <Card className="p-5 bg-white border border-gray-100">
          <AlertCircle className="w-6 h-6 text-amber-500 mb-2" />
          <p className="text-3xl font-bold text-[#0F172A]">1</p>
          <p className="text-sm text-[#64748B]">Controls Need Review</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Lock className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-[#0F172A]">Trust Service Criteria — Control Scores</h2>
        </div>
        <div className="space-y-3">
          {controls.map((c, i) => (
            <motion.div key={c.category} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
              className="flex items-center gap-4">
              <span className="text-sm text-[#64748B] w-72 shrink-0">{c.category}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all ${c.score >= 90 ? "bg-green-500" : c.score >= 80 ? "bg-teal-500" : "bg-amber-500"}`}
                  style={{ width: `${c.score}%` }} />
              </div>
              <span className="text-sm font-medium w-10 text-right">{c.score}%</span>
              <span className={`text-xs px-2 py-0.5 rounded font-medium w-28 text-center ${c.status === "Pass" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                {c.status}
              </span>
            </motion.div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileCheck className="w-5 h-5 text-teal-600" />
          <h2 className="font-bold text-[#0F172A]">Evidence Collection</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "Access Logs", count: "2,847 entries", color: "bg-blue-50 text-blue-700" },
            { label: "Security Incidents", count: "0 this quarter", color: "bg-green-50 text-green-700" },
            { label: "Policy Documents", count: "24 approved", color: "bg-purple-50 text-purple-700" },
          ].map(e => (
            <div key={e.label} className={`p-4 rounded-xl ${e.color}`}>
              <p className="font-semibold">{e.label}</p>
              <p className="text-sm mt-1">{e.count}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
