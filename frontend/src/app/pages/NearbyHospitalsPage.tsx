import { motion } from "motion/react";
import {
  MapPin,
  Phone,
  Clock,
  Navigation,
  Star,
  List,
  Grid,
  AlertCircle,
  Loader,
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useTranslation } from "../../lib/i18n";

export default function NearbyHospitalsPage() {
  const { t } = useTranslation();
  const [view, setView] = useState<"list" | "grid">("list");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);

  // Fetch hospitals from backend
  const {
    data: hospitals = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["hospitals"],
    queryFn: async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/v1/hospitals?distance_km=10`,
        );
        if (!response.ok) throw new Error("Failed to load hospitals");
        return response.json();
      } catch (err) {
        console.error("Error fetching hospitals:", err);
        return [];
      }
    },
  });

  // Try to get user location
  const handleEnableLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Location access denied:", error);
          // Still show Mumbai hospitals as default
        },
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-6 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-[#0D9488] animate-spin mx-auto mb-4" />
          <p className="text-[#0F172A]">{t('patient.hospitals.loading', "Loading nearby hospitals...")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#0F172A] mb-2">
            {t('patient.hospitals.error_title', "Unable to Load Hospitals")}
          </h2>
          <p className="text-[#64748B] mb-6">
            {t('patient.hospitals.error_desc', "Error loading hospital data. Please try again later.")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-6 bg-gradient-to-br from-[#F0FDFA] via-white to-[#F8FAFC]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-[#0F172A] mb-2">
            {t('patient.hospitals.title', "Nearby Hospitals & Clinics")}
          </h1>
          <p className="text-[#64748B]">
            {t('patient.hospitals.desc', "Find hospitals and diagnostic centers near you for physical consultation")}
          </p>
        </motion.div>

        {/* Embedded Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 relative"
        >
          <div className="absolute top-4 right-4 z-10 bg-white p-2 rounded-lg shadow-md flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">{t('patient.hospitals.display_area', "Displaying Hospitals Area")}</span>
            <Button
              className="bg-[#0D9488] hover:bg-[#0F766E] text-white !py-1 !px-3 h-8 text-xs"
              onClick={handleEnableLocation}
            >
              <Navigation className="w-3 h-3 mr-1" />{" "}
              {userLocation ? t('patient.hospitals.using_gps', "Using GPS") : t('patient.hospitals.enable_gps', "Enable GPS")}
            </Button>
            {selectedDestination && (
              <Button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 !py-1 !px-3 h-8 text-xs"
                onClick={() => setSelectedDestination(null)}
              >
                {t('patient.hospitals.reset_map', "Reset Map")}
              </Button>
            )}
          </div>
          <Card className="h-96 w-full bg-gray-50 border border-gray-100 flex items-center justify-center relative overflow-hidden rounded-2xl shadow-sm">
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={selectedDestination
                ? `https://maps.google.com/maps?saddr=${encodeURIComponent(userLocation ? `${userLocation.lat},${userLocation.lon}` : 'Mumbai')}&daddr=${encodeURIComponent(selectedDestination)}&t=&z=13&ie=UTF8&iwloc=&output=embed`
                : `https://maps.google.com/maps?q=hospitals+near+${encodeURIComponent(userLocation ? `${userLocation.lat},${userLocation.lon}` : 'Mumbai')}&t=&z=13&ie=UTF8&iwloc=&output=embed`
              }
            />
          </Card>
        </motion.div>

        {/* View Toggle */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[#64748B]">
            {t('patient.hospitals.results_found', { defaultValue: "{{count}} results found", count: hospitals.length })}
          </p>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView("list")}
              className={`p-2 rounded-md transition-all ${view === "list" ? "bg-white shadow-sm" : ""}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("grid")}
              className={`p-2 rounded-md transition-all ${view === "grid" ? "bg-white shadow-sm" : ""}`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hospital Cards */}
        <div
          className={
            view === "grid"
              ? "grid md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-3"
          }
        >
          {hospitals.map((h: { id: string; name: string; address: string; distance: string; specialties?: string[]; type: string; rating: string; hours: string }, i: number) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
            >
              <Card
                className={`p-5 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${view === "list" ? "flex items-center gap-6" : ""}`}
              >
                <div className={`${view === "list" ? "flex-1" : ""}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-[#0F172A] text-lg">
                        {h.name}
                      </h3>
                      <p className="text-sm text-[#64748B] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {h.address}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-[#0D9488]/10 text-[#0D9488] font-medium whitespace-nowrap">
                      {h.distance}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {h.specialties?.map((s: string) => (
                      <span
                        key={s}
                        className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-[#64748B]"
                      >
                        {s}
                      </span>
                    ))}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#0EA5E9]/10 text-[#0EA5E9]">
                      {h.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#64748B]">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-[#F59E0B]" /> {h.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {h.hours}
                    </span>
                  </div>
                </div>
                <div
                  className={`${view === "list" ? "flex gap-2" : "flex gap-2 mt-4"}`}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#0D9488] text-[#0D9488] hover:bg-[#0D9488]/5"
                  >
                    <Phone className="w-3 h-3 mr-1" /> {t('common.call', "Call")}
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[#0D9488] hover:bg-[#0F766E] text-white"
                    onClick={() => {
                      setSelectedDestination(`${h.name}, ${h.address}`);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <Navigation className="w-3 h-3 mr-1" /> {t('common.directions', "Directions")}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
