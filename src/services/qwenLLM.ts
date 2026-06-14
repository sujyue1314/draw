import { chatCompletion } from './apiClient';
import type { Action, Intent } from '../types/commands';
import type { ConversationTurn } from '../types/canvas';

/** 关键词预检测规则 */
const KEYWORD_RULES: Array<{
  keywords: string[];
  intent: Intent;
  extract?: (text: string) => Partial<Action>;
}> = [
  {
    keywords: ['帮助', '帮助我', '你能做什么', '怎么用', '怎么操作', '指令', '命令'],
    intent: 'help',
  },
  {
    keywords: ['撤销', '撤回', '回退'],
    intent: 'undo',
  },
  {
    keywords: ['重做', '恢复'],
    intent: 'redo',
  },
  {
    keywords: ['有哪些', '有什么', '当前组件', '列出', '查看组件'],
    intent: 'query_objects',
  },
  {
    keywords: ['新建画布', '创建画布', '新画布'],
    intent: 'create_canvas',
  },
  {
    keywords: ['切换画布', '切换到画布', '切到画布', '换画布', '换到画布', '打开画布'],
    intent: 'switch_canvas',
    extract: (text: string) => {
      const cnMap: Record<string, string> = { '一': '1', '二': '2', '三': '3', '四': '4', '五': '5', '六': '6', '七': '7', '八': '8', '九': '9', '十': '10' };
      const digitMatch = text.match(/画布\s*(\d+)/);
      if (digitMatch) return { canvasId: `canvas_${digitMatch[1]}` };
      for (const [cn, num] of Object.entries(cnMap)) {
        if (text.includes(`画布${cn}`)) return { canvasId: `canvas_${num}` };
      }
      return {};
    },
  },
  {
    keywords: ['删除', '删掉', '去掉', '移除'],
    intent: 'delete_object',
    extract: (text: string) => {
      // 尝试提取目标对象名
      const match = text.match(/(?:删除|删掉|去掉|移除)\s*(.+)/);
      return match ? { target: match[1].trim() } : {};
    },
  },
];

/** 复合指令连接词 */
const SPLIT_SEPARATORS = ['然后', '接着', '再', '并且', '同时', '之后', '还要'];

/**
 * 尝试拆分复合指令
 * 返回拆分后的子指令文本数组，长度 >= 2 表示是复合指令
 */
export function splitCompoundCommand(text: string): string[] {
  for (const sep of SPLIT_SEPARATORS) {
    if (text.includes(sep)) {
      const parts = text
        .split(sep)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (parts.length >= 2) return parts;
    }
  }
  return [text];
}

/**
 * 关键词预检测（优先于 LLM）
 * 返回 null 表示未命中，需要走 LLM
 */
export function detectIntentByKeywords(text: string): Action | null {
  const normalized = text.trim();

  // 比例检测：数字:数字 模式（优先级最高，避免被 edit_image 误判）
  const ratioMatch = normalized.match(/(\d+)\s*[:：]\s*(\d+)/);
  if (ratioMatch) {
    return {
      intent: 'change_ratio',
      ratio: `${ratioMatch[1]}:${ratioMatch[2]}`,
    };
  }

  // 关键词规则匹配
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((kw) => normalized.includes(kw))) {
      const base: Action = { intent: rule.intent };
      if (rule.extract) {
        return { ...base, ...rule.extract(normalized) };
      }
      return base;
    }
  }

  return null;
}

/** LLM system prompt */
const SYSTEM_PROMPT = `你是一个语音绘图助手的指令解析器。用户通过语音描述绘图需求，你需要解析为结构化 JSON。

## Intent 列表

| Intent | 说明 | 必填字段 |
|--------|------|----------|
| create_image | 生成新图片 | description |
| edit_image | 整体编辑当前图片 | description |
| add_object | 增量添加元素 | objectName, description |
| modify_object | 修改已有元素 | objectId, description |
| delete_object | 删除元素 | objectId 或 target |
| multi_step_edit | 复合操作 | operations |
| undo | 撤销 | 无 |
| redo | 重做 | 无 |
| create_canvas | 新建画布 | 无 |
| switch_canvas | 切换画布 | canvasId |
| query_objects | 查询组件 | 无 |
| change_ratio | 修改比例 | ratio |
| unknown | 无法识别 | 无 |

## 输出格式

严格输出 JSON，不要有任何其他文字：
{
  "intent": "intent名",
  "description": "描述",
  "objectName": "对象名",
  "objectId": 数字ID,
  "canvasId": "canvas_N",
  "ratio": "数字:数字",
  "operations": [...]
}

## 规则

1. 用户说"生成/画/创建"某物 → create_image
2. 用户说"加/添加/再加"某物 → add_object
3. 用户说"把X改成Y" → modify_object（需要 objectId）
4. 用户说"删除/去掉"某物 → delete_object
5. 用户说"把背景改成..."、"整体改成..." → edit_image
6. 复合指令如"删掉月亮再加船" → multi_step_edit + operations
7. objectId 是数字，不是字符串
8. 不确定时返回 unknown`;

