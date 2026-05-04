---
name: alan-ekle
description: XSD ve opsiyonel PDF dökümanlarından src/modules/<modül>/config.ts'e yeni FieldDefinition/FieldGroupConfig ekler. İlk kullanımda klasör yapısını ve dosya yerleşimini kullanıcıya adım adım rehberlik ederek kurar. UBL-TR gibi bilinen şemalar için domain-packs/ altındaki pattern paketlerini kullanır; bilinmeyen şemalar için saf XSD'den çalışır.
---

# alan-ekle

XSD (zorunlu) + PDF (opsiyonel) girdisinden `src/modules/<modül>/config.ts` dosyasına `FieldDefinition` ve `FieldGroupConfig` üretir. Önce öneri sunar, kullanıcı onaylayınca yazar, sonunda `npx tsc --noEmit` çalıştırır.

İki faz vardır:
- **Faz A — Bootstrap:** referans klasörleri/dosyaları yoksa kullanıcıyı yönlendirerek oluşturur.
- **Faz B — Ekleme:** XSD'yi parse edip alan üretir, glossary'yi günceller, config'i değiştirir, tip kontrolü yapar.

Ana referanslar:
- `conventions.md` — XSD→FieldType eşleme, naming, path, group seçimi (genel, domain-bağımsız)
- `domain-packs/<pack>.md` — bilinen şema aileleri (UBL-TR vb.) için factory imzaları ve glossary tohumları
- `domain-packs/README.md` — yeni pack nasıl eklenir

Tüm karar adımlarında: emin değilsen **kullanıcıya sor** (`AskUserQuestion`). Tahmin etme. Klasör/dosya oluşturma adımlarında her zaman onay al.

---

## Faz A — Bootstrap

Skill her çağrıldığında önce ortamı kontrol eder. Eksikleri sırayla tamamlar.

### A1. Hedef modülü belirle

