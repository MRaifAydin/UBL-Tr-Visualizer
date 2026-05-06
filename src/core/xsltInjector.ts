function encodeBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

function escapeXmlAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
}

function escapeXmlText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Serileştirilmiş UBL XML string'inin uygun bir noktasına `cac:AdditionalDocumentReference`
 * bloğu (gömülü XSLT içeren) yerleştirir.
 *
 * Yerleştirme: root içindeki ilk `<cac:*` ile başlayan eleman'ın önüne — UBL sequence'inde
 * cbc: header'ından sonra cac: blokları gelir, XSLT bloğu da cac: olduğu için doğal yerleşir.
 * Hiç cac: yoksa root close tag'in öncesine eklenir (edge case).
 */
export function injectXsltIntoXml(
  xml: string,
  xsltText: string,
  invoiceId: string,
  issueDate: string,
  rootTag: string,
): string {
  const base64 = encodeBase64Utf8(xsltText)
  const filenameAttr = escapeXmlAttr(`${invoiceId || 'document'}.xslt`)
  const idText = escapeXmlText(invoiceId || '')
  const dateText = escapeXmlText(issueDate || '')

  const block =
    '  <cac:AdditionalDocumentReference>\n' +
    `    <cbc:ID>${idText}</cbc:ID>\n` +
    `    <cbc:IssueDate>${dateText}</cbc:IssueDate>\n` +
    '    <cbc:DocumentType>XSLT</cbc:DocumentType>\n' +
    '    <cac:Attachment>\n' +
    `      <cbc:EmbeddedDocumentBinaryObject mimeCode="application/xml" encodingCode="Base64" characterSetCode="UTF-8" filename="${filenameAttr}">${base64}</cbc:EmbeddedDocumentBinaryObject>\n` +
    '    </cac:Attachment>\n' +
    '  </cac:AdditionalDocumentReference>\n'

  // Primary: ilk <cac:*> elementinin önüne yerleştir
  const cacPattern = /([ \t]*<cac:[A-Za-z][\w-]*[\s>])/
  const match = xml.match(cacPattern)
  if (match && match.index !== undefined) {
    return xml.slice(0, match.index) + block + xml.slice(match.index)
  }

  // Fallback: root close tag'in önüne yerleştir
  const closeTag = `</${rootTag}>`
  const closeIdx = xml.lastIndexOf(closeTag)
  if (closeIdx >= 0) {
    return xml.slice(0, closeIdx) + block + xml.slice(closeIdx)
  }

  // Hiçbir yer bulunamadı (mümkün değil ama güvenli)
  return xml
}
