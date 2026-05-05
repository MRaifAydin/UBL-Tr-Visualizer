# conventions.md — Schematron parse ve eşleme kuralları

`/senaryo-ekle` skill'inin Schematron'ları nasıl yorumlayacağını, profilleri nasıl ayıracağını ve config.ts ile nasıl eşleyeceğini tanımlar.

---

## 1. Schematron temel yapısı

UBL-TR Schematron'ları ISO Schematron 2016 formatına uyar:

```xml
<sch:schema xmlns:sch="http://purl.oclc.org/dsdl/schematron">
  <sch:phase id="TEMELFATURA">
    <sch:active pattern="invoice-rules"/>
  </sch:phase>

  <sch:pattern name="AbstractRules" id="abstracts">
    <sch:rule abstract="true" id="DocumentCheck">
      <sch:assert test="sh:StandardBusinessDocumentHeader">
        sh:StandardBusinessDocumentHeader zorunludur.
      </sch:assert>
    </sch:rule>
  </sch:pattern>

  <sch:pattern id="invoice-rules">
    <sch:rule context="//Invoice">
      <sch:extends rule="DocumentCheck"/>
      <sch:assert test="cbc:UUID">UUID zorunludur.</sch:assert>
    </sch:rule>
  </sch:pattern>
</sch:schema>
```

### İlgili elementler

| Element | Anlamı |
|---|---|
| `sch:phase[@id]` | Bir profili veya kontrol setini gruplar; `sch:active` ile pattern'lere bağlanır |
| `sch:active[@pattern]` | Phase'in aktive ettiği pattern id |
| `sch:pattern[@id]` | Rule grubu |
| `sch:rule[@context]` | Hangi node'a uygulanır (XPath) |
| `sch:rule[@abstract='true']` | Doğrudan değil, `sch:extends` ile inline edilir |
| `sch:rule/sch:extends[@rule]` | Abstract rule'u somutlaştırır |
| `sch:assert[@test]` | Test başarısızsa hata; **zorunluluk kaynağı** |
| `sch:assert[@flag]` veya `[@role]` | `error` (zorunlu) / `warning` (atla) |
| `sch:report` | Test başarılıysa hata — bu skill **işlemiyor** (zorunluluk değil) |

---

## 2. Test ifadesi parse kuralları

`<sch:assert test="...">` içindeki XPath. Skill **basit existence** kalıplarını yakalar.

### Kabul edilen kalıplar (zorunluluk olarak işlenir)

| Kalıp | Anlam | Örnek |
|---|---|---|
| `<tag>` | Element zorunlu | `cbc:UUID` |
| `<path>/<path>` | Nested element zorunlu | `cac:Party/cbc:WebsiteURI` |
| `exists(<path>)` | Element zorunlu | `exists(cbc:UUID)` |
| `count(<path>) > 0` | En az bir tane zorunlu | `count(cac:InvoiceLine) > 0` |
| `count(<path>) >= N` | N tane zorunlu | `count(...) >= 1` |
| `<path>[<predicate>]` | Element zorunlu (predicate sade path için atılır) | `cac:Party[cbc:ID]` → `cac:Party` zorunlu, predicate atla |
| `@<attr>` | Attribute zorunlu | `@currencyID` (path'in absolute hali context'ten türer) |

### Atlanan kalıplar (skippedAsserts'e yazılır)

| Kalıp | Sebep |
|---|---|
| `if/then/else` | Koşullu — basit existence değil |
| `<a> and <b>` | Mantıksal AND — ayrıca alınabilir ama skill basit kalıp seviyesinde tutar |
| `<a> or <b>` | Mantıksal OR — hangisi gerekli belirsiz |
| `string-length(...) > 0` | Boş olmama kontrolü — değer bağımlı, existence ile karıştırma |
| `matches(...)` | Regex — değer formatı kontrolü |
| `contains(...)`, `starts-with(...)` | Substring kontrolü |
| `number(...) > N` | Sayısal kıyas |
| Karmaşık nested fonksiyonlar | Otomatik anlam çıkarımı zor |

Atlananlar için `_meta.skippedAsserts`'e şu format'ta yaz:
```json
{ "ruleId": "DocumentCheck", "test": "string-length(cbc:ID) > 0", "reason": "complex-test", "messageHint": "ID boş olamaz" }
```

### `flag` / `role` filtresi

`<sch:assert flag="warning">` veya `role="warning"` (case-insensitive) → **atla, raporlama yok**. Sadece `error` (default) seviyesindekiler zorunluluk sayılır.

---

## 3. Context'ten absolute path türetme

Rule'un `context` attribute'u XPath. Skill bunu absolute path'e dönüştürür ve assert'lerin path'inin önüne koyar.

