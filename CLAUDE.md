# VoiceCanvas AI

语音驱动的 AI 绘图助手。

## 仓库

- GitHub: https://github.com/sujyue1314/draw
- 推送方式: `git push`（git 凭证为 sujyue1314）

## 技术栈

- Vite 8 + React 19 + TypeScript
- Zustand 5（状态管理 + persist 持久化）
- Tailwind CSS 4（via @tailwindcss/vite）
- DashScope API（qwen-max + qwen-image-2.0-pro + wan2.7-image-pro）
- Web Speech API（语音识别/合成，Chrome/Edge）

## 开发命令

```bash
pnpm dev          # 启动开发服务器 localhost:5173
pnpm build        # tsc -b + vite build
pnpm preview      # 预览构建产物
```

## 项目结构

```
src/
├── types/          # 类型定义（canvas.ts, commands.ts）
├── stores/         # Zustand stores
│   ├── canvasStore.ts    # 画布状态（多画布、undo/redo、persist）
│   ├── voiceStore.ts     # 语音状态（识别、TTS、对话历史）
│   └── confirmStore.ts   # 确认对话框
├── services/       # API 客户端和服务
│   ├── apiClient.ts      # DashScope 通用 chat 接口
│   ├── qwenImage.ts      # 图片生成/编辑
│   └── qwenLLM.ts        # 指令解析 + 画面规划
├── executor/       # action 执行器（纯函数）
│   └── actionExecutor.ts # 12 个 intent 处理
├── hooks/          # 自定义 hooks
│   ├── useVoiceCommand.ts       # 编排层（语音→解析→执行→TTS）
│   ├── useSpeechRecognition.ts  # STT 封装
│   └── useSpeechSynthesis.ts    # TTS 封装
├── utils/          # 工具函数
│   └── promptBuilder.ts  # prompt 拼接
└── components/     # UI 组件
    ├── layout/AppLayout.tsx
    ├── canvas/     # CanvasArea, CanvasTabs
    ├── voice/      # VoiceControlBar, VoiceIndicator, TranscriptOverlay
    ├── panel/      # RightPanel, ComponentList, HistoryList
    └── ui/         # TopBar, ConfirmDialog
```

## 关键设计

- **actionExecutor 纯函数**：无 React 依赖，通过 ExecutorCtx 访问 store
- **TTS/STT 隔离**：speakWithPause 统一管理 isSystemSpeaking，延迟 1.5s 恢复
- **关键词预检测**：优先于 LLM（比例/撤销/重做/查询/删除/画布）
- **Per-canvas 历史**：每个画布独立 undoStack/redoStack
- **操作前快照**：saveToHistory 在写操作前调用
- **对象 ID 转换**：统一 Number() 处理 LLM 返回的 string ID
- **画布创建防抖**：3 秒内不重复创建
- **状态持久化**：Zustand persist + localStorage，清理 blob URL

## 环境变量

复制 `.env.example` 为 `.env.local`，填入 DashScope API Key。

## 文档

- [技术设计](docs/design.md)
- [语音指令说明](docs/commands.md)
- [演示脚本](docs/demo.md)

## PR 提交规范

### 原则

1. **每个 PR 只做一件事**：单一功能，鼓励小粒度
2. **合并后主分支可运行**：任意时间 `pnpm build` 通过
3. **PR 标题格式**：`<type>: <一句话说明>`

### PR 描述模板

```markdown
## 功能描述
说明该功能的作用与使用方式

## 实现思路
简要说明技术选型或核心实现逻辑

## 测试方式
如何验证该功能正常运行
```

### Commit 格式

```
<type>: <description>
```

类型：feat, fix, refactor, docs, test, chore, perf, ci

### 推送流程

```bash
git checkout -b feat/xxx
pnpm build
git add -A && git commit -m "feat: xxx"
git push -u origin feat/xxx
# 使用 gh pr create 创建 PR
```
