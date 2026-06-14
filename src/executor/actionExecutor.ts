import type { Action, ExecResult, ExecutorCtx } from '../types/commands';
import type { SceneObject, AspectRatio } from '../types/canvas';
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
import {
  withGenerating,
  findObjectByIdOrName,
} from '../utils/actionHelpers';

// ── 画布创建防抖 ──────────────────────────────────────────────────────────────
let lastCanvasCreateAt = 0;
const CANVAS_DEBOUNCE_MS = 3_000;

// ── 主分发 ────────────────────────────────────────────────────────────────────

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
      return handleCreateCanvas();
    case 'switch_canvas':
      return handleSwitchCanvas(action);
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

  return withGenerating(ctx, async () => {
    const components = await planScene(description);
    const objects: SceneObject[] = components.map((c, i) => ({
      id: Date.now() + i,
      name: c.name,
      description: c.description,
      position: c.position,
    }));

    const canvas = ctx.getCanvas();
    const prompt = buildImagePrompt(description, objects);
    const size = getSizeFromRatio(canvas.aspectRatio);

    const remoteUrl = await generateImage(prompt, size);
    const blobUrl = await imageToBlob(remoteUrl);

    ctx.updateCanvas({
      objects,
      imageUrl: blobUrl,
      remoteImageUrl: remoteUrl,
    });

    const names = objects.map((o) => o.name).join('、');
    return { reply: `已生成画面，包含：${names}。` };
  });
}

// ── 编辑图片 ──────────────────────────────────────────────────────────────────

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

  return withGenerating(ctx, async () => {
    const size = getSizeFromRatio(canvas.aspectRatio);
    const remoteUrl = await editImage(canvas.remoteImageUrl!, prompt, size);
    const blobUrl = await imageToBlob(remoteUrl);

    ctx.updateCanvas({
      imageUrl: blobUrl,
      remoteImageUrl: remoteUrl,
    });

    return { reply: '图片已更新。' };
  });
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

  ctx.saveToHistory('添加: ' + objectName);

  const newObject: SceneObject = {
    id: Date.now(),
    name: objectName,
    description,
    position: action.target as string | undefined,
  };
  const updatedObjects = [...canvas.objects, newObject];

  return withGenerating(ctx, async () => {
    const prompt = buildAppendPrompt(objectName, description, newObject.position);
    const size = getSizeFromRatio(canvas.aspectRatio);
    const remoteUrl = await editImage(canvas.remoteImageUrl!, prompt, size);
    const blobUrl = await imageToBlob(remoteUrl);

    ctx.updateCanvas({
      objects: updatedObjects,
      imageUrl: blobUrl,
      remoteImageUrl: remoteUrl,
    });

    return { reply: `已添加「${objectName}」到画面中。` };
  });
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

  const matched = resolveObject(canvas.objects, action);

  if (!matched) {
    return { reply: `没有找到「${action.objectName ?? action.target ?? action.objectId}」这个组件。` };
  }

  ctx.saveToHistory('删除: ' + matched.name);
  const remaining = canvas.objects.filter((o) => o.id !== matched.id);

  return withGenerating(ctx, async () => {
    const prompt = buildDeletePrompt(remaining);
    const size = getSizeFromRatio(canvas.aspectRatio);

    let remoteUrl: string;
    if (remaining.length === 0) {
      remoteUrl = await generateImage(prompt, size);
    } else {
      remoteUrl = await editImage(canvas.remoteImageUrl!, prompt, size);
    }
    const blobUrl = await imageToBlob(remoteUrl);

    ctx.updateCanvas({
      objects: remaining,
      imageUrl: blobUrl,
      remoteImageUrl: remoteUrl,
    });

    return { reply: `已删除「${matched.name}」。` };
  });
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

  const newDescription = action.description ?? '';
  if (!newDescription) {
    return { reply: '请描述你想如何修改。' };
  }

  const matched = resolveObject(canvas.objects, action);

  if (!matched) {
    return { reply: `没有找到「${action.objectName ?? action.target ?? action.objectId}」这个组件。` };
  }

  ctx.saveToHistory('修改: ' + matched.name);
  const updatedObjects = canvas.objects.map((o) =>
    o.id === matched.id ? { ...o, description: newDescription } : o,
  );

  return withGenerating(ctx, async () => {
    const prompt = buildImagePrompt('the scene', updatedObjects);
    const size = getSizeFromRatio(canvas.aspectRatio);
    const remoteUrl = await editImage(canvas.remoteImageUrl!, prompt, size);
    const blobUrl = await imageToBlob(remoteUrl);

    ctx.updateCanvas({
      objects: updatedObjects,
      imageUrl: blobUrl,
      remoteImageUrl: remoteUrl,
    });

    return { reply: `已将「${matched.name}」修改为：${newDescription}。` };
  });
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

