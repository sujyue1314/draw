import type { AspectRatio } from '../types/canvas';

const API_KEY = import.meta.env.VITE_DASHSCOPE_API_KEY as string;

const IMAGE_ENDPOINT =
  'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

/** 比例转像素尺寸 */
export function getSizeFromRatio(ratio: AspectRatio): string {
  const map: Record<AspectRatio, string> = {
    '16:9': '1440*810',
    '9:16': '810*1440',
    '1:1': '1024*1024',
    '4:3': '1440*1080',
    '3:4': '1080*1440',
  };
  return map[ratio];
}

/** 生成图片 */
export async function generateImage(
  prompt: string,
  size: string = '1024*1024',
): Promise<string> {
  const response = await fetch(IMAGE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'qwen-image-2.0-pro',
      input: {
        messages: [
          {
            role: 'user',
            content: [{ text: prompt }],
          },
        ],
      },
      parameters: { size, n: 1, watermark: false },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Image generation error ${response.status}: ${error}`);
  }

  const data = await response.json();
  const imageUrl = data.output?.choices?.[0]?.message?.content?.[0]?.image;
  if (!imageUrl) {
    throw new Error('Image generation returned no URL');
  }
  return imageUrl;
}

/** 编辑图片（wan2.7-image-pro 同步端点 + messages 格式） */
export async function editImage(
  imageUrl: string,
  prompt: string,
  size: string = '1024*1024',
): Promise<string> {
  const response = await fetch(IMAGE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'wan2.7-image-pro',
      input: {
        messages: [
          {
            role: 'user',
            content: [
              { image: imageUrl },
              { text: prompt },
            ],
          },
        ],
      },
      parameters: { size, n: 1, watermark: false },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Image edit error ${response.status}: ${error}`);
  }

  const data = await response.json();
  const editedUrl = data.output?.choices?.[0]?.message?.content?.[0]?.image;
  if (!editedUrl) {
    throw new Error('Image edit returned no URL');
  }
  return editedUrl;
}

/** 将远程图片 URL 转为本地 blob URL */
export async function imageToBlob(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
