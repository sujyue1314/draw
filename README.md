# VoiceCanvas AI

> 语音驱动的 AI 绘图助手 — 用自然语言创建和编辑画面

VoiceCanvas 是一个基于 Web Speech API 和通义千问大模型的创意工具。用户通过语音指令描述想画的内容，AI 自动生成图片；后续可以通过语音增量添加、修改、删除画面中的元素，实现"用嘴画画"的创作体验。

## 演示视频

[![VoiceCanvas 演示](https://img.shields.io/badge/▶_Bilibili_演示视频-blue?style=for-the-badge&logo=bilibili)](https://www.bilibili.com/video/BV1yuJN6gEs7/?vd_source=cde215379748085a70c1e6736d0a19de)

## 功能特性

- **纯语音控制** — 页面加载后自动聆听，无需鼠标键盘，说出指令即执行
- **智能生成** — 基于 qwen-image-2.0-pro 生成高质量插画
- **增量编辑** — 添加、修改、删除画面中的单个元素，不影响其他部分
- **复合指令** — "删掉月亮再加一艘船"，一次说出多个操作自动拆解执行
- **多画布** — 同时管理多个创作画布，语音切换
- **比例切换** — 支持 16:9、9:16、1:1、4:3、3:4 五种画布比例
- **撤销/重做** — 完整的历史记录，语音回退或前进
- **语音帮助** — 说"帮助"查看所有可用指令

## 语音指令

| 指令类型 | 示例 | 说明 |
|---------|------|------|
| 生成图片 | "生成一只小猫坐在月亮上" | 描述场景，AI 规划组件并生成 |
| 添加元素 | "加一只小鸟在天上飞" | 增量添加到现有画面 |
| 修改元素 | "把小猫改成白色的" | 精准修改指定对象 |
| 删除元素 | "删掉月亮" | 移除画面中的指定对象 |
| 整体编辑 | "把背景改成夜晚" | 修改整体风格或背景 |
| 复合操作 | "删掉月亮再加一艘船" | 一次说出多个操作 |
| 撤销/重做 | "撤销" / "重做" | 回退或前进操作 |
| 查询组件 | "当前有哪些组件" | 列出画面中的所有元素 |
| 切换画布 | "切换到画布二" | 在多个画布间切换（支持中文数字） |
| 切换比例 | "16:9" / "1:1" | 切换画布宽高比 |
| 帮助 | "帮助" / "你能做什么" | 播报所有可用指令 |

## 快速开始

### 环境要求

- Node.js 18+
- pnpm 8+
- Chrome 或 Edge 浏览器（Web Speech API 支持）

### 安装

```bash
git clone https://github.com/sujyue1314/draw.git
cd draw
pnpm install
```

### 配置

创建 `.env.local` 文件：

```bash
VITE_DASHSCOPE_API_KEY=your_api_key_here
```

API Key 从 [阿里云 DashScope](https://dashscope.console.aliyun.com/) 获取。

### 启动

```bash
pnpm dev
```

打开 http://localhost:5173/ ，页面会自动开始聆听。说出指令即可使用，例如"帮助"查看所有指令。

## 技术架构

```
用户语音 → Web Speech API → 意图解析 → 执行器 → AI 服务 → 画面更新
                                    ↑
                          关键词预检测（0ms）
                          LLM 解析（兜底）
```

### 核心层

| 层 | 目录 | 职责 |
|---|------|------|
| 组件层 | `components/` | UI 渲染，用户交互 |
| Hook 层 | `hooks/` | 语音识别/合成、指令编排 |
| 状态层 | `stores/` | Zustand 管理画布和语音状态 |
| 服务层 | `services/` | DashScope API 调用（LLM + 图片） |
| 执行层 | `executor/` | 13 种意图的纯函数处理器 |
| 工具层 | `utils/` | Prompt 构建、对象匹配 |

### 关键设计决策

1. **关键词优先** — 撤销/重做/切换画布等高频指令走关键词匹配（0ms），不调 LLM
2. **增量编辑** — 修改单个元素时只描述变化，不重建整个场景，避免背景被覆盖
3. **TTS/STT 隔离** — 系统播报时暂停语音识别，防止反馈循环
4. **不可变状态** — Zustand store 的所有更新都是不可变操作，配合 persist 中间件
5. **Per-canvas 历史** — 每个画布独立的 undo/redo 栈，切换画布不影响历史

## 开发过程

采用增量式 PR 开发，共 13 个 PR，按功能模块递进：

| PR | 类型 | 内容 |
|----|------|------|
| #1 | feat | DashScope API 客户端和图片生成/编辑服务 |
| #2 | feat | useSpeechRecognition 和 useSpeechSynthesis hooks |
| #3 | feat | qwenLLM 指令解析和画面规划 |
| #4 | feat | actionExecutor 纯函数执行器 |
| #5 | feat | useVoiceCommand 编排层和 TTS/STT 隔离 |
| #6 | feat | CanvasArea、RightPanel、TopBar 等 UI 组件 |
| #7 | feat | 多画布管理、比例切换和撤销/重做 |
| #8 | feat | localStorage 持久化，更新文档 |
| #9 | fix | 修复内存泄漏、DRY 重构、添加 API 超时 |
| #10 | fix | 无障碍 ARIA 属性和语义化 HTML |
| #11 | perf | 修复重渲染问题，添加 React.memo |
| #12 | test | vitest 测试基础设施和单元测试（53 个） |
| #13 | feat | 增强复杂指令拆解与执行能力 |

## 技术栈

- **前端框架**: React 19 + TypeScript 6
- **构建工具**: Vite 8
- **状态管理**: Zustand 5
- **样式方案**: Tailwind CSS 4
- **AI 服务**: DashScope API
  - `qwen-max` — 意图解析
  - `qwen-image-2.0-pro` — 图片生成
  - `wan2.7-image-pro` — 图片编辑
- **语音**: Web Speech API（SpeechRecognition + SpeechSynthesis）

## 开发命令

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm preview      # 预览构建产物
pnpm test         # 运行测试
pnpm test:watch   # 监听模式运行测试
pnpm lint         # 代码检查
```

## 项目结构

```
src/
├── components/     # UI 组件
│   ├── canvas/     # 画布区域
│   ├── voice/      # 语音控制
│   ├── panel/      # 右侧面板
│   ├── layout/     # 布局
│   └── ui/         # 通用 UI
├── hooks/          # React Hooks
├── stores/         # Zustand 状态
├── services/       # API 服务
├── executor/       # 意图执行器
├── utils/          # 工具函数
├── types/          # TypeScript 类型
└── __tests__/      # 测试文件
```

## 相关文档

- [技术设计](docs/design.md) — 架构概览、核心分层、关键设计决策
- [语音指令说明](docs/commands.md) — 13 个 Intent 详解、关键词预检测规则
- [比赛设计文档](docs/design-document.md) — 计划 vs 实现、未完成原因、技术决策、测试结果
- [演示脚本](docs/demo.md) — 完整的演示流程和预期结果

## License

MIT
