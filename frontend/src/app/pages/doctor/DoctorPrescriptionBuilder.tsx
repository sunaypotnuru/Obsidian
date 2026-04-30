import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Plus, Trash2, Send, Loader2, FileText, Stethoscope,
  Hospital, Phone, Mail, Globe, MapPin, Calendar as CalendarIcon
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";
import jsPDF from "jspdf";
import DrugAutocomplete from "../../components/DrugAutocomplete";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../../lib/store";
import { doctorAPI } from "../../../lib/api";
import { supabase } from "../../../lib/supabase";

interface Medication {
    name: string;
    dosage: string;
    duration: string;
    instructions: string;
}

interface PatientRecord {
    id: string;
    full_name?: string;
    name?: string;
    email: string;
    age?: number;
    gender?: string;
    sex?: string;
}

interface DoctorProfile {
    id: string;
    full_name?: string;
    specialty?: string;
    hospital?: string;
    license_number?: string;
}

export default function DoctorPrescriptionBuilder() {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [patients, setPatients] = useState<PatientRecord[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string>("");
    const [diagnosis, setDiagnosis] = useState("");
    const [additionalNotes, setAdditionalNotes] = useState("");
    const [medications, setMedications] = useState<Medication[]>([
        { name: "", dosage: "", duration: "", instructions: "" }
    ]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);

    const prescriptionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const patRes = await doctorAPI.getPatients();
                setPatients(patRes.data || []);

                const profileRes = await supabase.from('profiles_doctor').select('*').eq('id', user?.id).single();
                if (profileRes.data) {
                    setDoctorProfile(profileRes.data);
                }
            } catch (err) {
                console.error("Failed to load initial data", err);
            }
        };
        fetchData();
    }, [user]);

    const handleAddMedication = () => {
        setMedications([...medications, { name: "", dosage: "", duration: "", instructions: "" }]);
    };

    const handleRemoveMedication = (index: number) => {
        setMedications(medications.filter((_, i) => i !== index));
    };

    const handleMedChange = (index: number, field: keyof Medication, value: string) => {
        const updated = [...medications];
        updated[index][field] = value;
        setMedications(updated);
    };

    const selectedPatient = patients.find(p => p.id === selectedPatientId);

    const handleGenerateAndSave = async () => {
        if (!selectedPatientId || !diagnosis.trim() || medications.some(m => !m.name.trim())) {
            toast.error(t("doctor.prescription.error_required", "Please fill in all required fields"));
            return;
        }

        setIsGenerating(true);
        try {
            // 1. Create the entry in database using the existing api.ts
            const payload = {
                patient_id: selectedPatientId,
                diagnosis,
                medications,
                additional_notes: additionalNotes || null
            };
            const rxRes = await doctorAPI.createPrescription(payload);
            const prescriptionId = rxRes.data.id;

            // 2. Generate PDF via jspdf (Manual Drawing for Reliability)
            const pdf = new jsPDF("p", "mm", "a4");
            const pageWidth = pdf.internal.pageSize.getWidth();
            
            // Header
            pdf.setFillColor(14, 165, 233); // #0EA5E9
            pdf.rect(0, 0, pageWidth, 2, "F");
            
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(22);
            pdf.setTextColor(15, 23, 42); // #0F172A
            pdf.text(doctorProfile?.full_name || user?.name || "Dr. NetraAI", 20, 20);
            
            pdf.setFont("helvetica", "medium");
            pdf.setFontSize(14);
            pdf.setTextColor(14, 165, 233);
            pdf.text(doctorProfile?.specialty || t("doctor.prescription.default_specialty", "Specialist Consultant"), 20, 28);
            
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(10);
            pdf.setTextColor(100, 116, 139);
            pdf.text(doctorProfile?.hospital || t("doctor.prescription.default_hospital", "NetraAI Telemedicine"), 20, 34);
            pdf.text(`${t("doctor.prescription.license", "License")}: ${doctorProfile?.license_number || "MED-ONL-2024"}`, 20, 39);
            
            // Contact info (right aligned)
            pdf.text(user?.email || "", pageWidth - 20, 20, { align: "right" });
            pdf.text("+91 9876543210", pageWidth - 20, 25, { align: "right" });
            pdf.text("www.netraai.com", pageWidth - 20, 30, { align: "right" });
            
            // Separator
            pdf.setDrawColor(229, 231, 235);
            pdf.line(20, 45, pageWidth - 20, 45);
            
            // Patient Details Box
            pdf.setFillColor(249, 250, 251);
            pdf.roundedRect(20, 52, pageWidth - 40, 25, 3, 3, "F");
            
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(9);
            pdf.setTextColor(107, 114, 128);
            pdf.text(t("doctor.prescription.patient_details", "PATIENT DETAILS").toUpperCase(), 25, 60);
            
            pdf.setFontSize(14);
            pdf.setTextColor(15, 23, 42);
            pdf.text(selectedPatient?.full_name || selectedPatient?.name || "Unknown Patient", 25, 68);
            
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(10);
            pdf.setTextColor(55, 65, 81);
            pdf.text(`${t("common.age", "Age")}: ${selectedPatient?.age || "--"} | ${t("common.sex", "Sex")}: ${selectedPatient?.gender || "--"} | ID: #${prescriptionId.substring(0, 8)}`, 25, 74);
            
            // Date (right)
            pdf.setFont("helvetica", "bold");
            pdf.text(new Date().toLocaleDateString(), pageWidth - 30, 68, { align: "right" });
            
            // Diagnosis
            let currentY = 90;
            pdf.setDrawColor(244, 63, 94); // Rose 500
            pdf.setLineWidth(1);
            pdf.line(20, currentY, 20, currentY + 15);
            
            pdf.setFontSize(9);
            pdf.setTextColor(107, 114, 128);
            pdf.text(t("doctor.prescription.clinical_diagnosis", "CLINICAL DIAGNOSIS").toUpperCase(), 25, currentY + 4);
            
            pdf.setFontSize(12);
            pdf.setTextColor(15, 23, 42);
            pdf.text(diagnosis, 25, currentY + 12);
            
            currentY += 30;
            
            // Rx Section
            pdf.setFont("times", "italic");
            pdf.setFontSize(36);
            pdf.setTextColor(14, 165, 233);
            pdf.text("Rx", 20, currentY);
            
            pdf.setDrawColor(14, 165, 233);
            pdf.setLineWidth(0.2);
            pdf.line(35, currentY - 5, pageWidth - 20, currentY - 5);
            
            currentY += 15;
            
            // Medications List
            medications.forEach((med, idx) => {
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(12);
                pdf.setTextColor(15, 23, 42);
                pdf.text(`${idx + 1}. ${med.name}`, 25, currentY);
                
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(10);
                pdf.setTextColor(55, 65, 81);
                pdf.text(`${med.dosage}  |  ${med.duration}`, 25, currentY + 6);
                
                if (med.instructions) {
                    pdf.setFont("helvetica", "italic");
                    pdf.setFontSize(9);
                    pdf.setTextColor(107, 114, 128);
                    pdf.text(`Note: ${med.instructions}`, 25, currentY + 11);
                    currentY += 22;
                } else {
                    currentY += 15;
                }
                
                // Add new page if needed
                if (currentY > 260) {
                    pdf.addPage();
                    currentY = 20;
                }
            });
            
            // Additional Notes
            if (additionalNotes) {
                currentY += 10;
                pdf.setDrawColor(229, 231, 235);
                pdf.line(20, currentY, pageWidth - 20, currentY);
                currentY += 10;
                
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(9);
                pdf.setTextColor(107, 114, 128);
                pdf.text(t("doctor.prescription.additional_instructions", "ADDITIONAL INSTRUCTIONS").toUpperCase(), 25, currentY);
                
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(10);
                pdf.setTextColor(31, 41, 55);
                
                const splitNotes = pdf.splitTextToSize(additionalNotes, pageWidth - 50);
                pdf.text(splitNotes, 25, currentY + 7);
            }
            
            // Footer (Signature)
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(15, 23, 42);
            pdf.text(doctorProfile?.full_name || user?.name || "", pageWidth - 25, 270, { align: "right" });
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9);
            pdf.setTextColor(14, 165, 233);
            pdf.text(doctorProfile?.specialty || "", pageWidth - 25, 275, { align: "right" });
            
            pdf.setFontSize(8);
            pdf.setTextColor(209, 213, 219);
            pdf.text(`Generated by NetraAI Engine • Ref: ${prescriptionId.substring(0, 12).toUpperCase()}`, pageWidth / 2, 285, { align: "center" });

            const pdfBlob = pdf.output("blob");

            // 3. Upload to backend (which bypasses RLS using service role)
            await doctorAPI.uploadPrescriptionPDF(prescriptionId, pdfBlob);

            toast.success(t("doctor.prescription.success", "Prescription generated & saved successfully!"));
            navigate("/doctor/dashboard");

        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : t("doctor.prescription.error", "Failed to generate prescription"));
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0F172A]">{t("doctor.prescription.title", "Digital Prescription Pad")}</h1>
                    <p className="text-sm text-[#64748B]">{t("doctor.prescription.subtitle", "Draft, preview, and generate official medical prescriptions.")}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* FORM COLUMN */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t("doctor.prescription.select_patient", "Select Patient")}</Label>
                            <select
                                className="w-full flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                value={selectedPatientId}
                                onChange={(e) => setSelectedPatientId(e.target.value)}
                            >
                                <option value="">{t("doctor.prescription.choose_patient", "-- Choose a patient --")}</option>
                                {patients.map(p => (
                                    <option key={p.id} value={p.id}>{p.full_name || p.name} ({p.email})</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>{t("common.diagnosis", "Diagnosis")}</Label>
                            <Input
                                placeholder={t("doctor.prescription.diagnosis_placeholder", "e.g., Acute Pharyngitis")}
                                value={diagnosis}
                                onChange={(e) => setDiagnosis(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <Label className="text-base font-semibold">{t("doctor.prescription.medications", "Medications")}</Label>
                            <Button variant="outline" size="sm" onClick={handleAddMedication}>
                                <Plus className="w-4 h-4 mr-2" /> {t("doctor.prescription.add_drug", "Add Drug")}
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {medications.map((med, index) => (
                                <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-100 relative">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleRemoveMedication(index)}
                                        disabled={medications.length === 1}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>

                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div className="space-y-2">
                                            <Label className="text-xs">{t("doctor.prescription.drug_name", "Drug Name")} <span className="text-[#0D9488] text-[10px]">({t("doctor.prescription.nih_autocomplete", "NIH autocomplete")})</span></Label>
                                            <DrugAutocomplete
                                                value={med.name}
                                                onChange={(val) => handleMedChange(index, "name", val)}
                                                placeholder={t("doctor.prescription.drug_placeholder", "Type drug name...")}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">{t("doctor.prescription.dosage", "Dosage")}</Label>
                                            <Input placeholder={t("doctor.prescription.dosage_placeholder", "e.g., 500mg")} value={med.dosage} onChange={(e) => handleMedChange(index, "dosage", e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">{t("doctor.prescription.duration", "Duration")}</Label>
                                            <Input placeholder={t("doctor.prescription.duration_placeholder", "e.g., 7 Days")} value={med.duration} onChange={(e) => handleMedChange(index, "duration", e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">{t("doctor.prescription.instructions", "Instructions")}</Label>
                                            <Input placeholder={t("doctor.prescription.instructions_placeholder", "e.g., After meals")} value={med.instructions} onChange={(e) => handleMedChange(index, "instructions", e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 space-y-2">
                        <Label>{t("doctor.prescription.notes", "Doctor's Additional Notes (Optional)")}</Label>
                        <textarea
                            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            placeholder={t("doctor.prescription.notes_placeholder", "Dietary advice, next follow-up date, etc.")}
                            value={additionalNotes}
                            onChange={(e) => setAdditionalNotes(e.target.value)}
                        />
                    </div>

                    <Button
                        className="w-full bg-[#0EA5E9] hover:bg-[#0284C7] text-white shadow-lg"
                        size="lg"
                        onClick={handleGenerateAndSave}
                        disabled={isGenerating}
                    >
                        {isGenerating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> {t("doctor.prescription.generating", "Generating PDF...")}</> : <><Send className="w-5 h-5 mr-2" /> {t("doctor.prescription.publish", "Publish Prescription")}</>}
                    </Button>
                </motion.div>

                {/* LIVE PREVIEW COLUMN */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:block">
                    <div className="sticky top-24">
                        <div className="mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-500" />
                            <h3 className="font-semibold text-gray-700">{t("doctor.prescription.live_preview", "Live Preview")}</h3>
                        </div>

                        {/* The visible preview representation */}
                        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 aspect-[1/1.414] overflow-hidden relative">
                            {/* Watermark */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                                <Stethoscope className="w-64 h-64 text-[#0EA5E9]" />
                            </div>

                            <div className="border-b-2 border-[#0EA5E9] pb-6 mb-6 flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-[#0F172A]">{doctorProfile?.full_name || user?.name || "Dr. NetraAI"}</h2>
                                    <p className="text-[#0EA5E9] font-medium">{doctorProfile?.specialty || t("doctor.prescription.default_specialty", "Specialist Consultant")}</p>
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Hospital className="w-3 h-3" /> {doctorProfile?.hospital || t("doctor.prescription.default_hospital", "NetraAI Telemedicine")}</p>
                                </div>
                                <div className="text-right text-xs text-gray-500 space-y-1">
                                    <p className="flex items-center justify-end gap-1"><Phone className="w-3 h-3" /> +91 9876543210</p>
                                    <p className="flex items-center justify-end gap-1"><Mail className="w-3 h-3" /> {user?.email}</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-end mb-6 text-sm bg-gray-50 p-4 rounded-lg">
                                <div>
                                    <p className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-1">{t("common.patient", "Patient")}</p>
                                    <p className="font-bold text-[#0F172A] text-lg">{selectedPatient?.full_name || selectedPatient?.name || t("doctor.prescription.no_patient", "No patient selected")}</p>
                                    <p className="text-gray-600">{t("common.age", "Age")}: {selectedPatient?.age || "--"} | {t("common.sex", "Sex")}: {selectedPatient?.gender || selectedPatient?.sex || "--"}</p>
                                </div>
                                <div className="text-right">
                                    <p className="flex items-center justify-end gap-1 text-gray-500 font-medium"><CalendarIcon className="w-4 h-4" /> {new Date().toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">{t("common.diagnosis", "Diagnosis")}</h3>
                                <p className="font-medium text-lg text-[#0F172A]">{diagnosis || "..."}</p>
                            </div>

                            <div className="mb-8 flex-1">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-3xl font-serif font-black text-[#0EA5E9] italic">Rx</span>
                                    <div className="h-px bg-gradient-to-r from-[#0EA5E9] to-transparent flex-1 opacity-30 mt-2" />
                                </div>

                                <div className="space-y-4">
                                    {medications.map((med, idx) => (
                                        <div key={idx} className="pl-4 border-l-2 border-gray-100">
                                            <p className="font-bold text-[#0F172A]">{med.name || "..."}</p>
                                            <p className="text-sm text-gray-600">
                                                {med.dosage && <span className="mr-3 font-medium text-[#0EA5E9]">{med.dosage}</span>}
                                                {med.duration && <span className="mr-3">🕒 {med.duration}</span>}
                                            </p>
                                            {med.instructions && <p className="text-xs text-gray-500 mt-1 italic">"{med.instructions}"</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {additionalNotes && (
                                <div className="mb-8 pt-4 border-t border-gray-100 border-dashed">
                                    <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">{t("doctor.prescription.notes_instructions", "Notes & Instructions")}</h3>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{additionalNotes}</p>
                                </div>
                            )}

                            <div className="absolute bottom-8 right-8 text-right">
                                <div className="w-32 h-12 bg-gray-100 rounded mb-2 flex items-center justify-center text-xs text-gray-400 border border-gray-200 border-dashed">{t("doctor.prescription.signature", "Signature")}</div>
                                <p className="text-sm font-bold text-[#0F172A]">{doctorProfile?.full_name || user?.name}</p>
                                <p className="text-xs text-gray-500">{doctorProfile?.specialty || t("doctor.prescription.default_specialty", "Specialist Consultant")}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* HIDDEN RENDER TARGET FOR HTML2CANVAS */}
            <div style={{ display: "none" }}>
                <div
                    ref={prescriptionRef}
                    data-prescription-container="true"
                    className="p-12 w-[800px] h-[1131px] relative font-sans" // Approximate A4 ratio 1:1.414 at 800px width
                    style={{ backgroundColor: '#ffffff', color: '#000000', display: 'none' }}
                >
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                        <Stethoscope className="w-96 h-96" style={{ color: '#0EA5E9' }} />
                    </div>

                    {/* Header */}
                    <div className="pb-8 mb-8 flex justify-between items-start" style={{ borderBottom: '4px solid #0EA5E9' }}>
                        <div>
                            <h2 className="text-4xl font-bold mb-2" style={{ color: '#0F172A' }}>{doctorProfile?.full_name || user?.name || "Dr. NetraAI"}</h2>
                            <p className="text-xl font-medium mb-2" style={{ color: '#0EA5E9' }}>{doctorProfile?.specialty || t("doctor.prescription.default_specialty", "Specialist Consultant")}</p>
                            <p className="flex items-center gap-2 mb-1" style={{ color: '#4B5563' }}><Hospital className="w-4 h-4" /> {doctorProfile?.hospital || t("doctor.prescription.default_hospital", "NetraAI Telemedicine")}</p>
                            <p className="flex items-center gap-2" style={{ color: '#4B5563' }}><MapPin className="w-4 h-4" /> {t("doctor.prescription.license", "License")}: {doctorProfile?.license_number || "MED-ONL-2024"}</p>
                        </div>
                        <div className="text-right text-sm space-y-2" style={{ color: '#4B5563' }}>
                            <p className="flex items-center justify-end gap-2"><Phone className="w-4 h-4" /> +91 9876543210</p>
                            <p className="flex items-center justify-end gap-2"><Mail className="w-4 h-4" /> {user?.email}</p>
                            <p className="flex items-center justify-end gap-2"><Globe className="w-4 h-4" /> www.netraai.com</p>
                        </div>
                    </div>

                    {/* Patient Info */}
                    <div className="flex justify-between items-end mb-10 p-6 rounded-xl border" style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}>
                        <div>
                            <p className="text-sm uppercase tracking-widest font-bold mb-2" style={{ color: '#6B7280' }}>{t("doctor.prescription.patient_details", "Patient Details")}</p>
                            <p className="font-bold text-2xl mb-1" style={{ color: '#0F172A' }}>{selectedPatient?.full_name || selectedPatient?.name || t("doctor.prescription.unknown_patient", "Unknown Patient")}</p>
                            <p className="font-medium" style={{ color: '#374151' }}>{t("common.age", "Age")}: {selectedPatient?.age || "--"} yrs &nbsp;&nbsp;|&nbsp;&nbsp; {t("common.sex", "Sex")}: {selectedPatient?.gender || selectedPatient?.sex || "--"} &nbsp;&nbsp;|&nbsp;&nbsp; ID: #{selectedPatient?.id?.substring(0, 8) || "0000"}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm uppercase tracking-widest font-bold mb-2" style={{ color: '#6B7280' }}>{t("common.date", "Date")}</p>
                            <p className="font-medium text-lg" style={{ color: '#000000' }}>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>

                    {/* Diagnosis */}
                    <div className="mb-10 pl-4 border-l-4" style={{ borderLeftColor: '#F43F5E' }}>
                        <h3 className="text-sm uppercase tracking-widest font-bold mb-2" style={{ color: '#6B7280' }}>{t("doctor.prescription.clinical_diagnosis", "Clinical Diagnosis")}</h3>
                        <p className="font-medium text-xl" style={{ color: '#0F172A' }}>{diagnosis}</p>
                    </div>

                    {/* Medications */}
                    <div className="mb-12">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-5xl font-serif font-black italic leading-none" style={{ color: '#0EA5E9' }}>Rx</span>
                            <div className="h-0.5 flex-1 mt-4" style={{ background: 'linear-gradient(to right, #0EA5E9, transparent)', opacity: 0.2 }} />
                        </div>

                        <div className="space-y-8 mt-8">
                            {medications.map((med, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 mt-1" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-xl mb-2" style={{ color: '#0F172A' }}>{med.name}</h4>
                                        <div className="flex gap-8 font-medium mb-2 p-3 rounded-lg border inline-flex" style={{ backgroundColor: '#F9FAFB', borderColor: '#F3F4F6', color: '#374151' }}>
                                            {med.dosage && <div><span className="text-xs block uppercase tracking-wider" style={{ color: '#9CA3AF' }}>{t("doctor.prescription.dosage", "Dosage")}</span><span style={{ color: '#0EA5E9' }}>{med.dosage}</span></div>}
                                            {med.duration && <div><span className="text-xs block uppercase tracking-wider" style={{ color: '#9CA3AF' }}>{t("doctor.prescription.duration", "Duration")}</span><span>{med.duration}</span></div>}
                                        </div>
                                        {med.instructions && (
                                            <p className="mt-2 p-2 rounded-md border-l-2 text-sm" style={{ backgroundColor: '#FEFCE8', borderLeftColor: '#FACC15', color: '#4B5563' }}>
                                                <span className="font-semibold" style={{ color: '#374151' }}>{t("doctor.prescription.direction", "Direction:")}</span> {med.instructions}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    {additionalNotes && (
                        <div className="mb-10 pt-8 border-t border-dashed" style={{ borderTopColor: '#E5E7EB' }}>
                            <h3 className="text-sm uppercase tracking-widest font-bold mb-4" style={{ color: '#6B7280' }}>{t("doctor.prescription.additional_instructions", "Additional Instructions & Notes")}</h3>
                            <p className="text-base whitespace-pre-wrap leading-relaxed p-6 rounded-xl" style={{ color: '#1F2937', backgroundColor: '#EFF6FF' }}>{additionalNotes}</p>
                        </div>
                    )}

                    {/* Footer / Signatures - Pinned to bottom using absolute positioning within the relative parent */}
                    <div className="absolute bottom-20 left-12 right-12 flex justify-between items-end border-t-2 pt-8 mt-12" style={{ borderTopColor: '#F3F4F6' }}>
                        <div className="text-xs max-w-sm" style={{ color: '#9CA3AF' }}>
                            <p className="font-semibold mb-1" style={{ color: '#6B7280' }}>{t("doctor.prescription.notice_pharmacy", "Notice to Pharmacy:")}</p>
                            <p>{t("doctor.prescription.notice_desc", "This is a digitally generated medical prescription and does not require a physical signature if validated through the NetraAI platform. Substitution permitted unless strictly prohibited above.")}</p>
                        </div>
                        <div className="text-right">
                            <div className="w-48 h-16 rounded-lg mb-4 flex-col flex items-center justify-center border" style={{ backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }}>
                                <span className="font-serif text-xl italic opacity-80" style={{ color: '#0EA5E9' }}>{doctorProfile?.full_name || user?.name}</span>
                                <span className="text-[10px] uppercase tracking-widest mt-1" style={{ color: '#9CA3AF' }}>{t("doctor.prescription.digital_signature_validated", "Digital Signature Validated")}</span>
                            </div>
                            <p className="text-lg font-bold" style={{ color: '#0F172A' }}>{doctorProfile?.full_name || user?.name}</p>
                            <p className="text-sm font-medium" style={{ color: '#0EA5E9' }}>{doctorProfile?.specialty || t("doctor.prescription.default_specialty", "Specialist Consultant")}</p>
                            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{t("doctor.prescription.reg", "Reg:")} {doctorProfile?.license_number || "MED-ONL-2024"}</p>
                        </div>
                    </div>

                    <div className="absolute bottom-6 left-0 right-0 text-center text-[10px] uppercase tracking-widest" style={{ color: '#D1D5DB' }}>
                        {t("doctor.prescription.generated_by", "Generated by NetraAI Telemedicine Engine • Ref:")} {new Date().getTime().toString(16).toUpperCase()}
                    </div>
                </div>
            </div>
        </div>
    );
}
