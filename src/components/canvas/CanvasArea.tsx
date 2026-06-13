import { useCanvasStore } from '../../stores/canvasStore';
import { TranscriptOverlay } from '../voice/TranscriptOverlay';
import { useVoiceStore } from '../../stores/voiceStore';

export function CanvasArea() {
  const canvas = useCanvasStore((s) => s.getCurrentCanvas());
  const interimTranscript = useVoiceStore((s) => s.interimTranscript);
  const transcript = useVoiceStore((s) => s.transcript);

  const displayText = interimTranscript || transcript;

  return (
    <div className="flex-1 relative flex items-center justify-center bg-canvas-bg min-h-0 overflow-hidden">
      {/* 生成中 Loading 遮罩 */}
      {canvas.isGenerating && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-canvas-bg/80 backdrop-blur-sm">
          <div className="w-10 h-10 border-2 border-panel-border border-t-accent rounded-full animate-spin" />
          <p className="mt-4 text-sm text-text-secondary">正在生成...</p>
        </div>
      )}

      {/* 图片显示 */}
      {canvas.imageUrl ? (
        <img
          src={canvas.imageUrl}
          alt={canvas.name}
          className="max-w-full max-h-full object-contain"
          draggable={false}
        />
      ) : (
        /* 空状态 */
        <div className="flex flex-col items-center gap-4 select-none">
          <div className="w-20 h-20 rounded-2xl bg-surface flex items-center justify-center">
            <svg
              className="w-10 h-10 text-text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
              />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-text-secondary text-sm font-medium">
              说出你的绘图指令
            </p>
            <p className="text-text-muted text-xs mt-1">
              例如 &ldquo;生成一只小猫坐在月亮上&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* 识别文本浮层 */}
      <TranscriptOverlay text={displayText} />
    </div>
  );
}
