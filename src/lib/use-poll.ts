"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export function usePoll<T>(
  fetcher: () => Promise<T>,
  intervalMs: number,
  enabled: boolean
): { data: T | null; loading: boolean; refresh: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const doFetch = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch (err) {
      console.error("Poll error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    setLoading(true);
    void doFetch();

    const id = setInterval(() => void doFetch(), intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs, doFetch]);

  return { data, loading, refresh: doFetch };
}
