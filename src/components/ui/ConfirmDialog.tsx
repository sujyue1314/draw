import { useConfirmStore } from '../../stores/confirmStore';

export function ConfirmDialog() {
  const isOpen = useConfirmStore((s) => s.isOpen);
  const question = useConfirmStore((s) => s.question);
  const confirm = useConfirmStore((s) => s.confirm);
  const cancel = useConfirmStore((s) => s.cancel);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-canvas-bg/60 backdrop-blur-sm"
        onClick={cancel}
        aria-hidden="true"
      />

      {/* 对话框 */}
      <div
        className="relative bg-panel-bg border border-panel-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <p id="confirm-dialog-title" className="text-sm text-text-primary leading-relaxed mb-6">
          {question}
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={cancel}
            className="px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={confirm}
            className="px-4 py-2 text-xs font-medium text-canvas-bg bg-accent hover:bg-accent-dim rounded-lg transition-colors"
            autoFocus
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}
