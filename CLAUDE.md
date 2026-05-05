# UBL-TR Visualizer

UBL-TR standardına uygun e-belge XML yapısını görselleştiren bir React + TypeScript uygulaması. Sadece eğitim/öğrenme amaçlıdır.

## Komutlar

- `npm install` — bağımlılıkları yükle
- `npm run dev` — geliştirme sunucusunu başlat
- `npm run build` — production build al
- `npm run preview` — build'i önizle
- `npx tsc --noEmit` — tip kontrolü çalıştır

## Teknolojiler

- React 19, TypeScript 6, Vite 8, Tailwind CSS 4
- Test altyapısı yok

## Proje Yapısı

```
src/
  main.tsx                                 — Uygulama giriş noktası (StrictMode + DocumentProvider)
  App.tsx                                  — Sidebar navigasyon + sayfa yönlendirme
  types.ts                                 — Merkezi tip tanımları (Tree, FieldDefinition, ModuleConfig, vb.)
  vite-env.d.ts                            — Vite tip referansları (CSS importları, env vars)
  context/DocumentContext.tsx              — Global state (tree, activeFieldId, validation, safeMode, loadTree, ...)
  core/treeManager.ts                      — Tree CRUD (findOrCreateNodeById, removeNodeById, removeSubtree)
  core/xmlSerializer.ts                    — Tree → XML string dönüşümü
  core/xmlParser.ts                        — XML string → Tree (DOMParser tabanlı; unknownPaths + extraOptions raporu)
  components/FieldForm.tsx                 — Form bileşenleri (input, select, date/time picker, vb.)
  components/FieldGroup.tsx                — Accordion tarzı alan grubu bileşeni
  components/RepeatableFieldGroup.tsx      — Çoklu instance taşıyabilen grup wrapper'ı (Ekle/Sil)
  components/XMLNode.tsx                   — XML ağacını recursive render eden bileşen
  pages/DocumentPageLayout.tsx             — İki kolonlu layout (form + XML önizleme + indir/yükle/Güvenli Mod)
  pages/InvoicePage.tsx                    — Fatura sayfası wrapper'ı
  modules/index.ts                         — Modül kayıt noktası
  modules/invoice/config.ts                — Fatura alan tanımları, grupları ve factory'leri
  modules/invoice/required.generated.json  — XSD'den üretilen zorunlu path listesi (ELLE DÜZENLEME)
```

## Mimari

