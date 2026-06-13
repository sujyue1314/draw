import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '../stores/canvasStore';

describe('canvasStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useCanvasStore.setState({
      canvases: [
        {
          id: 'canvas_1',
          name: '画布1',
          aspectRatio: '16:9',
          objects: [],
          imageUrl: null,
          remoteImageUrl: null,
          isGenerating: false,
          undoStack: [],
          redoStack: [],
        },
      ],
      currentCanvasId: 'canvas_1',
    });
  });

  describe('createCanvas', () => {
    it('creates a new canvas and switches to it', () => {
      useCanvasStore.getState().createCanvas();
      const state = useCanvasStore.getState();
      expect(state.canvases).toHaveLength(2);
      expect(state.currentCanvasId).toBe('canvas_2');
    });

    it('increments canvas index correctly', () => {
      useCanvasStore.getState().createCanvas();
      useCanvasStore.getState().createCanvas();
      const state = useCanvasStore.getState();
      expect(state.canvases).toHaveLength(3);
      expect(state.currentCanvasId).toBe('canvas_3');
    });
  });

  describe('switchCanvas', () => {
    it('switches to existing canvas', () => {
      useCanvasStore.getState().createCanvas();
      useCanvasStore.getState().switchCanvas('canvas_1');
      expect(useCanvasStore.getState().currentCanvasId).toBe('canvas_1');
    });

    it('ignores non-existent canvas', () => {
      useCanvasStore.getState().switchCanvas('canvas_999');
      expect(useCanvasStore.getState().currentCanvasId).toBe('canvas_1');
    });
  });

  describe('updateCanvas', () => {
    it('patches current canvas', () => {
      useCanvasStore.getState().updateCanvas({ aspectRatio: '1:1' });
      const canvas = useCanvasStore.getState().getCurrentCanvas();
      expect(canvas.aspectRatio).toBe('1:1');
    });

    it('only updates current canvas', () => {
      useCanvasStore.getState().createCanvas();
      useCanvasStore.getState().updateCanvas({ aspectRatio: '4:3' });
      useCanvasStore.getState().switchCanvas('canvas_1');
      const canvas = useCanvasStore.getState().getCurrentCanvas();
      expect(canvas.aspectRatio).toBe('16:9'); // unchanged
    });
  });

  describe('saveToHistory', () => {
    it('saves snapshot to undoStack', () => {
      useCanvasStore.getState().updateCanvas({ objects: [{ id: 1, name: '猫', description: 'a cat' }] });
      useCanvasStore.getState().saveToHistory('添加猫');
      const canvas = useCanvasStore.getState().getCurrentCanvas();
      expect(canvas.undoStack).toHaveLength(1);
      expect(canvas.undoStack[0].description).toBe('添加猫');
    });

    it('clears redoStack on new operation', () => {
      // Setup: add object, save, then simulate redo stack
      useCanvasStore.getState().saveToHistory('操作1');
      useCanvasStore.setState((state) => ({
        canvases: state.canvases.map((c) =>
          c.id === 'canvas_1' ? { ...c, redoStack: [{ timestamp: Date.now(), description: 'redo', objects: [], imageUrl: null, remoteImageUrl: null }] } : c,
        ),
      }));
      useCanvasStore.getState().saveToHistory('操作2');
      const canvas = useCanvasStore.getState().getCurrentCanvas();
      expect(canvas.redoStack).toHaveLength(0);
    });
  });

  describe('undo', () => {
    it('restores previous state from undoStack', () => {
      const originalObjects = [{ id: 1, name: '猫', description: 'a cat' }];
      useCanvasStore.getState().updateCanvas({ objects: originalObjects as any });
      useCanvasStore.getState().saveToHistory('添加猫');

      // Modify state
      useCanvasStore.getState().updateCanvas({ objects: [] as any });

      // Undo
      useCanvasStore.getState().undo();
      const canvas = useCanvasStore.getState().getCurrentCanvas();
      expect(canvas.objects).toEqual(originalObjects);
      expect(canvas.undoStack).toHaveLength(0);
      expect(canvas.redoStack).toHaveLength(1);
    });

    it('does nothing when undoStack is empty', () => {
      useCanvasStore.getState().undo();
      const canvas = useCanvasStore.getState().getCurrentCanvas();
      expect(canvas.undoStack).toHaveLength(0);
      expect(canvas.redoStack).toHaveLength(0);
    });
  });

  describe('redo', () => {
    it('restores state from redoStack', () => {
      // Setup: save state, modify, undo
      useCanvasStore.getState().updateCanvas({ objects: [{ id: 1, name: '猫', description: 'a cat' }] as any });
      useCanvasStore.getState().saveToHistory('添加猫');
      useCanvasStore.getState().updateCanvas({ objects: [] as any });
      useCanvasStore.getState().undo();

      // Redo
      useCanvasStore.getState().redo();
      const canvas = useCanvasStore.getState().getCurrentCanvas();
      expect(canvas.objects).toEqual([]);
      expect(canvas.redoStack).toHaveLength(0);
      expect(canvas.undoStack).toHaveLength(1);
    });

    it('does nothing when redoStack is empty', () => {
      useCanvasStore.getState().redo();
      const canvas = useCanvasStore.getState().getCurrentCanvas();
      expect(canvas.redoStack).toHaveLength(0);
    });
  });

  describe('setIsGenerating', () => {
    it('sets isGenerating on current canvas', () => {
      useCanvasStore.getState().setIsGenerating(true);
      expect(useCanvasStore.getState().getCurrentCanvas().isGenerating).toBe(true);
    });
  });
});
