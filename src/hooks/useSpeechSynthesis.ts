import { useCallback, useRef } from 'react';

interface SpeakOptions {
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export function useSpeechSynthesis() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  /** 播报文本 */
  const speak = useCallback((text: string, options?: SpeakOptions) => {
    // 先取消当前播报
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      options?.onComplete?.();
    };

    utterance.onerror = (event) => {
      // 'interrupted' 是正常的取消行为，不报错
      if (event.error !== 'interrupted') {
        options?.onError?.(new Error(`Speech synthesis error: ${event.error}`));
      }
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  /** 取消当前播报 */
  const cancel = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  /** 是否正在播报 */
  const isSpeaking = useCallback(() => {
    return window.speechSynthesis.speaking;
  }, []);

  return { speak, cancel, isSpeaking };
}
