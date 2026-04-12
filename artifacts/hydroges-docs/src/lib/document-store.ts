import type { Document } from "@workspace/api-client-react";

const STORE_KEY = "hydroges_documents_v2";

function load(): Document[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(docs: Document[]) {
  localStorage.setItem(STORE_KEY, JSON.stringify(docs));
}

export const localDocs: Document[] = load();

export function addDoc(doc: Document) {
  localDocs.unshift(doc);
  save(localDocs);
}

export function patchDoc(id: number, updates: Partial<Document>): Document | null {
  const idx = localDocs.findIndex(d => d.id === id);
  if (idx === -1) return null;
  localDocs[idx] = { ...localDocs[idx], ...updates };
  save(localDocs);
  return localDocs[idx];
}

export function removeDoc(id: number) {
  const idx = localDocs.findIndex(d => d.id === id);
  if (idx > -1) {
    localDocs.splice(idx, 1);
    save(localDocs);
  }
}

export function clearAllDocs() {
  localDocs.length = 0;
  save(localDocs);
}

/** Return only docs where the given user is sender or recipient */
export function docsForUser(userName: string, userRole: string): Document[] {
  const nameLower = userName.toLowerCase();
  const roleLower = userRole.toLowerCase();
  return localDocs.filter(d =>
    d.senderName?.toLowerCase() === nameLower ||
    d.recipientName?.toLowerCase() === nameLower ||
    d.senderName?.toLowerCase() === roleLower ||
    d.recipientName?.toLowerCase() === roleLower
  );
}
