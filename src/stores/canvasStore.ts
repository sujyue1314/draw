import { create } from 'zustand';
import type { CanvasState, HistorySnapshot } from '../types/canvas';

/** 创建默认画布 */
function createDefaultCanvas(id: string, name: string): CanvasState {
  return {
    id,
    name,
    aspectRatio: '16:9',
    objects: [],
    imageUrl: null,
    remoteImageUrl: null,
    isGenerating: false,
    undoStack: [],
    redoStack: [],
  };
}

interface CanvasStore {
  canvases: CanvasState[];
  currentCanvasId: string;

  /** 获取当前画布 */
  getCurrentCanvas: () => CanvasState;

  /** 创建新画布并切换 */
  createCanvas: () => void;

  /** 切换到指定画布 */
  switchCanvas: (canvasId: string) => void;

  /** 更新当前画布（不可变） */
  updateCanvas: (patch: Partial<CanvasState>) => void;

  /** 操作前保存快照到 undoStack */
  saveToHistory: (description: string) => void;

  /** 撤销 */
  undo: () => void;

  /** 重做 */
  redo: () => void;

  /** 设置生成状态 */
  setIsGenerating: (isGenerating: boolean) => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  canvases: [createDefaultCanvas('canvas_1', '画布1')],
  currentCanvasId: 'canvas_1',

  getCurrentCanvas: () => {
    const { canvases, currentCanvasId } = get();
    return canvases.find((c) => c.id === currentCanvasId) ?? canvases[0];
  },

  createCanvas: () => {
    set((state) => {
      const nextIndex = state.canvases.length + 1;
      const newCanvas = createDefaultCanvas(
        `canvas_${nextIndex}`,
        `画布${nextIndex}`,
      );
      return {
        canvases: [...state.canvases, newCanvas],
        currentCanvasId: newCanvas.id,
      };
    });
  },

  switchCanvas: (canvasId: string) => {
    set((state) => {
      const exists = state.canvases.some((c) => c.id === canvasId);
      if (!exists) return state;
      return { currentCanvasId: canvasId };
    });
  },

  updateCanvas: (patch: Partial<CanvasState>) => {
    set((state) => ({
      canvases: state.canvases.map((c) =>
        c.id === state.currentCanvasId ? { ...c, ...patch } : c,
      ),
    }));
  },

  saveToHistory: (description: string) => {
    set((state) => ({
      canvases: state.canvases.map((c) => {
        if (c.id !== state.currentCanvasId) return c;
        const snapshot: HistorySnapshot = {
          timestamp: Date.now(),
          description,
          objects: [...c.objects],
          imageUrl: c.imageUrl,
          remoteImageUrl: c.remoteImageUrl,
        };
        return {
          ...c,
          undoStack: [...c.undoStack, snapshot],
          redoStack: [], // 新操作清空 redoStack
        };
      }),
    }));
  },

  undo: () => {
    set((state) => ({
      canvases: state.canvases.map((c) => {
        if (c.id !== state.currentCanvasId) return c;
        if (c.undoStack.length === 0) return c;

        const lastSnapshot = c.undoStack[c.undoStack.length - 1];
        const currentSnapshot: HistorySnapshot = {
          timestamp: Date.now(),
          description: 'undo',
          objects: [...c.objects],
          imageUrl: c.imageUrl,
          remoteImageUrl: c.remoteImageUrl,
        };

        return {
          ...c,
          objects: [...lastSnapshot.objects],
          imageUrl: lastSnapshot.imageUrl,
          remoteImageUrl: lastSnapshot.remoteImageUrl,
          undoStack: c.undoStack.slice(0, -1),
          redoStack: [...c.redoStack, currentSnapshot],
        };
      }),
    }));
  },

  redo: () => {
    set((state) => ({
      canvases: state.canvases.map((c) => {
        if (c.id !== state.currentCanvasId) return c;
        if (c.redoStack.length === 0) return c;

        const lastSnapshot = c.redoStack[c.redoStack.length - 1];
        const currentSnapshot: HistorySnapshot = {
          timestamp: Date.now(),
          description: 'redo',
          objects: [...c.objects],
          imageUrl: c.imageUrl,
          remoteImageUrl: c.remoteImageUrl,
        };

        return {
          ...c,
          objects: [...lastSnapshot.objects],
          imageUrl: lastSnapshot.imageUrl,
          remoteImageUrl: lastSnapshot.remoteImageUrl,
          undoStack: [...c.undoStack, currentSnapshot],
          redoStack: c.redoStack.slice(0, -1),
        };
      }),
    }));
  },

  setIsGenerating: (isGenerating: boolean) => {
    set((state) => ({
      canvases: state.canvases.map((c) =>
        c.id === state.currentCanvasId ? { ...c, isGenerating } : c,
      ),
    }));
  },
}));
