import { useCallback, useEffect, useRef } from 'react';
import { useVoiceStore } from '../../stores/voiceStore';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useVoiceCommand } from '../../hooks/useVoiceCommand';

/** 快捷命令 */
const QUICK_COMMANDS = [
  { label: '生成小猫', command: '生成一只可爱的小猫' },
  { label: '添加太阳', command: '加一个太阳' },
  { label: '查询组件', command: '当前有哪些组件' },
  { label: '撤销', command: '撤销' },
];

export function VoiceControlBar() {
  const status = useVoiceStore((s) => s.status);
  const transcript = useVoiceStore((s) => s.transcript);
  const interimTranscript = useVoiceStore((s) => s.interimTranscript);
  const shouldListen = useVoiceStore((s) => s.shouldListen);
  const setShouldListen = useVoiceStore((s) => s.setShouldListen);

  const { startListening, stopListening } = useSpeechRecognition();
  const { handleVoiceCommand } = useVoiceCommand();

  const lastTranscriptRef = useRef('');
  const commandLockRef = useRef(false);

  // 监听 transcript 变化，触发指令处理
  useEffect(() => {
    if (transcript && transcript !== lastTranscriptRef.current && !commandLockRef.current) {
      lastTranscriptRef.current = transcript;
      commandLockRef.current = true;
      handleVoiceCommand(transcript).finally(() => {
        // 延迟解锁，防止 TTS 播报期间 STT 捕获同一条指令
        setTimeout(() => {
          commandLockRef.current = false;
          lastTranscriptRef.current = '';
        }, 2000);
      });
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

  /** 快捷命令点击 */
  const handleQuickCommand = useCallback(
    (command: string) => {
      if (commandLockRef.current) return;
      commandLockRef.current = true;
      handleVoiceCommand(command).finally(() => {
        setTimeout(() => {
          commandLockRef.current = false;
        }, 2000);
      });
    },
    [handleVoiceCommand],
  );

  const isListening = status === 'listening';
  const isProcessing = status === 'processing';
  const isSpeaking = status === 'speaking';
  const isBusy = isProcessing || isSpeaking;

  // 状态文字
  const statusText = (() => {
    if (isProcessing) return '正在理解...';
    if (isSpeaking) return '正在播报...';
    if (isListening) return '聆听中，说出指令';
    return '点击麦克风开始';
  })();

  return (
    <div className="shrink-0 bg-panel-bg border-t border-panel-border">
      {/* 主控制栏 */}
      <div className="h-16 flex items-center gap-4 px-5">
        {/* 麦克风按钮 */}
        <button
          onClick={toggleListening}
          disabled={isBusy}
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

        {/* 状态指示灯 */}
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

      {/* 快捷命令行 */}
      <div className="flex items-center gap-2 px-5 pb-3">
        <span className="text-[10px] text-text-muted shrink-0">快捷：</span>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {QUICK_COMMANDS.map((cmd) => (
            <button
              key={cmd.label}
              onClick={() => handleQuickCommand(cmd.command)}
              disabled={isBusy}
              className="px-2.5 py-1 rounded-full bg-surface text-[11px] text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-panel-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {cmd.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
