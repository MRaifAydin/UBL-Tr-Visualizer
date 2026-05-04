# Domain Pack: UBL-TR

UBL-TR (Türkiye e-belge) ailesi için pattern paketi. Faktur, irsaliye, müstahsil makbuzu, e-arşiv vs. bu pack'i tetikler.

## Tetikleyici

XSD'nin `targetNamespace` veya import edilen namespace'lerinden herhangi biri:

- `urn:oasis:names:specification:ubl:schema:xsd:*`
- `urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2` (cbc:)
- `urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2` (cac:)

veya XSD içinde `cbc:` / `cac:` prefix'lerinin yaygın kullanımı.

## Bilinen factory'ler

Bu factory'ler şu an [src/modules/invoice/config.ts](../../../../src/modules/invoice/config.ts) içinde local olarak tanımlı. İkinci bir modül aynı factory'i kullanmaya başladığında skill `src/modules/_shared/factories.ts`'a taşımayı önerir.

### `makeAddressGroup(prefix: string, pathBase: string[]): FieldGroupConfig`

**Tetikleyici imza:** `cac:PostalAddress` veya `cac:Address` veya `cac:DeliveryAddress` veya `cac:RegistrationAddress` — UBL-TR Address tipi (içinde `cbc:ID`, `cbc:StreetName`, `cbc:CityName`, `cac:Country`, vb.).

**Üretir:** "Adres" alt grubu. İçinde:
- Sabit Tanımlama Numarası, Posta Kutusu, İç Kapı No, Cadde-Sokak, Blok, Bina, Dış Kapı No, İlçe-Semt, İl, Posta Kodu, Kasaba-Köy, Mahalle
- Alt grup "Ülke": IdentificationCode, Name

**Örnek çağrı:**
```ts
makeAddressGroup('delivery-addr', ['Invoice', 'cac:Delivery', 'cac:DeliveryAddress'])
```

### `makePartyGroup(title: string, prefix: string, pathBase: string[]): FieldGroupConfig`

**Tetikleyici imza:** `cac:*Party` (örn. `cac:SignatoryParty`, `cac:BuyerCustomerParty`, `cac:SellerSupplierParty`, `cac:DeliveryParty`, `cac:OriginatorCustomerParty`, `cac:AgentParty`) içinde `cac:Party` complex tipi (içinde `cbc:WebsiteURI`, `cac:PartyIdentification`, `cac:PartyName`, `cac:PostalAddress`, `cac:PartyTaxScheme`, `cac:Contact`, `cac:Person`).

**Üretir:** Party hiyerarşisi — items array'iyle:
- Web Sitesi, EndpointID (disabled), Faaliyet Kodu, Kimlik Bilgisi (TCKN/VKN), Kurum İsmi
- Adres alt grubu (`makeAddressGroup` çağrısı)
- Depo Bilgisi (PhysicalLocation)
- Vergi Dairesi (PartyTaxScheme + TaxScheme)
- Diğer Kayıtlı Olduğu Yerler (disabled)
- İletişim (Contact + OtherCommunication)
- Şahıs (Person + FinancialAccount + bank hiyerarşisi)
- Şube (AgentParty — kendisini recursive çağırır, makePartyItems)

**Örnek çağrı:**
```ts
makePartyGroup('Düzenleyen', 'order-issuer', ['Invoice', 'cac:OrderReference', 'cac:DocumentReference', 'cac:IssuerParty'])
```

### `makeDocumentReferenceGroup(title: string, prefix: string, pathBase: string[]): FieldGroupConfig`

**Tetikleyici imza:** `cac:*DocumentReference` (örn. `cac:OrderDocumentReference`, `cac:DespatchDocumentReference`, `cac:ReceiptDocumentReference`, `cac:OriginatorDocumentReference`, `cac:ContractDocumentReference`, `cac:AdditionalDocumentReference`) — içinde `cbc:ID`, `cbc:IssueDate`, `cbc:DocumentTypeCode`, `cbc:DocumentType`, `cbc:DocumentDescription`, `cac:Attachment`, `cac:ValidityPeriod`, `cac:IssuerParty`.

**Üretir:** "Döküman Referansı" tarzı grup:
- Sıra Numarası, Düzenleme Tarihi, Uygulama Yanıtı (disabled), Belge Tipi, Açıklama, Ek
- Geçerlilik Dönemi alt grubu (StartDate/Time, EndDate/Time, DurationMeasure, Description)
- Düzenleyen alt grubu (`makePartyGroup` çağrısı)

