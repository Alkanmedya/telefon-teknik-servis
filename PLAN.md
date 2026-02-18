# Telefon Teknik Servis Yönetim Sistemi - Proje Planı

## 1. Proje Özeti
Telefon tamiri yapan teknik servisler için; müşteri takibi, cihaz durumu izleme ve iş akışı yönetimini kolaylaştıran modern bir web uygulaması.

## 2. Temel Özellikler (MVP - İlk Sürüm)

### A. Dashboard (Gösterge Paneli)
- Günlük özet (Alınan cihazlar, tamamlananlar, bekleyenler).
- Hızlı işlem butonları (Yeni Kayıt, Durum Sorgula).
- Gelir/Gider mini raporu.
  
### B. Cihaz Kabul & Müşteri Yönetimi
- **Müşteri Kaydı:** Ad, Soyad, Telefon (Zorunlu).
- **Cihaz Bilgileri:** Marka, Model, IMEI (Opsiyonel), Seri No.
- **Arıza Tespiti:** Müşterinin şikayeti, teknisyenin notları.
- **Şifre/Desen:** Desen kilidi çizimi veya pin kodu alanı.

### C. Servis İşlemleri
- **Durum Takibi:** 
  - `Bekliyor` (Sıraya Alındı)
  - `İnceleniyor` (Arıza Tespiti Yapılıyor)
  - `Parça Bekleniyor`
  - `Tamamlandı` (Teslim Alınabilir)
  - `Teslim Edildi`
  - `İade` (Tamir Edilemedi)
- **Teknisyen Notları:** Yapılan işlemler, değişen parçalar.
- **Fiyatlandırma:** Parça maliyeti + İşçilik = Toplam Tutar.

### D. Müşteri Bilgilendirme (Opsiyonel/Sonraki Faz)
- WhatsApp/SMS entegrasyonu için altyapı.
- Müşteriye özel sorgulama linki (QR Kodlu fiş çıktısı tasarımı).

## 3. Teknik Altyapı
- **Framework:** Next.js 14+ (App Router)
- **Dil:** TypeScript
- **Stil:** Tailwind CSS
- **İkonlar:** Lucide React
- **Veri Saklama (Başlangıç):** LocalStorage (Tarayıcı hafızası) - *Daha sonra veritabanına bağlanacak.*
- **UI Kit:** Özel tasarım bileşenleri (Shadcn UI benzeri yaklaşım).

## 4. Tasarım Dili
- **Tema:** "Tech Blue" - Koyu Lacivert & Neon Mavi tonları (Profesyonel ve teknik görünüm).
- **Kullanıcı Deneyimi:** Hızlı veri girişi odaklı, mouse kullanımını minimuma indiren klavye dostu arayüz.
