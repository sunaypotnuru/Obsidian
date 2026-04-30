import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from '../../../lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Activity, AlertCircle, PlayCircle, ArrowLeft } from 'lucide-react';
import { patientAPI } from '../../../lib/api';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import { AIVoicePulse } from '../../../components/AIVoicePulse';
import Breadcrumb from '../../components/Breadcrumb';

const ParkinsonsVoicePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  interface ParkinsonsResult {
    risk_score: number;
    confidence: number;
    recommendation: string;
  }

  const [result, setResult] = useState<ParkinsonsResult | null>(null);
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.start();
      setRecording(true);
      setError('');
      setResult(null);
    } catch (err) {
      setError('Microphone permission denied.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const uploadAndAnalyze = async () => {
    if (!audioBlob) return;
    setAnalyzing(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'parkinsons_ahhh.webm');
      const response = await patientAPI.analyzeParkinsons(formData);
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
        <PlayCircle className="w-8 h-8 text-patient-primary" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("patient.parkinsons.title", "Parkinson's Voice Analysis")}</h1>
      </div>
      
      <p className="text-gray-600 dark:text-gray-300 text-lg">
        {t("patient.parkinsons.description", "Please take a deep breath and say Ahhh as steadily and clearly as possible for 10 seconds. Our AI maps micro-tremors in your vocal frequency.")}
      </p>

      <Card className="p-8 shadow-xl border-t-4 border-t-patient-primary glass-card">
        <div className="flex flex-col items-center gap-6">
          <AIVoicePulse isRecording={recording} scoreCategory="neutral" />

          {!audioBlob && !recording && (
            <Button onClick={startRecording} size="lg" className="rounded-full w-56 h-16 text-lg bg-patient-primary hover:bg-green-700 font-bold shadow-lg">
              <Mic className="w-6 h-6 mr-2" /> {t("common.start_recording", "Start Recording")}
            </Button>
          )}

          {recording && (
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="flex items-center gap-2 text-red-500 font-bold animate-pulse text-lg">
                {t("patient.parkinsons.recording_hint", "Say Ahhh for 10 seconds...")}
              </div>
              <Button onClick={stopRecording} size="lg" variant="destructive" className="rounded-full w-48 h-12 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                <Square className="w-5 h-5 mr-2" /> {t("common.stop_recording", "Stop Recording")}
              </Button>
            </div>
          )}

          {audioBlob && !analyzing && !recording && (
            <div className="flex flex-col items-center gap-6 w-full mt-4">
              <audio controls src={URL.createObjectURL(audioBlob)} className="w-full max-w-sm rounded-full bg-gray-100 dark:bg-gray-800" />
              <div className="flex gap-4">
                <Button onClick={uploadAndAnalyze} size="lg" className="bg-green-600 hover:bg-green-700 w-56 shadow-lg">
                  <Activity className="w-5 h-5 mr-2" /> {t("common.analyze_tremors", "Analyze Vocal Tremors")}
                </Button>
                <Button onClick={() => setAudioBlob(null)} variant="outline" size="lg" className="w-32">
                  {t("common.retake", "Retake")}
                </Button>
              </div>
            </div>
          )}

          {analyzing && (
            <div className="flex flex-col items-center gap-4 text-patient-primary w-full mt-4">
              <Activity className="w-12 h-12 animate-spin" />
              <p className="font-bold text-lg animate-pulse">{t("patient.parkinsons.analyzing", "Running Vocal Frequency Map...")}</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="w-full max-w-md mt-4">
              <AlertCircle className="w-5 h-5 mr-2" /> {error}
            </Alert>
          )}
        </div>
      </Card>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="p-8 shadow-2xl glass-card mt-6 bg-gradient-to-tr from-white to-blue-50/30 dark:from-slate-800 dark:to-slate-800">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center gap-2">
                {t("patient.scan.spectrogram_results", "Spectrogram Analysis Results")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-red-50/50 dark:bg-red-900/30 rounded-xl border border-red-100 dark:border-red-800/50">
                  <p className="text-red-800 dark:text-red-300 font-medium mb-2">{t("patient.scan.biomarker_risk", "Biomarker Risk Score")}</p>
                  <p className="text-4xl font-black text-red-900 dark:text-red-100">{(result.risk_score * 100).toFixed(0)}%</p>
                </div>
                <div className="p-6 bg-green-50/50 dark:bg-green-900/30 rounded-xl border border-green-100 dark:border-green-800/50">
                  <p className="text-green-800 dark:text-green-300 font-medium mb-2">{t("patient.scan.ai_confidence", "AI Confidence")}</p>
                  <p className="text-4xl font-black text-green-900 dark:text-green-100">{(result.confidence * 100).toFixed(0)}%</p>
                </div>
                <div className="p-6 bg-blue-50/50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800/50 flex flex-col justify-center">
                  <p className="text-blue-800 dark:text-blue-300 font-medium mb-2">{t("patient.scan.recommendation", "Recommendation")}</p>
                  <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{result.recommendation}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ParkinsonsVoicePage;
