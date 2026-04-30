import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, Download, X, AlertCircle } from "lucide-react";
import { useTranslation } from "../../lib/i18n";
import { useAccessibilityStore } from "../../lib/accessibility";

// Map app language codes to BCP-47 language tags for SpeechSynthesis
const LANG_MAP: Record<string, string> = {
  en: 'en',
  hi: 'hi',
  kn: 'kn',
  ta: 'ta',
  te: 'te',
  mr: 'mr',
};

// Language names for display
const LANG_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi (हिन्दी)',
  kn: 'Kannada (ಕನ್ನಡ)',
  ta: 'Tamil (தமிழ்)',
  te: 'Telugu (తెలుగు)',
  mr: 'Marathi (मराठी)',
};

// Download instructions by OS
const getDownloadInstructions = (lang: string, os: string) => {
  const langName = LANG_NAMES[lang] || lang;
  
  if (os === 'Windows') {
    return {
      title: `Install ${langName} Voice`,
      steps: [
        'Open Settings (Win + I)',
        'Go to Time & Language → Speech',
        'Click "Add voices"',
        `Search and download "${langName}" voice`,
        'Restart your browser',
        'Enable voice reader again'
      ],
      link: 'ms-settings:speech'
    };
  } else if (os === 'Mac') {
    return {
      title: `Install ${langName} Voice`,
      steps: [
        'Open System Preferences',
        'Go to Accessibility → Speech',
        'Click "System Voice" → "Customize"',
        `Download "${langName}" voice`,
        'Restart your browser',
        'Enable voice reader again'
      ],
      link: null
    };
  } else if (os === 'Android') {
    return {
      title: `Install ${langName} Voice`,
      steps: [
        'Open Settings',
        'Go to System → Languages & input',
        'Select Text-to-speech output',
        'Click "Install voice data"',
        `Download "${langName}" voice`,
        'Restart your browser',
        'Enable voice reader again'
      ],
      link: null
    };
  } else {
    return {
      title: `Install ${langName} Voice`,
      steps: [
        'Open your system settings',
        'Search for "Speech" or "Text-to-speech"',
        `Download "${langName}" voice`,
        'Restart your browser',
        'Enable voice reader again'
      ],
      link: null
    };
  }
};

// Detect operating system
const detectOS = (): string => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  if (userAgent.includes('win')) return 'Windows';
  if (userAgent.includes('mac')) return 'Mac';
  if (userAgent.includes('android')) return 'Android';
  if (userAgent.includes('linux')) return 'Linux';
  return 'Unknown';
};

/**
 * VoiceAccessibility — Screen reader / hover-to-speak widget.
 * - Toggle button (bottom-left) to enable/disable
 * - When enabled: reads out text of any element the cursor hovers over
 * - Uses Web Speech API (SpeechSynthesis) — no external deps
 * - Persists preference to localStorage
 * - Shows download alert if voice not available and user changes language while enabled
 */
