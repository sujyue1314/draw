import { useEffect, useRef, useCallback } from 'react';
import { useVoiceStore } from '../stores/voiceStore';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

// Web Speech API 类型声明
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const SILENCE_TIMEOUT = 2500; // 2.5 秒静默检测

export function useSpeechRecognition() {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isListeningRef = useRef(false);

  const {
    setTranscript,
    setInterimTranscript,
    setStatus,
    isSystemSpeaking,
    shouldListen,
  } = useVoiceStore();

  /** 重置静默计时器 */
  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    silenceTimerRef.current = setTimeout(() => {
      // 静默超时，停止识别
      if (recognitionRef.current && isListeningRef.current) {
        recognitionRef.current.stop();
      }
    }, SILENCE_TIMEOUT);
  }, []);

  /** 开始识别 */
  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListeningRef.current) return;
    if (isSystemSpeaking) return; // TTS 播报中不启动

    try {
      recognitionRef.current.start();
      isListeningRef.current = true;
      setStatus('listening');
      resetSilenceTimer();
    } catch {
      // 可能已经在运行，忽略
    }
  }, [isSystemSpeaking, setStatus, resetSilenceTimer]);

  /** 停止识别 */
  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListeningRef.current) return;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    recognitionRef.current.stop();
    isListeningRef.current = false;
    setStatus('idle');
  }, [setStatus]);

  // 初始化 SpeechRecognition
  useEffect(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.warn('SpeechRecognition API not supported');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'zh-CN';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // TTS 播报中忽略识别结果
      if (useVoiceStore.getState().isSystemSpeaking) return;

      resetSilenceTimer();

      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      if (interimText) {
        setInterimTranscript(interimText);
      }

      if (finalText) {
        setTranscript(finalText.trim());
        setInterimTranscript('');
        setStatus('processing');
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // 'no-speech' 是正常的静默情况，不报错
      if (event.error !== 'no-speech') {
        console.error('Speech recognition error:', event.error);
      }
    };

    recognition.onend = () => {
      isListeningRef.current = false;

      // 如果应该继续监听且 TTS 未播报，自动重启
      if (useVoiceStore.getState().shouldListen && !useVoiceStore.getState().isSystemSpeaking) {
        setTimeout(() => {
          if (recognitionRef.current && useVoiceStore.getState().shouldListen) {
            try {
              recognitionRef.current.start();
              isListeningRef.current = true;
              setStatus('listening');
            } catch {
              // 忽略启动错误
            }
          }
        }, 100);
      } else {
        setStatus('idle');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      recognition.abort();
    };
  }, [setTranscript, setInterimTranscript, setStatus, resetSilenceTimer]);

  // shouldListen 变化时控制启停
  useEffect(() => {
    if (shouldListen) {
      startListening();
    } else {
      stopListening();
    }
  }, [shouldListen, startListening, stopListening]);

  return {
    startListening,
    stopListening,
    isSupported: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
  };
}
