import { useState, useEffect } from "react";
import { Calendar, CheckCircle, Clock, Save, AlertTriangle } from "lucide-react";
import { doctorAPI } from "../../../lib/api";
import { toast } from "sonner";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/button";

// Basic Calendar UI. We skip react-big-calendar for simplicity in this MVP 
// and stick to a streamlined grid to configure weekly slots & RRULEs

interface DaySchedule {
    start: string;
    end: string;
    active: boolean;
}

interface DashboardData {
    profile?: {
        availability?: Record<string, DaySchedule>;
    };
}

export default function AvailabilityPage() {
    const { t } = useTranslation();
    const [weeklySchedule, setWeeklySchedule] = useState<Record<string, DaySchedule>>({
        Monday: { active: true, start: "09:00", end: "17:00" },
        Tuesday: { active: true, start: "09:00", end: "17:00" },
        Wednesday: { active: true, start: "09:00", end: "17:00" },
        Thursday: { active: true, start: "09:00", end: "17:00" },
        Friday: { active: true, start: "09:00", end: "17:00" },
        Saturday: { active: false, start: "09:00", end: "13:00" },
        Sunday: { active: false, start: "00:00", end: "00:00" },
    });

    const { data: dashboardData, isLoading } = useQuery<DashboardData>({
        queryKey: ['doctorDashboard'],
        queryFn: () => doctorAPI.getDashboard().then(res => res.data)
    });

    useEffect(() => {
        if (dashboardData?.profile?.availability) {
            if (typeof dashboardData.profile.availability === 'object') {
                // Keep structure if matches format, else overwrite with fetched
                setWeeklySchedule(prev => ({ ...prev, ...dashboardData.profile!.availability }));
            }
        }
    }, [dashboardData?.profile]);


    const saveAvailability = useMutation({
        mutationFn: (data: { schedule: Record<string, DaySchedule>; _rrule: string }) => doctorAPI.updateAvailability({ availability: data }),
        onSuccess: () => {
            toast.success(t("doctor.availability.save_success_title", "Schedule Updated"), { description: t("doctor.availability.save_success_desc", "Your recurring availability has been saved.") });
        },
        onError: () => {
            toast.error(t("common.error", "Error"), { description: t("doctor.availability.save_error_desc", "Failed to save availability settings.") });
        }
    });

    const generateRRuleStrings = () => {
        // Very basic mock of an RRule for demo purposes depending on days active
        const activeDays = Object.entries(weeklySchedule)
            .filter(([_, data]) => data.active)
            .map(([day, _]) => day.substring(0, 2).toUpperCase()); // MO, TU, WE
        return `FREQ=WEEKLY;BYDAY=${activeDays.join(',')}`;
    }

    const handleSave = () => {
        // We store the full JSON map in the DB column so it's easy to read
        saveAvailability.mutate({ schedule: weeklySchedule, _rrule: generateRRuleStrings() });
    }

    const toggleDay = (day: string) => {
        setWeeklySchedule(prev => ({
            ...prev,
            [day]: { ...prev[day], active: !prev[day].active }
        }));
    }

    const changeTime = (day: string, field: 'start' | 'end', value: string) => {
        setWeeklySchedule(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value }
        }));
    }

    const daysOfWeek = [
        t("common.monday", "Monday"),
        t("common.tuesday", "Tuesday"),
        t("common.wednesday", "Wednesday"),
        t("common.thursday", "Thursday"),
        t("common.friday", "Friday"),
        t("common.saturday", "Saturday"),
        t("common.sunday", "Sunday")
    ];

    if (isLoading) return <div className="p-10 text-gray-500">{t("doctor.availability.loading", "Loading Schedule...")}</div>;

    return (
        <div className="min-h-screen pt-20 pb-12 px-6 bg-gradient-to-br from-indigo-50/50 to-white">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                        <Calendar className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">{t("doctor.availability.title", "Availability Calendar")}</h1>
                        <p className="text-gray-500">{t("doctor.availability.subtitle", "Configure your recurring weekly schedule to accept online consults.")}</p>
                    </div>
                </div>

                <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-8">
                    <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-50">
                        <div className="flex items-center gap-3">
                            <Clock className="text-indigo-500 w-5 h-5" />
                            <h3 className="text-lg font-semibold text-gray-800">{t("doctor.availability.weekly_standard_hours", "Weekly Standard Hours")}</h3>
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={saveAvailability.isPending}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                        >
                            {saveAvailability.isPending ? t("common.saving", "Saving...") : <><Save className="w-4 h-4 mr-2" /> {t("common.save_changes", "Save Changes")}</>}
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((dayKey, index) => {
                            const isConfigured = weeklySchedule[dayKey].active;
                            const displayDay = daysOfWeek[index];
                            return (
                                <div key={dayKey} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isConfigured ? 'border-indigo-100 bg-indigo-50/30' : 'border-gray-100 bg-gray-50/50'}`}>

                                    {/* Day Toggle */}
                                    <div className="flex items-center gap-3 w-40">
                                        <button
                                            onClick={() => toggleDay(dayKey)}
                                            className={`w-6 h-6 rounded flex items-center justify-center border transition-colors ${isConfigured ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-transparent'}`}
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                        </button>
                                        <span className={`font-medium ${isConfigured ? 'text-gray-900' : 'text-gray-400'}`}>{displayDay}</span>
                                    </div>

                                    {/* Time Controls */}
                                    {isConfigured ? (
                                        <div className="flex items-center gap-4 flex-1 justify-end">
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs text-gray-500 font-medium">{t("common.starts", "Starts")}</label>
                                                <input
                                                    type="time"
                                                    value={weeklySchedule[dayKey].start}
                                                    onChange={(e) => changeTime(dayKey, 'start', e.target.value)}
                                                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                            <span className="text-gray-300">-</span>
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs text-gray-500 font-medium">{t("common.ends", "Ends")}</label>
                                                <input
                                                    type="time"
                                                    value={weeklySchedule[dayKey].end}
                                                    onChange={(e) => changeTime(dayKey, 'end', e.target.value)}
                                                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 justify-end flex">
                                            <span className="text-sm font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{t("doctor.availability.unavailable", "Unavailable")}</span>
                                        </div>
                                    )}

                                </div>
                            )
                        })}
                    </div>

                    <div className="mt-8 bg-amber-50 rounded-xl p-4 flex gap-3 border border-amber-100">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <p className="text-amber-800 text-sm">
                            {t("doctor.availability.warning_msg", "Changes made here directly affect the available times shown to patients booking appointments with you moving forward. Existing appointments will not be rescaled.")}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
