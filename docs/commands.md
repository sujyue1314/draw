# VoiceCanvas AI - 语音指令说明

## 支持的 Intent（12 个）

### 图片操作

| Intent | 功能 | 示例 | 说明 |
|--------|------|------|------|
| `create_image` | 生成图片 | "生成一只小猫"、"画一座山" | 画面规划 → prompt 构建 → 图片生成 |
| `edit_image` | 整体编辑 | "把背景改成傍晚" | 基于当前图片编辑 |
| `add_object` | 增量添加 | "加一只小鸟"、"右边加棵树" | 在现有场景中添加元素 |
| `modify_object` | 修改组件 | "把猫改成白色"、"把 1 号改成狗" | 需要 objectId 或 objectName |
| `delete_object` | 删除组件 | "删除月亮"、"去掉 2 号" | 匹配后重建场景 |
| `multi_step_edit` | 复合操作 | "删掉月亮再加一艘船" | 拆分为多个子操作依次执行 |

### 画布操作

| Intent | 功能 | 示例 | 说明 |
|--------|------|------|------|
| `create_canvas` | 新建画布 | "新建画布" | 3 秒防抖防止无限创建 |
| `switch_canvas` | 切换画布 | "切换到画布 1" | 支持"画布1"/"1"/"canvas_1"格式 |
| `change_ratio` | 修改比例 | "改成 1:1"、"用 16:9" | 支持 16:9/9:16/1:1/4:3/3:4 |
| `query_objects` | 查询组件 | "现在有哪些元素" | 返回组件列表 |
| `undo` | 撤销 | "撤销上一步" | 关键词直接命中，不调 LLM |
| `redo` | 重做 | "恢复刚才的操作" | 关键词直接命中，不调 LLM |

## 指令解析流程

```
用户语音文本
    ↓
detectIntentByKeywords()  ← 关键词优先（比例/撤销/重做/查询/删除/画布）
    ↓ 命中 → 直接返回 Action
    ↓ 未命中
parseVoiceCommand() → 调用 qwen-max LLM
    ↓
返回 Action JSON
```

## 关键词预检测规则

| 优先级 | 模式 | Intent |
|--------|------|--------|
| 1（最高） | `\d+[:：]\d+` | `change_ratio` |
| 2 | 撤销/回退 | `undo` |
| 2 | 重做/恢复 | `redo` |
| 3 | 查询/有哪些/现在有什么 | `query_objects` |
| 4 | 新建画布/创建画布 | `create_canvas` |
| 4 | 切换画布/切换到 | `switch_canvas` |
| 5 | 删除/去掉 | `delete_object` |

## LLM 返回格式

```json
{
  "intent": "intent名",
  "description": "描述",
  "objectName": "对象名",
  "objectId": 数字ID,
  "canvasId": "canvas_N",
  "ratio": "数字:数字",
  "operations": [...]
}
```

## 注意事项

- objectId 是数字类型，LLM 可能返回 string，executor 统一 `Number()` 转换
- 复合操作使用 `multi_step_edit` + `operations` 数组
- 画布切换支持中文数字提取："画布2" → `canvas_2`
- 无法识别时返回 `unknown`，TTS 提示用户再说一次
