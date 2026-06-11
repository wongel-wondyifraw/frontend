import { useMemo } from 'react';

export function debounce<T extends (...args: Parameters<T>) => void>(fn: T, delayMs: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}

export function useDebouncedCallback<T extends (...args: never[]) => void>(
  callback: T,
  delayMs: number,
): (...args: Parameters<T>) => void {
  return useMemo(
    () => debounce(callback, delayMs),
    [callback, delayMs],
  );
}