**Örnek çağrı:**
```ts
makeDocumentReferenceGroup('İlişkili Fatura', 'billing-inv', ['Invoice', 'cac:BillingReference', 'cac:InvoiceDocumentReference'])
```

### `makeAllowanceChargeGroup(prefix: string, pathBase: string[]): FieldGroupConfig`

**Tetikleyici imza:** `cac:AllowanceCharge` — içinde `cbc:ChargeIndicator`, `cbc:AllowanceChargeReason`, `cbc:MultiplierFactorNumeric`, `cbc:SequenceNumeric`, `cbc:Amount`, `cbc:BaseAmount`, `cbc:PerUnitAmount`.

**Üretir:** "Iskonto-Artırım" grubu:
- Yön (select: +/-), Nedeni, Oranı, Sıra Numarası, Tutarı, Matrah, Adet

**Örnek çağrı:**
```ts
makeAllowanceChargeGroup('billing-line-ac', ['Invoice', 'cac:BillingReference', 'cac:BillingReferenceLine', 'cac:AllowanceCharge'])
```

## Always-disabled alanlar (UBL-TR konvansiyonu)

Bu alanlar e-fatura sistemleri tarafından otomatik doldurulur, kullanıcı girmez:

- `cbc:DocumentTypeCode` — uygulama yanıtı tipi
- `cbc:EndpointID` — taraf endpoint'i (VKN/TCKN'den türetilir)
- `cbc:TaxTypeCode` — vergi tipi kodu (TaxScheme içinde)
- `cac:IdentityDocumentReference` — kimlik dökümanı referansı (genellikle iç kullanım)
- `cac:Attachment` — ekler (UI'dan değil ayrı yüklenir)
- "Diğer Kayıtlı Olduğu Yerler" — Party.AgentParty hariç ek kayıt referansları

Skill bu elemanlardan birine denk geldiğinde otomatik `disabled: true` ekler. Domain pack tetikli değilse bu kural uygulanmaz.

## Sabit option setleri

UBL-TR'de tekrar eden enum'lar — skill PDF'e gitmeden bunları kullanabilir:

### Para birimleri
```ts
const CURRENCY_OPTIONS = [
  { value: 'TRY', label: 'Türk Lirası' },
  { value: 'USD', label: 'Dolar' },
  { value: 'EUR', label: 'Euro' },
]
```
`currencyID` attrKey kullanan tüm `cbc:Amount` ve türevlerinde.

### Süre birimleri
```ts
const DURATION_MEASURE_OPTIONS = [
  { value: 'ANN', label: 'Yıl' },
  { value: 'MON', label: 'Ay' },
  { value: 'DAY', label: 'Gün' },
  { value: 'HUR', label: 'Saat' },
]
```
`cbc:DurationMeasure` alanlarında.

### Kimlik şemaları
```ts
const PARTY_ID_SCHEME_OPTIONS = [
  { value: 'TCKN', label: 'Kimlik Numarası' },
  { value: 'VKN',  label: 'Vergi Numarası' },
]
```
`cac:PartyIdentification` `schemeID` için.

### Iskonto/Artırım yönü
```ts
const CHARGE_INDICATOR_OPTIONS = [
  { value: '+', label: 'Artı' },
  { value: '-', label: 'Eksi' },
]
```
`cbc:ChargeIndicator` için.

Bu listeler `invoice/config.ts`'te zaten mevcut; skill yeni modülde aynı XSD imzasıyla karşılaşırsa aynı seti kullanır.

## Glossary tohumu (opsiyonel)

`references/shared/glossary.json`'a basabileceği temel UBL-TR terimleri (skill bootstrap'ta sorar):

