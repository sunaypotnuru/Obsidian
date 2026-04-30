import { motion } from "motion/react";
import { MessageSquare, Clock, CheckCircle, AlertCircle, Search } from "lucide-react";
import { Card } from "../../components/ui/card";
import { useState } from "react";

const complaints = [
  { id: "CMP-2026-001", date: "2026-04-28", subject: "Incorrect diagnosis result displayed", category: "Clinical", severity: "High", status: "Open" },
  { id: "CMP-2026-002", date: "2026-04-25", subject: "Unable to book appointment", category: "Technical", severity: "Medium", status: "In Progress" },
  { id: "CMP-2026-003", date: "2026-04-20", subject: "Billing discrepancy in subscription", category: "Billing", severity: "Medium", status: "Resolved" },
  { id: "CMP-2026-004", date: "2026-04-18", subject: "Privacy concern with data sharing", category: "Privacy", severity: "High", status: "Under Review" },
  { id: "CMP-2026-005", date: "2026-04-10", subject: "Doctor did not join video call", category: "Clinical", severity: "Low", status: "Resolved" },
];

const severityColors: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-green-100 text-green-700",
};
const statusColors: Record<string, string> = {
  Open: "bg-red-100 text-red-700",
  "In Progress": "bg-blue-100 text-blue-700",
  "Under Review": "bg-amber-100 text-amber-700",
  Resolved: "bg-green-100 text-green-700",
};

export default function AdminComplaintManagement() {
  const [query, setQuery] = useState("");
  const filtered = complaints.filter(c =>
    c.subject.toLowerCase().includes(query.toLowerCase()) ||
    c.id.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  const counts = {
    open: complaints.filter(c => c.status === "Open").length,
    inProgress: complaints.filter(c => c.status === "In Progress" || c.status === "Under Review").length,
    resolved: complaints.filter(c => c.status === "Resolved").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] mb-1">Complaint Management</h1>
        <p className="text-[#64748B] text-sm">Track and resolve patient/doctor complaints in compliance with FDA MDR requirements</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-white border border-gray-100">
          <AlertCircle className="w-6 h-6 text-red-500 mb-2" />
          <p className="text-2xl font-bold text-[#0F172A]">{counts.open}</p>
          <p className="text-sm text-[#64748B]">Open Complaints</p>
        </Card>
        <Card className="p-5 bg-white border border-gray-100">
          <Clock className="w-6 h-6 text-amber-500 mb-2" />
          <p className="text-2xl font-bold text-[#0F172A]">{counts.inProgress}</p>
          <p className="text-sm text-[#64748B]">In Progress / Under Review</p>
        </Card>
        <Card className="p-5 bg-white border border-gray-100">
          <CheckCircle className="w-6 h-6 text-green-500 mb-2" />
          <p className="text-2xl font-bold text-[#0F172A]">{counts.resolved}</p>
          <p className="text-sm text-[#64748B]">Resolved</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-[#0F172A]">All Complaints</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search complaints..."
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-[#64748B]">
                <th className="pb-3 pr-4">ID</th>
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Subject</th>
                <th className="pb-3 pr-4">Category</th>
                <th className="pb-3 pr-4">Severity</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer">
                  <td className="py-3 pr-4 font-mono text-xs">{c.id}</td>
                  <td className="py-3 pr-4 text-[#64748B]">{c.date}</td>
                  <td className="py-3 pr-4 max-w-xs truncate">{c.subject}</td>
                  <td className="py-3 pr-4">{c.category}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityColors[c.severity]}`}>{c.severity}</span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[c.status]}`}>{c.status}</span>
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
