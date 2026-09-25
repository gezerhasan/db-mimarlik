# DB Mimarlık — web sitesi

Statik site. Derleme adımı, bağımlılık kurulumu, build aracı yok. Klasörü
herhangi bir statik sunucuya (Netlify, Vercel, Cloudflare Pages, cPanel)
olduğu gibi atmak yeterli.

```bash
# yerelde çalıştırmak için
cd site && python3 -m http.server 8787
# → http://127.0.0.1:8787
```

> `file://` ile açmayın — tarayıcı `fetch`/canvas kaynaklarını engeller.

---

## Klasör yapısı

```
site/
├── index.html            tüm bölümlerin iskeleti (data-i18n anahtarlarıyla)
├── css/style.css         tasarım sistemi + tüm animasyon durumları
├── js/
│   ├── i18n.js           TR / EN / RU sözlük + Google yorumları
│   └── main.js           etkileşim katmanı (14 numaralı bölüm başlıkları var)
└── assets/
    ├── logo/             logo-light.png (koyu zemin), logo-dark.png
    ├── img/              proje görselleri, WebP
    └── frames/lg, /sm    hero sinematik sekansı (97 kare × 2 boyut)
```

---

## İçerik nasıl değiştirilir

**Metinlerin tamamı `js/i18n.js` içinde.** HTML'e dokunmanıza gerek yok.
Her metnin üç dilde karşılığı var; anahtarı bulup değeri değiştirin:

```js
'hero.l1' : 'Arsadan',          // tr bloğunda
'hero.l1' : 'From land',        // en bloğunda
'hero.l1' : 'От участка',       // ru bloğunda
```

**Yeni proje eklemek** iki adım:

1. `js/i18n.js` → üç dile de `p7.t`, `p7.loc`, `p7.type`, `p7.scope`,
   `p7.status`, `p7.d` anahtarlarını ekleyin.
2. `js/main.js` → en üstteki `PROJECTS` dizisine bir satır:

```js
{ k:'p7', cls:'', cover:'gorsel-adi', done:true, imgs:['gorsel-1','gorsel-2'] }
```

`cls` seçenekleri: boş = dikey kart (3:4), `card--wide` = geniş kart,
`card--pano` = tam genişlik. Görseller `assets/img/<ad>.webp` olarak durmalı.

**Google yorumları** `js/i18n.js` sonundaki `REVIEWS` dizisinde. `orig` alanı
yorumun yazıldığı dildeki hâli — her zaman aynen gösterilir; `tr`/`en`/`ru`
alanları ziyaretçinin dili farklıysa altında "çeviri" etiketiyle çıkar.

---

## Randevu formu — bağlanması gereken tek yer

Takvim, saat seçimi ve doğrulama tamamen çalışıyor. **Ancak form şu an
hiçbir yere gönderim yapmıyor.** Gönder'e basıldığında ziyaretçiye özet
gösteriliyor ve telefon + WhatsApp'a yönlendiriliyor — yani lead kaybolmuyor,
ama size otomatik bildirim de gelmiyor.

Bağlantı noktası: `js/main.js` → `booking()` içindeki `form.addEventListener('submit', …)`,
`goStep(4)` satırının hemen altında yorumla işaretli. Calendly'ye geçerken
oradaki `console.info` satırını bir `fetch(...)` ile değiştirmek yeterli.

Müsait saatler `SLOT_TIMES` dizisinde; dolu görünen saatler `isBusy()` ile
tarihten türetiliyor (aynı gün her zaman aynı görünür). Calendly bağlanınca
bu ikisi gerçek müsaitlikle değiştirilmeli.

---

## Sinematik kaydırma sahneleri (üç adet)

Arka plandaki kamera hareketleri video değil — **resim dizileri** canvas'a
çiziliyor ve kare indeksi scroll pozisyonuna bağlanıyor (Apple ürün
sayfalarındaki teknik). Video etiketi kullanılmamasının sebebi: kullanıcı
yukarı kaydırdığında hareket de geri sarıyor.

Üçü de tam ekran, sabitlenmiş (pinned) bölümler. Yazı her zaman animasyonun
**üzerinde** durur.

| Sahne | Kare | Kareler | Hareket |
|---|---|---|---|
| `#hero` | 65 | `frames/lg`, `frames/sm` | Havuzun üzerinden villaya doğru |
| `#interior` | 49 | `frames/int-lg`, `frames/int-sm` | Salonun içinden havuza doğru |
| `#services` | 49 | `frames/desk-lg`, `frames/desk-sm` | Tasarım masasına doğru |

