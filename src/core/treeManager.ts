import type { Tree, TreeNode, FieldAttr } from '../types'

/**
 * Yaprak node'lar `tag__fieldId` anahtarıyla saklanır; bu sayede aynı tag'e
 * sahip birden fazla sibling (farklı fieldId) çakışmadan yan yana durabilir.
 * Ara node'lar (intermediate) tag adıyla paylaşılır — aynı XML elemanıdır.
 *
 * Her node'a `_order` yazılır (fieldDefinitions dizisindeki indeks).
 * Birden fazla field aynı ara node'dan geçiyorsa en küçük (erken) indeks kazanır.
 * XMLNode bu değere göre kardeş node'ları sıralar → XML çıktısı her zaman
 * fieldDefinitions sıralamasına uyar, kullanıcının giriş sırası fark etmez.
 */
export function findOrCreateNodeById(
  tree: Tree,
  fieldId: string,
  path: string[],
  value: string,
  attr: FieldAttr | undefined,
  order = 0,
): Tree {
  const newTree = structuredClone(tree) as Tree
  _traverse(newTree as TreeNode, fieldId, path, value, attr, order, 0)
  return newTree
}

function _traverse(
  node: TreeNode,
  fieldId: string,
  path: string[],
  value: string,
  attr: FieldAttr | undefined,
  order: number,
  depth: number,
): TreeNode {
  if (depth === path.length) {
    node.fieldId = fieldId
    node.value = value
    node._order = order
    if (attr && attr !== 'value') node.attr = attr
    else delete node.attr
    return node
  }

  const segment = path[depth]
  const isLeaf = depth === path.length - 1

  if (!node.children) node.children = {}

  const key = isLeaf ? `${segment}__${fieldId}` : segment

  if (!node.children[key]) {
    node.children[key] = { tag: segment, children: {}, _order: order }
  } else {
    node.children[key]._order = Math.min(node.children[key]._order ?? Infinity, order)
  }

  _traverse(node.children[key], fieldId, path, value, attr, order, depth + 1)
  return node
}

/**
 * Yaprak node'u siler ve yukarı doğru boş kalan ara node'ları temizler.
 * Root tag node'u (tree.children'ın doğrudan çocukları) hiçbir zaman silinmez.
 */
export function removeNodeById(tree: Tree, fieldId: string, path: string[]): Tree {
  const newTree = structuredClone(tree) as Tree
  _prune(newTree as TreeNode, fieldId, path, 0)
  return newTree
}

function _prune(node: TreeNode, fieldId: string, path: string[], depth: number): boolean {
  if (!node.children) return false

  const segment = path[depth]
  const isLeaf = depth === path.length - 1

  if (isLeaf) {
    const key = `${segment}__${fieldId}`
    delete node.children[key]
    if (depth === 0) return false
    return Object.keys(node.children).length === 0
  }

  const child = node.children[segment]
  if (!child) return false

  const childEmpty = _prune(child, fieldId, path, depth + 1)

  if (childEmpty) {
    if (depth > 0) delete node.children[segment]
  }

  if (depth === 0) return false
  return Object.keys(node.children).length === 0
}

/**
 * Tree içinde fieldId'ye göre node'u döndürür (read-only arama).
 */
export function findNodeById(tree: Tree, fieldId: string): TreeNode | null {
  return _find(tree as TreeNode, fieldId)
}

function _find(node: TreeNode, fieldId: string): TreeNode | null {
  if (node.fieldId === fieldId) return node
  if (!node.children) return null

  for (const key of Object.keys(node.children)) {
    const result = _find(node.children[key], fieldId)
    if (result) return result
  }

  return null
}
