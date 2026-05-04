# references/

UBL-TR Visualizer'ın alan tanımlarını üretirken başvurduğu kaynak dökümanların ve terim sözlüklerinin tutulduğu klasör. `/alan-ekle` skill'i bu klasörü okur.

## Yapı

```
references/
  README.md                       — bu dosya
  shared/
    glossary.json                 — modüller arası ortak terim sözlüğü (commit edilir)
  <modül>/
    xsd/                          — XSD dosyaları (gitignore'lu)
    pdf/                          — kılavuz PDF'leri (gitignore'lu, opsiyonel)
    glossary.json                 — modüle özgü terim sözlüğü (commit edilir)
```

## Kurallar

- **XSD ve PDF dosyaları commit edilmez.** `.gitignore`'da `references/*/xsd/` ve `references/*/pdf/` desenleri var. Lisans/dağıtım kısıtları olabileceği için bunlar yerel kalır.
- **Glossary dosyaları commit edilir.** Skill her yeni alanı tekrar çevirmek zorunda kalmasın diye paylaşılan bilgi birikimidir.
- Anahtar formatı: `prefix:Eleman` (örn. `cbc:ID`, `cac:PostalAddress`).
- Modül-özgü bir terim önce modül glossary'sine yazılır; iki+ modülde tekrarlanırsa shared'a taşınır.

## Kullanım

`/alan-ekle` skill'i çağrıldığında:
1. Hedef modülün `xsd/` klasöründeki XSD'yi parse eder.
2. Türkçe label'ları önce modül glossary'sinden, sonra shared'dan, sonra PDF'ten, son çare kullanıcıdan çözer.
3. Bulduğu yeni terimleri uygun glossary dosyasına yazar.
