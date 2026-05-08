---
name: senaryo-ekle
description: GIB UBL-TR Schematron'larından ve örnek XML'lerden FillScenario doldurma senaryoları üretir, src/modules/<modül>/scenarios.generated.json dosyasına yazar. Argument verilirse tek senaryoya/profile odaklanır (örn. /senaryo-ekle TICARIFATURA, /senaryo-ekle ENERJI-SARJ), verilmezse references/<modül>/schematron/ ve references/<modül>/samples/ altındaki tüm dosyaları toplu tarar. Aynı ProfileID için birden fazla senaryo (varyant) üretebilir. İlk kullanımda klasör yapısını ve defaults.ts entegrasyonunu rehberlik ederek kurar.
---

# senaryo-ekle

Schematron (zorunluluk) + örnek XML (tipik değerler) girdisinden senaryo düzeyinde `FillScenario` üretir. Çıktı `src/modules/<modül>/scenarios.generated.json`'a yazılır; `defaults.ts` bu JSON'u runtime'da merge eder, `ScenarioListModal` otomatik listeler.

**Senaryo ↔ ProfileID ayrımı:** Senaryo bir doldurma örneğidir (kendi `id`'si, label'ı, override seti); ProfileID ise XML'deki `cbc:ProfileID` alanının değeridir. Aralarında 1:1 zorunluluk yok — bir profil için birden fazla senaryo (örn. `enerji-sarj`, `enerji-sarjanlik` aynı `ENERJI` profilinde farklı InvoiceTypeCode varyantları) yazılabilir. ProfileID artık `fieldOverrides` içinde sıradan bir alan olarak (`"invoice-profile-id": "ENERJI"`) yer alır; özel statüsü/auto-injection'ı yoktur.

İki faz vardır:
- **Faz A — Bootstrap:** referans klasörleri/dosyaları/defaults.ts entegrasyonu yoksa kullanıcıyı yönlendirerek kurar.
- **Faz B — Üretim:** Schematron'ları parse eder, örnek XML'leri okur, profil bazlı senaryoları inşa eder, JSON'a yazar.

Ana referans:
- `conventions.md` — Schematron parse kuralları, ProfileID eşleme tablosu, path→fieldId rehberi, edge case'ler

Kurallar:
- Tüm karar adımlarında: emin değilsen **kullanıcıya sor** (`AskUserQuestion`). Tahmin etme.
- Klasör/dosya oluşturma adımlarında her zaman onay al.
- Mevcut `scenarios.generated.json`'u **silme**; varsayılan davranış: aynı `id`'ye sahip senaryoları güncelle, yenisi varsa ekle. Tümünü sıfırlama isteğini açıkça sor.
- Sample XML değeri `invoiceGroupDefaults`'taki değerle aynıysa `fieldOverrides`'a YAZMA (gereksiz tekrar) — defaults zincirine bırak. **İstisna:** `invoice-profile-id` her senaryoda açıkça yazılır (otomatik enjekte edilmez).

---

## Faz A — Bootstrap

Skill her çağrıldığında önce ortamı kontrol eder. Eksikleri sırayla tamamlar.

### A1. Hedef modülü belirle

1. `src/modules/index.ts`'i oku, `MODULES` kaydındaki modül anahtarlarını çıkar.
2. Tek modül varsa otomatik seç ve kullanıcıya bildir: "Tek modül mevcut: `invoice`. Onunla devam ediyorum."
3. Birden fazla varsa `AskUserQuestion` ile seçtir.
4. Modül seçildikten sonra: `src/modules/<modül>/config.ts` dosyasının var olduğunu doğrula. Yoksa: `/alan-ekle` skill'iyle modülün önce kurulmasını iste, dur.

### A2. Klasör yapısı

Sırayla kontrol et ve eksikleri kullanıcı onayıyla oluştur. Her oluşturma için `AskUserQuestion` kullan.

```
references/<modül>/schematron/    — Schematron .sch dosyaları
references/<modül>/samples/       — Profil bazlı örnek XML'ler
```

Adımlar:

