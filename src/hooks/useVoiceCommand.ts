import { useCallback, useRef } from 'react';
import { useCanvasStore } from '../stores/canvasStore';
import { useVoiceStore } from '../stores/voiceStore';
import { useConfirmStore } from '../stores/confirmStore';
import { parseVoiceCommand } from '../services/qwenLLM';
import { executeAction } from '../executor/actionExecutor';
import { useSpeechSynthesis } from './useSpeechSynthesis';
import type { ExecutorCtx } from '../types/commands';

const PAUSE_AFTER_TTS = 1500; // TTS 结束后延迟 1.5 秒恢复监听

export function useVoiceCommand() {
  const { speak, cancel } = useSpeechSynthesis();
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * TTS 播报 + 延迟恢复监听
   * V1.0 踩坑 3.1：绝对不在 finally 中清除 isSystemSpeaking
   */
  const speakWithPause = useCallback(
    (text: string) => {
      // 清除之前的延迟计时器
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }

      const voiceStore = useVoiceStore.getState();
      voiceStore.setShouldListen(false);
      voiceStore.setIsSystemSpeaking(true);

      speak(text, {
        onComplete: () => {
          // TTS 结束后延迟恢复监听
          pauseTimerRef.current = setTimeout(() => {
            useVoiceStore.getState().setShouldListen(true);
            useVoiceStore.getState().setIsSystemSpeaking(false);
          }, PAUSE_AFTER_TTS);
        },
        onError: () => {
          // 出错也要恢复监听
          pauseTimerRef.current = setTimeout(() => {
            useVoiceStore.getState().setShouldListen(true);
            useVoiceStore.getState().setIsSystemSpeaking(false);
          }, PAUSE_AFTER_TTS);
        },
      });
    },
    [speak],
  );

  /**
   * 构建 ExecutorCtx：从 stores 读取最新状态
   */
  const buildCtx = useCallback((): ExecutorCtx => {
    const canvasStore = useCanvasStore.getState();
    const voiceStore = useVoiceStore.getState();
    const confirmStore = useConfirmStore.getState();

    return {
      getCanvas: () => canvasStore.getCurrentCanvas(),
      updateCanvas: (patch) => canvasStore.updateCanvas(patch),
      saveToHistory: (desc) => canvasStore.saveToHistory(desc),
      addConversationTurn: (turn) => voiceStore.addConversationTurn(turn),
      showConfirm: (question, onConfirm) =>
        confirmStore.showConfirm(question, onConfirm),
    };
  }, []);

  /**
   * 主入口：语音文本 → 解析 → 执行 → TTS 反馈
   */
  const handleVoiceCommand = useCallback(
    async (transcript: string) => {
      if (!transcript.trim()) return;

      const voiceStore = useVoiceStore.getState();
      voiceStore.setIsSystemSpeaking(true);
      voiceStore.setStatus('processing');

      // 记录用户对话
      voiceStore.addConversationTurn({
        role: 'user',
        content: transcript,
        timestamp: Date.now(),
      });

      try {
        // 1. 解析指令
        const action = await parseVoiceCommand(
          transcript,
          voiceStore.conversationHistory,
        );

        // 2. 执行 action
        const ctx = buildCtx();
        const result = await executeAction(action, ctx);

        // 3. 特殊 intent 需要调用 store 方法
        if (action.intent === 'create_canvas') {
          useCanvasStore.getState().createCanvas();
        } else if (action.intent === 'switch_canvas') {
          const raw = action.canvasId ?? action.target ?? '';
          const match = raw.match(/\d+/);
          if (match) {
            useCanvasStore.getState().switchCanvas(`canvas_${match[0]}`);
          }
        }

        // 4. needConfirm → 弹确认框（不播报）
        if (result.needConfirm && result.confirmQuestion) {
          useVoiceStore.getState().setIsSystemSpeaking(false);
          useConfirmStore.getState().showConfirm(result.confirmQuestion, () => {
            // 确认后重新执行（此处简化，后续可扩展）
            speakWithPause('好的，已确认。');
          });
          return;
        }

        // 5. 记录助手对话
        voiceStore.addConversationTurn({
          role: 'assistant',
          content: result.reply,
          timestamp: Date.now(),
        });

        // 6. TTS 播报 + 延迟恢复
        speakWithPause(result.reply);
      } catch (err) {
        const msg = err instanceof Error ? err.message : '指令处理出错';
        speakWithPause(`抱歉，${msg}。`);
      }
      // 注意：无 finally 块清除 isSystemSpeaking（V1.0 踩坑 3.1）
    },
    [buildCtx, speakWithPause],
  );

  /** 打断当前播报并停止监听 */
  const interrupt = useCallback(() => {
    cancel();
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
    }
    const voiceStore = useVoiceStore.getState();
    voiceStore.setIsSystemSpeaking(false);
    voiceStore.setShouldListen(true);
  }, [cancel]);

  return { handleVoiceCommand, speakWithPause, interrupt };
}
