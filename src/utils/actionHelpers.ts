import type { SceneObject } from '../types/canvas';
import type { ExecutorCtx, ExecResult } from '../types/commands';

/** 统一错误格式 */
export function formatError(err: unknown, prefix: string): ExecResult {
  const msg = err instanceof Error ? err.message : String(err);
  return { reply: `${prefix}：${msg}` };
}

/** 包装 isGenerating 状态管理 */
export async function withGenerating(
  ctx: ExecutorCtx,
  fn: () => Promise<ExecResult>,
): Promise<ExecResult> {
  ctx.updateCanvas({ isGenerating: true });
  try {
    return await fn();
  } catch (err) {
    return formatError(err, '操作失败');
  } finally {
    ctx.updateCanvas({ isGenerating: false });
  }
}

/** 按 ID 或名称匹配对象 */
export function findObjectByIdOrName(
  objects: SceneObject[],
  targetId?: number,
  targetName?: string,
): SceneObject | undefined {
  if (targetId !== undefined) {
    const found = objects.find((o) => o.id === Number(targetId));
    if (found) return found;
  }
  if (targetName) {
    return objects.find(
      (o) => o.name === targetName || o.name.includes(targetName),
    );
  }
  return undefined;
}
