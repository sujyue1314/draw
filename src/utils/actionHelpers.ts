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

/** 按 ID 或名称匹配对象（双向模糊匹配） */
export function findObjectByIdOrName(
  objects: SceneObject[],
  targetId?: number,
  targetName?: string,
): SceneObject | undefined {
  // 1. 按 ID 精确匹配
  if (targetId !== undefined) {
    const found = objects.find((o) => o.id === Number(targetId));
    if (found) return found;
  }

  if (!targetName) return undefined;

  const normalized = targetName.trim();

  // 2. 精确匹配
  const exact = objects.find((o) => o.name === normalized);
  if (exact) return exact;

  // 3. 对象名包含目标（"小猫" 匹配用户说的 "小猫"）
  const includes = objects.find((o) => o.name.includes(normalized));
  if (includes) return includes;

  // 4. 目标包含对象名（"那只小猫" 匹配对象 "小猫"）— 优先最长匹配
  const reverseMatches = objects.filter((o) => normalized.includes(o.name));
  if (reverseMatches.length > 0) {
    return reverseMatches.reduce((best, cur) =>
      cur.name.length > best.name.length ? cur : best,
    );
  }

  return undefined;
}
