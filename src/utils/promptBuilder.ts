import type { SceneObject } from '../types/canvas';

/** 位置描述转文字 */
export function positionToDescription(position?: string): string {
  if (!position) return '';
  const map: Record<string, string> = {
    center: 'in the center',
    left: 'on the left side',
    right: 'on the right side',
    top: 'at the top',
    bottom: 'at the bottom',
    'top-left': 'in the top-left area',
    'top-right': 'in the top-right area',
    'bottom-left': 'in the bottom-left area',
    'bottom-right': 'in the bottom-right area',
  };
  return map[position] ?? `at ${position}`;
}

/**
 * 构建图片生成 prompt
 * 拼接场景描述 + 已有组件描述，生成优化的 prompt
 */
export function buildImagePrompt(
  description: string,
  existingObjects: SceneObject[] = [],
): string {
  const parts: string[] = [];

  // 基础场景描述
  parts.push(`A high-quality, detailed illustration: ${description}`);

  // 已有组件（用于增量编辑时保持一致性）
  if (existingObjects.length > 0) {
    const objectDescriptions = existingObjects
      .map((obj) => {
        const pos = positionToDescription(obj.position);
        return pos ? `${obj.description} ${pos}` : obj.description;
      })
      .join(', ');
    parts.push(`The scene contains: ${objectDescriptions}`);
  }

  parts.push('Professional quality, clean composition, vibrant colors.');

  return parts.join('. ') + '.';
}

/**
 * 构建增量添加 prompt
 */
export function buildAppendPrompt(
  objectName: string,
  description: string,
  position?: string,
): string {
  const pos = positionToDescription(position);
  const posText = pos ? ` ${pos}` : '';
  return `Add ${objectName} to the scene${posText}. ${description}. Keep everything else unchanged.`;
}

/**
 * 构建删除 prompt
 */
export function buildDeletePrompt(
  remainingObjects: SceneObject[],
): string {
  if (remainingObjects.length === 0) {
    return 'Remove all objects. Show an empty scene.';
  }
  const descriptions = remainingObjects
    .map((obj) => obj.description)
    .join(', ');
  return `Keep only the following in the scene: ${descriptions}. Remove everything else.`;
}