1. `src/modules/index.ts`'i oku, `MODULES` kaydındaki modül anahtarlarını çıkar.
2. Kullanıcı argümanında modül belirtmişse onu kullan (ör. `/alan-ekle invoice ...`).
3. Tek modül varsa otomatik seç ve kullanıcıya bildir: "Tek modül mevcut: `invoice`. Onunla devam ediyorum."
4. Birden fazla varsa `AskUserQuestion` ile seçtir. Seçenekler: mevcut modüller + "yeni modül oluştur" (V2).
5. **Yeni modül seçilirse (V1'de):** kullanıcıya manuel oluşturma adımlarını sun ve dur:
   - `src/modules/<isim>/config.ts` iskeleti (rootTag + boş fieldGroups + collectFields)
   - `src/modules/index.ts`'e import ve kayıt
   - `src/pages/<Isim>Page.tsx` (mevcut `InvoicePage` örneğine göre)
   - Bunlar tamamlandıktan sonra `/alan-ekle`'yi tekrar çağırmasını iste.

### A2. `references/` klasör yapısı

Sırayla kontrol et ve eksikleri kullanıcı onayıyla oluştur. Her oluşturma için `AskUserQuestion` kullan, ne yapacağını net göster.

```
references/
  README.md                       — açıklama
  shared/
    glossary.json                 — modüller arası ortak terimler
  <modül>/
    xsd/                          — XSD dosyaları (kullanıcı dolduracak)
    pdf/                          — kılavuz PDF'leri (opsiyonel)
    glossary.json                 — modüle özgü terimler
```

Adımlar:

1. **`references/` yok mu?** → "Proje köküne `references/` oluşturayım mı? XSD/PDF/glossary için merkez klasör olacak." Onay → `mkdir -p references`.
2. **`references/<modül>/xsd/`** → "`references/<modül>/xsd/` oluşturup XSD dosyalarını oraya koymanı isteyeceğim." Onay → oluştur.
3. **`references/<modül>/pdf/`** → "Opsiyonel: kılavuz PDF'lerin için `references/<modül>/pdf/` oluşturayım mı? PDF yoksa label'ları sana sorarım." Onay → oluştur.
4. **`references/<modül>/glossary.json`** → "Boş glossary oluşturayım mı? Çevirilerimizi buraya biriktirip ileride tekrar sormam." Onay → `{}` yaz.
5. **`references/shared/glossary.json`** → "Modüller arası ortak terimler için `references/shared/glossary.json`?" Onay → `{}` yaz.
6. **Domain pack tohumu** → Eğer hedef modül adı/içeriği bir pack ile ilgili görünüyorsa (ör. invoice + UBL ortamı) "X pack'inin temel terim sözlüğüyle shared'ı tohumlayayım mı?" diye sor. Onay → pack içindeki tohumu yaz.
7. **`references/README.md`** → "Klasör yapısını açıklayan README yazayım mı?" Onay → kısa README yaz.

XSD klasörü boş kaldığında: kullanıcıya net bir bekleme mesajı ver. Örnek:

> `references/invoice/xsd/` hazır. UBL-TR Invoice XSD dosyalarını oraya kopyalayıp "hazır" dediğinde devam ederim. Dosya sayısı veya isimleri önemli değil; ben tarayıp uygunu seçerim.

Kullanıcı içeriği konuşmaya yapıştırırsa skill geçici dosyaya yazıp oradan parse eder.

### A3. .gitignore kontrolü

`.gitignore`'da `references/*/xsd/` ve `references/*/pdf/` pattern'leri yoksa kullanıcıya öner ve onayla ekle. Glossary dosyaları **commit edilir** (paylaşılan bilgi birikimi).

---

## Faz B — Ekleme akışı

Bootstrap tamamsa veya zaten kuruluysa.

### B1. Hedefi netleştir

Kullanıcının istediği XSD bölümü/eleman adı net mi?
- Net: "Delivery", "TaxTotal", "PaymentMeans" gibi.
- Belirsiz: `AskUserQuestion` ile XSD'deki üst seviye kompleks tipleri listele, seçtir.

### B2. Kaynakları tespit et

1. `references/<modül>/xsd/` içindeki XSD dosyalarını listele.
2. Tek dosyaysa onu kullan; birden fazlaysa kullanıcıya hangisini seçeceğini sor.
3. PDF için aynısı (opsiyonel).
4. XSD parse edilemiyorsa (bozuk/şifreli) hatayı raporla, alternatif iste.

### B3. Domain pack aktivasyonu

XSD'nin `targetNamespace` ve kullanılan namespace prefix'lerini oku.

`.claude/skills/alan-ekle/domain-packs/` altındaki tüm pack dosyalarını tara, tetikleyici eşleşmesine bak:
- `urn:oasis:names:specification:ubl:schema:xsd:*` → `ubl-tr.md`
- (gelecekte) HR-XML, başka standartlar → ilgili pack

Birden fazla pack tetiklenirse kullanıcıya hangisini kullanacağını sor.
Hiçbiri tetiklenmezse: saf XSD modunda devam et (factory tanıma yapma, hepsini düz field olarak işle; tekrar tespit edilirse yeni factory önerisi sun).

### B4. XSD'yi parse et

İlgili karmaşık tipi ve onun bütün alt elemanlarını çıkar:
- Eleman adı, namespace prefix
- `type` (xs:date, xs:decimal, custom complexType, vs.)
- `minOccurs`/`maxOccurs`
- `xs:restriction` ve `xs:enumeration` değerleri
- Zorunlu attribute'lar (currencyID, unitCode, schemeID, …)
- `xs:annotation` / `xs:documentation` (Türkçe label kaynağı olabilir)

Recursive: alt complex tip varsa onu da aç.

### B5. Mevcut alanları tara

Hedef modülün `config.ts`'ini oku. `fieldDefinitions` flat listesini topla. Çıkar:
- Var olan `fieldId`'ler (çakışma kontrolü için)
- Var olan path'ler (yinelenmemesi için)
- Var olan factory'lerin imzaları (yeniden kullanılabilir mi)

### B6. Yapı tanıma

Domain pack'teki imzalara karşı XSD'deki kompleks alt yapıları eşleştir:
- Tam eşleşme → ilgili factory'yi listele.
- Kısmi eşleşme veya yeni tekrar yapı → "yeni factory önerisi" listesine ekle.

### B7. Türkçe label çözümü

Her eleman için sırasıyla:

1. `references/<modül>/glossary.json`'da varsa kullan.
2. Yoksa `references/shared/glossary.json`'a bak.
3. PDF varsa parse et (`Read` tool, gerekirse `pages` parametresi). Kullanıcının kullandığı PDF büyükse ilgili sayfayı tahmin et veya kullanıcıdan iste.
4. Hala yoksa enum/select değerleri için kullanıcıya tek seferde toplu sor (`AskUserQuestion` ile birden çok soru).
5. Bulunan yeni terimleri uygun glossary'ye yaz:
   - UBL `cbc:`/`cac:` ortak terimleri (`cbc:ID`, `cbc:Name` gibi) → `references/shared/glossary.json`
   - Modüle özgü terimler → `references/<modül>/glossary.json`
   - Şüphede modül glossary'sini tercih et.

### B8. FieldType kararları

`conventions.md`'deki tabloya göre tip ata. Belirsizse kullanıcıya sor (özellikle `select` vs `text`, `duration-measure` tetikleyicisi).

### B9. Yerleşim kararı

Yeni grup mu, mevcut bir grubun alt grubu mu olacak? Kullanıcının ilk mesajında belirtilmediyse `AskUserQuestion`:
- Yeni üst seviye grup
- Mevcut bir grubun (X, Y, Z) altında alt grup

`fullWidth`, `wrap`, `defaultOpen` kararları için `conventions.md`'deki "Group config seçimi" bölümünü kullan.

### B10. Öneri özeti

Kullanıcıya tablo halinde göster:

```
Hedef: src/modules/invoice/config.ts
Yerleşim: <fieldGroups[5] altında yeni "Teslimat" grubu>

Eklenecek alanlar (12):
| fieldId               | label              | path                                       | type     |
|-----------------------|--------------------|--------------------------------------------|----------|
| delivery-id           | Sıra Numarası      | Invoice/cac:Delivery/cbc:ID                | text     |
| delivery-actual-date  | Fiili Teslim Tarihi| Invoice/cac:Delivery/cbc:ActualDeliveryDate| date     |
| ...                   |                    |                                            |          |

Kullanılacak factory'ler:
- makeAddressGroup (cac:DeliveryAddress için)
- makePartyGroup (cac:DeliveryParty için)

Yeni factory önerileri:
- (yok)

Glossary'ye eklenecek (8 yeni):
  references/invoice/glossary.json:
    "cac:Delivery": "Teslimat"
    "cbc:ActualDeliveryDate": "Fiili Teslim Tarihi"
  references/shared/glossary.json:
    (yok)
```

### B11. Onay

`AskUserQuestion`: "Uygula / Düzenle / İptal".
- **Düzenle** seçilirse: kullanıcı neyi değiştirmek istediğini söylesin (label, fieldId, yerleşim, factory kararı), tekrar B10'a dön.

### B12. Uygula

Sırayla:
1. Glossary dosyalarını güncelle (yeni anahtar/değerler).
2. `src/modules/<modül>/config.ts`'i `Edit` ile değiştir:
   - Gerekiyorsa yeni factory fonksiyonu ekle (modül-içi veya `_shared`).
   - Yeni `FieldGroupConfig` insert et.
3. Yeni factory `_shared`'a gidiyorsa `src/modules/_shared/factories.ts` oluştur veya güncelle. Var olan modül-içi factory'lerin oraya **taşınması** kararı kullanıcıya bırakılır (B10'da öneri olarak gösterilir).
4. `references/README.md` yoksa kısa bir tane yaz.

### B13. Doğrula

`npx tsc --noEmit` çalıştır. Hata varsa:
- Hatayı kullanıcıya raporla.
- Düzelt (yanlış import, eksik option, vs.) ve tekrar çalıştır.
- 2 başarısız denemeden sonra durup kullanıcıdan yardım iste.

### B14. Özet

```
✓ src/modules/invoice/config.ts: +12 alan, +1 grup ("Teslimat")
✓ references/invoice/glossary.json: +8 terim
✓ npx tsc --noEmit: temiz

Sonraki adımlar (öneri):
- npm run dev ile UI'da yeni grubu kontrol et
- XML önizlemesinde namespace'lerin doğru olduğunu doğrula
```

---

## Sınır durumları

- **fieldId çakışması:** prefix'i değiştir (`delivery-id` → `delivery2-id`) veya kullanıcıya sor.
- **Aynı path zaten var:** çakışan alanı listele, üzerine yazma; kullanıcıdan ne yapacağını iste.
- **PDF taranmış görüntü (OCR yok):** kullanıcıdan label iste.
- **XSD parse edilemiyor:** dosya adını ve hatayı göster, alternatif iste.
- **Domain pack çakışması:** birden fazla pack tetiklenirse kullanıcıya sor.
- **Belirsiz yapı:** tahmin etme, sor.
- **Mevcut factory'yi `_shared`'a taşıma:** kullanıcı reddederse modül-içi kopya yaz (geçici duplikasyon kabul).
- **`src/types.ts`'e yeni `FieldType` ekleme:** çok nadir gerekir; eklenmesi gerekiyorsa B10'da ayrı bir kalem olarak göster ve onay al, çünkü `FieldForm.tsx`'te de handler eklemek gerekebilir.
