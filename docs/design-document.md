# VoiceCanvas AI — 设计文档

> 比赛题目：AI 语音绘图工具
> 要求：用户不能使用鼠标或键盘，仅通过语音指令完成绘图创作

## 一、计划支持的指令能力

| # | 指令类型 | 计划支持的语音表达 | 优先级 |
|---|---------|-------------------|--------|
| 1 | 生成图片 | "生成一只小猫"、"画一座山"、"帮我画一个太空场景" | P0 |
| 2 | 添加元素 | "加一只小鸟"、"右边加棵树"、"再画一个月亮" | P0 |
| 3 | 修改元素 | "把猫改成白色"、"把1号换成狗" | P0 |
| 4 | 删除元素 | "删除月亮"、"去掉那棵树" | P0 |
| 5 | 整体编辑 | "把背景改成夜晚"、"整体改成水彩风格" | P1 |
| 6 | 复合操作 | "删掉月亮再加一艘船"、"把猫改成黑色然后加个太阳" | P1 |
| 7 | 撤销/重做 | "撤销"、"撤销上一步"、"重做"、"恢复" | P0 |
| 8 | 新建画布 | "新建画布"、"创建一个新画布" | P1 |
| 9 | 切换画布 | "切换到画布一"、"打开画布2" | P1 |
| 10 | 查询组件 | "当前有哪些组件"、"现在有什么" | P1 |
| 11 | 切换比例 | "改成1:1"、"用16:9" | P2 |
| 12 | 帮助 | "帮助"、"你能做什么"、"怎么用" | P1 |
| 13 | 语音控制 | "暂停聆听"、"继续听"（通过麦克风按钮） | P1 |

## 二、最终实现的指令能力

### 已完整实现（12 个 Intent）

| # | Intent | 实现状态 | 关键词预检测 | LLM 解析 | 说明 |
|---|--------|---------|-------------|----------|------|
| 1 | `create_image` | ✅ 完整 | — | ✅ | planScene 组件规划 + prompt 构建 + qwen-image-2.0-pro 生成 |
| 2 | `add_object` | ✅ 完整 | — | ✅ | 增量 editImage，"Keep everything else unchanged" |
| 3 | `modify_object` | ✅ 完整 | — | ✅ | 精准 editImage："Change the X to Y" |
| 4 | `delete_object` | ✅ 完整 | ✅ 删除/去掉 | ✅ | 3 级对象匹配（名称模糊→ID 精确→序号） |
| 5 | `edit_image` | ✅ 完整 | — | ✅ | 整体编辑 + "Keep everything else unchanged" |
| 6 | `multi_step_edit` | ✅ 完整 | — | ✅ | operations 数组顺序执行 |
| 7 | `undo` | ✅ 完整 | ✅ 撤销/回退 | — | 关键词直接命中，0ms 响应 |
| 8 | `redo` | ✅ 完整 | ✅ 重做/恢复 | — | 关键词直接命中，0ms 响应 |
| 9 | `create_canvas` | ✅ 完整 | ✅ 新建画布 | — | 3 秒防抖 |
| 10 | `switch_canvas` | ✅ 完整 | ✅ 切换画布 | — | 支持中文数字（一→1） |
| 11 | `query_objects` | ✅ 完整 | ✅ 有哪些/列出 | — | 返回带序号和位置的列表 |
| 12 | `change_ratio` | ✅ 完整 | ✅ 数字:数字 | — | 5 种比例，正则最高优先级 |
| 13 | `help` | ✅ 完整 | ✅ 帮助/你能做什么 | — | TTS 播报所有可用指令 |

### 实现亮点

1. **关键词预检测优先于 LLM** — 高频指令（撤销/重做/画布/比例）0ms 响应，不调 LLM
2. **3 级对象匹配** — 名称模糊 → ID 精确 → 1-based 序号，兜底 LLM 返回的 objectId
3. **增量编辑 prompt** — 修改单个元素时只描述变化，不重建整个场景，避免背景被覆盖
4. **TTS/STT 隔离** — speakWithPause 模式，系统播报期间 STT 不捕获，防止循环执行
5. **自动聆听** — 页面加载后自动进入聆听状态，无需鼠标点击
6. **Per-canvas 历史** — 每个画布独立 undo/redo 栈，切换画布不影响历史

## 三、未完成部分及原因

| 计划功能 | 状态 | 原因 |
|---------|------|------|
| 拖拽定位（"把猫移到左边"） | 未实现 | Web Speech API 只返回文本，无法获取精确坐标。需额外的空间语义理解层，超出 MVP 范围 |
| 风格切换（"画成水彩风格"） | 部分实现 | 可通过 edit_image 的 description 字段实现，但未做专门的关键词检测 |
| 语音确认（"是的"/"不是"） | 未实现 | 需要会话状态机管理确认流程，当前架构未支持 |
| 多语言支持 | 未实现 | Web Speech API 设置 lang='zh-CN'，切换语言需重构 STT 层 |
| 离线模式 | 未实现 | 依赖 DashScope 云端 API，无本地模型备选 |
| 画布拖拽/缩放 | 未实现 | 比赛要求"纯语音控制"，鼠标交互违反规则 |

