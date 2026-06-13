import { useCanvasStore } from '../../stores/canvasStore';

export function CanvasTabs() {
  const canvases = useCanvasStore((s) => s.canvases);
  const currentCanvasId = useCanvasStore((s) => s.currentCanvasId);
  const switchCanvas = useCanvasStore((s) => s.switchCanvas);
  const createCanvas = useCanvasStore((s) => s.createCanvas);

  return (
    <nav
      className="h-10 flex items-center gap-1 px-4 bg-panel-bg border-t border-panel-border shrink-0 overflow-x-auto"
      role="tablist"
      aria-label="画布列表"
    >
      {canvases.map((c) => {
        const isActive = c.id === currentCanvasId;
        return (
          <button
            key={c.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => switchCanvas(c.id)}
            className={`
              px-3 py-1 text-xs font-medium rounded-md transition-colors shrink-0
              ${
                isActive
                  ? 'bg-surface text-text-primary'
                  : 'text-text-muted hover:text-text-secondary hover:bg-surface-hover'
              }
            `}
          >
            {c.name}
          </button>
        );
      })}

      <button
        onClick={createCanvas}
        className="px-2 py-1 text-xs text-text-muted hover:text-accent hover:bg-surface-hover rounded-md transition-colors shrink-0 ml-1"
        aria-label="新建画布"
      >
        +
      </button>
    </nav>
  );
}
