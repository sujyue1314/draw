import { useCanvasStore } from '../../stores/canvasStore';
import { useVoiceStore } from '../../stores/voiceStore';
import type { VoiceStatus } from '../../stores/voiceStore';

const STATUS_MAP: Record<VoiceStatus, { label: string; color: string }> = {
  idle: { label: '待命', color: 'bg-text-muted' },
  listening: { label: '聆听中', color: 'bg-status-listen' },
  processing: { label: '思考中', color: 'bg-status-process' },
  speaking: { label: '播报中', color: 'bg-status-speak' },
};

export function TopBar() {
  const canvas = useCanvasStore((s) => s.getCurrentCanvas());
  const voiceStatus = useVoiceStore((s) => s.status);
  const { label, color } = STATUS_MAP[voiceStatus];

  return (
    <header className="h-12 flex items-center justify-between px-5 bg-panel-bg border-b border-panel-border shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-canvas-bg font-bold text-sm">
          V
        </div>
        <span className="text-sm font-semibold tracking-wide text-text-primary">
          VoiceCanvas
        </span>
      </div>

      {/* 比例 + 语音状态 */}
      <div className="flex items-center gap-4">
        <span className="text-xs font-medium text-text-secondary tracking-wider uppercase">
          {canvas.aspectRatio}
        </span>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
          <span className="text-xs text-text-secondary">{label}</span>
        </div>
      </div>
    </header>
  );
}
