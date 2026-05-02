const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }
const escapeXml = (str) => String(str).replace(/[&<>"']/g, (c) => ESCAPE_MAP[c])

/** Returns true if this node or any descendant has a defined value (including empty string). */
function hasContent(node) {
  if (node.value !== undefined) return true
  if (!node.children) return false
  return Object.values(node.children).some(hasContent)
}

/** Serializes node.attr object → ` key="val"` string fragments. */
function attrsString(attr) {
  if (!attr || typeof attr !== 'object') return ''
  return Object.entries(attr)
    .map(([k, v]) => ` ${k}="${escapeXml(v)}"`)
    .join('')
}

function serializeNode(node, depth) {
  if (!hasContent(node)) return ''

  const pad = '  '.repeat(depth)
  const attrs = attrsString(node.attr)
  const tag = node.tag

  const children = node.children ? Object.values(node.children).filter(hasContent) : []

  if (children.length > 0) {
    const inner = children
      .map((child) => serializeNode(child, depth + 1))
      .filter(Boolean)
      .join('\n')
    if (!inner) return ''
    return `${pad}<${tag}${attrs}>\n${inner}\n${pad}</${tag}>`
  }

  // Leaf with value
  return `${pad}<${tag}${attrs}>${escapeXml(node.value)}</${tag}>`
}

/**
 * Converts a treeManager tree state to a formatted XML string.
 * Internal properties (fieldId, attr, etc.) are never written to output.
 *
 * @param {Object} tree     - DocumentContext tree state
 * @param {string} rootTag  - Module rootTag ('Invoice' | 'DespatchAdvice' | ...)
 * @returns {string}        - Complete XML document string, or '' if tree is empty
 */
export function treeToXml(tree, rootTag) {
  const rootNode = tree.children?.[rootTag]
  if (!rootNode || !hasContent(rootNode)) return ''

  const body = serializeNode(rootNode, 0)
  if (!body) return ''

  return `<?xml version="1.0" encoding="UTF-8"?>\n${body}`
}
