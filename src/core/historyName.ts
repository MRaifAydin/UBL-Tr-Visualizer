import type { Tree } from '../types'

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function formatNow(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function findInvoiceId(tree: Tree, rootTag: string): string | null {
  const root = tree.children?.[rootTag]
  if (!root?.children) return null
  for (const [key, node] of Object.entries(root.children)) {
    if (key.startsWith('cbc:ID__') && node.value) return node.value
  }
  return null
}

export function generateHistoryName(tree: Tree, rootTag: string): string {
  const ts = formatNow()
  const id = findInvoiceId(tree, rootTag)
  return id ? `${ts} — ${id}` : ts
}
