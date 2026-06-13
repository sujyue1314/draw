import type { Action, ExecResult, ExecutorCtx } from '../types/commands';
import type { SceneObject } from '../types/canvas';
import { planScene } from '../services/qwenLLM';
import {
  generateImage,
  editImage,
  imageToBlob,
  getSizeFromRatio,
} from '../services/qwenImage';
import {
  buildImagePrompt,
  buildAppendPrompt,
  buildDeletePrompt,
} from '../utils/promptBuilder';

// ── 画布创建防抖 ──────────────────────────────────────────────────────────────
let lastCanvasCreateAt = 0;
const CANVAS_DEBOUNCE_MS = 3_000;

// ── 主分发 ────────────────────────────────────────────────────────────────────

/**
 * 按 intent 分发到对应 handler
 * 每个 handler 是 async，返回 { reply }
 */
export async function executeAction(
  action: Action,
  ctx: ExecutorCtx,
): Promise<ExecResult> {
  switch (action.intent) {
    case 'create_image':
      return handleGenerateImage(action, ctx);
    case 'edit_image':
      return handleEditImage(action, ctx);
    case 'add_object':
      return handleAppendObject(action, ctx);
    case 'delete_object':
      return handleDeleteObject(action, ctx);
    case 'modify_object':
      return handleModifyObject(action, ctx);
    case 'multi_step_edit':
      return handleMultiStep(action, ctx);
    case 'undo':
      return handleUndo(ctx);
    case 'redo':
      return handleRedo(ctx);
    case 'create_canvas':
      return handleCreateCanvas(ctx);
    case 'switch_canvas':
      return handleSwitchCanvas(action, ctx);
    case 'query_objects':
      return handleQueryObjects(ctx);
    case 'change_ratio':
      return handleChangeRatio(action, ctx);
    default:
      return { reply: '抱歉，我没有理解你的指令，请再说一次。' };
  }
}

// ── 生成图片 ──────────────────────────────────────────────────────────────────

