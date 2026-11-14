import { useEffect, useState } from 'react';

/**
 * Delays updating the returned value until `delayMs` has elapsed without changes.
 * Keeps UI sliders/inputs responsive while curbing burst API requests.
 */
export function useDebounce<T>(value: T, delayMs: number = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

export default useDebounce;
