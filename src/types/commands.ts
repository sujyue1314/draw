/** 12 个 intent + unknown */
export type Intent =
  | 'create_image'
  | 'edit_image'
  | 'add_object'
  | 'modify_object'
  | 'delete_object'
  | 'multi_step_edit'
  | 'undo'
  | 'redo'
  | 'create_canvas'
  | 'switch_canvas'
  | 'query_objects'
  | 'change_ratio'
  | 'unknown';

/** 复合操作中的单个操作 */
export interface Operation {
  intent: Intent;
  target?: string;
  description?: string;
  objectName?: string;
}

/** LLM 解析后的结构化 Action */
export interface Action {
  intent: Intent;
  target?: string;
  description?: string;
  objectName?: string;
  objectId?: number;
  canvasId?: string;
  ratio?: string;
  operations?: Operation[];
}

/** actionExecutor 的执行结果 */
export interface ExecResult {
  reply: string;
  needConfirm?: boolean;
  confirmQuestion?: string;
}

/** actionExecutor 的上下文接口 */
export interface ExecutorCtx {
  getCanvas: () => import('./canvas').CanvasState;
  updateCanvas: (patch: Partial<import('./canvas').CanvasState>) => void;
  saveToHistory: (description: string) => void;
  addConversationTurn: (turn: import('./canvas').ConversationTurn) => void;
  showConfirm: (question: string, onConfirm: () => void) => void;
}
