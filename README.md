# UBL-TR Visualizer

E-belge alanlarının XML yapısını görsel olarak keşfetmek için geliştirilmiş bir öğrenme aracıdır. Sol tarafta form, sağ tarafta canlı XML ağacı; bir alana yazdığınızda XML çıktısındaki karşılığı anında oluşur ve vurgulanır.

## Önemli Yasal Uyarı

> **Bu proje yalnızca öğrenme amaçlıdır.**
>
> İçerdiği alan tanımları ve XML yapısı hatalı veya eksik olabilir. Araçtan indirilen XML çıktısı gerçek bir e-belge olarak **kullanılamaz**, herhangi bir sisteme **gönderilemez**.

## Ekran Tanıtımı

- **Sol kenar çubuğu** — belge tipi seçimi (şu an: Fatura) ve "Bilgi" düğmesi (yasal uyarı).
- **Form paneli (sol)** — UBL-TR alan grupları akordiyon başlıklar halinde. Bir grubu açın, alanları doldurun.
- **XML önizleme paneli (sağ)** — form ile gerçek zamanlı senkronize XML ağacı. Düğümler tek tek açılır/kapanır.
- **Üst toolbar** — *XML İndir*, *XML Yükle*, *Varsayılanları Doldur*, *Kaydet*, *Geçmiş*, *Güvenli Mod*, *Küçült*.

## Özellikler

### Canlı XML Senkronizasyonu
Form alanına yazdığınız her karakter XML ağacında karşılığında anında belirir. XML çıktısı her zaman config'deki alan sırasına göre üretilir — kullanıcının formu hangi sırayla doldurduğu fark etmez (her node'da tutulan `_order` alanı sayesinde).

### Çift Yönlü Vurgulama
- Form alanına tıklayın → XML paneli ilgili node'a yumuşak scroll yapar ve onu vurgular.
- XML node'una tıklayın → ilgili form alanı highlight olur ve görünür hâle gelir.

### Manuel Aç/Kapa + Küçült
XML ağacındaki düğümler `▸` ile açılır/kapanır. Toolbar'daki "Küçült" butonu ağacı ilk seviyeye indirir; kalabalık çıktıyı toparlamak için kullanışlı.

### Çoklu Instance (Repeatable) Gruplar
`cac:PartyIdentification`, `cac:PartyLegalEntity`, `cac:AdditionalDocumentReference` gibi belgede birden fazla geçebilen blokların **"Yeni X Ekle"** ve **"Sil"** desteği. Yüklediğiniz bir XML'de var olan instance'lar otomatik tespit edilip listelenir; düzenlenebilir.

### XML İndirme
*XML İndir* butonu mevcut formu `<docType>_YYYYMMDD.xml` adıyla bir dosyaya çevirir (`treeToXml` üzerinden, kanonik UBL sırasıyla).

### XML Yükleme
*XML Yükle* butonu ile bir `.xml` seçince:
- 5 MB üst limit kontrol edilir.
- Form doluysa **"üzerine yazılsın mı?"** onayı alınır.
- Tanımadığı path'ler sayfa üstünde **sarı banner**'da listelenir (`unknownPaths`).
- `<select>` alanlarına gelen tanımsız değerler dropdown'a otomatik eklenir (`extraOptions`) — yüklenen değer korunur.

### Güvenli Mod
Toolbar'daki toggle. Modül başına `localStorage`'da kalıcıdır.
- Açıkken *XML İndir*'e basınca önce zorunlu alan doğrulaması yapılır.
- Eksik alan varsa indirme iptal olur, sayfa **ilk eksik alana** scroll eder, toolbar'da **"N eksik alan"** sayacı görünür.
- Zorunluluk listesi `src/modules/invoice/required.generated.json` dosyasından gelir; bu dosya XSD'den otomatik üretilir (`npm run extract-required`).

### Varsayılanları Doldur
Boş bir formu birkaç tıkla makul örnek değerlerle doldurur. *Varsayılanları Doldur* butonu iki seçenek sunan bir ara ekran açar:

- **Senaryolar** — Hazır profil kartları (örn. *Temel Fatura*, *Ticari Fatura*). Her senaryo, GIB Schematron'larından üretilen profil-spesifik zorunlu alanlar + örnek XML'lerden alınmış tipik değerler içerir.
- **Kendim Seçeceğim** — Grup checkbox listesi. İstediğiniz gruplar seçilir, *üzerine yaz* tercihi açıkken dolu alanlar da yenilenir.

