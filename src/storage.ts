import { get, set } from "idb-keyval";
import type { ScanRecord } from "./types";

const STORAGE_KEY = "scan-history";

export async function getHistory(): Promise<ScanRecord[]> {
  return (await get<ScanRecord[]>(STORAGE_KEY)) ?? [];
}

export async function addScan(record: ScanRecord): Promise<void> {
  const history = await getHistory();
  // Avoid duplicates by ISBN — update if already exists
  const idx = history.findIndex((r) => r.isbn13 === record.isbn13);
  if (idx !== -1) {
    history[idx] = record;
  } else {
    history.unshift(record);
  }
  await set(STORAGE_KEY, history);
}

export async function clearHistory(): Promise<void> {
  await set(STORAGE_KEY, []);
}