Üçü de `js/main.js` → `scrubScenes()` içinde aynı `makeScrub()` motorunu
kullanıyor; kare sayısı, klasör ve pin mesafesi orada.

- Masaüstü `-lg`, mobil `-sm` setini çeker.
- Sahne **ilk 10 kare** iner inmez açılır; kalanı boşta yüklenir.
- Kare klasörü boşsa canvas hiç açılmaz, `scrub__fallback` görseli kalır —
  kareleri silseniz bile sayfa bozulmaz.
- `prefers-reduced-motion` açıksa veya tarayıcı "veri tasarrufu" bildiriyorsa
  canvas hiç kurulmaz, statik görseller kalır.

**Hizmetler sahnesi** (`scrub--right`) metni sağa alır, çünkü masadaki
nesneler solda duruyor. Yazı ayrıca buzlu cam panelin (`.scrub__panel`)
üzerinde — masa dokusu hareketli olduğu için düz metin okunmuyordu.

Sekans yenilemek: yeni klibi alıp

```bash
ffmpeg -i klip.mp4 -vf "select='not(mod(n\,3))'" -fps_mode passthrough out/f_%03d.png
# sonra PNG'leri WebP'ye çevirip ilgili frames/ klasörüne koyun
```

Kare sayısı değişirse `scrubScenes()` içindeki ilgili `count` güncellenmeli.

## Buzlu cam bölüm zeminleri

Hizmet kartları, Süreç, SSS ve İletişim bölümlerinin arkasında soluk,
hafif bulanık bir iç mekân render'ı duruyor; başlık bloğu da üzerinde
`backdrop-filter` ile buzlu cam paneli olarak okunuyor.

Zemini değiştirmek için `index.html` içinde o bölümün
`style="--secbg:url(assets/img/bg-living.webp)"` değerini değiştirin.
Yeni zemin görselini küçük (~1100px) ve hafif blur'lu kaydedin — zaten
neredeyse şeffaf duracak.

## Sayfa ağırlığı

| | Masaüstü | Mobil |
|---|---|---|
| **İlk boya** (HTML+CSS+JS + hero ilk 10 kare) | **~1.3 MB** | ~0.5 MB |
| Hero kareleri | 5.3 MB | 2.0 MB |
| İç mekân kareleri | 3.4 MB | 1.1 MB |
| Masa kareleri | 3.4 MB | 1.2 MB |
| Proje görselleri (`loading="lazy"`) | 3.8 MB | 3.8 MB |
| **Toplam** | **~16 MB** | **~9 MB** |

İlk boya 1.3 MB — sayfa hemen kullanılabilir hâle geliyor; kalan her şey
arka planda, tarayıcı boştayken iniyor. Yine de toplam hacim yüksek; üç
sinematik sahnenin bedeli bu.

**Hafifletmek isterseniz**, etkisi büyükten küçüğe:

1. Kare sayısını düşürün — `ffmpeg` komutundaki `mod(n\,3)` yerine
   `mod(n\,4)` veya `mod(n\,5)`, ardından `scrubScenes()` içindeki `count`.
   (65→49 kare ≈ %25 tasarruf, akıcılık farkı gözle zor seçilir.)
2. WebP kalitesini 58'den 48'e indirin (≈ %20).
3. İkincil sahneleri (iç mekân, masa) 1920px yerine 1500px üretin (≈ %30).
4. En radikali: bir sahneyi tamamen kaldırın — kare klasörünü silmeniz
   yeterli, sayfa statik görselle sorunsuz çalışmaya devam eder.

---

## Bilinmesi gerekenler

- **Ekip fotoğrafı yok.** Ekip bölümünde şu an harf monogramları var.
  Dilara ve Buse'nin gerçek portreleri konursa dönüşüme en çok katkı yapacak
  tek değişiklik bu olur (`.mem__mark` yerine `<img>`).
- **Instagram linki** `https://instagram.com` olarak duruyor; gerçek hesap
  adresiyle değiştirilmeli (`index.html` içinde iki yerde, bir de JSON-LD'de).
- **"3D'den Gerçeğe" bölümündeki ikinci karşılaştırmada** render'ın taş rengi
  uygulamadakinden açık. Metin bunu açıkça söylüyor; gizlenmiş değil.
- Google yorumları elle girilmiştir; yeni yorum geldikçe `REVIEWS` dizisine
  eklenmesi gerekir (otomatik çekilmiyor).
- Harita anahtarsız Google Maps embed'i kullanıyor — kota derdi yok.
