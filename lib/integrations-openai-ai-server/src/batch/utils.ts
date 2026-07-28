import { openai } from "../client";

export interface BatchOptions {
  model?: string;
  maxRetries?: number;
  batchSize?: number;
  delayMs?: number;
}

export function isRateLimitError(error: unknown): boolean {
  if (error && typeof error === "object" && "status" in error) {
    return (error as { status: number }).status === 429;
  }
  return false;
}

export async function batchProcess<T>(
  items: T[],
  processFn: (item: T) => Promise<string>,
  options?: BatchOptions,
): Promise<string[]> {
  const results: string[] = [];
  const batchSize = options?.batchSize ?? 10;
  const delayMs = options?.delayMs ?? 1000;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map(processFn));
    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        results.push("");
      }
    }
    if (i + batchSize < items.length) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return results;
}

export async function batchProcessWithSSE<T>(
  items: T[],
  processFn: (item: T) => Promise<string>,
  onProgress: (index: number, total: number, result: string) => void,
  options?: BatchOptions,
): Promise<string[]> {
  const results: string[] = [];
  const batchSize = options?.batchSize ?? 5;
  const delayMs = options?.delayMs ?? 1000;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map(processFn));
    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j];
      const value = result.status === "fulfilled" ? result.value : "";
      results.push(value);
      onProgress(i + j, items.length, value);
    }
    if (i + batchSize < items.length) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return results;
}
