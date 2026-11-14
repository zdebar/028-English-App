/** Runs async operations with a fixed maximum number of concurrent workers. */
export async function runWithConcurrency<T>(
  values: readonly T[],
  concurrency: number,
  operation: (value: T) => Promise<void>,
): Promise<void> {
  let nextIndex = 0;
  const workerCount = Math.min(values.length, concurrency);

  const runNext = async (): Promise<void> => {
    const currentIndex = nextIndex;
    if (currentIndex >= values.length) return;

    nextIndex += 1;
    const value = values[currentIndex];
    if (value !== undefined) await operation(value);
    return runNext();
  };

  await Promise.all(Array.from({ length: workerCount }, () => runNext()));
}
