/** 配信 JSON の fetch 打ち切り。電波が悪いとき同梱 JSON へ切り替える。 */
export const CONTENT_FETCH_TIMEOUT_MS = 5000;

export async function fetchContentJson(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONTENT_FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
