import { useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';

/**
 * Observe the size of an element and return the latest width and height.
 */
export function useElementSize<T extends HTMLElement>(ref: RefObject<T>) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ w: width, h: height });
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);

  return size;
}