```json
{
  "cbc:ID": "Sıra Numarası",
  "cbc:UUID": "Ettn",
  "cbc:Name": "Ad",
  "cbc:Description": "Açıklama",
  "cbc:Note": "Not",
  "cbc:IssueDate": "Düzenleme Tarihi",
  "cbc:IssueTime": "Düzenleme Saati",
  "cbc:StartDate": "Başlangıç Tarihi",
  "cbc:StartTime": "Başlangıç Saati",
  "cbc:EndDate": "Bitiş Tarihi",
  "cbc:EndTime": "Bitiş Saati",
  "cbc:Amount": "Tutar",
  "cbc:BaseAmount": "Matrah",
  "cbc:DocumentCurrencyCode": "Belge Para Birimi",
  "cbc:DocumentTypeCode": "Uygulama Yanıtı",
  "cbc:DocumentType": "Belge Tipi",
  "cbc:DocumentDescription": "Açıklama",
  "cbc:DurationMeasure": "Dönem Süresi",
  "cbc:LineCountNumeric": "Kalem Sayısı",
  "cbc:AccountingCost": "Hesap Kodu",
  "cbc:WebsiteURI": "Web Sitesi",
  "cbc:EndpointID": "EndpointID",
  "cbc:IndustryClassificationCode": "Faaliyet Kodu",
  "cbc:Telephone": "Telefon Numarası",
  "cbc:Telefax": "Fax Numarası",
  "cbc:ElectronicMail": "E-Posta Adresi",
  "cbc:FirstName": "Ad",
  "cbc:FamilyName": "Soyad",
  "cbc:Title": "Ünvan",
  "cbc:MiddleName": "Diğer Adı",
  "cbc:NameSuffix": "Ad Ön Eki",
  "cbc:NationalityID": "Milliyeti",
  "cbc:Postbox": "Posta Kutusu",
  "cbc:Room": "İç Kapı No",
  "cbc:StreetName": "Cadde-Sokak Adı",
  "cbc:BlockName": "Blok Adı",
  "cbc:BuildingName": "Bina",
  "cbc:BuildingNumber": "Dış Kapı No",
  "cbc:CitySubdivisionName": "İlçe-Semt Adı",
  "cbc:CityName": "İl Adı",
  "cbc:PostalZone": "Posta Kodu",
  "cbc:Region": "Kasaba-Köy Adı",
  "cbc:District": "Mahalle Adı",
  "cbc:IdentificationCode": "Ülke Kodu",
  "cbc:CompanyID": "Yabancı Ülke Kurumu Vergi Kayıt Kodu",
  "cbc:RegistrationName": "Yabancı Ülke Kurumu Ünvanı",
  "cbc:CurrencyCode": "Para Birimi",
  "cbc:PaymentNote": "Not",
  "cbc:ChannelCode": "İletişim Numarası Kodu",
  "cbc:Channel": "İletişim Kanal Adı",
  "cbc:Value": "Değer",
  "cbc:ChargeIndicator": "Yön",
  "cbc:AllowanceChargeReason": "Nedeni",
  "cbc:MultiplierFactorNumeric": "Oranı",
  "cbc:SequenceNumeric": "Sıra Numarası",
  "cbc:PerUnitAmount": "Adet",
  "cac:Country": "Ülke",
  "cac:PostalAddress": "Posta Adresi",
  "cac:PhysicalLocation": "Depo Bilgisi",
  "cac:PartyTaxScheme": "Vergi Dairesi",
  "cac:TaxScheme": "Vergi Şeması",
  "cac:Contact": "İletişim",
  "cac:OtherCommunication": "Diğer Bilgiler",
  "cac:Person": "Şahıs",
  "cac:FinancialAccount": "Hesap Bilgileri",
  "cac:FinancialInstitutionBranch": "Banka-Şube Bilgileri",
  "cac:FinancialInstitution": "Banka Bilgileri",
  "cac:AgentParty": "Şube",
  "cac:ValidityPeriod": "Geçerlilik Dönemi",
  "cac:Attachment": "Ek",
  "cac:Signature": "Mali Mühür-İmza",
  "cac:DigitalSignatureAttachment": "Dijital İmza",
  "cac:ExternalReference": "Dış Referans Eki"
}
```

Bu tohum domain'in en yaygın terimlerini içerir; skill her yeni alanı PDF'ten yeniden çevirmek zorunda kalmaz.

## Always-required (zorunlu) işaretleyiciler

UBL-TR'de bazı elemanlar XSD seviyesinde optional olsa da Türkiye senaryoları gereği zorunludur (`cbc:ProfileID`, `cbc:ID`, `cbc:UUID`, `cbc:IssueDate`, vb.). Bu mevcut tip sisteminde explicit bir alan değil — gerekirse ileride `required: boolean` eklenebilir; şu an skill bunu sadece bilgi notu olarak öneri özetinde gösterir.