async function handleGenerateImage(
  action: Action,
  ctx: ExecutorCtx,
): Promise<ExecResult> {
  const description = action.description ?? '';
  if (!description) {
    return { reply: '请描述你想生成的画面。' };
  }

  ctx.saveToHistory('生成图片: ' + description);

  // 1. 画面规划
  const components = await planScene(description);

  // 2. 构建 prompt + 生成图片
  const objects: SceneObject[] = components.map((c, i) => ({
    id: Date.now() + i,
    name: c.name,
    description: c.description,
    position: c.position,
  }));

  const canvas = ctx.getCanvas();
  const prompt = buildImagePrompt(description, objects);
  const size = getSizeFromRatio(canvas.aspectRatio);

  try {
    const remoteUrl = await generateImage(prompt, size);
    const blobUrl = await imageToBlob(remoteUrl);

    ctx.updateCanvas({
      objects,
      imageUrl: blobUrl,
      remoteImageUrl: remoteUrl,
    });

    const names = objects.map((o) => o.name).join('、');
    return { reply: `已生成画面，包含：${names}。` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { reply: `图片生成失败：${msg}` };
  }
}

// ── 编辑图片（整体风格/背景） ─────────────────────────────────────────────────

async function handleEditImage(
  action: Action,
  ctx: ExecutorCtx,
): Promise<ExecResult> {
  const canvas = ctx.getCanvas();
  if (!canvas.remoteImageUrl) {
    return { reply: '当前画布没有图片，请先生成一张。' };
  }

  const prompt = action.description ?? '';
  if (!prompt) {
    return { reply: '请描述你想如何修改。' };
  }

  ctx.saveToHistory('编辑图片: ' + prompt);
  ctx.updateCanvas({ isGenerating: true });

  try {
    const size = getSizeFromRatio(canvas.aspectRatio);
    const remoteUrl = await editImage(canvas.remoteImageUrl, prompt, size);
    const blobUrl = await imageToBlob(remoteUrl);

    ctx.updateCanvas({
      imageUrl: blobUrl,
      remoteImageUrl: remoteUrl,
      isGenerating: false,
    });

    return { reply: '图片已更新。' };
  } catch (err) {
    ctx.updateCanvas({ isGenerating: false });
    const msg = err instanceof Error ? err.message : String(err);
    return { reply: `图片编辑失败：${msg}` };
  }
}

// ── 增量添加对象 ──────────────────────────────────────────────────────────────

async function handleAppendObject(
  action: Action,
  ctx: ExecutorCtx,
): Promise<ExecResult> {
  const canvas = ctx.getCanvas();
  if (!canvas.remoteImageUrl) {
    return { reply: '当前画布没有图片，请先生成一张。' };
  }

  const objectName = action.objectName ?? action.target ?? '';
  const description = action.description ?? objectName;
  if (!objectName) {
    return { reply: '请告诉我你想添加什么。' };
  }

  // 保存快照 + 更新 objects
  ctx.saveToHistory('添加: ' + objectName);
  const newObject: SceneObject = {
    id: Date.now(),
    name: objectName,
    description,
    position: action.target as string | undefined,
  };
  const updatedObjects = [...canvas.objects, newObject];

  ctx.updateCanvas({ isGenerating: true });

  try {
    const prompt = buildAppendPrompt(objectName, description, newObject.position);
    const size = getSizeFromRatio(canvas.aspectRatio);
    const remoteUrl = await editImage(canvas.remoteImageUrl, prompt, size);
    const blobUrl = await imageToBlob(remoteUrl);

    ctx.updateCanvas({
      objects: updatedObjects,
      imageUrl: blobUrl,
      remoteImageUrl: remoteUrl,
      isGenerating: false,
    });

    return { reply: `已添加「${objectName}」到画面中。` };
  } catch (err) {
    ctx.updateCanvas({ isGenerating: false });
    const msg = err instanceof Error ? err.message : String(err);
    return { reply: `添加失败：${msg}` };
  }
}

// ── 删除对象 ──────────────────────────────────────────────────────────────────

async function handleDeleteObject(
  action: Action,
  ctx: ExecutorCtx,
): Promise<ExecResult> {
  const canvas = ctx.getCanvas();
  if (!canvas.remoteImageUrl) {
    return { reply: '当前画布没有图片。' };
  }

  // 匹配对象：优先 objectId，其次 objectName/target
  const targetId = action.objectId;
  const targetName = action.objectName ?? action.target ?? '';

  let matched: SceneObject | undefined;
  if (targetId !== undefined) {
    matched = canvas.objects.find((o) => o.id === Number(targetId));
  }
  if (!matched && targetName) {
    matched = canvas.objects.find(
      (o) => o.name === targetName || o.name.includes(targetName),
    );
  }

  if (!matched) {
    return { reply: `没有找到「${targetName || targetId}」这个组件。` };
  }

  ctx.saveToHistory('删除: ' + matched.name);
  const remaining = canvas.objects.filter((o) => o.id !== matched!.id);

  ctx.updateCanvas({ isGenerating: true });

  try {
    if (remaining.length === 0) {
      // 没有剩余对象，重新生成空场景
      const prompt = buildDeletePrompt([]);
      const size = getSizeFromRatio(canvas.aspectRatio);
      const remoteUrl = await generateImage(prompt, size);
      const blobUrl = await imageToBlob(remoteUrl);
      ctx.updateCanvas({
        objects: [],
        imageUrl: blobUrl,
        remoteImageUrl: remoteUrl,
        isGenerating: false,
      });
    } else {
      // 有剩余对象，用 editImage 重建
      const prompt = buildDeletePrompt(remaining);
      const size = getSizeFromRatio(canvas.aspectRatio);
      const remoteUrl = await editImage(canvas.remoteImageUrl, prompt, size);
      const blobUrl = await imageToBlob(remoteUrl);
      ctx.updateCanvas({
        objects: remaining,
        imageUrl: blobUrl,
        remoteImageUrl: remoteUrl,
        isGenerating: false,
      });
    }

    return { reply: `已删除「${matched.name}」。` };
  } catch (err) {
    ctx.updateCanvas({ isGenerating: false });
    const msg = err instanceof Error ? err.message : String(err);
    return { reply: `删除失败：${msg}` };
  }
}

// ── 修改对象 ──────────────────────────────────────────────────────────────────

async function handleModifyObject(
  action: Action,
  ctx: ExecutorCtx,
): Promise<ExecResult> {
  const canvas = ctx.getCanvas();
  if (!canvas.remoteImageUrl) {
    return { reply: '当前画布没有图片，请先生成一张。' };
  }

  const targetId = action.objectId;
  const targetName = action.objectName ?? action.target ?? '';
  const newDescription = action.description ?? '';

  if (!newDescription) {
    return { reply: '请描述你想如何修改。' };
  }

  // 匹配对象
  let matched: SceneObject | undefined;
  if (targetId !== undefined) {
    matched = canvas.objects.find((o) => o.id === Number(targetId));
  }
  if (!matched && targetName) {
    matched = canvas.objects.find(
      (o) => o.name === targetName || o.name.includes(targetName),
    );
  }

  if (!matched) {
    return { reply: `没有找到「${targetName || targetId}」这个组件。` };
  }

  ctx.saveToHistory('修改: ' + matched.name);

  // 更新对象描述
  const updatedObjects = canvas.objects.map((o) =>
    o.id === matched!.id ? { ...o, description: newDescription } : o,
  );

  ctx.updateCanvas({ isGenerating: true });

  try {
    // 用新描述重新生成
    const prompt = buildImagePrompt('the scene', updatedObjects);
    const size = getSizeFromRatio(canvas.aspectRatio);

    let remoteUrl: string;
    // 如果有图片，用 editImage；否则 generateImage
    remoteUrl = await editImage(canvas.remoteImageUrl, prompt, size);
    const blobUrl = await imageToBlob(remoteUrl);

    ctx.updateCanvas({
      objects: updatedObjects,
      imageUrl: blobUrl,
      remoteImageUrl: remoteUrl,
      isGenerating: false,
    });

    return { reply: `已将「${matched.name}」修改为：${newDescription}。` };
  } catch (err) {
    ctx.updateCanvas({ isGenerating: false });
    const msg = err instanceof Error ? err.message : String(err);
    return { reply: `修改失败：${msg}` };
  }
}

// ── 复合操作 ──────────────────────────────────────────────────────────────────

async function handleMultiStep(
  action: Action,
  ctx: ExecutorCtx,
): Promise<ExecResult> {
  const operations = action.operations ?? [];
  if (operations.length === 0) {
    return { reply: '复合操作为空。' };
  }

  const replies: string[] = [];
  for (const op of operations) {
    // 将 Operation 提升为 Action（Operation 是 Action 的子集）
    const subAction: Action = {
      intent: op.intent,
      target: op.target,
      description: op.description,
      objectName: op.objectName,
    };
    const result = await executeAction(subAction, ctx);
    replies.push(result.reply);
  }

  return { reply: replies.join(' ') };
}

// ── 撤销 ──────────────────────────────────────────────────────────────────────

function handleUndo(ctx: ExecutorCtx): ExecResult {
  const canvas = ctx.getCanvas();
  if (canvas.undoStack.length === 0) {
    return { reply: '没有可以撤销的操作。' };
  }

  // 保存当前状态到 redoStack
  const currentSnapshot = {
    timestamp: Date.now(),
    description: '当前状态',
    objects: [...canvas.objects],
    imageUrl: canvas.imageUrl,
    remoteImageUrl: canvas.remoteImageUrl,
  };

  // 弹出 undoStack 栈顶
  const snapshot = canvas.undoStack[canvas.undoStack.length - 1];
  const newUndoStack = canvas.undoStack.slice(0, -1);

  ctx.updateCanvas({
    undoStack: newUndoStack,
    redoStack: [...canvas.redoStack, currentSnapshot],
    objects: [...snapshot.objects],
    imageUrl: snapshot.imageUrl,
    remoteImageUrl: snapshot.remoteImageUrl,
  });

  return { reply: `已撤销「${snapshot.description}」。` };
}

// ── 重做 ──────────────────────────────────────────────────────────────────────

function handleRedo(ctx: ExecutorCtx): ExecResult {
  const canvas = ctx.getCanvas();
  if (canvas.redoStack.length === 0) {
    return { reply: '没有可以重做的操作。' };
  }

  // 保存当前状态到 undoStack
  const currentSnapshot = {
    timestamp: Date.now(),
    description: '当前状态',
    objects: [...canvas.objects],
    imageUrl: canvas.imageUrl,
    remoteImageUrl: canvas.remoteImageUrl,
  };

  // 弹出 redoStack 栈顶
  const snapshot = canvas.redoStack[canvas.redoStack.length - 1];
  const newRedoStack = canvas.redoStack.slice(0, -1);

  ctx.updateCanvas({
    undoStack: [...canvas.undoStack, currentSnapshot],
    redoStack: newRedoStack,
    objects: [...snapshot.objects],
    imageUrl: snapshot.imageUrl,
    remoteImageUrl: snapshot.remoteImageUrl,
  });

  return { reply: '已重做。' };
}

// ── 新建画布（3 秒防抖） ─────────────────────────────────────────────────────

function handleCreateCanvas(_ctx: ExecutorCtx): ExecResult {
  const now = Date.now();
  if (now - lastCanvasCreateAt < CANVAS_DEBOUNCE_MS) {
    return { reply: '操作太频繁，请稍后再试。' };
  }
  lastCanvasCreateAt = now;

  // 由 PR 9 的 canvasStore.createCanvas 处理
  // 这里只返回 reply，实际创建在编排层调用
  return { reply: '已创建新画布。' };
}

// ── 切换画布 ──────────────────────────────────────────────────────────────────

function handleSwitchCanvas(
  action: Action,
  _ctx: ExecutorCtx,
): ExecResult {
  const raw = action.canvasId ?? action.target ?? '';
  // 提取数字：支持 "画布1"、"1"、"canvas_1" 等格式
  const match = raw.match(/\d+/);
  if (!match) {
    return { reply: '请指定画布编号，例如"切换到画布 1"。' };
  }
  const n = match[0];
  // 编排层负责调用 canvasStore.switchCanvas(`canvas_${n}`)
  return { reply: `已切换到画布 ${n}。` };
}

// ── 查询组件 ──────────────────────────────────────────────────────────────────

function handleQueryObjects(ctx: ExecutorCtx): ExecResult {
  const canvas = ctx.getCanvas();
  if (canvas.objects.length === 0) {
    return { reply: '当前画布没有组件。' };
  }

  const list = canvas.objects
    .map((o, i) => `${i + 1}. ${o.name}${o.position ? `（${o.position}）` : ''}`)
    .join('；');

  return { reply: `当前画布有 ${canvas.objects.length} 个组件：${list}。` };
}

// ── 切换比例 ──────────────────────────────────────────────────────────────────

function handleChangeRatio(
  action: Action,
  ctx: ExecutorCtx,
): ExecResult {
  const ratio = action.ratio ?? action.target ?? '';
  const validRatios = ['16:9', '9:16', '1:1', '4:3', '3:4'];

  if (!validRatios.includes(ratio)) {
    return { reply: `不支持的比例 ${ratio}。支持：${validRatios.join('、')}。` };
  }

  ctx.saveToHistory('切换比例: ' + ratio);
  ctx.updateCanvas({ aspectRatio: ratio as import('../types/canvas').AspectRatio });

  return { reply: `已切换到 ${ratio} 比例。` };
}
