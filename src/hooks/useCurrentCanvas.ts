import { useCanvasStore } from '../stores/canvasStore';
import type { CanvasState } from '../types/canvas';

/**
 * 稳定的当前画布 selector hook
 * 使用 currentCanvasId 索引，避免 getCurrentCanvas() 每次创建新引用
 */
export function useCurrentCanvas(): CanvasState {
  const canvases = useCanvasStore((s) => s.canvases);
  const currentCanvasId = useCanvasStore((s) => s.currentCanvasId);
  return canvases.find((c) => c.id === currentCanvasId) ?? canvases[0];
}
