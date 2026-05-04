# UBL-TR Visualizer

UBL-TR standardına uygun e-belge XML yapısını görselleştiren bir React uygulaması. Sadece eğitim/öğrenme amaçlıdır.

## Komutlar

- `npm install` — bağımlılıkları yükle
- `npm run dev` — geliştirme sunucusunu başlat
- `npm run build` — production build al
- `npm run preview` — build'i önizle

## Teknolojiler

- React 18, Vite 5, Tailwind CSS 3, PostCSS
- Test altyapısı yok

## Proje Yapısı

```
src/
  main.jsx                          — Uygulama giriş noktası (StrictMode + DocumentProvider)
  App.jsx                           — Sidebar navigasyon + sayfa yönlendirme
  context/DocumentContext.jsx       — Global state (tree, activeFieldId, updateField, removeField)
  core/treeManager.js               — XML ağaç yapısını yöneten saf fonksiyonlar (CRUD)
  core/xmlSerializer.js             — Tree → XML string dönüşümü
  components/FieldForm.jsx          — Form bileşenleri (input, select, date/time picker, vb.)
  components/FieldGroup.jsx         — Accordion tarzı alan grubu bileşeni
  components/XMLNode.jsx            — XML ağacını recursive render eden bileşen
  pages/DocumentPageLayout.jsx      — İki kolonlu layout (form + XML önizleme)
  pages/InvoicePage.jsx             — Fatura sayfası wrapper'ı
  modules/index.js                  — Modül kayıt noktası
  modules/invoice/config.js         — Fatura alan tanımları ve grupları
```

## Mimari

- **Modül sistemi:** Her belge tipi (fatura, irsaliye vb.) `src/modules/` altında kendi config dosyasına sahiptir. Config dosyası `rootTag`, `fieldGroups` ve `fieldDefinitions` export eder.
- **State yönetimi:** `DocumentContext` tüm belge tiplerinin state'ini tutar. Her modülün bağımsız `tree` ve `activeFieldId` state'i vardır.
- **Tree yapısı:** Yaprak node'lar `tag__fieldId` anahtarıyla, ara node'lar tag adıyla saklanır. `_order` alanı sıralama sağlar.
- **Veri akışı:** Config → FieldForm (render) → updateField (context) → tree güncelleme → XMLNode (görselleştirme)

## Kod Stili

- Fonksiyonel React component'leri, `export default function` pattern'i
- Stillendirme tamamen Tailwind CSS utility class'ları ile (inline CSS kullanma)
- Dosya uzantıları: component'ler `.jsx`, saf JS dosyaları `.js`
- Import'larda dosya uzantısı belirtilir (`.jsx`, `.js`)
- Türkçe UI metinleri ve yorumlar

## Kurallar

- Commit mesajları Türkçe yazılmalıdır
- Paket yöneticisi olarak sadece `npm` kullan
- Yeni belge tipi eklerken `src/modules/` altında klasör oluştur ve `modules/index.js`'e kaydet
