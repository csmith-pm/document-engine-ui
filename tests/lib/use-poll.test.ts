import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { usePoll } from "../../src/lib/use-poll";

describe("usePoll", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls fetcher immediately when enabled", async () => {
    const fetcher = vi.fn().mockResolvedValue({ data: "test" });
    renderHook(() => usePoll(fetcher, 5000, true));

    // Flush the initial microtask from the immediate void doFetch()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("does not call fetcher when disabled", async () => {
    const fetcher = vi.fn().mockResolvedValue({ data: "test" });
    renderHook(() => usePoll(fetcher, 5000, false));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });

    expect(fetcher).not.toHaveBeenCalled();
  });

  it("polls at specified interval", async () => {
    const fetcher = vi.fn().mockResolvedValue({ data: "test" });
    renderHook(() => usePoll(fetcher, 1000, true));

    // Initial call
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetcher).toHaveBeenCalledTimes(1);

    // After 3 intervals
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(fetcher).toHaveBeenCalledTimes(4);
  });

  it("stops polling when enabled changes to false", async () => {
    const fetcher = vi.fn().mockResolvedValue({ data: "test" });
    const { rerender } = renderHook(
      ({ enabled }) => usePoll(fetcher, 1000, enabled),
      { initialProps: { enabled: true } }
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    const callCount = fetcher.mock.calls.length;

    rerender({ enabled: false });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(fetcher.mock.calls.length).toBe(callCount);
  });

  it("returns loading=true initially then false after first fetch", async () => {
    const fetcher = vi.fn().mockResolvedValue({ data: "test" });
    const { result } = renderHook(() => usePoll(fetcher, 5000, true));

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.loading).toBe(false);
  });

  it("handles fetcher errors gracefully", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("fail"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => usePoll(fetcher, 5000, true));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();

    consoleSpy.mockRestore();
  });

  it("refresh triggers immediate fetch", async () => {
    const fetcher = vi.fn().mockResolvedValue({ data: "test" });
    const { result } = renderHook(() => usePoll(fetcher, 5000, true));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetcher).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.refresh();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("sets data from fetcher result", async () => {
    const fetcher = vi.fn().mockResolvedValue({ items: [1, 2, 3] });
    const { result } = renderHook(() => usePoll(fetcher, 5000, true));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.data).toEqual({ items: [1, 2, 3] });
  });
});
