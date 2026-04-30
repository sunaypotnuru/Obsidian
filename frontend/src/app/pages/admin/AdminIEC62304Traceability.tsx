import { motion } from "motion/react";
import { GitBranch, CheckCircle, Clock, FileText } from "lucide-react";
import { Card } from "../../components/ui/card";

const phases = [
  { phase: "1 - Concept", status: "Complete", items: 8, done: 8 },
  { phase: "2 - Design", status: "Complete", items: 12, done: 12 },
  { phase: "3 - Implementation", status: "Complete", items: 24, done: 24 },
  { phase: "4 - Verification", status: "In Progress", items: 18, done: 14 },
  { phase: "5 - Release", status: "Pending", items: 10, done: 0 },
  { phase: "6 - Post-Production", status: "Pending", items: 6, done: 0 },
];

export default function AdminIEC62304Traceability() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] mb-1">IEC 62304 Traceability</h1>
        <p className="text-[#64748B] text-sm">Medical Device Software Lifecycle Compliance &amp; Requirement Traceability Matrix</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-white border border-gray-100">
          <CheckCircle className="w-6 h-6 text-green-500 mb-2" />
          <p className="text-2xl font-bold text-[#0F172A]">44</p>
          <p className="text-sm text-[#64748B]">Requirements Verified</p>
        </Card>
        <Card className="p-5 bg-white border border-gray-100">
          <Clock className="w-6 h-6 text-amber-500 mb-2" />
          <p className="text-2xl font-bold text-[#0F172A]">14</p>
          <p className="text-sm text-[#64748B]">In Progress</p>
        </Card>
        <Card className="p-5 bg-white border border-gray-100">
          <FileText className="w-6 h-6 text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-[#0F172A]">78</p>
          <p className="text-sm text-[#64748B]">Total Requirements</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <GitBranch className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-[#0F172A]">Software Development Lifecycle Phases</h2>
        </div>
        <div className="space-y-4">
          {phases.map((p, i) => (
            <motion.div key={p.phase} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${p.status === "Complete" ? "bg-green-500" : p.status === "In Progress" ? "bg-amber-500" : "bg-gray-300"}`} />
                <span className="font-medium text-[#0F172A]">Phase {p.phase}</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-sm text-[#64748B]">{p.done}/{p.items} items</div>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="h-2 rounded-full bg-teal-500 transition-all" style={{ width: `${(p.done / p.items) * 100}%` }} />
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.status === "Complete" ? "bg-green-100 text-green-700" : p.status === "In Progress" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
                  {p.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}