- **Modül sistemi:** Her belge tipi (fatura, irsaliye vb.) `src/modules/` altında kendi config dosyasına sahiptir. Config dosyası `rootTag`, opsiyonel `rootAttributes` (xmlns'ler) ve `rootStaticPrefix` (UBLExtensions/UBLVersionID/CustomizationID gibi sabit blok), `fieldGroups` ve `fieldDefinitions` export eder.
- **State yönetimi:** `DocumentContext` tüm belge tiplerinin state'ini tutar. Her modülün bağımsız `tree`, `activeFieldId`, `validationErrors`, `safeMode`, `extraOptions` ve `loadCounter` state'i vardır.
- **Tree yapısı:**
  - Yaprak node'lar `tag__fieldId` anahtarıyla saklanır → aynı tag'e sahip farklı field'lar (ör. iki ayrı `cbc:ID`) çakışmaz.
  - Ara node'lar tag adıyla paylaşılır — aynı XML elemanıdır.
  - Her node'da `_order` (fieldDefinitions indeksinden türeyen sayı) bulunur; `XMLNode` kardeşleri buna göre sıralar → XML çıktısı her zaman config sırasına uyar, kullanıcının giriş sırası önemsizdir.
  - Repeatable instance'lar tag anahtarına `#0`, `#1`, ... eklenerek ayrılır (ör. `cac:PartyIdentification#0`, `cac:PartyIdentification#1`).
- **Path adresleme:** Bir alan `path: string[]` ile tanımlanır (kök dahil değil; örn. `['cac:AccountingSupplierParty', 'cac:Party', 'cbc:WebsiteURI']`). `path` + `fieldId` birlikte kanonik adrestir; `treeManager` tüm CRUD işlemlerini bu ikisi üzerinden yapar.
- **Veri akışı:** Config → FieldForm (render) → updateField (context) → treeManager (CRUD) → XMLNode (görselleştirme) / xmlSerializer (indirme)
- **XML I/O:** `xmlSerializer` tree'yi indirilebilir XML'e çevirir; `xmlParser` yüklenen XML'i tree'ye dönüştürür. Parser, config'e bağlı bir `pathMap` üzerinden tanıdığı path'leri tree'ye yazar; tanımadıklarını `unknownPaths` listesine düşürür ve `<select>` alanlarındaki tanınmayan değerler `extraOptions`'a eklenerek kaybolmaz.
- **Tipler:** Tüm domain tipleri `src/types.ts`'te merkezi tutulur. Yeni alan tipleri eklerken önce burayı güncelle.

### Tip ve alan konvansiyonları (`types.ts`)

- **`FieldType`** (opsiyonel; varsayılan `text`): `'text' | 'number' | 'date' | 'time' | 'select' | 'duration-measure' | 'notes-list'`. `select` tipinde `options: SelectOption[]` zorunludur. `duration-measure` iki input render eder (sayı + birim); birim `attrKey` ile attribute'a yazılır.
- **`FieldAttr`** — Alanın XML'de nasıl yazılacağı:
  - `'value'` → element text'i (`<cbc:ID>123</cbc:ID>`)
  - `Record<string, string>` → element üzerinde attribute (örn. `{ currencyID: 'TRY' }` → `<cbc:PayableAmount currencyID="TRY">100</cbc:PayableAmount>`)
- **`FieldDefinition`**: `fieldId` (proje genelinde benzersiz), `label` (Türkçe; PDF kılavuzundan), `path`, `attr`, opsiyonel `type`, `options`, `attrKey`, `disabled`, `required`.
- **`FieldGroupConfig`**: `title`, `fields` veya `subgroups` veya karma `items: GroupItem[]`. Düzen için: `wrap` (alanları yan yana sar), `fullWidth`, `wide`, `newRow`, `defaultOpen`. Çoklu instance için: `repeatable: true`, `instanceMarker` (instance kökünün tag'i, örn. `cac:PartyIdentification`), `addLabel` (Ekle butonu metni).
- `GroupItem` ayrımı için yardımcı: `isFieldDefinition(item)`. Alt grupları gezerken her zaman bunu kullan.

## Kod Stili

- Fonksiyonel React component'leri, `export default function` pattern'i
- Stillendirme tamamen Tailwind CSS utility class'ları ile (inline CSS kullanma)
- **Dosya uzantıları:** React component'leri `.tsx`, saf TypeScript dosyaları `.ts`
- **Import'larda dosya uzantısı kullanma** — `import App from './App'` (TypeScript bundler resolution)
- **Type-only import'lar `import type` kullanır** — `import type { Tree } from './types'`
- TypeScript strict mode aktif (`noUnusedLocals`, `noUnusedParameters` dahil)
- Türkçe UI metinleri ve yorumlar

## Kurallar

- Commit mesajları Türkçe yazılmalıdır
- Paket yöneticisi olarak sadece `npm` kullan
- Yeni belge tipi eklerken `src/modules/` altında klasör oluştur ve `modules/index.ts`'e kaydet
- Yeni component/dosya oluştururken `.tsx` (JSX içerenler) veya `.ts` (saf TS) kullan — `.jsx`/`.js` kullanma
- Kod değişikliklerinden sonra `npx tsc --noEmit` ile tip kontrolünü doğrula
- `required.generated.json` ELLE düzenlenmez — XSD'den üretilir, üzerine yazılır. Bir alanın zorunluluğunu değiştirmek için XSD/üretim adımı gerekir
- Yeni alan eklerken `required: true` flag'ini elle yazma — config yüklendiğinde `markRequiredInGroups` path eşleşmesine göre otomatik işaretler

## Factory fonksiyonları (`modules/invoice/config.ts`)

Tekrar eden UBL yapıları için ortak factory'ler vardır. Yeni alan eklerken önce uygun factory'yi kullan, yoksa yeni grup yaz. Çağrı imzası genelde `(prefix, pathBase)` veya `(title, prefix, pathBase)` şeklindedir; `prefix` o yapı içindeki tüm `fieldId`'lere ön-ek olur, `pathBase` ise XML alt yolunu belirler.

- `makeAddressGroup(prefix, pathBase)` — `cbc:Postbox`, `cbc:Room`, `cbc:CitySubdivisionName`, `cbc:CityName`, `cac:Country/cbc:Name` vs. tüm UBL adres alanları
- `makePartyItems(prefix, base)` — Bir tarafa ait alanların düz listesi (Web, EndpointID, kimlik, vergi dairesi, ticaret sicili, iletişim, şahıs, ödeme bilgileri vs.) — `makePartyGroup` tarafından kullanılır
- `makePartyGroup(title, prefix, pathBase)` — Tam Party yapısı: `makePartyItems` + içinde "Şube" alt grubu (`cac:AgentParty`)
- `makeDocumentReferenceGroup(title, prefix, pathBase)` — `cac:*DocumentReference` blokları (ID, IssueDate, DocumentType, IssuerParty, geçerlilik dönemi vs.)
- `makeExchangeRateGroup(title, prefix, pathBase)` — `cac:*ExchangeRate` (Source/Target/Rate/Date)
- `makeTaxTotalGroup(title, prefix, pathBase, ...)` — `cac:TaxTotal` ve içindeki `cac:TaxSubtotal` / `cac:TaxCategory` / `cac:TaxScheme` zinciri
- `makeAllowanceChargeGroup(prefix, pathBase)` — `cac:AllowanceCharge` (Iskonto/Artırım): yön, neden, oran, tutar, matrah
- `makeDeliveryGroup(title, prefix, pathBase)` — `cac:Delivery` (alternatif teslim yeri, tahmini teslim dönemi, gönderi bilgisi, teslimat koşulları, yük/kargo)

**`fieldId` benzersizliği:** Aynı factory iki kez çağrılırsa farklı `prefix` ver — yoksa fieldId'ler çakışır. (örn. `'supplier-address'` ve `'customer-address'`)

## Repeatable (çoklu instance) gruplar

Bazı UBL yapıları aynı belgede birden fazla kez yer alır (örn. `cac:PartyIdentification`, `cac:PartyLegalEntity`, `cac:AdditionalDocumentReference`). Bunlar için:

```ts
{
  title: 'Kimlik Bilgisi',
  wrap: true,
  repeatable: true,
  instanceMarker: 'cac:PartyIdentification',  // instance kökü olan tag
  addLabel: 'Yeni Kimlik Bilgisi Ekle',
  fields: [...]                                // veya items / subgroups
}
```

- `RepeatableFieldGroup` çalışma anında `instanceMarker`'ı path'te bulup `cac:PartyIdentification#0`, `#1`, ... şeklinde index'ler.
- Her instance için ayrı bir `FieldGroup` render edilir; instance silindiğinde `removeSubtree` ile alt ağaç temizlenir.
- Yüklenen XML'de var olan instance'lar otomatik tespit edilip listelenir (`useEffect` + `findExistingInstanceIndices`).
- Repeatable bir grup içindeki alanların `path`'i, factory'lerin döndüğü pattern'le aynı olmalı (instance index'i runtime'da eklenir; config'de yazma).

## Güvenli Mod ve doğrulama

- `DocumentPageLayout`'taki "Güvenli Mod" toggle'ı `localStorage` (`safeMode:<docType>`) ile kalıcıdır, modül başına ayrıdır.
- Açıkken kullanıcı "XML İndir"e bastığında `validateRequired()` çalışır; eksik bir zorunlu alan varsa indirme iptal edilir, ilk eksik alana scroll yapılır ve sayaç ("N eksik alan") gösterilir.
- `updateField`, validation aktifse hatayı dolu/boş geçişine göre kendi günceller (yeniden tam tarama yapmaz).
- Doc type değiştirildiğinde validation otomatik sıfırlanır.

## XML Yükleme ve İndirme

- **İndirme:** `treeToXml` çıktısı `<docType>_YYYYMMDD.xml` adıyla Blob URL üzerinden indirilir (`pages/DocumentPageLayout.tsx` → `downloadXml`).
- **Yükleme:** `.xml` seçildiğinde 5 MB limit kontrol edilir; mevcut form dolu ise üzerine yazma onayı alınır; `parseXmlToTree(xmlString, config)` çağrılır ve `loadTree(tree, extraOptions)` ile context'e yüklenir.
- Parser config dışında kalan elemanları `unknownPaths`'te toplar → kullanıcıya sarı banner ile gösterilir.
- `<select>` alanlarına gelen tanımsız değerler `extraOptions`'a eklenir; FieldForm bu ekstraları normal seçenekler gibi sunar (veri kaybı olmaz).
- `loadCounter` artırılır; `FieldForm` bunu `key` olarak kullanarak iç state'ini sıfırlar.

## Referans dökümanlar ve `/alan-ekle` skill'i

XSD ve PDF kılavuzları `references/` klasörü altında modül-bazlı tutulur:

```
references/
  shared/glossary.json            — modüller arası ortak terim sözlüğü (commit edilir)
  <modül>/xsd/                    — XSD dosyaları (gitignore'lu)
  <modül>/pdf/                    — kılavuz PDF'leri (gitignore'lu)
  <modül>/glossary.json           — modüle özgü terim sözlüğü (commit edilir)
```

Yeni alan eklemek için `/alan-ekle` skill'i kullanılır. Skill XSD'yi parse eder, mevcut factory'leri (yukarıdaki liste — `makeAddressGroup`, `makePartyItems`, `makePartyGroup`, `makeDocumentReferenceGroup`, `makeExchangeRateGroup`, `makeTaxTotalGroup`, `makeAllowanceChargeGroup`, `makeDeliveryGroup`) tanır, glossary'yi günceller, önce öneri sunar, onay sonrası `config.ts`'i değiştirir. Klasör yoksa skill ilk kullanımda kullanıcıyı yönlendirerek oluşturur.
