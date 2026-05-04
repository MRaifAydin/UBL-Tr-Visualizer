# Domain Packs

Bu klasör belirli XML standartlarına özgü pattern'leri tutar. Skill ekleme akışında XSD'nin namespace'lerine bakar; eşleşen pack varsa o pack'in factory imzalarını ve glossary tohumunu kullanır.

Pack'ler **opsiyoneldir.** Pack tetiklenmezse skill saf XSD'den çalışır (tüm elemanları düz field olarak işler, tekrar tespit edince yeni factory önerir).

## Mevcut pack'ler

- [ubl-tr.md](./ubl-tr.md) — UBL-TR (Türkiye e-belge) — fatura, irsaliye, müstahsil makbuzu, e-arşiv

## Yeni pack ekleme

Yeni bir XML standardı (örn. HR-XML, ISO 20022, kurum-içi şema) destekleneceğinde:

1. Bu klasöre `<pack-adı>.md` dosyası ekle.
2. Aşağıdaki yapıyı doldur:

### Pack şablonu

```markdown
# Domain Pack: <Pack Adı>

<Bir cümlelik açıklama: hangi standardı/aileyi kapsar.>

## Tetikleyici

- targetNamespace pattern(ler)i
- Veya yaygın prefix kullanımı (örn. `xx:` prefix'i)
- Veya XSD'de tanınabilir başka bir imza

## Bilinen factory'ler

Her factory için:

### `makeXGroup(prefix: string, basePath: string[]): FieldGroupConfig`

**Tetikleyici imza:** XSD'de hangi kompozit yapı bu factory'i çağırır (eleman adı + alt elemanların imzası).

**Üretir:** Hangi alt grup/alanları üretir.

**Örnek çağrı:**
\`\`\`ts
makeXGroup('prefix', ['Root', 'xx:Parent', 'xx:Element'])
\`\`\`

## Always-disabled alanlar

Standardın konvansiyonu gereği kullanıcı tarafından girilmemesi gereken elemanlar.

## Sabit option setleri

Standartta tekrar eden enum'lar (skill PDF'e gitmeden bunları kullanabilir).

## Glossary tohumu (opsiyonel)

Standardın temel terimleri için JSON sözlük. Bootstrap'ta kullanıcıya tohumlama seçeneği sunulur.
```

3. Bu README'nin "Mevcut pack'ler" listesine ekle.

## Pack tetikleme kuralı

Skill ekleme akışında (B3) tüm pack dosyalarını tarar, "Tetikleyici" bölümüne göre eşleşme arar.

- **Hiç eşleşme yok:** saf XSD modu (factory tanıma yok, tekrar görülürse yeni factory önerir).
- **Bir eşleşme:** o pack aktif.
- **Birden fazla eşleşme:** kullanıcıya hangisini kullanacağını sor.

## Pack içeriğindeki factory'ler nerede yaşar?

Pack dosyası **dökümandır** — factory'lerin imzasını ve davranışını anlatır, çağıran kod değildir. Asıl factory implementasyonları `src/modules/` altında yaşar:

- Tek modülde kullanılıyorsa: o modülün `config.ts`'inde local
- Birden fazla modülde kullanılıyorsa: `src/modules/_shared/factories.ts`

Skill yeni bir factory'ye ihtiyaç duyduğunda kullanıcıya konum sorar.

## Pack glossary'si

Tohum sözlük `references/shared/glossary.json`'a bootstrap'ta yazılır (kullanıcı onayıyla). Sonradan büyütmek için pack dosyasını manuel güncellemek yeterli; skill bir sonraki bootstrap çağrısında "yeni terimleri shared'a aktarayım mı?" diye sorabilir.
