/**
 * XSLT metnini (string) parametre olarak alır ve XML'i HTML/XML'e dönüştürür.
 * Caller, metnin nereden geleceğine karar verir:
 *   - Default için fetch('/xslt/<docType>.xsl') → loadXsltFromUrl
 *   - İleride özel XSLT'ler için IndexedDB'den okuma
 * Her iki kaynak da string döner → tek kod yolu.
 *
 * Tarayıcının native XSLTProcessor'ı yalnız XSLT 1.0 destekler.
 */
export function transformXmlWithXslt(xml: string, xsltText: string): string {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xml, 'application/xml')
  if (xmlDoc.querySelector('parsererror')) {
    throw new Error('XML ayrıştırılamadı')
  }
  const xsltDoc = parser.parseFromString(xsltText, 'application/xml')
  if (xsltDoc.querySelector('parsererror')) {
    throw new Error('XSLT ayrıştırılamadı')
  }

  const proc = new XSLTProcessor()
  proc.importStylesheet(xsltDoc)
  const resultDoc = proc.transformToDocument(xmlDoc)
  return new XMLSerializer().serializeToString(resultDoc)
}

export async function loadXsltFromUrl(url: string): Promise<string> {
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`XSLT yüklenemedi (${resp.status})`)
  return resp.text()
}
