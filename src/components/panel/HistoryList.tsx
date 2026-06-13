import { useCurrentCanvas } from '../../hooks/useCurrentCanvas';

export function HistoryList() {
  const canvas = useCurrentCanvas();
  const undoStack = canvas.undoStack;
  const redoStack = canvas.redoStack;

  return (
    <div className="flex-1 p-3 border-t border-panel-border overflow-y-auto min-h-0">
      <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-3">
        历史
      </h3>

      {undoStack.length === 0 && redoStack.length === 0 ? (
        <p className="text-xs text-text-muted">暂无历史</p>
      ) : (
        <ul className="space-y-1">
          {[...redoStack].reverse().map((snap, i) => (
            <li
              key={`redo-${i}`}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-text-muted opacity-50"
            >
              <span className="text-[10px]">↻</span>
              <span className="truncate">{snap.description}</span>
            </li>
          ))}

          <li className="flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-accent font-medium">
            <span className="text-[10px]">●</span>
            <span>当前</span>
          </li>

          {[...undoStack].reverse().map((snap, i) => (
            <li
              key={`undo-${i}`}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-text-secondary hover:bg-surface-hover transition-colors"
            >
              <span className="text-[10px]">↩</span>
              <span className="truncate">{snap.description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
