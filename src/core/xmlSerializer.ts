import type { Tree, TreeNode } from '../types'

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}
const escapeXml = (str: string): string =>
  String(str).replace(/[&<>"']/g, (c) => ESCAPE_MAP[c])

// XML Name yaklaşık kuralı (UBL-TR: harf/_ ile başlar; harf, rakam, '.', '-', '_', ':' içerir)
const XML_NAME_RE = /^[A-Za-z_][\w.\-:]*$/
const isValidXmlName = (name: unknown): name is string =>
  typeof name === 'string' && XML_NAME_RE.test(name)

function hasContent(node: TreeNode): boolean {
  if (node.value !== undefined) return true
  if (!node.children) return false
  return Object.values(node.children).some(hasContent)
}

function attrsString(attr: TreeNode['attr']): string {
  if (!attr || typeof attr !== 'object') return ''
  return Object.entries(attr)
    .filter(([k]) => {
      if (isValidXmlName(k)) return true
      console.warn(`[xmlSerializer] Geçersiz XML attribute adı atlandı: ${JSON.stringify(k)}`)
      return false
    })
    .map(([k, v]) => ` ${k}="${escapeXml(v)}"`)
    .join('')
}

function serializeNode(node: TreeNode, depth: number): string {
  if (!hasContent(node)) return ''

  const tag = node.tag
  if (!isValidXmlName(tag)) {
    console.warn(`[xmlSerializer] Geçersiz XML tag adı atlandı: ${JSON.stringify(tag)}`)
    return ''
  }

  const pad = '  '.repeat(depth)
  const attrs = attrsString(node.attr)

  const children = node.children ? Object.values(node.children).filter(hasContent) : []

  if (children.length > 0) {
    const inner = children
      .map((child) => serializeNode(child, depth + 1))
      .filter(Boolean)
      .join('\n')
    if (!inner) return ''
    return `${pad}<${tag}${attrs}>\n${inner}\n${pad}</${tag}>`
  }

  return `${pad}<${tag}${attrs}>${escapeXml(node.value ?? '')}</${tag}>`
}

/**
 * Converts a treeManager tree state to a formatted XML string.
 * Internal properties (fieldId, attr, etc.) are never written to output.
 */
export function treeToXml(
  tree: Tree,
  rootTag: string,
  rootAttributes?: Record<string, string>,
  rootStaticPrefix?: string,
): string {
  if (!isValidXmlName(rootTag)) {
    console.warn(`[xmlSerializer] Geçersiz root XML tag adı: ${JSON.stringify(rootTag)}`)
    return ''
  }
  const rootNode = tree.children?.[rootTag]
  if (!rootNode || !hasContent(rootNode)) return ''

  const rootAttrs = attrsString(rootAttributes)
  const childNodes = rootNode.children ? Object.values(rootNode.children).filter(hasContent) : []
  const dynamicBody = childNodes
    .map((child) => serializeNode(child, 1))
    .filter(Boolean)
    .join('\n')

  const innerParts: string[] = []
  if (rootStaticPrefix) innerParts.push(rootStaticPrefix)
  if (dynamicBody) innerParts.push(dynamicBody)
  if (innerParts.length === 0) return ''

  const inner = innerParts.join('\n')
  const body = `<${rootTag}${rootAttrs}>\n${inner}\n</${rootTag}>`
  return `<?xml version="1.0" encoding="UTF-8"?>\n${body}`
}
