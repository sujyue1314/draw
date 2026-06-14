import { useCurrentCanvas } from '../../hooks/useCurrentCanvas';

/** 位置标签简写 */
const POSITION_SHORT: Record<string, string> = {
  center: '中',
  left: '左',
  right: '右',
  top: '上',
  bottom: '下',
  'top-left': '左上',
  'top-right': '右上',
  'bottom-left': '左下',
  'bottom-right': '右下',
};

export function ComponentList() {
  const objects = useCurrentCanvas().objects;

  return (
    <div className="flex-1 p-3 overflow-y-auto min-h-0">
      <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-3">
        组件
      </h3>

      {objects.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-center">
          <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center mb-2.5">
            <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3 3h18a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
            </svg>
          </div>
          <p className="text-xs text-text-muted">生成图片后将在此显示组件</p>
        </div>
      ) : (
        <ul className="space-y-1">
          {objects.map((obj, i) => (
            <li
              key={obj.id}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-surface hover:bg-surface-hover transition-colors group"
            >
              <span className="w-5 h-5 rounded-md bg-panel-bg flex items-center justify-center text-[10px] font-mono text-text-muted shrink-0">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-text-primary truncate">
                  {obj.name}
                </p>
              </div>
              {obj.position && (
                <span className="text-[10px] text-text-muted bg-panel-bg px-1.5 py-0.5 rounded shrink-0">
                  {POSITION_SHORT[obj.position] ?? obj.position}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