1. **`references/<modül>/schematron/`** → "`references/<modül>/schematron/` oluşturup .sch dosyalarını oraya koymanı isteyeceğim." Onay → `mkdir -p` ve `.gitkeep` ekle.
2. **`references/<modül>/samples/`** → "Profil bazlı örnek XML'ler için `references/<modül>/samples/` oluşturayım mı?" Onay → `mkdir -p` ve `.gitkeep` ekle.

### A3. .gitignore kontrolü

`.gitignore`'da `references/*/schematron/` ve `references/*/samples/` pattern'leri yoksa kullanıcıya öner ve onayla ekle. (Mevcut `references/*/xsd/` ve `references/*/pdf/` satırlarının yanına yerleştir.)

### A4. `scenarios.generated.json` ve `defaults.ts` entegrasyonu

1. **`src/modules/<modül>/scenarios.generated.json`** var mı? Yoksa `AskUserQuestion` ile onay alıp boş `{ "scenarios": [], "_meta": { ... } }` yaz.
2. **`src/modules/<modül>/defaults.ts`** generated JSON'u import ediyor mu? Etmiyorsa kullanıcıya teklif et:
   - Import satırı: `import scenariosData from './scenarios.generated.json'`
   - `invoiceFillScenarios` dizisinin sonuna `...profileScenarios` spread'i
   - Spread için `GeneratedScenario` interface'i (alanlar: `id`, `label`, `description?`, `fieldOverrides`, `groupTitles?`) ve senaryoyu doğrudan `FillScenario`'ya çeviren map (`id: \`scenario-${s.id}\``)
   - **ProfileID otomatik enjekte edilmez** — her senaryonun `fieldOverrides`'ı `invoice-profile-id` değerini açıkça taşır
3. Onay sonrası patch'i uygula. Mevcut entegrasyon varsa atla.

### A5. Schematron klasörü boşsa bekle

`references/<modül>/schematron/` boşsa kullanıcıya net mesaj ver:

> `references/<modül>/schematron/` hazır. Schematron .sch dosyalarını oraya kopyalayıp "hazır" dediğinde devam ederim. Örnek XML'leri varsa `references/<modül>/samples/` altına anlamlı bir adla (ör. `TEMELFATURA.xml`, `SARJ.xml`, `SARJANLIK.xml`) koy. Aynı ProfileID için birden fazla varyant istiyorsan ayrı dosyalar kullan.

`samples/` klasörü boş kalabilir; bu durumda senaryo değerleri `invoiceGroupDefaults` + `autoFieldDefault`'tan gelir, sadece `invoice-profile-id` override yazılır.

---

## Faz B — Üretim akışı

Bootstrap tamamsa veya zaten kuruluysa.

### B1. Argüman ve hedef senaryo seti

1. Kullanıcı argüman verdiyse hedef seti belirle:
   - Tek senaryo `id`: `/senaryo-ekle enerji-sarj` (mevcut bir senaryo varsa onu güncelle)
   - ProfileID adı: `/senaryo-ekle TICARIFATURA` (o profile bağlı tek/birden fazla senaryo)
   - Doğal dilden ifade: `/senaryo-ekle şarj senaryosunu ekleyelim` → kullanıcıya hangi sample dosya(lar)ına karşılık geldiğini `AskUserQuestion` ile doğrula
2. Argüman yoksa: tüm Schematron + sample dosyalarını tara, ProfileID'leri ve dosya adlarını otomatik tespit et. Aynı ProfileID için birden fazla sample varsa kullanıcıya tek senaryo mu, ayrı senaryolar mı tercih ettiğini sor.
3. Tespit edilen ProfileID'leri `config.ts`'deki resmi liste ile karşılaştır:
   - Tanınan: doğrudan kullan
   - Tanınmayan (typo veya yeni profil): `AskUserQuestion` — "TICARIFATURA mı demek istedin?" / "Yeni bir profil mi tanımlıyorsun? config.ts'e eklenmeli mi?"
4. Hedef set boşsa kullanıcıya bildir ve dur.

### B2. Schematron parse (zorunluluk çıkarımı)

