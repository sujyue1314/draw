# VoiceCanvas AI

语音驱动的 AI 绘图助手。

## 仓库

- GitHub: https://github.com/sujyue1314/draw
- 推送方式: `git push`（git 凭证为 sujyue1314）

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

## PR 提交规范

### 原则

1. **每个 PR 只做一件事**：单一功能，鼓励小粒度
2. **合并后主分支可运行**：任意时间 `pnpm build` 通过
3. **PR 标题格式**：`<type>: <一句话说明>`

### PR 描述模板

每个 PR 必须包含以下内容：

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
# 1. 创建 feature 分支
git checkout -b feat/xxx

# 2. 开发 + 验证构建
pnpm build

# 3. 提交
git add -A
git commit -m "feat: xxx"

# 4. 推送 feature 分支
git push -u origin feat/xxx

# 5. 创建 PR（从 feat/xxx 合入 main）
#    使用 GitHub 网页或 gh CLI

# 6. 合并后切回 main
git checkout main && git pull
```

## 关键设计决策

- actionExecutor 是纯函数，无 React 依赖
- TTS/STT 隔离：speakWithPause 统一管理 isSystemSpeaking 生命周期
- 撤销快照在操作前保存
- 对象 ID 统一 Number() 转换
- 画布创建 3 秒防抖

## 环境变量

复制 `.env.example` 为 `.env.local`，填入 DashScope API Key。
