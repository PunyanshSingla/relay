const RETRY_DELAYS = [1000, 3000, 9000];

export function isRetryable(error: unknown): boolean {
  if (error && typeof error === "object" && "statusCode" in error) {
    const status = (error as { statusCode: number }).statusCode;
    return status === 503 || status === 529 || status === 429;
  }
  if (error && typeof error === "object" && "isRetryable" in error) {
    return (error as { isRetryable: boolean }).isRetryable === true;
  }
  if (error instanceof TypeError) return true;
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries: number = 3,
  logPrefix: string = "ai",
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const retryable = isRetryable(error);

      console.error(
        `[${logPrefix}] ${label} attempt ${attempt}/${maxRetries} failed:`,
        error instanceof Error ? error.message : error,
      );

      if (!retryable || attempt === maxRetries) {
        throw error;
      }

      const delay = RETRY_DELAYS[attempt - 1] ?? 9000;
      console.warn(
        `[${logPrefix}] ${label} retryable error, retrying in ${delay}ms...`,
      );
      await sleep(delay);
    }
  }

  throw lastError;
}
