# Mental Math Trainer

![Mental Math Trainer icon](assets/icon.png)

Mental Math Trainer, zihinsel matematiği kısa, ölçülebilir ve tekrar oynanabilir antrenmanlara dönüştüren Expo + React Native tabanlı bir mobil uygulamadır. Uygulama sadece doğru cevabı değil; hız, isabet, seri yakalama, ritim, seviye ilerlemesi ve uzun vadeli alışkanlık metriklerini birlikte değerlendirir.

Projenin hedefi basit bir dört işlem oyununun ötesine geçmek: kullanıcıya her oturumdan sonra ne kadar geliştiğini göstermek, güçlü ve zayıf alanlarını takip etmek, premium tema/ödül ekonomisiyle motivasyonu artırmak ve gelişmiş Neuro Fusion modu ile matematiği ritim, hafıza ve puzzle baskısıyla birleştirmek.

## Öne Çıkan Özellikler

- **Çoklu oyun modları:** Daily, Sprint, Zen, Survival, Custom Training ve Neuro Fusion.
- **Akıllı soru üretimi:** Toplama, çıkarma, çarpma ve bölme soruları seviye/difficulty değerine göre deterministik seed ile üretilir.
- **Skor ve combo sistemi:** Doğru cevap, cevap süresi, zorluk seviyesi ve combo çarpanı birlikte puana yansır.
- **XP, seviye ve seri takibi:** Oyuncu ilerlemesi, günlük tamamlama, en iyi skor, en iyi combo ve son oturum geçmişi saklanır.
- **Performans analizleri:** Mod ve işlem türü bazında doğruluk, ortalama cevap süresi, toplam oturum ve en iyi skor metrikleri.
- **Neuro Fusion:** Ritim matematiği, puzzle, hafıza ve refleks fazlarını tek koşuda birleştiren gelişmiş antrenman modu.
- **Neuro Pass:** Sezon, görev, ödül, premium track, tier skip, coin ve track fragment ekonomisi.
- **Tema sistemi:** Free, premium, seasonal, limited ve collab kategorileriyle kilit açma kurallarına bağlı 20 temalık yapı.
- **Premium akışı:** Custom training, advanced insights, sınırsız pratik, tema vitrinleri ve rewarded bonus XP gibi monetization yüzeyleri.
- **TR/EN lokalizasyon:** Uygulama metinleri Türkçe ve İngilizce kaynaklardan yönetilir.
- **Test edilebilir domain katmanı:** Skorlama, soru üretimi, difficulty, brain score, Neuro Fusion ve Neuro Pass ekonomisi için Jest testleri bulunur.

## Oyun Modları

| Mod             | Açıklama                                                                  |
| --------------- | ------------------------------------------------------------------------- |
| Daily           | Her gün seed tabanlı, sınırlı soru sayılı günlük meydan okuma.            |
| Sprint          | Kısa sürede maksimum doğru cevap ve skor hedefleyen tempo modu.           |
| Zen             | Süre baskısı olmadan odaklı pratik.                                       |
| Survival        | Hata baskısı yüksek, daha rekabetçi koşu tipi.                            |
| Custom Training | Süre, soru limiti ve işlem türlerini oyuncunun seçtiği premium antrenman. |
| Neuro Fusion    | Matematik, ritim, puzzle, hafıza ve refleksi birleştiren flagship mod.    |

## Neuro Fusion

Neuro Fusion, klasik mental math akışını daha yoğun bir bilişsel antrenmana çevirir. Koşular BPM ve preset seçimiyle başlar; kullanıcı isterse gecikme kalibrasyonu yapar. Ardından fazlar arasında dönen bir yapı çalışır:

- **Rhythm Math:** Sorular beat pencerelerinde cevaplanır; perfect/great/good/offbeat ayrımı puanı etkiler.
- **Puzzle Phase:** Dizi tamamlama, operasyon paterni, grid puzzle, odd one out, denklem dengeleme ve hızlı tahmin tipleri.
- **Cognitive Blend:** Echo Stack ve Reflex Gate ile hafıza, reaksiyon ve matematik aynı anda ölçülür.
- **Boss Phase:** Koşunun sonunda daha yoğun karışık mikro meydan okuma.

Sonuç ekranı skor, grade, doğruluk, ortalama beat offset, flow peak, faz kırılımı, XP, coin, track fragment ve badge ödüllerini gösterir.

