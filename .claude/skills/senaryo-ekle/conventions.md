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

## 6. fieldOverrides ve fieldAttrOverrides yazma kuralı

Her hedef senaryo için:

```
combinedFieldIds = (schematronRequiredFieldIds[profile] ∪ commonRequiredFieldIds ∪ sampleFieldIds[scenario])

fieldOverrides = {}
fieldAttrOverrides = {}
fieldOverrides['invoice-profile-id'] = <senaryonun ait olduğu ProfileID>   // her zaman açıkça yaz

for each fieldId in combinedFieldIds:
  sampleValue = sampleValues[scenario][fieldId]
  sampleAttrs = sampleAttributes[scenario][fieldId]   // örn. { schemeID: 'KUNYENO', unitCode: 'KWH' }
  groupDefaultValue = invoiceGroupDefaults[<groupOf(fieldId)>][fieldId]
  field = configFields[fieldId]

  # Element text override
  if sampleValue && sampleValue !== groupDefaultValue:
    fieldOverrides[fieldId] = sampleValue

  # Attribute override (şemaID, unitCode, currencyID, characterSetCode, vb.)
  for each (attrName, attrValue) in sampleAttrs:
    # default attribute değeri — config field'ında attrKey + options[0] varsa
    defaultAttr = field.options?.[0]?.value (eğer field.attrKey === attrName)
    if attrValue && attrValue !== defaultAttr:
      fieldAttrOverrides[fieldId] ??= {}
      fieldAttrOverrides[fieldId][attrName] = attrValue
```

**`fieldAttrOverrides` mekaniği:**
- Anahtar: fieldId. Değer: `{ attrName: attrValue }` map'i. Bir alan birden fazla attribute taşıyabilir (örn. EmbeddedDocumentBinaryObject 4 attribute ile).
- `applyScenario` ([DocumentPageLayout.tsx](src/pages/DocumentPageLayout.tsx)) varsayılan attr (config'in attrKey + options[0] kombinasyonu) üzerine merge eder. Plain text alanlar (config'de `attr: 'value'`) için override attr objesini sıfırdan oluşturur.
- Sample XML'de görünen attribute config'in default option[0]'ı ile aynıysa **fieldAttrOverrides'a yazma** (gereksiz tekrar) — applyScenario default'u zaten yazıyor.
- GIB Schematron kuralları belirli schemeID değerlerini zorunlu tutar (örn. `INCOTERMS`, `PARTYTYPE`, `KUNYENO`, `ESURaporID`, `ARACIKURUMVKN`). Sample'dan gelen attribute'ları korumak GIB uyumluluğu için kritik.

**`invoice-profile-id` özel notu:**
- ProfileID artık **özel statüde değil** — `fieldOverrides` içinde sıradan bir alan olarak yer alır. Skill her senaryo için açıkça yazmalı (`defaults.ts` tarafında otomatik enjeksiyon **yok**, eski davranış kaldırıldı).
- Aynı ProfileID için birden fazla senaryo (varyant) yazılabilir — örn. `enerji-sarj` ve `enerji-sarjanlik` her ikisi de `"invoice-profile-id": "ENERJI"` taşır, farkı `invoice-type-code`, dönem değerleri vb. üzerinden gelir.
- Sample XML'de `<cbc:ProfileID>` görünenle senaryonun atadığı ProfileID farklıysa kullanıcıya raporlanır.

**Repeatable instance (array değer):**
- Sample XML'de aynı parent altında aynı tag birden fazla kez geçiyorsa (örn. `cac:PartyIdentification` 3 kez), repeatable group → fieldOverride değeri **array** olabilir.
- `"customer-party-party-id": ["VKN_DEĞERİ", "PLAKA_DEĞERİ", "ARACKIMLIKNO_DEĞERİ"]` → 3 ayrı `cac:PartyIdentification` instance'ı.
- `fieldAttrOverrides` aynı paralel array olabilir: `[{schemeID:"VKN"}, {schemeID:"PLAKA"}, {schemeID:"ARACKIMLIKNO"}]`.
- `applyScenario` array gördüğünde her elemanı ayrı instance'a yazar (path'te `marker#i`, fieldId'de `--i`).
- Tek-marker repeatable group'lar (PartyIdentification, PartyLegalEntity, AdditionalItemIdentification, vb.) için çalışır. Nested repeatable kapsam dışı.

**`strictMode` (kritik):**
- Generated senaryolar varsayılan olarak `"strictMode": true` ile yazılır.
- `applyScenario` strictMode etkin olduğunda **yalnız** `fieldOverrides` veya `fieldAttrOverrides`'da explicit listelenmiş alanları yazar; geri kalan tüm fieldId'ler için `groupDefaults` ve `autoFieldDefault` çağrısı atlanır → sample'da olmayan alanlar XML'e basılmaz.
- Sample'da olan her alanı senaryoya açıkça eklemek **zorunlu** — strictMode placeholder kurtarmaz. Skill, sample XML'i parse edip her gözlemlenen değeri override map'ine yazmalı.
- Compliance kritik: GIB e-fatura validasyonu sample'da olmayan alanları reddedebilir. strictMode bu nedenle generated senaryolar için varsayılan olmalı.

---

## 7. JSON çıktı şeması

```json
{
  "scenarios": [
    {
      "id": "ticarifatura",
      "label": "Ticari Fatura",
      "description": "Ticari Fatura profili için Schematron'a uygun tipik örnek.",
      "fieldOverrides": {
        "invoice-profile-id": "TICARIFATURA",
        "supplier-party-party-id": "1234567890",
        "customer-party-party-id": "9876543210"
      },
      "groupTitles": null
    },
    {
      "id": "enerji-sarj",
      "label": "Enerji - Şarj (Haftalık)",
      "description": "Enerji profili için haftalık şarj örneği.",
      "fieldOverrides": {
        "invoice-profile-id": "ENERJI",
        "invoice-type-code": "SARJ",
        "additional-docref-id": "B0E502A8-..."
      },
      "fieldAttrOverrides": {
        "additional-docref-id": { "schemeID": "ESURaporID" },
        "iline-quantity":       { "unitCode": "KWH" }
      },
      "strictMode": true,
      "groupTitles": ["Belge Genel Bilgileri", "Fatura Dönemi"]
    }
  ],
  "_meta": {
    "generatedAt": "2026-05-09",
    "schematronFiles": ["UBL-TR_Main_Schematron.xml"],
    "sampleFiles": ["TICARIFATURA.xml", "SARJ.xml"],
    "unmappedPaths": [
      "Invoice/cac:Foo/cbc:Bar"
    ],
    "skippedAsserts": [
      { "ruleId": "ProfileCheck", "test": "string-length(cbc:ID) > 0", "reason": "complex-test", "messageHint": "ID boş olamaz" }
    ]
  }
}
```

`id`: Lowercase, alfanumerik + tire. Senaryolar arası benzersiz. Aynı ProfileID için birden fazla senaryo varsa varyant suffix kullan (`<profileId>-<varyant>`, örn. `enerji-sarj`).
`label`: İnsan-okur. ProfileID + varyant ifadesi içerebilir (örn. `"Enerji - Şarj (Haftalık)"`); `config.ts`'deki ProfileID option'unun `label` field'ı temel başlangıç noktasıdır.
`description`: Kısa cümle, parantezsiz.
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
