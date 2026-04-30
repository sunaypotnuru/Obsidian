import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from '../../../lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, UploadCloud, AlertCircle, Activity, ArrowLeft } from 'lucide-react';
import { patientAPI } from '../../../lib/api';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import Breadcrumb from '../../components/Breadcrumb';

const CataractScanPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  interface CataractResult {
    status: string;
    confidence: number;
  }

  const [result, setResult] = useState<CataractResult | null>(null);
  const [error, setError] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      setResult(null);
      setError('');
    }
  };

  const uploadAndAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError('');
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file, file.name);
      const response = await patientAPI.analyzeCataract(formData);
      setResult(response.data);
    } catch (err) {
      const errorDetail = err instanceof Error && 'response' in err && (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(errorDetail || 'Analysis pipeline failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <motion.div 
      className="container mx-auto p-4 max-w-4xl space-y-6"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Breadcrumb />
      
      <Button 
        variant="ghost" 
        onClick={() => navigate("/patient/models")} 
        className="mb-4 text-[#0D9488] hover:text-[#0F766E] hover:bg-[#F0FDFA]"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t("common.back_to_models", "Back to AI Models")}
      </Button>

      <div className="flex items-center gap-3">
        <Eye className="w-8 h-8 text-patient-primary" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("patient.cataract.title", "Cataract AI Scan")}</h1>
      </div>

      <p className="text-gray-600 dark:text-gray-300 text-lg">
        {t("patient.cataract.description", "Upload a clear close-up image of your eye to detect early indicators of cataracts using our ML model.")}
      </p>

      <Card className="p-8 shadow-lg border-t-4 border-t-patient-primary glass-card flex flex-col items-center">
        {!preview ? (
          <label className="w-full h-64 border-2 border-dashed border-gray-300 hover:border-patient-primary hover:bg-patient-primary/5 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all">
            <UploadCloud className="w-12 h-12 text-gray-400 mb-2" />
            <span className="text-gray-600 font-medium">{t("patient.cataract.upload_hint", "Click or drag an eye image here")}</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
          </label>
        ) : (
          <div className="flex flex-col items-center w-full">
            <div className="relative w-64 h-64 mb-6 rounded-full overflow-hidden border-4 border-patient-primary/20 shadow-lg">
              <img src={preview} alt="Eye preview" className="w-full h-full object-cover" />
              {analyzing && (
                <motion.div 
                  className="absolute left-0 top-0 w-full h-[2px] bg-green-400 shadow-[0_0_8px_4px_rgba(74,222,128,0.6)]"
                  animate={{ y: [0, 256, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
              )}
            </div>

            {!analyzing && !result && (
              <div className="flex gap-4">
                <Button onClick={uploadAndAnalyze} size="lg" className="bg-patient-primary hover:bg-green-700 w-48 shadow-lg">
                  <Activity className="w-5 h-5 mr-2" /> {t("common.start_scan", "Start Scan")}
                </Button>
                <Button onClick={() => setPreview(null)} variant="outline" size="lg" className="w-32">
                  {t("common.retake", "Retake")}
                </Button>
              </div>
            )}
            
            {analyzing && (
              <div className="flex flex-col items-center">
                <p className="text-patient-primary font-bold animate-pulse text-lg flex items-center gap-2">
                   <Activity className="w-5 h-5 animate-spin" /> {t("patient.cataract.analyzing", "Analyzing ocular density...")}
                </p>
              </div>
            )}
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mt-6 w-full max-w-md">
            <AlertCircle className="w-5 h-5" /> {error}
          </Alert>
        )}
      </Card>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="p-8 glass-card shadow-xl mt-6 relative overflow-hidden bg-gradient-to-tr from-white to-green-50/20 dark:from-slate-800 dark:to-slate-800">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                {t("patient.scan.results_title", "Scan Results")}
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-blue-50/50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800/50">
                   <p className="text-blue-600 dark:text-blue-300 font-semibold mb-1">{t("patient.scan.diagnosis_status", "Diagnosis Status")}</p>
                   <p className="text-3xl font-black text-blue-900 dark:text-blue-100">{t(`models.prediction.${(result.status || '').toLowerCase()}`, result.status)}</p>
                </div>
                <div className="p-6 bg-green-50/50 dark:bg-green-900/30 rounded-xl border border-green-100 dark:border-green-800/50">
                   <p className="text-green-600 dark:text-green-300 font-semibold mb-1">{t("patient.scan.ai_confidence", "AI Confidence")}</p>
                   <p className="text-3xl font-black text-green-900 dark:text-green-100">{(result.confidence * 100).toFixed(1)}%</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CataractScanPage;
