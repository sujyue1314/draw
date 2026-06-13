import { useCurrentCanvas } from '../../hooks/useCurrentCanvas';

export function ComponentList() {
  const objects = useCurrentCanvas().objects;

  return (
    <div className="flex-1 p-3 overflow-y-auto min-h-0">
      <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-3">
        组件
      </h3>

      {objects.length === 0 ? (
        <p className="text-xs text-text-muted">暂无组件</p>
      ) : (
        <ul className="space-y-1.5">
          {objects.map((obj, i) => (
            <li
              key={obj.id}
              className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-surface hover:bg-surface-hover transition-colors"
            >
              <span className="text-[10px] text-text-muted font-mono mt-0.5 shrink-0">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">
                  {obj.name}
                </p>
                {obj.position && (
                  <p className="text-[10px] text-text-muted mt-0.5">
                    {obj.position}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