| Rule context | Assert test | Türetilmiş absolute path |
|---|---|---|
| `//Invoice` | `cbc:UUID` | `Invoice/cbc:UUID` |
| `Invoice/cac:AccountingSupplierParty` | `cac:Party/cbc:WebsiteURI` | `Invoice/cac:AccountingSupplierParty/cac:Party/cbc:WebsiteURI` |
| `cac:PostalAddress` | `cbc:CityName` | (context relatif → en yakın absolute parent'tan başla; bilinmiyorsa kullanıcıya sor) |
| `Invoice[cbc:ProfileID='TEMELFATURA']` | `cbc:UUID` | `Invoice/cbc:UUID` (predicate profil sinyali, path'ten çıkarılır) |

Predicate işleme:
- `[cbc:ProfileID='X']` → profil sinyali (madde 4'e bak), path'ten çıkar
- Diğer predicate'ler (`[1]`, `[@id='x']`) → atla (path'e dahil etme), raporla
- Mutlak path olmayan context'ler (`cac:X`) → en yakın bilinen parent'a göre absolute hale getirilemiyorsa **atla, raporla**

---

## 4. Profil ayrımı

Bir rule veya assert'in hangi ProfileID'ye ait olduğunu **sırayla** dene:

### 4.1 Phase id

```xml
<sch:phase id="TEMELFATURA">
  <sch:active pattern="invoice-rules"/>
</sch:phase>
```

`phase[@id]` ProfileID listesinde varsa → o phase'in aktive ettiği pattern'lerdeki rule'lar bu profile aittir.

### 4.2 Rule context predicate

```xml
<sch:rule context="//Invoice[cbc:ProfileID='TEMELFATURA']">
```

Predicate `[cbc:ProfileID='X']` (veya `[ProfileID='X']` namespace'siz) → o rule'un assert'leri X profiline aittir.

### 4.3 Dosya adı

`TEMELFATURA.sch`, `temel-fatura.sch`, `Temelfatura.sch` → normalize et (uppercase, alfa karakterleri al, ProfileID listesiyle karşılaştır).

Eşleme tablosu:
| Dosya pattern'i | ProfileID |
|---|---|
| `TEMELFATURA*` | TEMELFATURA |
| `TICARIFATURA*` | TICARIFATURA |
| `IHRACAT*`, `EXPORT*` | IHRACAT |
| `EARSIVFATURA*`, `EARSIV*` | EARSIVFATURA |
| `EFINANSFATURA*`, `EFINANS*` | EFINANSFATURA |
| `KAMU*` | KAMU |
| `OZELFATURA*`, `OZEL*` | OZELFATURA |
| `YOLCUBERABER*` | YOLCUBERABERFATURA |
| `STDKODFATURA*` | STDKODFATURA |
| `HKS*FATURA*`, `HKS.sch` | HKS |
| `HKSIRSALIYE*` | HKSIRSALIYE |
| `TEMELIRSALIYE*` | TEMELIRSALIYE |
| `ENERJI*` | ENERJI |
| `ILAC*`, `TIBBICIHAZ*` | ILAC_TIBBICIHAZ |
| `YATIRIMTESVIK*` | YATIRIMTESVIK |
| `Common*`, `Abstract*`, `Package*` | (ortak — hiçbir profile bağlı değil) |

### 4.4 Hiçbiri yoksa: ortak rule

Profil sinyali bulunamadıysa rule'un assert'leri **commonRequiredPaths** olarak işaretlenir → tüm profillere uygulanır.

### 4.5 Resmi ProfileID listesi (config.ts:506-519'dan)

```
TEMELFATURA, TICARIFATURA, YOLCUBERABERFATURA, EARSIVFATURA, IHRACAT,
OZELFATURA, KAMU, HKS, STDKODFATURA, TEMELIRSALIYE, HKSIRSALIYE,
ENERJI, ILAC_TIBBICIHAZ, YATIRIMTESVIK, ...
```

Skill bu listeyi config.ts'i parse edip dinamik olarak çekmeli (hardcode etme — sıkı bağımlılık olur).

---

## 5. Path → fieldId eşleme

`tsx` ile `src/modules/<modül>/config.ts`'i import et. `fieldDefinitions` dizisindeki her field için anahtar üret:

```ts
function makeKey(field: FieldDefinition): string {
  const pathStr = field.path.join('/')
  if (typeof field.attr === 'object') {
    const attrName = Object.keys(field.attr)[0]
    return pathStr + '@' + attrName
  }
  return pathStr
}
```

Map: `Map<key, FieldDefinition[]>` (aynı key'e birden fazla field düşebilir — ör. attribute farklı default'larla).

### Eşleme stratejisi

1. Schematron'dan gelen path için anahtarı oluştur (`Invoice/cbc:UUID` veya `Invoice/cbc:PayableAmount@currencyID`).
2. Map'te ara.
3. Tek match → fieldId'yi al.
4. Çoklu match → `fieldOverrides`'a yazılırken hepsini ekle (her fieldId için aynı değer).
5. Match yok → `_meta.unmappedPaths`'e yaz: `{ path: "...", profile: "...", source: "schematron|sample" }`.

### Sample XML eşlemesi

Sample XML element'lerinin absolute path'i `<root>/...` şeklinde. Skill için anahtar: `<rootTag>/<path...>` (config'deki `rootTag` ile aynı).

Örnek: `Invoice/cac:AccountingSupplierParty/cac:Party/cac:PostalAddress/cbc:CityName` → eşleşen fieldId: `supplier-party-postal-city`.

Attribute örneği: `Invoice/cbc:PayableAmount/@currencyID` → key `Invoice/cbc:PayableAmount@currencyID` → fieldId: `lmt-payable-currency` (config'e bağlı).

---

## 6. fieldOverrides yazma kuralı

Her hedef profil için:

```
combinedFieldIds = (schematronRequiredFieldIds[profile] ∪ commonRequiredFieldIds ∪ sampleFieldIds[profile])

for each fieldId in combinedFieldIds:
  sampleValue = sampleValues[profile][fieldId]
  groupDefaultValue = invoiceGroupDefaults[<groupOf(fieldId)>][fieldId]

  if sampleValue && sampleValue !== groupDefaultValue:
    fieldOverrides[fieldId] = sampleValue
  else:
    # groupDefault zaten doğru değeri verir, atla
    skip
```

`profileId` özel değer:
- `fieldOverrides['invoice-profile-id']` skill tarafından **JSON'a yazılmaz** — `defaults.ts`'teki merge mantığı ProfileID'yi otomatik ekler.
- Sample XML'de `<cbc:ProfileID>` farklı bir değer çıksa bile profile bilgisi dosya adı/argument'tan gelir; sample'daki ProfileID kullanıcıya raporlanır (uyumsuzluk kontrolü).

---

## 7. JSON çıktı şeması

```json
{
  "profiles": [
    {
      "profileId": "TICARIFATURA",
      "label": "Ticari Fatura",
      "description": "Ticari Fatura profili için Schematron'a uygun tipik örnek.",
      "fieldOverrides": {
        "supplier-party-party-id": "1234567890",
        "customer-party-party-id": "9876543210"
      },
      "groupTitles": null
    }
  ],
  "_meta": {
    "generatedAt": "2026-05-06",
    "schematronFiles": ["UBL-TR-CommonRules.sch", "TICARIFATURA.sch"],
    "sampleFiles": ["TICARIFATURA.xml"],
    "unmappedPaths": [
      { "path": "Invoice/cac:Foo/cbc:Bar", "profile": "TICARIFATURA", "source": "schematron" }
    ],
    "skippedAsserts": [
      { "ruleId": "ProfileCheck", "test": "string-length(cbc:ID) > 0", "reason": "complex-test", "messageHint": "ID boş olamaz" }
    ]
  }
}
```

`label`: `config.ts`'deki ProfileID option'unun `label` field'ından alınır (hardcode etme).
`description`: skill default cümle veya kullanıcı isterse override.
`groupTitles`: varsayılan `null` (tüm gruplar). Hariç tutulan grup varsa `string[]` olarak yazılır.

---

## 8. fast-xml-parser yapılandırması

```ts
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: false,        // namespace prefix'leri korunsun (cbc:, cac:, sch:)
  preserveOrder: true,          // rule sırası önemli
  trimValues: true,
  parseTagValue: false,         // tüm değerler string kalsın (sayı/boolean dönüşümü yok)
})
```

`preserveOrder: true` çıktıyı array-of-objects yapar; skill bunu recursive walk ederek dolaşır.

---

## 9. Parse yardımcısı çalıştırma

Skill içinde Bash + tsx ile parse mantığını ya inline ya da geçici dosyada çalıştır:

```bash
npx tsx -e '
  import { XMLParser } from "fast-xml-parser"
  import { readFileSync } from "node:fs"
  // ... parse logic ...
'
```

Veya kalıcı yardımcı: `.claude/skills/senaryo-ekle/parse.ts` (gerekirse skill'in ilk çalıştırmasında oluşturulur, sonraki çalıştırmalarda kullanılır).

---

## 10. config.ts'i dinamik okuma

```bash
npx tsx -e '
  const mod = await import("./src/modules/invoice/config.ts")
  const fields = mod.invoiceFieldDefinitions ?? mod.default?.fieldDefinitions
  for (const f of fields) {
    console.log(JSON.stringify({ id: f.fieldId, key: f.path.join("/") + (typeof f.attr === "object" ? "@" + Object.keys(f.attr)[0] : "") }))
  }
'
```

`config.ts` doğrudan `invoiceConfig` veya benzer bir export sunuyorsa skill o yapıdan `fieldDefinitions`'a ulaşır. Skill her çağrıda config dosyasını okur (cache yok).
