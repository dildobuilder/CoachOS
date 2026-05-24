export const networkErrorMessage =
  "Не удалось связаться с сервером. Обновите страницу или попробуйте позже.";

export function getReadableErrorMessage(error: unknown, fallback = "Произошла ошибка") {
  if (error instanceof Error) {
    if (isTransientNetworkError(error)) {
      return networkErrorMessage;
    }

    return error.message;
  }

  if (typeof error === "string") {
    if (isTransientNetworkError(error)) {
      return networkErrorMessage;
    }

    return error;
  }

  return fallback;
}

export function isTransientNetworkError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("fetch failed") ||
    message.includes("ECONNRESET") ||
    message.includes("terminated") ||
    message.includes("aborted") ||
    message.includes("network")
  );
}

export async function runWithTransientRetry<T>(
  operation: () => PromiseLike<T>,
  options: { attempts?: number; delayMs?: number } = {}
) {
  const attempts = options.attempts ?? 2;
  const delayMs = options.delayMs ?? 300;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isTransientNetworkError(error) || attempt === attempts) {
        throw error;
      }

      await delay(delayMs);
    }
  }

  throw lastError;
}

export async function retryResultOnTransientError<T extends { error: { message: string } | null }>(
  operation: () => PromiseLike<T>
) {
  const firstResult = await runWithTransientRetry(operation);

  if (!firstResult.error || !isTransientNetworkError(firstResult.error.message)) {
    return firstResult;
  }

  return runWithTransientRetry(operation);
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
