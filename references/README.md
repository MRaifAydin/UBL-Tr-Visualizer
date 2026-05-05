# references/

UBL-TR Visualizer'ın alan tanımlarını ve doldurma senaryolarını üretirken başvurduğu kaynak dökümanların ve terim sözlüklerinin tutulduğu klasör. `/alan-ekle` ve `/senaryo-ekle` skill'leri bu klasörü okur.

## Yapı

```
references/
  README.md                       — bu dosya
  shared/
    glossary.json                 — modüller arası ortak terim sözlüğü (commit edilir)
  <modül>/
    xsd/                          — XSD dosyaları (gitignore'lu)
    pdf/                          — kılavuz PDF'leri (gitignore'lu, opsiyonel)
    schematron/                   — Schematron (.sch) dosyaları (gitignore'lu)
    samples/                      — Profil bazlı örnek XML belgeler (gitignore'lu)
    glossary.json                 — modüle özgü terim sözlüğü (commit edilir)
```

## Kurallar

- **XSD, PDF, Schematron ve örnek XML dosyaları commit edilmez.** `.gitignore`'da ilgili pattern'ler var. Lisans/dağıtım/mahremiyet kısıtları olabileceği için bunlar yerel kalır.
- **Glossary dosyaları commit edilir.** Skill her yeni alanı tekrar çevirmek zorunda kalmasın diye paylaşılan bilgi birikimidir.
- Anahtar formatı: `prefix:Eleman` (örn. `cbc:ID`, `cac:PostalAddress`).
- Modül-özgü bir terim önce modül glossary'sine yazılır; iki+ modülde tekrarlanırsa shared'a taşınır.
- **Sample XML adlandırma:** `samples/` altındaki dosyalar profil adıyla adlandırılır (`TEMELFATURA.xml`, `TICARIFATURA.xml`, `IHRACAT.xml`). Skill dosya adından veya içerikteki `<cbc:ProfileID>`'den profili tespit eder.

## Kullanım

### `/alan-ekle`
1. Hedef modülün `xsd/` klasöründeki XSD'yi parse eder.
2. Türkçe label'ları önce modül glossary'sinden, sonra shared'dan, sonra PDF'ten, son çare kullanıcıdan çözer.
3. Bulduğu yeni terimleri uygun glossary dosyasına yazar.

### `/senaryo-ekle`
1. `schematron/` altındaki .sch dosyalarından profil bazlı zorunlu alanları çıkarır.
2. `samples/` altındaki örnek XML'lerden o profile özgü tipik değerleri okur.
3. Profilleri `src/modules/<modül>/scenarios.generated.json`'a yazar; `defaults.ts` bunu `invoiceFillScenarios`'a merge eder.
