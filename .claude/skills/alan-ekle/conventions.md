# conventions.md — genel kurallar

XSD'den `FieldDefinition` üretirken kullanılacak domain-bağımsız kurallar. UBL'e özgü kararlar `domain-packs/ubl-tr.md`'de.

## 1. Tip sistemi referansı

`src/types.ts` desteklediği tipler:

```ts
type FieldType =
  | 'text'              // default — type belirtilmezse text
  | 'number'
  | 'date'
  | 'time'
  | 'select'
  | 'duration-measure'
  | 'notes-list'
```

Yeni bir tip gerekirse `src/types.ts` ve `src/components/FieldForm.tsx` ikisi de güncellenmeli (skill bunu önerip kullanıcıdan onay alır, çünkü UI handler eklemek gerekir).

## 2. XSD tipi → FieldType eşlemesi

| XSD ifadesi | FieldType | attrKey | options | Notlar |
|---|---|---|---|---|
| `xs:date` | `date` | — | — | YYYY-MM-DD çıktı |
| `xs:time` | `time` | — | — | HH:MM:SS.0000000+00:00 çıktı |
| `xs:dateTime` | iki ayrı alan: `date` + `time` | — | — | Aynı parent path altında, fieldId suffix'leri `-date`/`-time` |
| `xs:decimal`, `xs:integer`, `xs:int`, `xs:long`, `xs:double`, `xs:float`, `xs:nonNegativeInteger` | `number` | — | — | |
| `xs:string` üzerinde `xs:enumeration` kısıtı | `select` | — | enum değerleri | `value`=enum kodu, `label`=glossary/PDF'ten Türkçe |
| Eleman + zorunlu birim attribute (`currencyID`, `unitCode`, `schemeID`, `listID`, vb.) | `duration-measure` | attribute adı | birim seçenekleri | Numeric değer + dropdown |
| `maxOccurs="unbounded"` ve eleman tek değerli (örn. `cbc:Note` benzeri) | `notes-list` | — | — | Sadece basit string tekrarları için. Karmaşık tekrarlar → factory veya alt grup |
| Diğer `xs:string` (kısıt yok) | `text` (default) | — | — | `type` alanını yazma — default text |

## 3. Disabled (`disabled: true`) tetikleyicileri

Aşağıdakilerden birinde true ata:
- `xs:annotation/xs:documentation` içeriğinde "sistem tarafından doldurulur", "otomatik", "uygulama tarafından" geçiyor.
- Domain pack'te explicit "always-disabled" listesinde (UBL pack'inde `cbc:DocumentTypeCode`, `cbc:EndpointID`, `cbc:TaxTypeCode`).
- Şüphede: kullanıcıya sor.

## 4. fieldId naming

- **Format:** kebab-case
- **Unique scope:** hedef modül-içinde unique (skill `fieldDefinitions` flat listesini tarayıp doğrular)
- **Yapı:** `<bağlam-prefix>-<eleman-adı-lowercase>`
  - Bağlam prefix'i grubun amacını yansıtır: `delivery-`, `period-`, `order-`, `signature-party-`
  - Eleman adı: namespace'siz, lowercase, ihtiyaç varsa kısaltılmış (`StreetName` → `street`, `BuildingNumber` → `bnum`)
- **Factory parametre:** factory çağırırken prefix'i parametreyle aktarılır: `makeAddressGroup('delivery-addr', [...])`. Factory iç fieldId'leri `${prefix}-id`, `${prefix}-street` gibi ekler.
- **Çakışma:** mevcut bir fieldId ile çakışıyorsa skill prefix'e bir suffix ekler (`delivery-id` → `delivery2-id`) veya kullanıcıya alternatif sorar.

## 5. Path konvansiyonu

- **İlk segment:** hedef modülün `rootTag`'i. Skill `MODULES[<modül>].rootTag`'ten alır (`Invoice`, `DespatchAdvice`, vs.).
- **Namespace prefix'leri:** literal korunur (`cbc:`, `cac:`). XSD'deki orijinal prefix neyse o kullanılır.
- **Attribute içeren alanlarda:** `path` parent elemanda biter, attribute `attrKey`'le belirtilir.
  - Örnek: `<cbc:Amount currencyID="TRY">100</cbc:Amount>` → `path: [..., 'cbc:Amount']`, `attr: 'value'`, `attrKey: 'currencyID'`.

## 6. Group config seçimi

`FieldGroupConfig` alanları:
- `title` — Türkçe grup başlığı
- `fields?` — düz alan listesi
- `subgroups?` — alt gruplar
- `items?` — fields ve subgroups karışık ve sıralı (Party gibi karmaşık yapılar)
- `wide?`, `fullWidth?`, `wrap?`, `defaultOpen?`, `newRow?` — UI flagleri

