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
  main.tsx                          — Uygulama giriş noktası (StrictMode + DocumentProvider)
  App.tsx                           — Sidebar navigasyon + sayfa yönlendirme
  types.ts                          — Merkezi tip tanımları (Tree, FieldDefinition, ModuleConfig, vb.)
  vite-env.d.ts                     — Vite tip referansları (CSS importları, env vars)
  context/DocumentContext.tsx       — Global state (tree, activeFieldId, updateField, removeField)
  core/treeManager.ts               — XML ağaç yapısını yöneten saf fonksiyonlar (CRUD)
  core/xmlSerializer.ts             — Tree → XML string dönüşümü
  components/FieldForm.tsx          — Form bileşenleri (input, select, date/time picker, vb.)
  components/FieldGroup.tsx         — Accordion tarzı alan grubu bileşeni
  components/XMLNode.tsx            — XML ağacını recursive render eden bileşen
  pages/DocumentPageLayout.tsx      — İki kolonlu layout (form + XML önizleme)
  pages/InvoicePage.tsx             — Fatura sayfası wrapper'ı
  modules/index.ts                  — Modül kayıt noktası
  modules/invoice/config.ts         — Fatura alan tanımları ve grupları
```

## Mimari

- **Modül sistemi:** Her belge tipi (fatura, irsaliye vb.) `src/modules/` altında kendi config dosyasına sahiptir. Config dosyası `rootTag`, `fieldGroups` ve `fieldDefinitions` export eder.
- **State yönetimi:** `DocumentContext` tüm belge tiplerinin state'ini tutar. Her modülün bağımsız `tree` ve `activeFieldId` state'i vardır.
- **Tree yapısı:** Yaprak node'lar `tag__fieldId` anahtarıyla, ara node'lar tag adıyla saklanır. `_order` alanı sıralama sağlar.
- **Veri akışı:** Config → FieldForm (render) → updateField (context) → tree güncelleme → XMLNode (görselleştirme)
- **Tipler:** Tüm domain tipleri `src/types.ts`'te merkezi tutulur. Yeni alan tipleri eklerken önce burayı güncelle.

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
