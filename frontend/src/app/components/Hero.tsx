import { motion } from "motion/react";
import { Upload } from "lucide-react";
import { Button } from "./ui/button";
import { useTranslation } from "../../lib/i18n";

export function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0D9488] via-[#0F766E] to-[#0EA5E9]">
      {/* Floating Background Circles */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"
          animate={{
            y: [0, 30, 0],
            x: [0, 20, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          animate={{
            y: [0, -40, 0],
            x: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-white z-10"
          >
            <motion.h1
              className="text-5xl lg:text-6xl font-bold mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              {t('home.title')}
            </motion.h1>
            <motion.p
              className="text-lg lg:text-xl mb-8 text-white/90 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              {t('home.subtitle')}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-wrap gap-4"
            >
              <Button
                size="lg"
                className="bg-white text-[#0D9488] hover:bg-white/90 font-semibold px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <Upload className="w-5 h-5 mr-2" />
                {t('home.start_screening')}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-6 text-lg"
              >
                {t('home.about')}
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="grid grid-cols-3 gap-6 mt-12 pt-12 border-t border-white/20"
            >
              <div>
                <div className="text-3xl font-bold">95%</div>
                <div className="text-sm text-white/80">{t('home.rating')}</div>
              </div>
              <div>
                <div className="text-3xl font-bold">10K+</div>
                <div className="text-sm text-white/80">{t('home.scans_done')}</div>
              </div>
              <div>
                <div className="text-3xl font-bold">&lt;5s</div>
                <div className="text-sm text-white/80">{t('home.results')}</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="relative h-[500px] flex items-center justify-center"
          >
            <DoctorPatientAnimation />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function DoctorPatientAnimation() {
  return (
    <div className="relative w-full h-full">
      {/* Patient - Sitting on bed */}
      <motion.div
        className="absolute right-20 bottom-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {/* Bed */}
        <div className="relative">
          <div className="w-32 h-24 bg-white/20 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30" />
          {/* Patient sitting */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2">
            <div className="relative">
              {/* Head */}
              <motion.div
                className="w-12 h-12 bg-[#0F172A] rounded-full border-4 border-white shadow-lg"
                animate={{
                  y: [0, -3, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              {/* Body */}
              <div className="w-16 h-20 bg-[#0EA5E9] rounded-2xl mt-2 shadow-lg border-2 border-white/50" />
              {/* Arms */}
              <div className="absolute top-6 -left-4 w-12 h-4 bg-[#0EA5E9] rounded-full" />
              <div className="absolute top-6 -right-4 w-12 h-4 bg-[#0EA5E9] rounded-full" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Doctor - Walking and treating */}
      <motion.div
        className="absolute bottom-20 left-0"
        animate={{
          x: [0, 180],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      >
        <div className="relative">
          {/* Doctor figure */}
          <div className="relative">
            {/* Head */}
            <motion.div
              className="w-14 h-14 bg-white rounded-full shadow-xl border-4 border-[#0D9488]"
              animate={{
                y: [0, -4, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {/* Body - White coat */}
            <div className="w-20 h-28 bg-white rounded-3xl mt-2 shadow-2xl border-2 border-[#0D9488]/30 relative">
              {/* Stethoscope */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-8 border-2 border-[#0D9488] rounded-full" />
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-1 h-4 bg-[#0D9488]" />
              
              {/* Medical bag */}
              <motion.div
                className="absolute -right-8 top-8 w-8 h-6 bg-[#F43F5E] rounded shadow-lg"
                animate={{
                  rotate: [0, 10, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
            {/* Legs - Walking animation */}
            <div className="flex gap-2 mt-1 justify-center">
              <motion.div
                className="w-5 h-12 bg-[#0F172A] rounded-full shadow-lg"
                animate={{
                  rotate: [0, 20, 0, -20, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="w-5 h-12 bg-[#0F172A] rounded-full shadow-lg"
                animate={{
                  rotate: [0, -20, 0, 20, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Medical cross floating icon */}
      <motion.div
        className="absolute top-10 right-10"
        animate={{
          y: [0, -15, 0],
          rotate: [0, 5, 0, -5, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl rotate-45 shadow-xl" />
          <div className="absolute inset-4 bg-white rounded shadow-2xl">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#F43F5E]" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-1.5 bg-[#F43F5E]" />
          </div>
        </div>
      </motion.div>

      {/* Heartbeat pulse */}
      <motion.div
        className="absolute top-40 left-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg width="80" height="40" viewBox="0 0 80 40" className="text-white/40">
          <path
            d="M 0,20 L 20,20 L 25,10 L 30,30 L 35,15 L 40,20 L 80,20"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>
    </div>
  );
}