Detaylar `conventions.md` → "Schematron parse kuralları" bölümünde. Özet:

- Tüm `.sch` dosyalarını oku (`fast-xml-parser` ile, `tsx` üzerinden)
- Abstract rule'ları + concrete rule'ları topla, `<sch:extends>` üzerinden inline et
- `<sch:assert>` test ifadelerini parse et: basit existence kalıplarını al, karmaşıkları **skippedAsserts** raporuna düşür
- Profil ayrımı: `sch:phase[@id]` → context predicate → dosya adı sırasıyla dene
- Hiçbiri eşleşmiyorsa rule'lar **ortak** sayılır (tüm profillere uygulanır)
- Çıktı: `Map<ProfileID, Set<requiredPath>>` + `commonRequiredPaths`

### B3. Sample XML parse (tipik değer çıkarımı)

- `references/<modül>/samples/*.xml` her dosyayı `fast-xml-parser` ile oku
- Profil tespiti: dosya adı (`TEMELFATURA.xml` → TEMELFATURA) > içerikteki `<cbc:ProfileID>`
- Element text → `path → değer` map'i; attribute → `path@attr → değer` map'i
- Sonuç: `Map<ProfileID, Map<path, value>>`

### B4. Path → fieldId eşleme

`config.ts`'i `tsx` ile dinamik import et, `fieldDefinitions` dizisini gez:
- Anahtar: `field.path.join('/') + (field.attr typeof object ? '@' + Object.keys(field.attr)[0] : '')`
- Değer: `field.fieldId`
- Birden fazla fieldId aynı path'e işaret ediyorsa: `attr` ayrımıyla doğru olanı seç (örn. `cbc:PayableAmount` value vs `cbc:PayableAmount` currencyID attr).

Eşleşmeyen path'ler `_meta.unmappedPaths`'e yazılır ve kullanıcıya raporlanır.

### B5. Senaryo inşası

Her hedef senaryo için:

1. Senaryoya bir **`id` ata:** lowercase, alfanumerik + tire (örn. `temelfatura`, `enerji-sarj`, `enerji-sarjanlik`). Aynı ProfileID için birden fazla senaryo varsa anlamlı bir suffix kullan (`<profileId>-<varyant>`).
2. **Required fieldId set** = (profile-specific required paths ∪ commonRequiredPaths) → fieldId'ye eşle
3. **Sample değerleri** = sample XML'den gelen path → değer map'i → fieldId → değer; sample attribute'ları = path → `{ attrName: attrValue }` → fieldId → attr map
4. **fieldOverrides inşası:**
   - **`invoice-profile-id` her zaman açıkça yazılır** — ProfileID değeri (örn. `"ENERJI"`) `fieldOverrides`'ın başına eklenir. Otomatik enjeksiyon yok.
   - Required ve sample-only fieldId'lerin değerlerini ekle
   - Sample değer `invoiceGroupDefaults`'taki override ile aynıysa **atla** (`invoice-profile-id` istisnadır)
   - Sample yok + groupDefault yok + required → autoFieldDefault zaten dolduracak, override'a yazma
   - Çıkan map'i `fieldOverrides`'a yaz
5. **fieldAttrOverrides inşası (XML attribute'ları):**
   - Sample XML'de bir alanın `@schemeID="X"`, `@unitCode="Y"`, `@currencyID="Z"`, `@encodingCode="W"` gibi attribute'ları varsa fieldAttrOverrides'a yaz (config field default'undan farklıysa).
   - Konvansiyon: `<fieldId>: { <attrName>: <attrValue> }`. Bir alan birden fazla attribute taşıyabilir (örn. EmbeddedDocumentBinaryObject 4 attribute).
   - GIB Schematron kuralları schemeID değerlerini sıkı kontrol eder (`KUNYENO`, `INCOTERMS`, `PARTYTYPE`, `ESURaporID`, `ARACIKURUMVKN` vb.) → atribute'ları kaçırmak GIB uyumluluğunu kırar.
   - Detaylı kural: `conventions.md` §6.
