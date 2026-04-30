import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, Loader2 } from "lucide-react";
import { patientAPI } from "../../../lib/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function SOSButton() {
  const { t } = useTranslation();
    const [isTriggering, setIsTriggering] = useState(false);
    const [cooldown, setCooldown] = useState(false);

    const handleSOSClick = () => {
        if (cooldown || isTriggering) return;

        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setIsTriggering(true);
        toast.info("Acquiring GPS location...");

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    await patientAPI.triggerSOS({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                    toast.success("EMERGENCY SOS DISPATCHED. Help is on the way.");
                    setCooldown(true);
                    setTimeout(() => setCooldown(false), 30000); // 30s cooldown
                } catch (error) {
                    toast.error("Failed to dispatch SOS. Please call emergency services directly!");
                } finally {
                    setIsTriggering(false);
                }
            },
            () => {
                setIsTriggering(false);
                toast.error("Unable to retrieve location. Please check your settings.");
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    return (
        <div className="fixed bottom-6 left-6 z-50">
            <AnimatePresence>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSOSClick}
                    disabled={cooldown || isTriggering}
                    className={`relative group flex items-center justify-center w-16 h-16 rounded-full shadow-2xl transition-colors ${cooldown ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
                        }`}
                    aria-label={t('ui.s_o_s_button.emergency_sos_aria-label_0', "Emergency SOS")}
                >
                    {isTriggering ? (
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : (
                        <AlertCircle className="w-8 h-8 text-white" />
                    )}

                    {/* Ripple Effect */}
                    {!cooldown && !isTriggering && (
                        <>
                            <motion.div
                                className="absolute inset-0 rounded-full bg-red-500 opacity-40 z-[-1]"
                                animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                            <motion.div
                                className="absolute inset-0 rounded-full bg-red-400 opacity-20 z-[-1]"
                                animate={{ scale: [1, 2, 1], opacity: [0.2, 0, 0.2] }}
                                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                            />
                        </>
                    )}

                    {/* Tooltip */}
                    <div className="absolute left-20 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-sm font-semibold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {cooldown ? "Cooling down..." : "Emergency SOS"}
                    </div>
                </motion.button>
            </AnimatePresence>
        </div>
    );
}
