const API_KEY = import.meta.env.VITE_DASHSCOPE_API_KEY as string;

const BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  response_format?: { type: 'json_object' | 'text' };
}

const FETCH_TIMEOUT_MS = 30_000;

/**
 * DashScope OpenAI-compatible chat completion
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {},
): Promise<string> {
  const {
    model = 'qwen-max',
    temperature = 0.1,
    response_format,
  } = options;

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
  };
  if (response_format) {
    body.response_format = response_format;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Chat API error ${response.status}: ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Chat API returned empty content');
    }
    return content;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Chat API 请求超时（30s）');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