/**
 * 解析语音指令
 * 关键词优先，失败则调 LLM
 */
export async function parseVoiceCommand(
  transcript: string,
  conversationHistory: ConversationTurn[] = [],
): Promise<Action> {
  // 1. 关键词预检测
  const keywordResult = detectIntentByKeywords(transcript);
  if (keywordResult) {
    return keywordResult;
  }

  // 1.5 复合指令关键词拆分（"加一只猫再加一只狗" → 两个子指令）
  const parts = splitCompoundCommand(transcript);
  if (parts.length >= 2) {
    // 每个子指令单独用关键词检测，全部命中则直接组装
    const subActions: Action[] = [];
    let allKeywordHit = true;
    for (const part of parts) {
      const hit = detectIntentByKeywords(part);
      if (hit) {
        subActions.push(hit);
      } else {
        allKeywordHit = false;
        break;
      }
    }
    if (allKeywordHit && subActions.length >= 2) {
      return {
        intent: 'multi_step_edit',
        operations: subActions.map((a) => ({
          intent: a.intent,
          target: a.target,
          description: a.description,
          objectName: a.objectName,
        })),
      };
    }
  }

  // 2. 构建对话上下文
  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    // 最近 6 轮对话作为上下文
    ...conversationHistory.slice(-6).map((turn) => ({
      role: turn.role as 'user' | 'assistant',
      content: turn.content,
    })),
    { role: 'user' as const, content: transcript },
  ];

  // 3. 调用 LLM
  const response = await chatCompletion(messages, {
    temperature: 0.1,
    response_format: { type: 'json_object' },
  });

  // 4. 解析响应
  try {
    const parsed = JSON.parse(response) as Action;

    // ID 类型修正：LLM 可能返回 string ID
    if (parsed.objectId !== undefined) {
      parsed.objectId = Number(parsed.objectId);
    }
    if (parsed.operations) {
      parsed.operations = parsed.operations.map((op) => ({
        ...op,
      }));
    }

    return parsed;
  } catch {
    // JSON 解析失败，返回 unknown
    return { intent: 'unknown', description: transcript };
  }
}

/**
 * 画面规划：从描述中提取组件列表
 */
export async function planScene(
  description: string,
): Promise<Array<{ name: string; description: string; position?: string }>> {
  const messages = [
    {
      role: 'system' as const,
      content: `你是一个画面规划器。根据用户的绘图描述，提取需要创建的组件列表。

## 输出格式

严格输出 JSON：
{
  "objects": [
    { "name": "组件名", "description": "英文描述（用于图片生成）", "position": "位置" }
  ]
}

## 位置可选值

center, left, right, top, bottom, top-left, top-right, bottom-left, bottom-right

## 位置推断规则

根据中文空间关系词推断位置：
- "坐在/站在/在...上" → 如果是物体表面（桌子、月亮），被坐物体 center，坐者 center
- "在左边/右侧" → left / right
- "在上面/天空中" → top
- "在下面/地上" → bottom
- "旁边/旁边有" → 根据前一个物体的位置选邻近位置
- "远处/背景" → top 或 top-left/top-right
- "前景/前面" → bottom 或 center
- 无明确位置描述 → 根据常识推断（如"天空"→top，"地面"→bottom）

## 示例

用户说"一只猫坐在月亮上"
→ {"objects": [{"name": "猫", "description": "a cute cat sitting on the moon", "position": "center"}, {"name": "月亮", "description": "a glowing full moon", "position": "center"}]}

用户说"一只猫坐在月亮上，旁边有一棵树，背景是星空"
→ {"objects": [{"name": "猫", "description": "a cute cat sitting on the moon", "position": "center"}, {"name": "月亮", "description": "a glowing full moon", "position": "center"}, {"name": "树", "description": "a tall tree", "position": "right"}, {"name": "星空", "description": "a starry night sky background", "position": "top"}]}`,
    },
    { role: 'user' as const, content: description },
  ];

  const response = await chatCompletion(messages, {
    temperature: 0.1,
    response_format: { type: 'json_object' },
  });

  try {
    const parsed = JSON.parse(response) as {
      objects: Array<{ name: string; description: string; position?: string }>;
    };
    return parsed.objects ?? [];
  } catch {
    // 解析失败，返回单个对象
    return [{ name: '场景', description: description }];
  }
}
