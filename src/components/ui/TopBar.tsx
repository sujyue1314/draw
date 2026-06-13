import { useState, useRef, useEffect } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';
import { useVoiceStore } from '../../stores/voiceStore';
import type { VoiceStatus } from '../../stores/voiceStore';
import type { AspectRatio } from '../../types/canvas';

const STATUS_MAP: Record<VoiceStatus, { label: string; color: string }> = {
  idle: { label: '待命', color: 'bg-text-muted' },
  listening: { label: '聆听中', color: 'bg-status-listen' },
  processing: { label: '思考中', color: 'bg-status-process' },
  speaking: { label: '播报中', color: 'bg-status-speak' },
};

const RATIOS: AspectRatio[] = ['16:9', '9:16', '1:1', '4:3', '3:4'];

export function TopBar() {
  const canvas = useCanvasStore((s) => s.getCurrentCanvas());
  const updateCanvas = useCanvasStore((s) => s.updateCanvas);
  const saveToHistory = useCanvasStore((s) => s.saveToHistory);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const voiceStatus = useVoiceStore((s) => s.status);
  const { label, color } = STATUS_MAP[voiceStatus];

  const [ratioOpen, setRatioOpen] = useState(false);
  const ratioRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉
  useEffect(() => {
    if (!ratioOpen) return;
    const handler = (e: MouseEvent) => {
      if (ratioRef.current && !ratioRef.current.contains(e.target as Node)) {
        setRatioOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ratioOpen]);

  const handleRatioChange = (ratio: AspectRatio) => {
    if (ratio === canvas.aspectRatio) return;
    saveToHistory('切换比例: ' + ratio);
    updateCanvas({ aspectRatio: ratio });
    setRatioOpen(false);
  };

  const canUndo = canvas.undoStack.length > 0;
  const canRedo = canvas.redoStack.length > 0;

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

      {/* 中间：撤销/重做 */}
      <div className="flex items-center gap-1">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="撤销"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
          </svg>
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="重做"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3" />
          </svg>
        </button>
      </div>

      {/* 右侧：比例选择 + 语音状态 */}
      <div className="flex items-center gap-4">
        {/* 比例选择器 */}
        <div className="relative" ref={ratioRef}>
          <button
            onClick={() => setRatioOpen(!ratioOpen)}
            className="text-xs font-medium text-text-secondary hover:text-text-primary tracking-wider uppercase px-2 py-1 rounded hover:bg-surface-hover transition-colors"
          >
            {canvas.aspectRatio}
          </button>

          {ratioOpen && (
            <div className="absolute right-0 top-full mt-1 bg-panel-bg border border-panel-border rounded-lg shadow-xl py-1 z-50 min-w-[80px]">
              {RATIOS.map((r) => (
                <button
                  key={r}
                  onClick={() => handleRatioChange(r)}
                  className={`w-full px-3 py-1.5 text-xs text-left transition-colors ${
                    r === canvas.aspectRatio
                      ? 'text-accent bg-surface'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 语音状态 */}
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
          <span className="text-xs text-text-secondary">{label}</span>
        </div>
      </div>
    </header>
  );
}