5b. **Repeatable instance (array değer):**
   - Sample'da aynı tag birden fazla kez varsa (PartyIdentification × N, PartyLegalEntity × N gibi) → fieldOverrides ve fieldAttrOverrides array yazılabilir.
   - Örnek (ENERJI/SARJ customer 3 instance): `"customer-party-party-id": ["3333333888", "06GIB06", "452325"]` ve paralel `fieldAttrOverrides` array'i `[{schemeID:"VKN"}, {schemeID:"PLAKA"}, {schemeID:"ARACKIMLIKNO"}]`.
   - applyScenario array uzunluğunca instance üretir; her elemana `cac:PartyIdentification#i` path verir, fieldId'ye `--i` suffix ekler.
6. **`strictMode: true` ekle (zorunlu):** Generated senaryolar sample'ı birebir yansıtmalı. strictMode etkinken `applyScenario` yalnız explicit override edilmiş alanları yazar; sample'da olmayan ghost alanlar XML'e basılmaz. Sample'daki tüm değerleri eksiksiz override'a yazdığından emin ol — strictMode placeholder kurtarmaz.
7. **groupTitles:** varsayılan `null` (tüm gruplar). Profil/varyant tipiyle alakasız grupların hariç tutulması gerekirse kullanıcıya `AskUserQuestion` ile sor (genelde gerekmez). Sample'da hangi top-level XML elemanları varsa, onların gruplarını listele.
8. Senaryoyu `scenarios` dizisine `id`, `label`, `description`, `fieldOverrides`, `fieldAttrOverrides` (varsa), `strictMode: true`, `groupTitles` ile birlikte ekle. `label` insan-okur (örn. `"Enerji - Şarj (Haftalık)"`); `description` kısa, parantezsiz.

### B6. Onay ve yazma

1. **Özet** sun:
   - Eklenecek/güncellenecek senaryolar (her biri için `id`, label, override sayısı, kullanılan ProfileID)
   - Sample XML'i olan senaryolar / olmayan senaryolar
   - `unmappedPaths` sayısı (Schematron veya sample'da var ama config'de yok)
   - `skippedAsserts` sayısı (karmaşık test'ler / repeatable instance'lar / locked attribute'lar)
2. `AskUserQuestion` ile onay al:
   - "Bu senaryoları JSON'a yazayım mı?"
   - Mevcut farklı senaryolar varsa: "Sadece güncelle / Hepsini sıfırla" seçeneği
3. Onay → `scenarios.generated.json`'u tek seferde yaz:
   - `scenarios` dizisi
   - `_meta.generatedAt` (today's date)
   - `_meta.schematronFiles`, `_meta.sampleFiles`
   - `_meta.unmappedPaths`, `_meta.skippedAsserts`
4. `npx tsc --noEmit` çalıştır → hata varsa kullanıcıya göster ve düzelt.
5. **Bitiş mesajı:**
   > Üretildi: N senaryo. `npm run dev` → Senaryolar listesinde görebilirsin.
   > Eşleşmeyen path: M (raporda detaylı liste). `/alan-ekle` ile config'e ekleyebilirsin.

### B7. Edge case'ler

- **Aynı path'e birden fazla rule referansı:** birleşik kümede tut (set, dedupe).
- **Karmaşık predicate'li context:** `cac:X[cbc:ID='Y']` → şimdilik predicate'i atla, sade path al, raporla.
- **Schematron'da sadece warning seviyesi assert'ler:** `flag="warning"` veya `role="warning"` olanlar zorunluluk sayılmaz, atla.
- **Sample XML'de tekrarlı eleman:** ilk instance değerini al, ek instance'lar repeatable group olarak işlenmeli — şimdilik sadece ilk instance'ı kullan, kullanıcıya raporla.
- **Sample XML'de profile uyumsuz değer:** kullanıcıya uyar (örn. dosya adı TEMELFATURA ama içerik `<cbc:ProfileID>TICARIFATURA</cbc:ProfileID>`).
- **Skill iki kez aynı dosyalarla çalışırsa:** çıktı idempotent olmalı; sadece `_meta.generatedAt` değişir.
