import { describe, it, expect } from 'vitest';
import {
  positionToDescription,
  buildImagePrompt,
  buildAppendPrompt,
  buildDeletePrompt,
} from '../utils/promptBuilder';
import type { SceneObject } from '../types/canvas';

describe('positionToDescription', () => {
  it('returns empty string for undefined position', () => {
    expect(positionToDescription(undefined)).toBe('');
  });

  it('maps center to "in the center"', () => {
    expect(positionToDescription('center')).toBe('in the center');
  });

  it('maps known positions correctly', () => {
    expect(positionToDescription('left')).toBe('on the left side');
    expect(positionToDescription('top-right')).toBe('in the top-right area');
    expect(positionToDescription('bottom')).toBe('at the bottom');
  });

  it('returns fallback for unknown position', () => {
    expect(positionToDescription('custom')).toBe('at custom');
  });
});

describe('buildImagePrompt', () => {
  it('includes description in prompt', () => {
    const prompt = buildImagePrompt('a cute cat');
    expect(prompt).toContain('a cute cat');
  });

  it('includes existing objects with positions', () => {
    const objects: SceneObject[] = [
      { id: 1, name: '猫', description: 'a cute cat', position: 'center' },
      { id: 2, name: '月亮', description: 'a glowing moon', position: 'top' },
    ];
    const prompt = buildImagePrompt('a scene', objects);
    expect(prompt).toContain('a cute cat in the center');
    expect(prompt).toContain('a glowing moon at the top');
  });

  it('handles empty objects array', () => {
    const prompt = buildImagePrompt('a scene', []);
    expect(prompt).not.toContain('The scene contains');
  });
});

describe('buildAppendPrompt', () => {
  it('includes object name and description', () => {
    const prompt = buildAppendPrompt('小鸟', 'a small bird', 'top');
    expect(prompt).toContain('Add 小鸟');
    expect(prompt).toContain('a small bird');
    expect(prompt).toContain('at the top');
    expect(prompt).toContain('Keep everything else unchanged');
  });

  it('works without position', () => {
    const prompt = buildAppendPrompt('猫', 'a cat');
    expect(prompt).toContain('Add 猫 to the scene.');
  });
});

describe('buildDeletePrompt', () => {
  it('returns empty scene prompt for no remaining objects', () => {
    const prompt = buildDeletePrompt([]);
    expect(prompt).toContain('empty scene');
  });

  it('lists remaining objects', () => {
    const objects: SceneObject[] = [
      { id: 1, name: '猫', description: 'a cute cat' },
    ];
    const prompt = buildDeletePrompt(objects);
    expect(prompt).toContain('a cute cat');
    expect(prompt).toContain('Remove everything else');
  });
});