Otomatik üretilen değerler arasında: bugünün tarihi, geçerli saat, UUID, ve yıl başına artan fatura numarası (örn. `INV2026000000001`; sayaç `localStorage`'da tutulur).

### Belge Geçmişi
Tarayıcı içi IndexedDB'de (Dexie) tutulan kişisel kayıt deposu. Hiçbir veri sunucuya gitmez.

- **Kaydet** — geçerli formun XML'ini ad vererek geçmişe atar; çakışan ad varsa otomatik suffix eklenir (`name_1`, `name_2`).
- **Geçmiş** — modül başına en son **50 kayıt** listelenir; bir kaydı tıklayıp formu geri yükleyebilir veya silebilirsiniz.

### Otomatik Zorunlu İşaretleme
Config yüklenirken `markRequiredInGroups` çalışır ve `required.generated.json`'daki path'lerle eşleşen alanlara `required: true` ekler. Yeni alan tanımı yazarken zorunluluk flag'ini elle girmeniz gerekmez.

## Kurulum

```bash
git clone <repo-url>
cd "UBL-Tr Visualizer"
npm install
npm run dev
```

Geliştirme sunucusu varsayılan olarak `http://localhost:5173` adresinde açılır.

### Komutlar

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu (hot reload) |
| `npm run build` | Production build (`dist/`) |
| `npm run preview` | Build çıktısını önizle |
| `npm run extract-required` | XSD'den `required.generated.json`'ı üretir |
| `npx tsc --noEmit` | Tip kontrolü |

## Teknoloji Yığını

- **React 19** + **TypeScript 6** — UI ve tipler
- **Vite 8** — geliştirme/build
- **Tailwind CSS 4** — stillendirme (utility-first)
- **Dexie 4** — IndexedDB üzerinde belge geçmişi
- **fast-xml-parser**, **tsx** — yardımcı script'ler

## Proje Yapısı (özet)

```
src/
  context/         — DocumentContext (global state, validation, safeMode, ...)
  core/            — treeManager, xmlSerializer, xmlParser, historyDb
  components/      — FieldForm, FieldGroup, RepeatableFieldGroup, XMLNode,
                     DefaultsModal, ScenarioListModal, FillModeChooserModal,
                     SaveHistoryModal, HistoryModal
  pages/           — DocumentPageLayout, InvoicePage
  modules/
    index.ts       — modül kayıt noktası
    invoice/       — config.ts, defaults.ts, required.generated.json,
                     scenarios.generated.json
references/        — XSD / PDF / Schematron / örnek XML kaynakları
scripts/           — extractRequiredFromXsd.ts
```

## Claude Code Skill'leri

Proje, [Claude Code](https://docs.claude.com/claude-code) ile geliştirilirken kullanılmak üzere iki adet özel slash komut içerir. Skill kayıtları `.claude/skills/` altındadır; Claude Code projeyi açtığında bu skill'ler otomatik tanınır.

### `/alan-ekle` — Yeni alan ekleme

XSD (zorunlu) ve opsiyonel PDF kılavuzdan `src/modules/<modül>/config.ts` dosyasına yeni `FieldDefinition` ve `FieldGroupConfig` üretir.

**Akış:**
1. **Bootstrap fazı** — `references/<modül>/xsd/`, `glossary.json` gibi referans klasörleri yoksa kullanıcı onayıyla oluşturur.
2. **Ekleme fazı** — XSD'yi parse eder, mevcut factory'leri (`makeAddressGroup`, `makePartyGroup`, `makeTaxTotalGroup`, `makeAllowanceChargeGroup`, `makeDeliveryGroup`, `makeDocumentReferenceGroup`, `makeExchangeRateGroup`) tanır, alan önerisini sunar, onay sonrası config'e yazar ve `npx tsc --noEmit` ile tip kontrolü yapar.

**Çağırma:**
```
/alan-ekle             # Modülü interaktif sorar
/alan-ekle invoice     # Doğrudan invoice modülüne ekler
```

**Gerekenler:** `references/<modül>/xsd/*.xsd` (zorunlu), `references/<modül>/pdf/*.pdf` (opsiyonel — Türkçe label doğrulaması için).

### `/senaryo-ekle` — Profil bazlı doldurma senaryoları üretme

GIB UBL-TR Schematron'larından profil-spesifik zorunlu alanları, örnek XML'lerden tipik değerleri çıkarır; sonucu `src/modules/<modül>/scenarios.generated.json`'a profil bazlı `FillScenario` olarak yazar.

**Akış:**
1. **Bootstrap fazı** — `references/<modül>/schematron/` ve `references/<modül>/samples/` klasörleri yoksa oluşturur, `defaults.ts` entegrasyonunu kontrol eder.
2. **Üretim fazı** — `.sch` dosyalarını parse edip profil bazlı zorunlulukları çıkarır, sample XML'lerden tipik değerleri okur, JSON'a yazar. Sample değer `invoiceGroupDefaults` ile aynıysa `fieldOverrides`'a yazılmaz (defaults zincirine bırakılır). Mevcut profiller silinmez; güncellenir veya yeni profil eklenir.

**Çağırma:**
```
/senaryo-ekle              # references/<modül>/schematron/ ve samples/ altındaki tüm profilleri toplu işler
/senaryo-ekle TICARIFATURA # Tek bir profile odaklanır
```

**Gerekenler:** `references/<modül>/schematron/*.sch`, `references/<modül>/samples/*.xml`.

**Sonuç:** `defaults.ts` JSON'u runtime'da `invoiceFillScenarios` ile birleştirir; `ScenarioListModal` yeni profili otomatik listeler — kod yazmaya gerek yoktur.

### Referans Klasörü Düzeni

Skill'lerin beklediği yapı:

```
references/
  shared/
    glossary.json                 — modüller arası ortak terim sözlüğü (commit edilir)
  <modül>/
    xsd/                          — XSD dosyaları (gitignore)
    pdf/                          — kılavuz PDF'leri (gitignore)
    schematron/                   — Schematron .sch dosyaları (gitignore)
    samples/                      — profil bazlı örnek XML'ler (gitignore)
    glossary.json                 — modüle özgü terim sözlüğü (commit edilir)
```

Bu klasörlerin amaçları ve genişletme yöntemi: [references/README.md](references/README.md).

## Lisans

[LICENSE](LICENSE) dosyasına bakın.