**Kararlar:**
- **Üst seviye (`fieldGroups` array'inin doğrudan elemanı):** `fullWidth: true, wrap: true`. İlk grup veya çok sık kullanılan gruba `defaultOpen: true`.
- **Alt grup (`subgroups`/`items` içinde):** `wrap: true`. `fullWidth` yazma.
- **`items` ne zaman kullanılır?** Bir grupta hem alanlar hem alt gruplar **sıralı** durmalıysa (örneğin Party'de WebSite, EndpointID, … sonra Adres, sonra Vergi Dairesi, sonra İletişim sırası önemli). `fields` + `subgroups` ayırırsan alanlar üstte, gruplar altta toplanır — sıra bozulur.
- **Sade ayrım:** Alan ve alt grup sırası önemli değilse `fields` + `subgroups` daha okunabilir.

## 7. Factory yaklaşımı

### 7.1 Mevcut factory'i kullanma

Domain pack aktif ve XSD'de pack'te tanımlı bir imza varsa skill o factory'yi çağırır.

Örnek (UBL):
```ts
makeAddressGroup('delivery-addr', ['Invoice', 'cac:Delivery', 'cac:DeliveryAddress'])
```

### 7.2 Yeni factory önerme

Skill XSD'de **2 veya daha fazla yerde tekrar eden** kompozit yapı görürse yeni factory önerir. Tekil bir yapı için inline yazar.

Yeni factory önerisi şunları içermeli (B10 öneri özetinde):
- İmza: `function makeXGroup(prefix: string, basePath: string[]): FieldGroupConfig`
- Hangi XSD elemanlarını kapsar
- Konum tercihi: tek modülde kullanılıyorsa modül-içi; birden fazla modülde de gerekecekse `src/modules/_shared/factories.ts`
- Skill kullanıcıya konumu net bir seçim olarak sorar.

### 7.3 Factory'i shared'a taşıma

Mevcut bir modül-içi factory ikinci modülde de gerekiyorsa skill önerir:
"Bu factory `invoice/config.ts`'te. Hem invoice hem despatch'te kullanılacaksa `src/modules/_shared/factories.ts`'a taşıyayım mı?"

Onay → taşı, her iki modülde import et. Reddedilirse → ikinci modüle kopyala (geçici duplikasyon kabul).

## 8. Glossary kararları

Skill her yeni terim için "shared mı, modül mü?" kararı verir:

- **shared:** UBL/XML standardının ortak terimleri. Birden fazla modülde aynı anlamda kullanılan elemanlar (`cbc:ID`, `cbc:Name`, `cbc:Description`, `cac:Address` çocukları gibi). Genel İngilizce → Türkçe ile çevrilebilir.
- **modül:** Sadece o belge tipinde anlam taşıyan veya farklı bağlamda farklı çevrilen terimler (`cbc:LineCountNumeric` → "Kalem Sayısı" sadece fatura için anlamlı).
- **Şüphede:** modüle yaz. Sonradan tekrar görülürse skill "bu terim shared'a taşınsın mı?" diye sorabilir.

Glossary anahtar formatı: namespace prefix dahil tam eleman adı (`cbc:DeliveryDate`, `cac:Delivery`).
Glossary değer formatı: Türkçe label (UI'da `label` alanına gidecek string).

## 9. Sıralama

`fieldGroups` array sırası UI'daki render sırasını belirler. Yeni grup eklerken kullanıcıya yerleşim sorusu (B9) hangi index'e gireceğini netleştirir. Skill mevcut grupları listeleyip "şunun altına / şunun arkasına" şeklinde seçtirir.

`fieldDefinitions` flat listesi `collectFields` ile otomatik üretilir; sıralama doğal olarak grup ağacının DFS'i.

## 10. Kontrol listesi (skill kendine sormalı)

Bir alan üretmeden önce:
- [ ] fieldId kebab-case ve unique mi?
- [ ] path rootTag ile başlıyor mu?
- [ ] Namespace prefix'leri korundu mu?
- [ ] FieldType doğru mu? (XSD tipi → tablo)
- [ ] Enum varsa `options` dolduruldu mu, label'ları çözüldü mü?
- [ ] Birim attribute varsa `attrKey` doğru, `options` birimleri içeriyor mu?
- [ ] Disabled olması gerekiyor mu?
- [ ] Factory ile temsil edilebilecek bir yapı mı?

Tüm liste tikli değilse alanı listeye eklemeden önce eksikleri kullanıcıya sor.
