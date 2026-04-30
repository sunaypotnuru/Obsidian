/// <reference types="vite/client" />
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import {
  Globe, Activity, X, Shield, FileText, Circle, PenTool
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useAuthStore } from "../../lib/store";
import { videoAPI } from "../../lib/api";
import api from "../../lib/api";
import { useTranslation } from "../../lib/i18n";
import { Whiteboard } from "../components/Whiteboard";

// Type for transcription messages
interface TranscriptionMessage {
  speaker: string;
  original: string;
  translated: string;
  time: string;
  isMe: boolean;
}

export default function VideoCallPage() {
  const { t } = useTranslation();
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isDoctor = user?.role === 'doctor';

  const [token, setToken] = useState("");
  const serverUrl = import.meta.env.VITE_LIVEKIT_URL || "wss://netrai-consult-b4c4xk1c.livekit.cloud";

  const [showScribe, setShowScribe] = useState(false);

  // Translation States
  const [translationActive, setTranslationActive] = useState(false);
  const [myLanguage, setMyLanguage] = useState(isDoctor ? 'English' : 'Hindi');
  const [transcripts] = useState<TranscriptionMessage[]>([]);

  // Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [egressId, setEgressId] = useState<string | null>(null);
  const [isTogglingRecord, setIsTogglingRecord] = useState(false);

  // Whiteboard
  const [showWhiteboard, setShowWhiteboard] = useState(false);

  const [connectionState, setConnectionState] = useState<'connecting' | 'ready' | 'failed'>('connecting');

  useEffect(() => {
    if (!user || !appointmentId) return;
    const fetchToken = async () => {
      try {
        const res = await videoAPI.getToken(appointmentId, user.name || "Guest");
        if (res.data?.token) {
          setToken(res.data.token);
          setConnectionState('ready');
        } else {
          setConnectionState('failed');
        }
      } catch (err) {
        console.error("Failed to fetch LiveKit token", err);
        setConnectionState('failed');
      }
    };
    // Timeout fallback — show error after 8s
    const timeout = setTimeout(() => {
      if (!token) setConnectionState('failed');
    }, 8000);
    fetchToken();
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, appointmentId]);


  const handleWhiteboardSnapshot = async (svgString: string) => {
      try {
          await api.post(`/api/v1/doctor/appointments/${appointmentId}/whiteboard`, { svg: svgString });
      } catch (err) {
          console.error("Failed to save whiteboard snapshot:", err);
      }
  };

  const handleEndCall = async () => {
    // Before navigating away, try to capture the whiteboard snapshot if the function is mapped
    const windowWithSnapshot = window as Window & { getWhiteboardSnapshot?: () => Promise<void> };
    if (windowWithSnapshot.getWhiteboardSnapshot) {
        try {
            await windowWithSnapshot.getWhiteboardSnapshot();
        } catch(e) {
            console.warn('Failed to capture whiteboard snapshot:', e);
        }
    }
    // Navigating away will unmount the room and disconnect automatically via component teardown.
    navigate(isDoctor ? "/doctor/appointments" : "/patient/appointments");
  };

  const toggleRecording = async () => {
    if (!appointmentId) return;
    setIsTogglingRecord(true);
    try {
      if (isRecording && egressId) {
        await videoAPI.stopRecording(egressId);
        setIsRecording(false);
        setEgressId(null);
      } else {
        const res = await videoAPI.startRecording(appointmentId);
        if (res.data?.success) {
          setIsRecording(true);
          setEgressId(res.data.egress_id);
        }
      }
    } catch (error) {
      console.error("Recording toggle failed", error);
    } finally {
      setIsTogglingRecord(false);
    }
  };

  return (
    <div className="h-screen max-h-screen bg-[#0F172A] flex flex-col font-sans overflow-hidden">
      {/* Top Bar */}
      <div className="h-16 flex items-center justify-between px-6 bg-[#1E293B] border-b border-white/10 shrink-0 select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-400" />
            <span className="text-white font-medium text-sm hidden sm:block">{t('patient.videocall.encrypted', "End-to-End Encrypted")}</span>
          </div>
          <div className="w-px h-6 bg-white/20 hidden sm:block" />
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <span className="font-mono">{appointmentId}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTranslationActive(!translationActive)}
            className={`gap-2 ${translationActive ? 'text-[#0D9488] bg-[#0D9488]/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
          >
            <Globe className="w-4 h-4" />
            <span className="hidden sm:block">{t('patient.videocall.live_translation', "Live Translation: ")}{translationActive ? t('common.on', "ON") : t('common.off', "OFF")}</span>
          </Button>

          {isDoctor && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                   setShowWhiteboard(!showWhiteboard);
                   setShowScribe(false);
                   setTranslationActive(false);
                }}
                className={`gap-2 ${showWhiteboard ? 'text-[#0EA5E9] bg-[#0EA5E9]/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                <PenTool className="w-4 h-4" />
                <span className="hidden sm:block">{t('patient.videocall.whiteboard', "Whiteboard")}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleRecording}
                disabled={isTogglingRecord}
                className={`gap-2 ${isRecording ? 'text-red-500 bg-red-500/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                <Circle className={`w-4 h-4 ${isRecording ? 'fill-red-500 animate-pulse' : ''}`} />
                <span className="hidden sm:block">{isRecording ? t('patient.videocall.recording', "Recording...") : t('patient.videocall.record', "Record")}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowScribe(!showScribe)}
                className={`gap-2 ${showScribe ? 'text-[#8B5CF6] bg-[#8B5CF6]/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                <Activity className="w-4 h-4" />
                <span className="hidden sm:block">{t('patient.videocall.ai_scribe', "AI Scribe")}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Video Area containing LiveKit */}
        <div className="flex-1 relative flex flex-col bg-black">
          {connectionState === 'connecting' && (
            <div className="flex-1 flex items-center justify-center text-white flex-col gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-white/20 border-t-white animate-spin" />
                <Shield className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/60" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{t('patient.videocall.joining', "Joining secure room...")}</p>
                <p className="text-white/50 text-sm mt-1">{t('patient.videocall.establishing', "Establishing end-to-end encrypted connection")}</p>
              </div>
            </div>
          )}
          {connectionState === 'failed' && (
            <div className="flex-1 flex items-center justify-center text-white flex-col gap-6 px-8">
              <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center">
                <X className="w-10 h-10 text-red-400" />
              </div>
              <div className="text-center max-w-md">
                <h2 className="text-xl font-bold mb-2">{t('patient.videocall.cannot_connect', "Could Not Connect")}</h2>
                <p className="text-white/60 text-sm mb-6">{t('patient.videocall.not_configured', "The video service is not configured yet. To enable video calls, add LiveKit credentials to your ")}<code className="text-yellow-400">.env</code>{t('patient.videocall.file', " file:")}</p>
                <div className="bg-white/10 rounded-xl p-4 text-left font-mono text-xs text-green-300 space-y-1">
                  <p>LIVEKIT_API_KEY=your_api_key</p>
                  <p>LIVEKIT_API_SECRET=your_api_secret</p>
                  <p>LIVEKIT_URL=wss://your-project.livekit.cloud</p>
                  <p>VITE_LIVEKIT_URL=wss://your-project.livekit.cloud</p>
                </div>
                <p className="text-white/40 text-xs mt-4">{t('patient.videocall.get_creds', "Get free LiveKit credentials at ")}<span className="text-blue-400">livekit.io</span></p>
              </div>
              <button onClick={handleEndCall} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-all">
                {t('patient.videocall.return_dash', "← Return to Dashboard")}
              </button>
            </div>
          )}
          {connectionState === 'ready' && token && (
            <LiveKitRoom
              video={true}
              audio={true}
              token={token}
              serverUrl={serverUrl}
              connect={true}
              onDisconnected={handleEndCall}
              data-lk-theme="default"
              style={{ display: 'flex', flex: 1, flexDirection: 'column' }}
            >
              <VideoConference />
              <RoomAudioRenderer />
            </LiveKitRoom>
          )}

        </div>

        {/* Side Panels - Independent from LiveKit for custom integrations */}
        <AnimatePresence mode="wait">
          {showWhiteboard ? (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '66.666667%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-white border-l border-white/20 shadow-[-10px_0_30px_rgba(0,0,0,0.1)] flex flex-col z-10"
            >
                <div className="h-14 shrink-0 px-4 border-b border-gray-100 flex items-center justify-between bg-white/50">
                  <div className="flex items-center gap-2 text-[#0F172A]">
                    <PenTool className="w-5 h-5 text-[#0EA5E9]" />
                    <h3 className="font-bold">{t('patient.videocall.collaborative_whiteboard', "Collaborative Whiteboard")}</h3>
                  </div>
                  <button onClick={() => setShowWhiteboard(false)} className="text-gray-400 hover:text-[#0EA5E9] transition-colors p-2 rounded-lg hover:bg-[#0EA5E9]/10">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 bg-white relative">
                   <Whiteboard roomId={appointmentId || 'default-room'} onEndConsultation={handleWhiteboardSnapshot} />
                </div>
            </motion.div>
          ) : (showScribe && isDoctor) ? (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              className="bg-white/95 backdrop-blur-xl border-l border-white/20 shadow-[-10px_0_30px_rgba(0,0,0,0.1)] flex flex-col z-10"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/50">
                <div className="flex items-center gap-2 text-[#0F172A]">
                  <Activity className="w-5 h-5 text-[#8B5CF6]" />
                  <h3 className="font-bold">{t('patient.videocall.ai_clinical_scribe', "AI Clinical Scribe")}</h3>
                </div>
                <button onClick={() => setShowScribe(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 flex-1 overflow-y-auto bg-gray-50/50">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{t('patient.videocall.listening', "Listening Stream...")}</span>
                  </div>

                  <Card className="p-4 shadow-sm border-gray-200">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">{t('patient.videocall.auto_notes', "Auto-Generated Notes")}</h4>
                    <p className="text-sm text-gray-700 leading-relaxed mb-3 whitespace-pre-wrap">
                      {t('patient.videocall.mock_notes', "Patient complains of chronic fatigue and weakness over the past 3 weeks.\nNoted pallor in conjunctiva during visual inspection.\nRecent blood work indicates microcytic anemia with Hb at 10.2 g/dL.")}
                    </p>
                    <div className="bg-[#F0F9FF] border border-[#BAE6FD] p-3 rounded-lg">
                      <h5 className="text-xs font-bold text-[#0284C7] mb-1">{t('patient.videocall.suggested_diagnosis', "Suggested Diagnosis")}</h5>
                      <p className="text-sm text-[#0369A1]">{t('patient.videocall.mock_diagnosis', "Iron Deficiency Anemia (IDA)")}</p>
                    </div>
                  </Card>
                </div>
              </div>
              <div className="p-4 bg-white border-t border-gray-200">
                <Button className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white">
                  <FileText className="w-4 h-4 mr-2" />
                  {t('patient.videocall.save_record', "Save to Patient Record")}
                </Button>
              </div>
            </motion.div>
          ) : (translationActive) ? (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              className="bg-white/95 backdrop-blur-xl border-l border-white/20 shadow-[-10px_0_30px_rgba(0,0,0,0.1)] flex flex-col z-10"
            >
              <div className="p-4 border-b border-gray-100 flex flex-col gap-3 bg-white/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#0F172A]">
                    <Globe className={`w-5 h-5 ${translationActive ? 'text-[#0D9488]' : 'text-gray-400'}`} />
                    <h3 className="font-bold">{t('patient.videocall.live_transcript', "Live Transcript & Translation")}</h3>
                  </div>
                  <button onClick={() => setTranslationActive(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-sm bg-white p-2 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">{t('patient.videocall.my_language', "My Language")}</p>
                    <select
                      className="w-full bg-transparent font-semibold text-[#0F172A] outline-none"
                      value={myLanguage}
                      onChange={(e) => setMyLanguage(e.target.value)}
                    >
                      <option>English</option>
                      <option>Hindi</option>
                      <option>Telugu</option>
                      <option>Tamil</option>
                    </select>
                  </div>
                  <div className="w-px h-8 bg-gray-200" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">{t('patient.videocall.translating_to', "Translating To")}</p>
                    <p className="font-semibold text-[#0F172A]">{myLanguage}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 flex-1 overflow-y-auto bg-gray-50/50 space-y-4">
                {transcripts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center space-y-3">
                    <Globe className="w-8 h-8 opacity-20" />
                    <p className="text-sm" dangerouslySetInnerHTML={{ __html: t('patient.videocall.start_translation', "Speak to start live translation.<br />Make sure your microphone is unmuted.") }} />
                  </div>
                ) : transcripts.map((msg, i) => {
                  const displayMessage = msg.isMe ? msg.original : msg.translated;

                  return (
                    <div key={i} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500">{msg.speaker}</span>
                        <span className="text-[10px] text-gray-400">{msg.time}</span>
                      </div>
                      <div className={`max-w-[85%] rounded-2xl p-3 ${msg.isMe
                        ? 'bg-[#0D9488] text-white rounded-tr-sm'
                        : 'bg-white border border-gray-200 text-[#0F172A] rounded-tl-sm shadow-sm'
                        }`}>
                        <p className="text-sm">{displayMessage}</p>
                      </div>
                      {(!msg.isMe) && (
                        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                          <Globe className="w-3 h-3" /> {t('patient.videocall.translated', "Translated")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
