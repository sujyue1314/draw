# VoiceCanvas AI - 技术设计

## 架构概览

```
用户语音 → Web Speech API → useSpeechRecognition
                                    ↓
                              useVoiceCommand (编排层)
                                    ↓
                            parseVoiceCommand (LLM)
                                    ↓
                            executeAction (纯函数)
                                    ↓
                     ┌──────────────┼──────────────┐
                  API 调用       Store 更新      TTS 播报
               (qwenImage)   (canvasStore)   (speakWithPause)
```

## 核心分层

| 层 | 文件 | 职责 |
|----|------|------|
| 类型 | `types/canvas.ts`, `types/commands.ts` | 数据结构定义 |
| Store | `stores/canvasStore.ts` | 画布状态（多画布、undo/redo） |
| Store | `stores/voiceStore.ts` | 语音状态（识别、TTS、对话历史） |
| Store | `stores/confirmStore.ts` | 确认对话框状态 |
| 服务 | `services/apiClient.ts` | DashScope 通用 chat 接口 |
| 服务 | `services/qwenImage.ts` | 图片生成/编辑 |
| 服务 | `services/qwenLLM.ts` | 指令解析 + 画面规划 |
| 工具 | `utils/promptBuilder.ts` | prompt 拼接 |
| 执行器 | `executor/actionExecutor.ts` | 12 个 intent 的纯函数处理 |
| Hook | `hooks/useVoiceCommand.ts` | 语音→解析→执行→TTS 编排 |
| Hook | `hooks/useSpeechRecognition.ts` | Web Speech API 封装 |
| Hook | `hooks/useSpeechSynthesis.ts` | TTS 封装 |
| UI | `components/` | React 组件 |

## 关键设计决策

### 1. actionExecutor 纯函数

所有 intent 处理逻辑是 async 纯函数，通过 `ExecutorCtx` 接口访问 store，无 React 依赖。
便于测试、复用，且避免 god hook 问题（V1.0 的 useVoiceCommand 有 803 行）。

### 2. TTS/STT 隔离

`speakWithPause()` 统一管理 `isSystemSpeaking` 生命周期：
- TTS 开始前 `setIsSystemSpeaking(true)`
- TTS 结束后延迟 1.5 秒才 `setIsSystemSpeaking(false)`
- 绝不在 `finally` 块中清除

这确保 TTS 播报期间 STT 不会捕获系统语音导致循环执行。

### 3. 关键词预检测优先于 LLM

`detectIntentByKeywords()` 先于 LLM 调用：
- 比例检测（`\d+[:：]\d+`）优先级最高，避免被 LLM 误判为 edit_image
- 撤销/重做/查询等高频指令直接命中，减少 LLM 调用成本

### 4. Per-canvas 撤销/重做

每个画布独立维护 `undoStack` 和 `redoStack`，操作前保存快照。
新操作清空 `redoStack`（标准 redo 行为）。

### 5. 状态持久化

Zustand `persist` 中间件 + localStorage：
- 持久化：`canvases`（含 objects、remoteImageUrl、aspectRatio）、`currentCanvasId`
- 不持久化：blob URL（刷新失效）、undoStack/redoStack（引用 blob URL）、isGenerating

## 数据流

### 语音生成图片

```
1. STT 捕获 "生成一只小猫"
2. useVoiceCommand.handleVoiceCommand(transcript)
3. parseVoiceCommand → { intent: 'create_image', description: '一只小猫' }
4. executeAction → handleGenerateImage
   a. planScene("一只小猫") → [{ name: "猫", description: "a cute cat", position: "center" }]
   b. buildImagePrompt("一只小猫", objects)
   c. generateImage(prompt, size) → remoteUrl
   d. imageToBlob(remoteUrl) → blobUrl
   e. ctx.updateCanvas({ objects, imageUrl, remoteImageUrl })
5. speakWithPause("已生成画面，包含：猫。")
```

### 语音撤销

```
1. STT 捕获 "撤销上一步"
2. detectIntentByKeywords → { intent: 'undo' }（关键词命中，不调 LLM）
3. executeAction → handleUndo
   a. 从 undoStack pop 快照
   b. 当前状态 push 到 redoStack
   c. ctx.updateCanvas 恢复快照状态
4. speakWithPause("已撤销「生成图片」。")
```
