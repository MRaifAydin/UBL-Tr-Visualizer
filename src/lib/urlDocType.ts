import { MODULES } from '../modules'

const DEFAULT_DOC_TYPE = Object.keys(MODULES)[0]

export function parseDocTypeFromPath(pathname: string): string | null {
  const seg = pathname.split('/').filter(Boolean)[0]
  if (!seg) return null
  return MODULES[seg] ? seg : null
}

export function pathFromDocType(docType: string): string {
  return '/' + docType
}

export function readInitialDocType(): string {
  return parseDocTypeFromPath(window.location.pathname) ?? DEFAULT_DOC_TYPE
}
