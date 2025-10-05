import { RefObject, useLayoutEffect, useState } from 'react';

/**
 * Observes element size changes using ResizeObserver.
 */
export function useElementSize<T extends HTMLElement>(ref: RefObject<T>) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    if (!ref.current) return;
    const element = ref.current;
    const observer = new ResizeObserver(([entry]) => {
      const rect = entry.contentRect;
      setSize({ w: rect.width, h: rect.height });
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return size;
}
