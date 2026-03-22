const API_URL = process.env.API_URL ?? "http://localhost:4000";
const TENANT_ID = "e2e-test";
const USER_ID = "e2e-user";

function headers(extra?: Record<string, string>): Record<string, string> {
  return {
    "x-tenant-id": TENANT_ID,
    "x-user-id": USER_ID,
    ...extra,
  };
}

export async function createTestDocument(overrides: Record<string, unknown> = {}) {
  const res = await fetch(`${API_URL}/api/documents`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      docType: "budget_book",
      title: `E2E Test ${Date.now()}`,
      fiscalYear: 2026,
      dataSource: "upload",
      maxIterations: 5,
      ...overrides,
    }),
  });
  if (!res.ok) throw new Error(`Create failed: ${res.status}`);
  return res.json();
}

export async function deleteTestDocument(id: string) {
  const res = await fetch(`${API_URL}/api/documents/${id}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok && res.status !== 404)
    throw new Error(`Delete failed: ${res.status}`);
}

export async function cleanupTestDocuments() {
  const res = await fetch(`${API_URL}/api/documents`, {
    headers: headers(),
  });
  if (!res.ok) return;
  const docs = await res.json();
  for (const doc of docs) {
    await deleteTestDocument(doc.id).catch(() => {});
  }
}

export async function waitForStatus(
  id: string,
  target: string | string[],
  timeout = 120_000
): Promise<Record<string, unknown>> {
  const targets = Array.isArray(target) ? target : [target];
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const res = await fetch(`${API_URL}/api/documents/${id}`, {
      headers: headers(),
    });
    if (res.ok) {
      const doc = await res.json();
      if (targets.includes(doc.status)) return doc;
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`Timed out waiting for status ${targets.join("|")} on ${id}`);
}
