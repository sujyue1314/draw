import { useCallback, useEffect, useRef } from 'react';
import { useVoiceStore } from '../../stores/voiceStore';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useVoiceCommand } from '../../hooks/useVoiceCommand';

export function VoiceControlBar() {
  const status = useVoiceStore((s) => s.status);
  const transcript = useVoiceStore((s) => s.transcript);
  const interimTranscript = useVoiceStore((s) => s.interimTranscript);
  const shouldListen = useVoiceStore((s) => s.shouldListen);
  const setShouldListen = useVoiceStore((s) => s.setShouldListen);

  const { startListening, stopListening } = useSpeechRecognition();
  const { handleVoiceCommand } = useVoiceCommand();

  const lastTranscriptRef = useRef('');

  // 监听 transcript 变化，触发指令处理
  useEffect(() => {
    if (transcript && transcript !== lastTranscriptRef.current) {
      lastTranscriptRef.current = transcript;
      handleVoiceCommand(transcript);
    }
  }, [transcript, handleVoiceCommand]);

  // shouldListen 变化时控制识别
  useEffect(() => {
    if (shouldListen) {
      startListening();
    } else {
      stopListening();
    }
  }, [shouldListen, startListening, stopListening]);

  const toggleListening = useCallback(() => {
    if (status === 'listening') {
      setShouldListen(false);
      stopListening();
    } else {
      setShouldListen(true);
      startListening();
    }
  }, [status, setShouldListen, startListening, stopListening]);

  const isListening = status === 'listening';
  const isProcessing = status === 'processing';
  const isSpeaking = status === 'speaking';

  // 状态文字
  const statusText = (() => {
    if (isProcessing) return '正在理解...';
    if (isSpeaking) return '正在播报...';
    if (isListening) return '聆听中，说出指令';
    return '点击麦克风开始';
  })();

  return (
    <div className="h-16 flex items-center gap-4 px-5 bg-panel-bg border-t border-panel-border shrink-0">
      {/* 麦克风按钮 */}
      <button
        onClick={toggleListening}
        disabled={isProcessing || isSpeaking}
        aria-label={isListening ? '停止聆听' : '开始聆听'}
        aria-pressed={isListening}
        className={`
          relative w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all
          ${isListening ? 'animate-voice-listening' : ''}
          ${isProcessing ? 'animate-voice-pulse' : ''}
          ${
            isListening
              ? 'bg-status-listen text-canvas-bg'
              : isProcessing
                ? 'bg-status-process text-white'
                : isSpeaking
                  ? 'bg-status-speak text-white'
                  : 'bg-surface hover:bg-surface-hover text-text-secondary'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {/* 麦克风图标 */}
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
          />
        </svg>
      </button>

      {/* 状态 + 识别文本 */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-secondary">{statusText}</p>
        <p className="text-sm text-text-primary truncate mt-0.5">
          {interimTranscript || transcript || ''}
        </p>
      </div>

      {/* VoiceIndicator */}
      <div className="flex items-center gap-1.5">
        <div
          className={`w-1.5 h-1.5 rounded-full transition-colors ${
            isListening
              ? 'bg-status-listen'
              : isProcessing
                ? 'bg-status-process'
                : isSpeaking
                  ? 'bg-status-speak'
                  : 'bg-text-muted'
          }`}
        />
      </div>
    </div>
  );
}
