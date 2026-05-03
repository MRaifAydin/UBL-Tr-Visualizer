# UBL-TR Visualizer

E-belge alanlarının XML yapısını görsel olarak keşfetmek için geliştirilmiş bir öğrenme aracıdır.

## Amaç

Türkiye'de kullanılan UBL-TR standardına göre hazırlanan e-belgelerde (e-Fatura, e-İrsaliye vb.) her alanın XML çıktısında **nerede ve nasıl göründüğünü** anlamayı kolaylaştırmak. Forma bir değer girildiğinde sağ panelde gerçek zamanlı olarak XML ağacındaki karşılığı vurgulanır.

## Önemli Uyarı

> **Bu proje yalnızca öğrenme amaçlıdır.**
>
> İçerdiği alan tanımları ve XML yapısı hatalı veya eksik olabilir. Araçtan indirilen XML çıktısı gerçek bir e-belge olarak **kullanılamaz**, herhangi bir sisteme **gönderilemez**.

## Özellikler

- Form alanına değer girildiğinde XML ağacında ilgili node anında vurgulanır
- Bir alana tıklandığında XML paneli o node'a otomatik scroll yapar
- XML ağacındaki node'lar elle açılıp kapatılabilir
- Başlıktaki "Küçült" butonu ile XML ağacı ilk seviyeye indirgenebilir

## Kurulum

```bash
npm install
npm run dev
```

## Teknolojiler

- React
- Tailwind CSS
- Vite
