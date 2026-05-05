---
name: senaryo-ekle
description: GIB UBL-TR Schematron'larından ve örnek XML'lerden profil bazlı FillScenario senaryoları üretir, src/modules/<modül>/scenarios.generated.json dosyasına yazar. Argument verilirse tek profile odaklanır (örn. /senaryo-ekle TICARIFATURA), verilmezse references/<modül>/schematron/ ve references/<modül>/samples/ altındaki tüm dosyaları toplu tarar. İlk kullanımda klasör yapısını ve defaults.ts entegrasyonunu rehberlik ederek kurar.
---

# senaryo-ekle

Schematron (zorunluluk) + örnek XML (tipik değerler) girdisinden profil bazlı `FillScenario` üretir. Çıktı `src/modules/<modül>/scenarios.generated.json`'a yazılır; `defaults.ts` bu JSON'u runtime'da merge eder, `ScenarioListModal` otomatik listeler.

İki faz vardır:
- **Faz A — Bootstrap:** referans klasörleri/dosyaları/defaults.ts entegrasyonu yoksa kullanıcıyı yönlendirerek kurar.
- **Faz B — Üretim:** Schematron'ları parse eder, örnek XML'leri okur, profil bazlı senaryoları inşa eder, JSON'a yazar.

Ana referans:
- `conventions.md` — Schematron parse kuralları, ProfileID eşleme tablosu, path→fieldId rehberi, edge case'ler

Kurallar:
- Tüm karar adımlarında: emin değilsen **kullanıcıya sor** (`AskUserQuestion`). Tahmin etme.
- Klasör/dosya oluşturma adımlarında her zaman onay al.
- Mevcut `scenarios.generated.json`'u **silme**; varsayılan davranış: mevcut profilleri güncelle, yeni profil varsa ekle. Tümünü sıfırlama isteğini açıkça sor.
- Sample XML değeri `invoiceGroupDefaults`'taki değerle aynıysa `fieldOverrides`'a YAZMA (gereksiz tekrar) — defaults zincirine bırak.

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

1. **`src/modules/<modül>/scenarios.generated.json`** var mı? Yoksa `AskUserQuestion` ile onay alıp boş `{ "profiles": [], "_meta": { ... } }` yaz.
2. **`src/modules/<modül>/defaults.ts`** generated JSON'u import ediyor mu? Etmiyorsa kullanıcıya teklif et:
   - Import satırı: `import scenariosData from './scenarios.generated.json'`
   - `invoiceFillScenarios` dizisinin sonuna `...profileScenarios` spread'i
   - Spread için `GeneratedProfile` interface'i ve `profileScenarios` map'i (profileId → FillScenario)
   - ProfileID otomatik `fieldOverrides`'a eklenir (override edilemez kilitli alan)
3. Onay sonrası patch'i uygula. Mevcut entegrasyon varsa atla.

### A5. Schematron klasörü boşsa bekle

`references/<modül>/schematron/` boşsa kullanıcıya net mesaj ver:

> `references/<modül>/schematron/` hazır. Schematron .sch dosyalarını oraya kopyalayıp "hazır" dediğinde devam ederim. Profil bazlı örnek XML'leri varsa `references/<modül>/samples/` altına ProfileID adıyla (ör. `TEMELFATURA.xml`) koy.

`samples/` klasörü boş kalabilir; bu durumda profil değerleri `invoiceGroupDefaults` + `autoFieldDefault`'tan gelir, sadece ProfileID override yazılır.

---

## Faz B — Üretim akışı

Bootstrap tamamsa veya zaten kuruluysa.

### B1. Argüman ve hedef profil seti

1. Kullanıcı argüman verdiyse (`/senaryo-ekle TICARIFATURA` gibi) hedef set: tek ProfileID.
2. Argüman yoksa: tüm Schematron + sample dosyalarını tara, ProfileID'leri otomatik tespit et.
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

### B5. Profil senaryosu inşası

Her hedef profil için:

1. **Required fieldId set** = (profile-specific required paths ∪ commonRequiredPaths) → fieldId'ye eşle
2. **Sample değerleri** = sample XML'den gelen path → değer map'i → fieldId → değer
3. **fieldOverrides inşası:**
   - ProfileID otomatik eklenir (defaults.ts tarafında)
   - Required ve sample-only fieldId'lerin değerlerini ekle
   - Sample değer `invoiceGroupDefaults`'taki override ile aynıysa **atla**
   - Sample yok + groupDefault yok + required → autoFieldDefault zaten dolduracak, override'a yazma
   - Çıkan map'i `fieldOverrides`'a yaz
4. **groupTitles:** varsayılan `null` (tüm gruplar). Profil tipiyle alakasız grupların hariç tutulması gerekirse kullanıcıya `AskUserQuestion` ile sor (genelde gerekmez).
5. Profili `profiles` dizisine `profileId`, `label` (config.ts'deki ProfileID option'undan), `description` ile birlikte ekle.

### B6. Onay ve yazma

1. **Özet** sun:
   - Eklenecek/güncellenecek profiller (ProfileID + override sayısı)
   - Sample XML'i olan profiller / olmayan profiller
   - `unmappedPaths` sayısı (Schematron'da var ama config'de yok)
   - `skippedAsserts` sayısı (karmaşık test'ler)
2. `AskUserQuestion` ile onay al:
   - "Bu profilleri JSON'a yazayım mı?"
   - Mevcut farklı profiller varsa: "Sadece güncelle / Hepsini sıfırla" seçeneği
3. Onay → `scenarios.generated.json`'u tek seferde yaz:
   - `profiles` dizisi
   - `_meta.generatedAt` (today's date)
   - `_meta.schematronFiles`, `_meta.sampleFiles`
   - `_meta.unmappedPaths`, `_meta.skippedAsserts`
4. `npx tsc --noEmit` çalıştır → hata varsa kullanıcıya göster ve düzelt.
5. **Bitiş mesajı:**
   > Üretildi: N profil. `npm run dev` → Senaryolar listesinde görebilirsin.
   > Eşleşmeyen path: M (raporda detaylı liste). `/alan-ekle` ile config'e ekleyebilirsin.

### B7. Edge case'ler

- **Aynı path'e birden fazla rule referansı:** birleşik kümede tut (set, dedupe).
- **Karmaşık predicate'li context:** `cac:X[cbc:ID='Y']` → şimdilik predicate'i atla, sade path al, raporla.
- **Schematron'da sadece warning seviyesi assert'ler:** `flag="warning"` veya `role="warning"` olanlar zorunluluk sayılmaz, atla.
- **Sample XML'de tekrarlı eleman:** ilk instance değerini al, ek instance'lar repeatable group olarak işlenmeli — şimdilik sadece ilk instance'ı kullan, kullanıcıya raporla.
- **Sample XML'de profile uyumsuz değer:** kullanıcıya uyar (örn. dosya adı TEMELFATURA ama içerik `<cbc:ProfileID>TICARIFATURA</cbc:ProfileID>`).
- **Skill iki kez aynı dosyalarla çalışırsa:** çıktı idempotent olmalı; sadece `_meta.generatedAt` değişir.
