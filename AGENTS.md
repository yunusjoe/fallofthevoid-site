# AGENTS.md - Fall of the Void Tanıtım Sitesi Kuralları

Bu dosya projenin değişmez kurallarıdır. Her görevden önce bu dosyayı oku ve kurallara uy. Çelişki olursa kullanıcıya sor, kendi başına karar verme.

## Proje
- Oyun: Fall of the Void (singleplayer ARPG, Diablo 4 tarzı)
- Domain: fallofthevoid.com
- Amaç: League of Legends tarzı oyun tanıtım sitesi
- Bölümler: Ana Sayfa (hero), Yama Notları, Karakterler, İletişim
- Tema: koyu, mor-void, sinematik

## Kullanıcı
- Kullanıcı Unity/C# geliştiricisidir, web tarafında yenidir.
- Türkçe, rahat ama ciddi bir dille konuş. Aşırı samimiyetten kaçın.
- Yaptığın her değişikliğin nedenini sebep-sonuç bağıyla açıkla.

## Teknik Kurallar
- Sadece saf HTML, CSS, JavaScript. Framework, npm, derleme aracı yok.
- Hosting GitHub Pages (statik).
- Hardcoded içerik yasak. Hiçbir metin, sayı, renk değeri veya link HTML/JS içine gömülmez.
  - İçerik: data/*.json dosyalarından okunur.
  - Renkler: CSS değişkenleri (:root) ile tek yerden yönetilir.
  - Sayısal ayarlar (örn. stat çubuğu maksimumu): data/site.json içinde tutulur.
- Çok dilli içerik { "tr": "...", "en": "..." } formatındadır.
  - Yeni bir arayüz metni eklenirse data/lang.json içine hem TR hem EN eklenir.
  - Yeni bir yama notu, karakter veya içerik eklenirse tüm dil alanları doldurulur.
  - Dil seçimi localStorage'da saklanır.
- JSON'dan gelen metin sayfaya basılırken innerHTML kullanılmaz, sadece textContent kullanılır.
- Yeni yama notu veya karakter eklemek sadece JSON'a yeni obje eklemekle yapılabilmelidir. HTML'e dokunmak gerekmemelidir.
- Mobil uyumlu (responsive) olmalıdır.
- Kod okunaklı olmalı, yorum satırları Türkçe olmalıdır.
- Var olmayan dosya, fonksiyon veya değişken adı uydurma. Emin değilsen önce mevcut dosyayı oku veya kullanıcıya sor.

## Klasör Yapısı
- index.html
- css/style.css
- js/main.js
- data/site.json
- data/lang.json
- data/patches.json
- data/characters.json

Bu yapıdan sapma. Yeni dosya gerekiyorsa önce gerekçesini söyle ve onay al.

## Çalışma Şekli
- Her şeyi tek seferde yapma. Aşama aşama ilerle.
- Her aşama sonunda ne yaptığını özetle ve kullanıcı "devam" demeden sonraki aşamaya geçme.
- Sadece değişen kısımları anlat. Bir dosyanın bir bölümü değişiyorsa tüm dosyayı yeniden yazmak yerine nerenin değiştiğini açıkça belirt.
- Önemli bir tasarım veya mimari karar gerekirse önce sor.
- Hata varsa susma, hatayı ve nedenini açıkla.

## Yasaklar
- Şifre, token veya API anahtarı isteme ya da yazma.
- GitHub'a yükleme yapma.
- DNS, domain veya e-posta ayarlarına dokunma. Bunlar kullanıcı tarafından elle yapılır.
- Proje klasörü dışına çıkma, bilgisayardaki başka dosyalara dokunma.
- Mevcut dosyaları kullanıcıya haber vermeden silme veya baştan yazma.

## Test
- index.html çift tıklanarak açılmaz, fetch ile JSON okuma file:// üzerinde engellenir.
- Yerel sunucu kullanılır (Live Server veya python -m http.server).
- Teslimden önce tarayıcı konsolunda hata olmadığını kontrol et.
