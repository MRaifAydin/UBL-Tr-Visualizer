export interface ExtractedXslt {
  filename?: string
  xsltText: string
}

function decodeBase64Utf8(b64: string): string {
  const cleaned = b64.replace(/\s+/g, '')
  const bin = atob(cleaned)
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder('utf-8').decode(bytes)
}

function getRootInvoiceId(doc: Document): string | null {
  const root = doc.documentElement
  if (!root) return null
  for (const child of Array.from(root.children)) {
    if (child.localName === 'ID' && child.namespaceURI?.endsWith('CommonBasicComponents-2')) {
      return (child.textContent || '').trim() || null
    }
  }
  // Fallback: ilk localName=ID olan ilk-seviye eleman
  for (const child of Array.from(root.children)) {
    if (child.localName === 'ID') return (child.textContent || '').trim() || null
  }
  return null
}

function findChildByLocalName(parent: Element, localName: string): Element | null {
  for (const c of Array.from(parent.children)) {
    if (c.localName === localName) return c
  }
  return null
}

function* iterateExtractCandidates(
  doc: Document,
  invoiceId: string | null,
): Generator<{ filename?: string; base64: string }> {
  const refs = doc.getElementsByTagNameNS('*', 'AdditionalDocumentReference')
  for (let i = 0; i < refs.length; i++) {
    const ref = refs[i]
    const docTypeEl = findChildByLocalName(ref, 'DocumentType')
    const docTypeText = (docTypeEl?.textContent || '').trim()

    const attachment = findChildByLocalName(ref, 'Attachment')
    const embedded = attachment ? findChildByLocalName(attachment, 'EmbeddedDocumentBinaryObject') : null
    if (!embedded) continue

    const filename = embedded.getAttribute('filename') || undefined
    const base64 = (embedded.textContent || '').trim()
    if (!base64) continue

    const isPrimary = docTypeText === 'XSLT'
    const isFallback =
      !isPrimary &&
      invoiceId !== null &&
      !!filename &&
      filename.includes(invoiceId)

    if (isPrimary || isFallback) {
      yield { filename, base64 }
    }
  }
}

export function extractEmbeddedXslts(xmlString: string): ExtractedXslt[] {
  const doc = new DOMParser().parseFromString(xmlString, 'application/xml')
  if (doc.querySelector('parsererror')) return []

  const invoiceId = getRootInvoiceId(doc)
  const out: ExtractedXslt[] = []
  for (const cand of iterateExtractCandidates(doc, invoiceId)) {
    let xsltText: string
    try {
      xsltText = decodeBase64Utf8(cand.base64)
    } catch {
      continue
    }
    if (!xsltText.includes('<xsl:stylesheet')) continue
    out.push({ filename: cand.filename, xsltText })
  }
  return out
}

export function hasEmbeddedXslt(xmlString: string): boolean {
  const doc = new DOMParser().parseFromString(xmlString, 'application/xml')
  if (doc.querySelector('parsererror')) return false
  const invoiceId = getRootInvoiceId(doc)
  for (const cand of iterateExtractCandidates(doc, invoiceId)) {
    try {
      const text = decodeBase64Utf8(cand.base64)
      if (text.includes('<xsl:stylesheet')) return true
    } catch {
      continue
    }
  }
  return false
}
