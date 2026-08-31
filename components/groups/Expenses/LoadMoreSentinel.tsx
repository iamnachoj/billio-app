'use client';

import { useEffect, useRef } from 'react';

type LoadMoreSentinelProps = {
  onIntersect: () => void;
  enabled: boolean;
  isLoading: boolean;
};

export default function LoadMoreSentinel({
  onIntersect,
  enabled,
  isLoading,
}: LoadMoreSentinelProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const node = sentinelRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onIntersect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [enabled, onIntersect]);

  if (!enabled) {
    return null;
  }

  return (
    <div ref={sentinelRef} className="flex justify-center py-4">
      {isLoading ? (
        <span className="text-sm text-slate-500">Loading more expenses…</span>
      ) : null}
    </div>
  );
}
