# VoiceCanvas AI

语音驱动的 AI 绘图助手。

## 技术栈

- Vite 8 + React 19 + TypeScript
- Zustand 5（状态管理）
- Tailwind CSS 4（via @tailwindcss/vite）
- DashScope API（qwen-max + qwen-image-2.0-pro + wan2.7-image-pro）
- Web Speech API（语音识别，Chrome/Edge）

## 开发命令

```bash
pnpm dev          # 启动开发服务器 localhost:5173
pnpm build        # tsc -b + vite build
pnpm preview      # 预览构建产物
```

## 项目结构

```
src/
├── types/          # 类型定义
├── stores/         # Zustand stores
├── services/       # API 客户端和服务
├── executor/       # action 执行器（纯函数）
├── hooks/          # 自定义 hooks
├── utils/          # 工具函数
└── components/     # UI 组件
    ├── layout/     # 页面布局
    ├── canvas/     # 画布相关
    ├── voice/      # 语音相关
    ├── panel/      # 右侧面板
    └── ui/         # 通用 UI
```

## 关键设计决策

- actionExecutor 是纯函数，无 React 依赖
- TTS/STT 隔离：speakWithPause 统一管理 isSystemSpeaking 生命周期
- 撤销快照在操作前保存
- 对象 ID 统一 Number() 转换
- 画布创建 3 秒防抖

## 环境变量

复制 `.env.example` 为 `.env.local`，填入 DashScope API Key。
