import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock localStorage
const store: Record<string, string> = { tenantId: "test-tenant", userId: "test-user" };
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = val; },
  },
});

// Set env
process.env.NEXT_PUBLIC_API_URL = "http://localhost:4000";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Dynamic import so env/localStorage are ready
const api = await import("../src/lib/api-client");

beforeEach(() => {
  mockFetch.mockReset();
});

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: "OK",
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
}

describe("api-client", () => {
  describe("listReports", () => {
    it("sends GET with tenant headers", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]));
      const result = await api.listReports();
      expect(result).toEqual([]);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:4000/api/documents",
        expect.objectContaining({
          headers: expect.objectContaining({
            "x-tenant-id": "test-tenant",
            "x-user-id": "test-user",
          }),
        })
      );
    });
  });

  describe("createReport", () => {
    it("sends POST with JSON body", async () => {
      const doc = { id: "123", title: "Test" };
      mockFetch.mockResolvedValueOnce(jsonResponse(doc));
      const result = await api.createReport({
        docType: "budget_book",
        title: "Test",
        fiscalYear: 2025,
      });
      expect(result).toEqual(doc);
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toBe("http://localhost:4000/api/documents");
      expect(opts.method).toBe("POST");
      expect(JSON.parse(opts.body)).toMatchObject({
        docType: "budget_book",
        title: "Test",
        fiscalYear: 2025,
      });
    });
  });

  describe("getReport", () => {
    it("fetches a single document", async () => {
      const doc = { id: "abc", title: "FY25 Budget" };
      mockFetch.mockResolvedValueOnce(jsonResponse(doc));
      const result = await api.getReport("abc");
      expect(result).toEqual(doc);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:4000/api/documents/abc",
        expect.anything()
      );
    });
  });

  describe("deleteReport", () => {
    it("sends DELETE", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => undefined, text: async () => "" });
      await api.deleteReport("abc");
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toBe("http://localhost:4000/api/documents/abc");
      expect(opts.method).toBe("DELETE");
    });
  });

  describe("startGeneration", () => {
    it("sends POST to generate endpoint", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ message: "started", documentId: "abc" })
      );
      const result = await api.startGeneration("abc");
      expect(result.message).toBe("started");
      expect(mockFetch.mock.calls[0][0]).toBe(
        "http://localhost:4000/api/documents/abc/generate"
      );
    });
  });

  describe("continueGeneration", () => {
    it("sends POST to regenerate endpoint", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ message: "started", documentId: "abc" })
      );
      await api.continueGeneration("abc");
      expect(mockFetch.mock.calls[0][0]).toBe(
        "http://localhost:4000/api/documents/abc/regenerate"
      );
    });
  });

  describe("getProgress", () => {
    it("fetches progress", async () => {
      const data = { documentId: "abc", jobs: [{ id: "j1" }] };
      mockFetch.mockResolvedValueOnce(jsonResponse(data));
      const result = await api.getProgress("abc");
      expect(result.jobs).toHaveLength(1);
    });
  });

  describe("listTodos", () => {
    it("fetches todos for a document", async () => {
      const data = { documentId: "abc", todos: [] };
      mockFetch.mockResolvedValueOnce(jsonResponse(data));
      const result = await api.listTodos("abc");
      expect(result.todos).toEqual([]);
      expect(mockFetch.mock.calls[0][0]).toBe(
        "http://localhost:4000/api/documents/abc/todos"
      );
    });
  });

  describe("sendMessage", () => {
    it("sends POST with message body", async () => {
      const data = { todo: { id: "t1" }, messages: [] };
      mockFetch.mockResolvedValueOnce(jsonResponse(data));
      await api.sendMessage("t1", "Hello");
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toBe("http://localhost:4000/api/documents/todos/t1/messages");
      expect(JSON.parse(opts.body)).toEqual({ message: "Hello" });
    });
  });

  describe("updateTodoStatus", () => {
    it("sends PATCH with status", async () => {
      const data = { id: "t1", status: "resolved" };
      mockFetch.mockResolvedValueOnce(jsonResponse(data));
      await api.updateTodoStatus("t1", "resolved");
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toBe("http://localhost:4000/api/documents/todos/t1/status");
      expect(opts.method).toBe("PATCH");
      expect(JSON.parse(opts.body)).toEqual({ status: "resolved" });
    });
  });

  describe("getPdfUrl", () => {
    it("returns the correct URL", () => {
      expect(api.getPdfUrl("abc")).toBe(
        "http://localhost:4000/api/documents/abc/pdf"
      );
    });
  });

  describe("error handling", () => {
    it("throws on non-OK responses", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: async () => "not found",
      });
      await expect(api.getReport("nope")).rejects.toThrow("API 404");
    });
  });
});
