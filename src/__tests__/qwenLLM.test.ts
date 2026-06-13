import { describe, it, expect } from 'vitest';
import { detectIntentByKeywords } from '../services/qwenLLM';

describe('detectIntentByKeywords', () => {
  describe('change_ratio', () => {
    it('detects ratio pattern 1:1', () => {
      const result = detectIntentByKeywords('改成1:1');
      expect(result).toEqual({ intent: 'change_ratio', ratio: '1:1' });
    });

    it('detects ratio pattern 16:9', () => {
      const result = detectIntentByKeywords('用16:9比例');
      expect(result).toEqual({ intent: 'change_ratio', ratio: '16:9' });
    });

    it('detects ratio with colon variant', () => {
      const result = detectIntentByKeywords('切换到4：3');
      expect(result).toEqual({ intent: 'change_ratio', ratio: '4:3' });
    });
  });

  describe('undo', () => {
    it('detects 撤销', () => {
      const result = detectIntentByKeywords('撤销');
      expect(result).toEqual({ intent: 'undo' });
    });

    it('detects 回退', () => {
      const result = detectIntentByKeywords('回退上一步');
      expect(result).toEqual({ intent: 'undo' });
    });
  });

  describe('redo', () => {
    it('detects 重做', () => {
      const result = detectIntentByKeywords('重做');
      expect(result).toEqual({ intent: 'redo' });
    });

    it('detects 恢复', () => {
      const result = detectIntentByKeywords('恢复刚才的操作');
      expect(result).toEqual({ intent: 'redo' });
    });
  });

  describe('query_objects', () => {
    it('detects 查询', () => {
      const result = detectIntentByKeywords('查询当前组件');
      expect(result).toEqual({ intent: 'query_objects' });
    });

    it('detects 有哪些', () => {
      const result = detectIntentByKeywords('现在有哪些元素');
      expect(result).toEqual({ intent: 'query_objects' });
    });
  });

  describe('create_canvas', () => {
    it('detects 新建画布', () => {
      const result = detectIntentByKeywords('新建画布');
      expect(result).toEqual({ intent: 'create_canvas' });
    });

    it('detects 创建画布', () => {
      const result = detectIntentByKeywords('创建画布');
      expect(result).toEqual({ intent: 'create_canvas' });
    });
  });

  describe('switch_canvas', () => {
    it('detects 切换画布 with canvas ID', () => {
      const result = detectIntentByKeywords('切换到画布2');
      expect(result).toEqual({ intent: 'switch_canvas', canvasId: 'canvas_2' });
    });

    it('detects 切换画布', () => {
      const result = detectIntentByKeywords('切换画布');
      expect(result).toEqual({ intent: 'switch_canvas' });
    });
  });

  describe('delete_object', () => {
    it('detects 删除', () => {
      const result = detectIntentByKeywords('删除月亮');
      expect(result).toEqual({ intent: 'delete_object', target: '月亮' });
    });

    it('detects 去掉', () => {
      const result = detectIntentByKeywords('去掉那只猫');
      expect(result).toEqual({ intent: 'delete_object', target: '那只猫' });
    });
  });

  describe('unknown', () => {
    it('returns null for unrecognized text', () => {
      const result = detectIntentByKeywords('生成一只小猫');
      expect(result).toBeNull();
    });

    it('returns null for empty string', () => {
      const result = detectIntentByKeywords('');
      expect(result).toBeNull();
    });
  });
});