export function VoiceAccessibility() {
  const { language, t } = useTranslation();
  const { voiceReader: enabled, toggleVoiceReader: setEnabled } = useAccessibilityStore();
  const [speaking, setSpeaking] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showDownloadAlert, setShowDownloadAlert] = useState(false);
  const [missingVoiceLang, setMissingVoiceLang] = useState<string | null>(null);
  const lastSpoken = useRef('');
  const timeoutRef = useRef<number | null>(null);

  const speak = useCallback((text: string) => {
    if (!text || text === lastSpoken.current) return;
    if (!window.speechSynthesis) return;

    lastSpoken.current = text;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Pick a voice that matches the current app language
    const targetLang = LANG_MAP[language] ?? 'en';
    const voices = window.speechSynthesis.getVoices();
    
    // Try to find a voice for the target language
    // Priority: 1. Exact match with Natural/Google, 2. Exact match, 3. Language prefix match, 4. English fallback
    const preferred =
      voices.find(v => v.lang === targetLang && (v.name.includes('Natural') || v.name.includes('Google'))) ||
      voices.find(v => v.lang === targetLang) ||
      voices.find(v => v.lang.startsWith(targetLang.split('-')[0])) ||
      voices.find(v => v.lang.startsWith('en'));
    
    // Check if voice is available for current language
    if (!preferred && targetLang !== 'en') {
      // Voice not available - check if we should show alert
      // User requested: Only show alert if voice reader is ON and they change language
      setMissingVoiceLang(targetLang);
      
      // Fallback to English for now
      const englishVoice = voices.find(v => v.lang.startsWith('en'));
      if (englishVoice) {
        utterance.voice = englishVoice;
        utterance.lang = englishVoice.lang;
      }
    } else if (preferred) {
      utterance.voice = preferred;
      utterance.lang = preferred.lang;
    } else {
      // Fallback: set lang even if no voice found (browser may use default)
      utterance.lang = targetLang;
    }

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [language]);

  const getReadableText = (el: Element): string => {
    // Priority: aria-label > title > alt > placeholder > innerText
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    const title = el.getAttribute('title');
    if (title) return title;

    const alt = el.getAttribute('alt');
    if (alt) return alt;

    const placeholder = el.getAttribute('placeholder');
    if (placeholder) return placeholder;

    // Get visible text, strip excess whitespace
    const text = (el as HTMLElement).innerText?.trim();
    if (text && text.length < 200) return text;

    // For inputs, read label
    if (el.tagName === 'INPUT' || el.tagName === 'BUTTON' || el.tagName === 'SELECT') {
      const id = el.getAttribute('id');
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) return (label as HTMLElement).innerText?.trim();
      }
    }

    return '';
  };

  // When language changes, reset lastSpoken so text is re-read in the new language
  useEffect(() => {
    lastSpoken.current = '';
    window.speechSynthesis?.cancel();

    // User requested: Only show alert if voice reader is ON and they try to change language
    if (enabled && language !== 'en') {
        const voices = window.speechSynthesis.getVoices();
        const targetLang = LANG_MAP[language] ?? 'en';
        const preferred = voices.find(v => v.lang === targetLang || v.lang.startsWith(targetLang.split('-')[0]));
        
        if (!preferred) {
            setMissingVoiceLang(language);
            setShowDownloadAlert(true);
        }
    }
  }, [language, enabled]);

  // Listen for settings page toggle
  useEffect(() => {
    const handleSettingsToggle = (event: CustomEvent) => {
      const { enabled: newEnabled, triggerAlert } = event.detail;
      setEnabled(newEnabled);
      if (!newEnabled) {
        window.speechSynthesis?.cancel();
        setSpeaking(false);
        setShowDownloadAlert(false);
      } else if (triggerAlert) {
        // Manually trigger the alert even if language is English, to show how to download others
        setMissingVoiceLang(language === 'en' ? 'hi' : language); // Default to Hindi if on English
        setShowDownloadAlert(true);
      }
    };

    window.addEventListener('voiceReaderToggle', handleSettingsToggle as EventListener);
    return () => {
      window.removeEventListener('voiceReaderToggle', handleSettingsToggle as EventListener);
    };
  }, [language, setEnabled]);

  useEffect(() => {
    if (!enabled) {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
      return;
    }

    const handleMouseOver = (e: Event) => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        const target = e.target as Element;
        if (!target) return;

        // Walk up to find meaningful element
        let el: Element | null = target;
        let text = '';
        while (el && el !== document.body) {
          text = getReadableText(el);
          if (text) break;
          el = el.parentElement;
        }

        if (text) speak(text);
      }, 300); // 300ms hover delay to avoid spam
    };

    const handleMouseOut = () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };

    document.addEventListener('mouseover', handleMouseOver as EventListener);
    document.addEventListener('mouseout', handleMouseOut as EventListener);

    // Announce that voice reader is now active
    speak(t('voice_accessibility.enabled_announcement'));

    return () => {
      document.removeEventListener('mouseover', handleMouseOver as EventListener);
      document.removeEventListener('mouseout', handleMouseOut as EventListener);
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, speak, t]);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    if (!next) {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
      setShowDownloadAlert(false);
    }
  };

  const openSystemSettings = () => {
    const os = detectOS();
    const instructions = getDownloadInstructions(missingVoiceLang || language, os);
    
    if (instructions.link && os === 'Windows') {
      // Try to open Windows settings directly
      window.location.href = instructions.link;
    } else {
      // Show instructions in alert
      alert(instructions.steps.join('\n\n'));
    }
  };

  return (
    <>
      {/* Download Alert Modal */}
      <AnimatePresence>
        {showDownloadAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDownloadAlert(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-md mx-4 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700"
            >
              {/* Close button */}
              <button
                onClick={() => setShowDownloadAlert(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>

              {/* Alert icon */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Voice Not Available
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {LANG_NAMES[missingVoiceLang || language]} voice is not installed
                  </p>
                </div>
              </div>

              {/* Instructions */}
              <div className="mb-6">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  To use voice reader in {LANG_NAMES[missingVoiceLang || language]}, you need to install the voice on your system.
                </p>
                
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Quick Steps ({detectOS()}):
                  </p>
                  <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                    {getDownloadInstructions(missingVoiceLang || language, detectOS()).steps.map((step, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="font-semibold text-[#0D9488]">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  💡 Tip: For now, voice reader will use English. After installing the voice, it will automatically switch to {LANG_NAMES[missingVoiceLang || language]}.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={openSystemSettings}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#0D9488] to-[#0EA5E9] text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
                >
                  <Download className="w-4 h-4" />
                  Open Settings
                </button>
                <button
                  onClick={() => setShowDownloadAlert(false)}
                  className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating voice button — Always shown for patient/doctor/guest */}
      <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-2">
        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              className="glass-card rounded-xl px-3 py-2 text-xs text-foreground/80 max-w-[180px] shadow-lg mb-1"
            >
              {enabled 
                ? t('voice_accessibility.enabled_tooltip', 'Voice reader ON — hover any element to hear it')
                : t('voice_accessibility.disabled_tooltip', 'Enable voice reader for accessibility')}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle button */}
        <motion.button
          onClick={toggle}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          initial={{ scale: 1, opacity: 1 }}
          aria-label={enabled ? t('voice_accessibility.disable_aria_label') : t('voice_accessibility.enable_aria_label')}
          title={enabled ? t('voice_accessibility.disable_aria_label') : t('voice_accessibility.enable_aria_label')}
          className={`relative w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
            enabled 
              ? "bg-gradient-to-br from-[#0D9488] to-[#0EA5E9] text-white"
              : "bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-[#0D9488] dark:hover:text-[#2DD4BF]"
          }`}
        >
          {/* Speaking pulse ring */}
          {enabled && speaking && (
            <span className="absolute inset-0 rounded-2xl bg-[#0D9488] animate-ping opacity-30" />
          )}
          <Volume2 className={`w-6 h-6 transition-transform duration-300 ${enabled ? 'scale-110' : 'scale-90 opacity-70'}`} />
        </motion.button>
      </div>
    </>
  );
}
