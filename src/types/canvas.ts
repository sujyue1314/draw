/** 画布中可显示的场景对象 */
export interface SceneObject {
  id: number;
  name: string;
  description: string;
  position?: string;
}

/** 支持的画布比例 */
export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4';

/** 单次历史快照（用于撤销/重做） */
export interface HistorySnapshot {
  timestamp: number;
  description: string;
  objects: SceneObject[];
  imageUrl: string | null;
  remoteImageUrl: string | null;
}

/** 单个画布的完整状态 */
export interface CanvasState {
  id: string;
  name: string;
  aspectRatio: AspectRatio;
  objects: SceneObject[];
  imageUrl: string | null;
  remoteImageUrl: string | null;
  isGenerating: boolean;
  undoStack: HistorySnapshot[];
  redoStack: HistorySnapshot[];
}

/** 对话轮次 */
export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