// ── 撤销（委托 canvasStore） ──────────────────────────────────────────────────

function handleUndo(ctx: ExecutorCtx): ExecResult {
  const canvas = ctx.getCanvas();
  if (canvas.undoStack.length === 0) {
    return { reply: '没有可以撤销的操作。' };
  }

  const snapshot = canvas.undoStack[canvas.undoStack.length - 1];

  // 保存当前状态到 redoStack
  const currentSnapshot = {
    timestamp: Date.now(),
    description: '当前状态',
    objects: [...canvas.objects],
    imageUrl: canvas.imageUrl,
    remoteImageUrl: canvas.remoteImageUrl,
  };

  ctx.updateCanvas({
    undoStack: canvas.undoStack.slice(0, -1),
    redoStack: [...canvas.redoStack, currentSnapshot],
    objects: [...snapshot.objects],
    imageUrl: snapshot.imageUrl,
    remoteImageUrl: snapshot.remoteImageUrl,
  });

  return { reply: `已撤销「${snapshot.description}」。` };
}

// ── 重做（委托 canvasStore） ──────────────────────────────────────────────────

function handleRedo(ctx: ExecutorCtx): ExecResult {
  const canvas = ctx.getCanvas();
  if (canvas.redoStack.length === 0) {
    return { reply: '没有可以重做的操作。' };
  }

  const snapshot = canvas.redoStack[canvas.redoStack.length - 1];

  // 保存当前状态到 undoStack
  const currentSnapshot = {
    timestamp: Date.now(),
    description: '当前状态',
    objects: [...canvas.objects],
    imageUrl: canvas.imageUrl,
    remoteImageUrl: canvas.remoteImageUrl,
  };

  ctx.updateCanvas({
    undoStack: [...canvas.undoStack, currentSnapshot],
    redoStack: canvas.redoStack.slice(0, -1),
    objects: [...snapshot.objects],
    imageUrl: snapshot.imageUrl,
    remoteImageUrl: snapshot.remoteImageUrl,
  });

  return { reply: '已重做。' };
}

// ── 新建画布 ──────────────────────────────────────────────────────────────────

function handleCreateCanvas(): ExecResult {
  const now = Date.now();
  if (now - lastCanvasCreateAt < CANVAS_DEBOUNCE_MS) {
    return { reply: '操作太频繁，请稍后再试。' };
  }
  lastCanvasCreateAt = now;
  return { reply: '已创建新画布。' };
}

// ── 切换画布 ──────────────────────────────────────────────────────────────────

function handleSwitchCanvas(action: Action): ExecResult {
  const raw = action.canvasId ?? action.target ?? '';
  const match = raw.match(/\d+/);
  if (!match) {
    return { reply: '请指定画布编号，例如"切换到画布 1"。' };
  }
  return { reply: `已切换到画布 ${match[0]}。` };
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

const VALID_RATIOS: AspectRatio[] = ['16:9', '9:16', '1:1', '4:3', '3:4'];

function handleChangeRatio(action: Action, ctx: ExecutorCtx): ExecResult {
  const ratio = action.ratio ?? action.target ?? '';

  if (!VALID_RATIOS.includes(ratio as AspectRatio)) {
    return { reply: `不支持的比例 ${ratio}。支持：${VALID_RATIOS.join('、')}。` };
  }

  ctx.saveToHistory('切换比例: ' + ratio);
  ctx.updateCanvas({ aspectRatio: ratio as AspectRatio });

  return { reply: `已切换到 ${ratio} 比例。` };
}

// ── 共享工具 ──────────────────────────────────────────────────────────────────

/**
 * 统一对象解析：按 objectName → objectId 精确 → objectId 序号 依次尝试
 */
function resolveObject(
  objects: SceneObject[],
  action: Action,
): SceneObject | undefined {
  // 1. 按 objectName/target 模糊匹配（最可靠）
  const name = action.objectName ?? action.target;
  if (name) {
    const byName = findObjectByIdOrName(objects, undefined, name);
    if (byName) return byName;
  }

  // 2. 按 objectId 精确匹配（实际 id）
  if (action.objectId !== undefined) {
    const byId = objects.find((o) => o.id === Number(action.objectId));
    if (byId) return byId;
  }

  // 3. 按 objectId 作为 1-based 序号匹配（LLM 常返回 "1" 表示第一个）
  if (action.objectId !== undefined) {
    const index = Number(action.objectId) - 1;
    if (index >= 0 && index < objects.length) {
      return objects[index];
    }
  }

  return undefined;
}
