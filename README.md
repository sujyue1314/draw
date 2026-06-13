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
