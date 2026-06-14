import { useCurrentCanvas } from '../../hooks/useCurrentCanvas';
import { TranscriptOverlay } from '../voice/TranscriptOverlay';
import { useVoiceStore } from '../../stores/voiceStore';

/** 空状态引导命令卡片 */
const SUGGESTIONS = [
  { icon: '🎨', label: '生成', example: '生成一只小猫坐在月亮上' },
  { icon: '➕', label: '添加', example: '加一只小鸟在天上飞' },
  { icon: '✏️', label: '修改', example: '把小猫改成白色的' },
  { icon: '🗑️', label: '删除', example: '删掉月亮' },
];

export function CanvasArea() {
  const canvas = useCurrentCanvas();
  const interimTranscript = useVoiceStore((s) => s.interimTranscript);
  const transcript = useVoiceStore((s) => s.transcript);

  const displayText = interimTranscript || transcript;

  const imageAlt = canvas.objects.length > 0
    ? `AI 生成的图片：${canvas.objects.map((o) => o.name).join('、')}`
    : canvas.name;

  return (
    <div
      className="flex-1 relative flex items-center justify-center bg-canvas-bg min-h-0 overflow-hidden"
      role="img"
      aria-label={canvas.imageUrl ? imageAlt : '空白画布，等待语音指令'}
    >
      {canvas.isGenerating && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-canvas-bg/80 backdrop-blur-sm" role="status" aria-label="正在生成图片">
          {/* 骨架屏占位 */}
          <div className="absolute inset-8 rounded-2xl bg-surface/30 animate-shimmer" />
          {/* 加载指示器 */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 border-[3px] border-panel-border border-t-accent rounded-full animate-spin" />
            <p className="mt-5 text-sm text-text-secondary font-medium">正在生成画面...</p>
            <p className="mt-1.5 text-xs text-text-muted">AI 正在绘制你的创意，通常需要 5-15 秒</p>
          </div>
        </div>
      )}

      {canvas.imageUrl ? (
        <img
          src={canvas.imageUrl}
          alt={imageAlt}
          width={1440}
          height={810}
          className="max-w-full max-h-full object-contain"
          draggable={false}
        />
      ) : (
        <div className="flex flex-col items-center gap-8 select-none max-w-lg px-6">
          {/* 标题区 */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-5">
              <svg
                className="w-8 h-8 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-1.5">
              说出你的绘图指令
            </h2>
            <p className="text-sm text-text-muted">
              点击底部麦克风，用语音描述你想画的内容
            </p>
          </div>

          {/* 命令引导卡片 */}
          <div className="grid grid-cols-2 gap-3 w-full">
            {SUGGESTIONS.map((s) => (
              <div
                key={s.label}
                className="bg-surface/60 border border-panel-border rounded-xl p-3.5 hover:border-accent/30 hover:bg-surface transition-all duration-200 group"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-base">{s.icon}</span>
                  <span className="text-xs font-medium text-text-secondary group-hover:text-accent transition-colors">
                    {s.label}
                  </span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  &ldquo;{s.example}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <TranscriptOverlay text={displayText} />
    </div>
  );
}