## 四、关键技术决策

### 4.1 指令解析：关键词优先 + LLM 兜底

**决策**：`detectIntentByKeywords()` 先于 LLM 调用。

**理由**：
- 撤销/重做/画布切换等高频指令用关键词匹配，0ms 响应
- 减少 LLM 调用次数，降低成本和延迟
- LLM 只处理复杂的语义理解（如"帮我画一个猫坐在月亮上"）

**权衡**：关键词规则需要手工维护，新增 intent 时需同步更新规则表。

### 4.2 图片编辑：增量 prompt 而非全量重建

**决策**：修改单个元素时使用 `Change the X to Y. Keep everything else exactly the same.` 而非 `buildImagePrompt()`。

**理由**：
- 全量重建 prompt 会导致 AI 重新生成整个场景，背景和未修改元素会变化
- 增量 prompt 明确告诉 AI "只改这个，其他不变"，保持画面一致性

**踩坑**：V1.0 使用 `buildImagePrompt` 导致修改猫的颜色时背景变黑。

### 4.3 TTS/STT 隔离：speakWithPause 模式

**决策**：TTS 开始前设置 `isSystemSpeaking=true`，结束后延迟 1.5s 才清除。

**理由**：
- 如果 TTS 和 STT 同时运行，系统播报会被 STT 捕获，导致循环执行
- 延迟 1.5s 是因为 Web Speech API 的 `onend` 事件有短暂延迟

**踩坑**：V1.0 在 `finally` 块中清除 `isSystemSpeaking`，导致 TTS 还在播报时 STT 就开始捕获。

### 4.4 状态管理：Zustand + persist

**决策**：使用 Zustand 的 persist 中间件，只持久化 canvases 和 currentCanvasId。

**理由**：
- Blob URL 刷新后失效，不持久化 imageUrl
- undoStack/redoStack 引用 blob URL，清空
- remoteImageUrl 保留，刷新后可通过 imageToBlob 重新获取

### 4.5 纯语音控制：自动聆听

**决策**：页面加载后自动进入聆听状态，无需鼠标点击。

**理由**：
- 比赛要求"用户不能使用鼠标或键盘"
- 延迟 1.5s 启动，等待浏览器麦克风权限弹窗关闭

## 五、测试结果

### 自动化测试

```
pnpm test → 53 tests passed (4 test files)
- canvasStore.test.ts: 14 tests
- actionHelpers.test.ts: 10 tests
- promptBuilder.test.ts: 12 tests
- qwenLLM.test.ts: 17 tests
```

### 手动测试场景

| 场景 | 指令 | 预期 | 结果 |
|------|------|------|------|
| 生成图片 | "生成一只小猫坐在月亮上" | 猫+月亮出现 | ✅ |
| 添加元素 | "加一只小鸟" | 小鸟添加到画面 | ✅ |
| 修改元素 | "把小猫改成白色的" | 猫变白，背景不变 | ✅ |
| 删除元素 | "删除月亮" | 月亮消失 | ✅ |
| 撤销 | "撤销" | 回到上一步 | ✅ |
| 重做 | "重做" | 恢复撤销的操作 | ✅ |
| 切换画布 | "切换到画布二" | 切换到第 2 个画布 | ✅ |
| 中文数字 | "切换到画布三" | 切换到第 3 个画布 | ✅ |
| 查询 | "现在有哪些组件" | 列出所有组件 | ✅ |
| 帮助 | "帮助" | 播报所有指令 | ✅ |
| 比例切换 | "改成1:1" | 画布比例变更 | ✅ |
| 复合操作 | "删掉月亮再加一艘船" | 两步依次执行 | ✅ |
| 自动聆听 | 打开页面 | 自动进入聆听状态 | ✅ |

### 已知限制

1. **Web Speech API 浏览器限制** — 仅 Chrome/Edge 支持，Firefox/Safari 不支持
2. **语音识别准确率** — 依赖浏览器内置 STT，嘈杂环境或方言可能不准确
3. **图片生成延迟** — DashScope API 通常需要 5-15 秒，用户需等待
4. **撤销恢复限制** — 刷新页面后 undoStack 清空（blob URL 失效）

## 六、架构总结

```
用户语音 → Web Speech API → useSpeechRecognition
                                    ↓
                              useVoiceCommand (编排层)
                                    ↓
                        detectIntentByKeywords (0ms)
                            ↓ 未命中
                        parseVoiceCommand → qwen-max LLM
                            ↓
                        executeAction (纯函数分发)
                            ↓
                 ┌──────────┼──────────┐
              API 调用    Store 更新   TTS 播报
           (qwenImage)  (canvasStore) (speakWithPause)
```

**分层职责**：
- 组件层 → UI 渲染
- Hook 层 → 语音识别/合成、指令编排
- Store 层 → Zustand 状态管理
- 服务层 → DashScope API 调用
- 执行层 → 13 个 intent 的纯函数处理
- 工具层 → Prompt 构建、对象匹配
