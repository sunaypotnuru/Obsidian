import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { useTranslation } from "../../lib/i18n";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 flex items-center justify-center bg-gradient-to-br from-[#F0FDFA] to-[#F0F9FF]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1 className="text-9xl font-bold text-[#0D9488] mb-4">404</h1>
        <h2 className="text-3xl font-bold text-[#0F172A] mb-4">{t('errors.not_found_title', 'Page Not Found')}</h2>
        <p className="text-[#0F172A]/70 mb-8 max-w-md">
          {t('errors.not_found_message', "The page you're looking for doesn't exist or has been moved.")}
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.go_back', 'Go Back')}
          </Button>
          <Button onClick={() => navigate("/")} className="bg-[#0D9488] hover:bg-[#0F766E]">
            <Home className="w-4 h-4 mr-2" />
            {t('common.home', 'Home')}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
