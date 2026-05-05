import Dexie, { type Table } from 'dexie'

export interface HistoryEntry {
  id?: number
  docType: string
  name: string
  xml: string
  createdAt: number
}

export const HISTORY_LIMIT_PER_DOCTYPE = 50

class HistoryDB extends Dexie {
  entries!: Table<HistoryEntry, number>

  constructor() {
    super('UBLTRHistoryDB')
    this.version(1).stores({
      entries: '++id, docType, createdAt, [docType+createdAt], [docType+name]',
    })
  }
}

const db = new HistoryDB()

export async function listHistory(docType: string): Promise<HistoryEntry[]> {
  const rows = await db.entries.where('docType').equals(docType).toArray()
  return rows.sort((a, b) => b.createdAt - a.createdAt)
}

export async function getHistoryEntry(id: number): Promise<HistoryEntry | undefined> {
  return db.entries.get(id)
}

export async function deleteHistoryEntry(id: number): Promise<void> {
  await db.entries.delete(id)
}

export async function findUniqueName(docType: string, baseName: string): Promise<string> {
  const rows = await db.entries.where('docType').equals(docType).toArray()
  const existing = new Set(rows.map((r) => r.name))
  if (!existing.has(baseName)) return baseName
  let i = 1
  while (existing.has(`${baseName}_${i}`)) i++
  return `${baseName}_${i}`
}

export async function listExistingNames(docType: string): Promise<Set<string>> {
  const rows = await db.entries.where('docType').equals(docType).toArray()
  return new Set(rows.map((r) => r.name))
}

export async function saveHistoryEntry(entry: Omit<HistoryEntry, 'id'>): Promise<number> {
  const id = await db.entries.add(entry as HistoryEntry)
  const count = await db.entries.where('docType').equals(entry.docType).count()
  if (count > HISTORY_LIMIT_PER_DOCTYPE) {
    const overflow = count - HISTORY_LIMIT_PER_DOCTYPE
    const oldest = await db.entries
      .where('[docType+createdAt]')
      .between([entry.docType, Dexie.minKey], [entry.docType, Dexie.maxKey])
      .limit(overflow)
      .toArray()
    await db.entries.bulkDelete(oldest.map((r) => r.id!).filter((v) => v !== undefined))
  }
  return id as number
}