## Neuro Pass

Neuro Pass, oyunu sezon bazlı ilerleme sistemine bağlayan ödül katmanıdır. Oyuncu Neuro Fusion koşularından, görevlerden ve claim akışlarından NXP kazanır; ücretsiz ve premium track üzerinde ödüller açar.

Sistem şu parçaları içerir:

- Sezon manifest doğrulama ve fallback akışı.
- Daily/weekly/boss quest yapısı.
- Idempotent XP grant ve reward claim politikaları.
- Premium entitlement, restore purchases ve IAP ürün katalogları.
- Tier skip satın alma/kullanma akışı.
- Anti-abuse kontrolleri: spam tap, time spoof ve cap politikaları.
- Backend'e geçiş için repository arayüzleri ve local-first migration planı.

## Tema ve Görsel Kimlik

Tema sistemi runtime'da light, dark ve system modlarıyla çalışır. Her tema; renk paleti, HUD stili, animasyon karakteri, tipografi profili, ses paketi, particle tipi ve unlock kuralı gibi alanlardan oluşur.

Kategoriler:

- Free başlangıç temaları
- Premium tema setleri
- Streak/referral ile açılan temalar
- Seasonal ve limited-time kampanya temaları
- Tek seferlik satın alma veya abonelikle açılabilen hibrit temalar

Detaylı tema planı için [docs/theme-system.md](docs/theme-system.md) dosyasına bakabilirsiniz.

## Teknik Mimari

Proje feature-first ve domain odaklı bir yapıyla düzenlenmiştir. UI, domain, data ve altyapı katmanları birbirinden ayrılır; bağımlılıklar DI container üzerinden çözülür.

```text
src/
  app/                 # Bootstrap, DI, navigation, theme, i18n, config
  core/                # Analytics, ads, storage, remote config, telemetry, utils
  features/
    game/              # Mental math domain, screens, store, scoring, Neuro Fusion
    neuroPass/         # Season pass, quests, rewards, IAP, anti-abuse
    theme/             # Theme catalog, unlock evaluator, preference store
  ui/                  # Paylaşılan layout, button ve feedback bileşenleri
```

Ana teknik kararlar:

- **Expo 54 + React Native 0.81 + React 19**
- **TypeScript strict mode**
- **Jest + ts-jest** ile domain ve store testleri
- **ESLint + Prettier + Husky + lint-staged**
- **Path alias'ları:** `@app`, `@core`, `@features`, `@ui`
- **Repository arayüzleri:** local storage ve backend-ready implementasyonlar için ayrılmış yapı
- **Analytics sanitization:** event parametreleri PII guard ve sanitizer katmanından geçer

## Kurulum

```bash
npm install
```

Geliştirme sunucusunu başlatmak için:

```bash
npm start
```

Platform komutları:

```bash
npm run ios
npm run android
npm run web
```

## Kalite Kontrolleri

```bash
npm run lint
npm run test
npm run typecheck
npm run ci
```

Kod formatlamak için:

```bash
npm run format
```

## GitHub'a Pushlama

Bu repo zaten `origin` olarak aşağıdaki GitHub adresine bağlıysa:

```bash
git status
git add README.md
git commit -m "docs: add project readme"
git push origin main
```

Tüm mevcut proje değişikliklerini göndermek istiyorsanız:

```bash
git status
git add .
git commit -m "feat: update mental math trainer"
git push origin main
```

Repo sıfırdan bağlanacaksa:

```bash
git init
git branch -M main
git remote add origin https://github.com/coskunburak/mental-math-trainer.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

## Dokümantasyon

- [Neuro Fusion Design Doc](docs/neuro-fusion-design.md)
- [Neuro Pass Migration Plan](docs/neuro_pass_migration_plan.md)
- [Theme System Blueprint](docs/theme-system.md)

## Kısa Özet

Mental Math Trainer; hızlı dört işlem pratiğini, seviye ilerlemesini, kişisel performans analizini, premium tema ekonomisini, sezon bazlı Neuro Pass sistemini ve ritim/puzzle temelli Neuro Fusion modunu tek bir mobil uygulamada birleştirir. Kod tarafında ise test edilebilir domain servisleri, modüler feature yapısı ve backend'e taşınmaya hazır repository sınırlarıyla büyümeye uygun bir React Native mimarisi sunar.
