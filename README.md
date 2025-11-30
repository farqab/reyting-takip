# Reyting Takip

Bu proje, günlük dizi reytinglerini otomatik olarak takip eden ve gösteren bir React Native uygulamasıdır.

## Veri Otomasyonu

Uygulama, verilerini GitHub üzerinden otomatik olarak güncellenen bir JSON dosyasından çeker.

### Nasıl Çalışır?

1.  **Veri Kaynağı**: `scripts/update_ratings.js` scripti, Puppeteer kullanarak `ranini.tv` adresinden günlük reyting verilerini çeker.
2.  **Otomasyon**: `.github/workflows/daily_update.yml` dosyası, her gün saat 11:00'de (TRT) bu scripti çalıştırır.
3.  **Veri Kaydı**: Güncellenen veriler `data/ratings.json` dosyasına kaydedilir ve repository'ye push edilir.
4.  **Uygulama**: Uygulama açıldığında `https://raw.githubusercontent.com/farqab/reyting-takip/main/data/ratings.json` adresinden en güncel veriyi çeker.

## Kurulum ve Çalıştırma

### Gerekli Paketler

```bash
npm install
```

### Manuel Veri Güncelleme

Verileri manuel olarak güncellemek isterseniz:

```bash
node scripts/update_ratings.js
```

### Uygulamayı Çalıştırma

```bash
npx expo start
```

## Notlar

- GitHub Actions'ın çalışabilmesi için repository'nin GitHub'a push edilmiş olması gerekir.
- `services/mockData.ts` dosyasındaki `DATA_URL` değişkeninin doğru repository adresini gösterdiğinden emin olun.
