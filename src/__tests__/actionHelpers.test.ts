import { describe, it, expect } from 'vitest';
import { formatError, findObjectByIdOrName } from '../utils/actionHelpers';
import type { SceneObject } from '../types/canvas';

describe('formatError', () => {
  it('formats Error instance', () => {
    const result = formatError(new Error('网络超时'), '图片生成失败');
    expect(result.reply).toBe('图片生成失败：网络超时');
  });

  it('formats string error', () => {
    const result = formatError('未知错误', '操作失败');
    expect(result.reply).toBe('操作失败：未知错误');
  });

  it('formats non-error value', () => {
    const result = formatError(42, '错误');
    expect(result.reply).toBe('错误：42');
  });
});

describe('findObjectByIdOrName', () => {
  const objects: SceneObject[] = [
    { id: 1, name: '猫', description: 'a cat' },
    { id: 2, name: '月亮', description: 'a moon' },
    { id: 3, name: '小猫', description: 'a kitten' },
  ];

  it('finds by ID', () => {
    const result = findObjectByIdOrName(objects, 2);
    expect(result?.name).toBe('月亮');
  });

  it('finds by name exact match', () => {
    const result = findObjectByIdOrName(objects, undefined, '猫');
    expect(result?.name).toBe('猫');
  });

  it('finds by name partial match', () => {
    const result = findObjectByIdOrName(objects, undefined, '猫');
    expect(result?.id).toBe(1); // matches '猫' first
  });

  it('finds by name includes match', () => {
    const result = findObjectByIdOrName(objects, undefined, '小猫');
    expect(result?.name).toBe('小猫');
  });

  it('finds by reverse match (target contains object name)', () => {
    const result = findObjectByIdOrName(objects, undefined, '那只小猫');
    expect(result?.name).toBe('小猫');
  });

  it('finds by reverse match with prefix', () => {
    const result = findObjectByIdOrName(objects, undefined, '把月亮删了');
    expect(result?.name).toBe('月亮');
  });

  it('returns undefined when not found', () => {
    const result = findObjectByIdOrName(objects, 99, '不存在');
    expect(result).toBeUndefined();
  });

  it('returns undefined for empty inputs', () => {
    const result = findObjectByIdOrName(objects);
    expect(result).toBeUndefined();
  });

  it('prefers ID match over name match', () => {
    const result = findObjectByIdOrName(objects, 2, '猫');
    expect(result?.name).toBe('月亮'); // ID 2 is 月亮, not 猫
  });
});
