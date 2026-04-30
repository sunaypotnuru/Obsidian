import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Upload, Activity, AlertCircle, ArrowLeft } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { anemiaAPI } from "../../lib/api";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "../../lib/i18n";
import Breadcrumb from "../components/Breadcrumb";

interface AnemiaResult {
  prediction: "anemic" | "normal";
  confidence: number;
  hemoglobin_level: number;
  recommendation: string;
}

export default function AnemiaDetectionPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnemiaResult | null>(null);
  const [qualityStatus, setQualityStatus] = useState<'checking' | 'good' | 'poor' | null>(null);
  const [qualityMessage, setQualityMessage] = useState<string>('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const mutation = useMutation({
    mutationFn: (file: File) => anemiaAPI.detectAnemia(file),
    onSuccess: (res: { data: AnemiaResult }) => {
      setResult(res.data);
      toast.success(t("patient.scan.analysis_complete", "Analysis complete!"));
      queryClient.invalidateQueries({ queryKey: ['patientDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['patientHistory'] });
    },
    onError: (error: { response?: { data?: { detail?: string } }; message?: string }) => {
      console.error("Analysis error:", error);
      const errorMessage = error?.response?.data?.detail || error?.message || t("patient.scan.analysis_failed_msg", "Analysis failed. Please try again.");
      toast.error(errorMessage);
    }
  });

  const checkImageQuality = async (file: File) => {
    setQualityStatus('checking');
    if (file.size < 20 * 1024) {
      setQualityStatus('poor');
      setQualityMessage(t("patient.scan.quality_too_small", "Image file size too small (under 20KB). Analysis may be inaccurate."));
      return;
    }
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise((resolve) => {
      img.onload = () => {
        if (img.width < 300 || img.height < 300) {
          setQualityStatus('poor');
          setQualityMessage(t("patient.scan.quality_low_res", { defaultValue: "Resolution too low ({{width}}x{{height}}). Minimum 300x300px recommended.", width: img.width, height: img.height }));
        } else {
          setQualityStatus('good');
          setQualityMessage(t("patient.scan.quality_good", "Image quality looks sufficient for AI analysis."));
        }
        resolve(null);
      };
      img.onerror = () => {
        setQualityStatus('poor');
        setQualityMessage(t("patient.scan.quality_invalid", "Invalid image file format."));
        resolve(null);
      };
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // always clear value to allow re-selection of same file
    if (e.target) e.target.value = "";

    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error(t("patient.scan.err_invalid_type", "Please upload a valid image file (JPG, PNG, or WebP)"));
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t("patient.scan.err_too_large", "Image size must be less than 10MB"));
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      mutation.reset(); // Reset error state
      checkImageQuality(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error(t("patient.scan.err_no_image", "Please select an image first"));
      return;
    }
    mutation.mutate(selectedFile);
  };
  const analyzing = mutation.isPending;

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setQualityStatus(null);
    setQualityMessage('');
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <Breadcrumb />
        
        {/* Back to Models Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/patient/models")}
          className="mb-4 text-[#0D9488] hover:text-[#0F766E] hover:bg-[#F0FDFA]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("common.back_to_models", "Back to AI Models")}
        </Button>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{t('patient.scan.title', 'AI Anemia Detection')}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            {t('patient.scan.subtitle', 'Upload an eye image for instant conjunctiva analysis')}
          </p>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('patient.scan.upload_image', 'Upload Image')}</h2>

              {!previewUrl ? (
                <div>
                  <label
                    htmlFor="file-upload"
                    className="block border-4 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 text-center hover:border-[#0D9488] transition-colors cursor-pointer bg-white dark:bg-gray-800"
                  >
                    <Upload className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-900 dark:text-white font-semibold mb-2">
                      {t('patient.scan.click_to_upload', 'Click to upload or drag and drop')}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('patient.scan.file_types', 'PNG, JPG up to 10MB')}
                    </p>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div>
                  <div className="relative rounded-xl overflow-hidden mb-4 border border-gray-100 shadow-sm">
                    <img
                      src={previewUrl}
                      alt="Selected"
                      className="w-full h-64 object-cover"
                    />
                    {qualityStatus && qualityStatus !== 'checking' && (
                      <div className={`absolute bottom-0 left-0 right-0 p-3 text-sm font-medium backdrop-blur-md flex items-center justify-center gap-2
                        ${qualityStatus === 'good' ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'}`}
                      >
                        {qualityStatus === 'good' ? <span className="text-xl">✓</span> : <AlertCircle className="w-5 h-5" />}
                        {qualityMessage}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleAnalyze}
                      disabled={analyzing}
                      className="flex-1 bg-[#0D9488] hover:bg-[#0F766E]"
                    >
                      {analyzing ? t('patient.scan.analyzing', 'Analyzing...') : t('patient.scan.analyze_btn', 'Analyze Image')}
                    </Button>
                    <Button variant="outline" onClick={handleReset}>
                      {t('common.reset', 'Reset')}
                    </Button>
                  </div>
                </div>
              )}

              {analyzing && (
                <div className="mt-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('patient.scan.analyzing_image', 'Analyzing image...')}</p>
                  <Progress value={75} className="h-2" />
                </div>
              )}

              {/* Guidelines */}
              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  {t('patient.scan.image_guidelines', 'Image Guidelines')}
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 ml-7">
                  <li>• {t('patient.scan.clear_image', 'Clear, well-lit eye image')}</li>
                  <li>• {t('patient.scan.focus_eyelid', 'Focus on lower eyelid conjunctiva')}</li>
                  <li>• {t('patient.scan.avoid_blurry', 'Avoid blurry or low-quality images')}</li>
                  <li>• {t('patient.scan.frontal_view', 'Frontal view works best')}</li>
                </ul>
              </div>
            </Card>

            {/* Results Section */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('patient.scan.analysis_results', 'Analysis Results')}</h2>

              {mutation.isError ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('patient.scan.analysis_err', 'Analysis Failed')}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-sm">
                    {(mutation.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || t('patient.scan.analysis_err_desc', "Unable to analyze the image. Please try again with a different image.")}
                  </p>
                  <Button onClick={() => mutation.reset()} variant="outline">
                    {t('common.try_again', 'Try Again')}
                  </Button>
                </div>
              ) : !result ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Activity className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('patient.scan.upload_to_see', 'Upload and analyze an image to see results')}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Prediction */}
                  <div className="text-center p-6 rounded-xl bg-gradient-to-br from-[#F43F5E]/10 to-[#C0392B]/10 dark:from-[#F43F5E]/20 dark:to-[#C0392B]/20 border-2 border-[#F43F5E]/20 dark:border-[#F43F5E]/30">
                    <h3 className="text-lg text-gray-600 dark:text-gray-300 mb-2">{t('patient.scan.prediction', 'Prediction')}</h3>
                    <p className={`text-4xl font-bold ${result.prediction === "anemic" ? "text-[#F43F5E]" : "text-[#0D9488]"
                      }`}>
                      {result.prediction === "anemic" ? t('models.prediction.anemic', "Anemic") : t('models.prediction.normal', "Normal")}
                    </p>
                  </div>

                  {/* Confidence */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{t('patient.scan.confidence', 'Confidence')}</span>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {(result.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={result.confidence * 100}
                      className="h-3"
                    />
                  </div>

                  {/* Hemoglobin */}
                  <div className="p-4 bg-[#0EA5E9]/10 dark:bg-[#0EA5E9]/20 rounded-lg border border-[#0EA5E9]/20 dark:border-[#0EA5E9]/30">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{t('patient.scan.estimated_hb', 'Estimated Hemoglobin')}</p>
                    <p className="text-3xl font-bold text-[#0EA5E9]">
                      {result.hemoglobin_level?.toFixed(1)} <span className="text-lg">g/dL</span>
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {t('patient.scan.hb_range', 'Normal range: 12-16 g/dL (female), 14-18 g/dL (male)')}
                    </p>
                  </div>

                  {/* Recommendation */}
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('patient.scan.recommendation', 'Recommendation')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{result.recommendation}</p>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-4">
                    <Button
                      className="w-full bg-[#0EA5E9] hover:bg-[#0284C7]"
                      onClick={() => navigate("/patient/doctors")}
                    >
                      {t('patient.scan.book_consultation', 'Book Consultation')}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleReset}
                    >
                      {t('patient.scan.new_scan', 'New Scan')}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
