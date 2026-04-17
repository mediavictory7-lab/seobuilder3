# 01 — Discovery

Инвентаризация двух исходных проектов. Цель — дать seobuilder3 прочное фактологическое основание: что реально есть, что работает, что сломано.

Все ссылки на файлы даны относительно корней проектов:
- `seobuilder2`: `C:/ZProjects/seobuilder2/site-builder/`
- `sitebuilder`: `C:/ZProjects/site-builder/`

Путь нового проекта: `C:/Projects/seobuilder3/`.

---

## Важное расхождение с ТЗ

В ТЗ указано, что seobuilder2 на **TypeScript / ESM**. Фактически репозиторий — чистый **Node.js CommonJS (`.cjs`), без TypeScript, без Babel**. Sitebuilder — тоже `.cjs`. Оба проекта используют конкатенацию HTML-строк в функциях вместо шаблонизатора.

seobuilder3 будет первым из трёх, кто реально на TypeScript/ESM — это переписывание, а не миграция.

---

## Часть A. seobuilder2

### A.1. Карта каталогов

```
site-builder/
├── seogen-bot.cjs               — Telegram-бот (polling), точка входа-1
├── seogen-runner.cjs (1228 LOC) — главный 18-шаговый оркестратор пайплайна
├── builder.cjs (958 LOC)        — рендерер одного языка: buildSite()
├── _build.cjs                   — мультиязычный билдер, обходит 16 языков
├── _generate-blog.cjs           — AI-генератор блога (3–5 статей на сайт)
├── _translate.cjs               — перевод content.json на 15 языков через AI
├── audit-all-sites.cjs          — массовая SEO-проверка уже задеплоенных
├── seo-check.cjs                — валидатор на сгенерированном HTML
│
├── master-template/
│   ├── content.json             — master EN-контент с тегами <keyword>, <brandname>, <country>, <celebrity>
│   └── content-{lang}.json × 16 — предвычисленные переводы (не runtime)
│
├── sections/                    — 17 функций-секций (hero, faq, reviews, howItWorks, latestArticles, …)
├── common/                      — head, leadForm, cookieConsent, langSwitcher
├── styles/globalStyle.cjs       — CSS-генератор, инъекция палетки+шрифта в CSS-переменные
│
├── data/
│   ├── seoMeta.cjs              — JSON-LD: Organization, WebSite, FAQPage, Breadcrumb, SoftwareApplication
│   ├── i18n.cjs (48 KB)         — строки UI на 16 языках (footer, nav, CTA, cookie banner, form labels)
│   ├── randomItems.cjs          — 8 палеток × 4 шрифта × 5 layout-вариантов
│   ├── legalDoc.cjs             — Privacy, Terms, Risk Disclosure, Cookie Policy (шаблонные)
│   └── thankYou.cjs             — страница после конверсии
│
├── lib/
│   ├── rewrite.cjs              — AI-обёртка: callAI(Claude→OpenAI fallback), stripAiPatterns, generateCompanyIdentity
│   ├── domain.cjs               — Spaceship API (поиск/регистрация домена)
│   ├── cloudflare.cjs           — Zone, DNS, WAF, SSL, Search Console
│   ├── telegram.cjs, google-sheets.cjs, youtube.cjs, backlinks.cjs, ga4-admin.cjs, favicon.cjs
│   └── config.cjs               — API-ключи, пути, Telegram creds
│
└── _preview/ (gitignored)       — артефакт сборки; структура = зеркало деплоя
```

Зависимости `package.json`: `basic-ftp`, `ssh2`, `crypto-js`, `oauth-1.0a`, `tumblr.js`. AI-вызовы — через глобальный `fetch`, без SDK.

### A.2. Пайплайн (18 шагов)

```
[Telegram /seogen k:… c:… z:… s:…]  или  [node seogen-runner.cjs --command …]
                 │
                 ▼
  [1] parseCommand → {keyword, country, tld, celebrities, langs?}
  [2‖3] generateCompanyIdentity   ‖   findAvailableDomain (Spaceship)
                 │
  [4] rewriteContent(content.json, "en")  ── Claude Sonnet 4.6 (fallback GPT-4o)
                 │   chunks×30 строк, temp=1.0, preserve <keyword|brandname|country|celebrity>
                 │   stripAiPatterns → убирает клише ("cutting-edge"→"advanced", "In today's…"→∅)
                 │
  [5‖6] translate → 15 остальных языков (по тем же правилам)
                 │
  [7]  generateBlog → 3–5 статей 800–1200 слов, pool из 40 топиков (детерм. hash домена)
  [7b] buildAll    → 14 страниц × (1 основной + 15 sublang dirs)
                 │   stripKwTags → deduplicateBrandWords → limitBrandDensity
                 │   render sections in random order (seeded by domain hash)
                 │   limitHtmlBrandDensity → ≤40 видимых упоминаний brand
                 │
  [8‖9‖10] Cloudflare zone + DNS ‖ NS update (Spaceship→CF) ‖ nginx vhost via SSH
  [11] SFTP deploy → /var/www/html/{domain}/
  [12‖13‖14] Google Search Console ‖ Bing Webmaster ‖ IndexNow
  [15] verifySite (curl HTTP 200, <title>, <h1>)
  [16‖17] publishBacklinks (GitHub/Telegraph/Blogger/Tumblr) ‖ publishYouTube
  [18] Telegram + Sheets отчёт
```

State каждого run сохраняется в `RUN_{id}.json`, поддерживается `/resume`.

### A.3. Сущности данных

```
Content              // корневой объект на язык
  lang, brandName, keyword, siteName, metaTitle, metaDescription
  _gaId, _gtmId, _langs[], _primaryLang, _domain, _blogArticles[]
  contact { company{address,phone,email}, phone, email }
  hero { title, subtitle, ctaText, layout }
  valueProposition { paragraphs[] }
  smarterTrading { features[{title,text}] }
  trustSecurity { cards[{title,text}] }
  faq { items[{question,answer}] }
  reviews { items[{name,text}] }
  howItWorks { steps[{title,description}] }
  … ещё ~10 секций

BlogArticle          // отдельная сущность
  slug, title, content(HTML), meta_title, meta_description, lang

SiteIdentity         // из generateCompanyIdentity
  brandName, companyName, address, phone, email, registration
```

### A.4. Переиспользуемые механизмы

| Механизм | Файл:строка | Роль |
|---|---|---|
| `stripKwTags()` | `builder.cjs:120` | снимает `<keyword> <country> <celebrity>`, оставляет `<brandname>` до дедуп-прохода |
| `deduplicateBrandWords()` | `builder.cjs:89` | вне тегов чистит generic-слова, входящие в brand |
| `limitBrandDensity()` | `builder.cjs:218` | ≤2 упоминания brand на текстовое поле |
| `limitHtmlBrandDensity()` | `builder.cjs:246` | пост-процесс финального HTML, ≤40 видимых упоминаний, защищает `<head>/<script>/<nav>/<footer>/alt` |
| `stripAiPatterns()` | `lib/rewrite.cjs:138` | список подстановок против AI-клише |
| `callAI()` | `lib/rewrite.cjs:16` | Anthropic→OpenAI fallback, отключает провайдера сессии на auth/credit error |
| `rewriteContent()` | `lib/rewrite.cjs:169` | chunked rewrite с preservation тегов |
| `SeoHead()` | `data/seoMeta.cjs:10` | `<head>` + JSON-LD |
| `BRAND_SYNONYMS_I18N` | `builder.cjs:143` | per-lang замены (the platform / our system / …) |
| `randomItems.cjs:7–96` | — | 8 палеток × 4 шрифта × 5 layouts = 160 комбо |
| `i18n.cjs` | — | строки UI-переводов |
| `seogen-runner.cjs` | — | оркестратор с persistent state + resume |

### A.5. SEO-слой (фактическое покрытие)

- `title` (≤60, обрезка с троеточием), `description`, OG, Twitter — есть.
- `canonical`, `hreflang` (с `x-default`) — есть.
- JSON-LD: `WebSite`, `Organization`, `FAQPage`, `BreadcrumbList`, `SoftwareApplication`. Reviews/AggregateRating **сознательно убраны** (политика).
- `sitemap.xml` per-language, `robots.txt`, кастомный 404 per language.
- Внутренняя перелинковка: фиксированные `relatedPages` словари в `builder.cjs:518–550` + header/footer nav + блок `LatestArticles`.
- URL: primary lang в корне, остальные в `/{lang}/`; `/page.html` и `/page/` оба работают (nginx).

### A.6. Мультиязычность

17 языков фактически: EN, ES, IT, FR, PT, TR, NL, DA, KO, NO, SV, DE, CS, PL, JA, HU **+ RU** (ТЗ говорит про 16 — расхождение подтверждается в коде).

Все переводы **предвычислены в `master-template/content-{lang}.json`**, не делаются при билде. Переводчик `_translate.cjs` — отдельный оффлайн-этап. Рерайт на EN и на каждый язык тоже заранее через `rewriteContent`. Рендер читает готовый content-{lang}.json.

### A.7. Формат вывода

Чистый HTML5. Без шаблонизатора, без JS-фреймворков. Каждая секция = функция `(content, palette) => "<section>...</section>"`. Стили собираются через `globalStyle.cjs` в один `styles.css` (~26 KB, общий для всех языков). Inline SVG-иконки. Никакого бандлера.

### A.8. Сильные стороны

1. **Антишаблонный пост-процессинг** — двухуровневое ограничение плотности бренда + strip AI-клише. Редкая в open-source вещь.
2. **17 языков с предвычисленными переводами** — быстро, дешёво при рендере.
3. **Полноценный SEO-слой**: JSON-LD, hreflang, sitemap.xml per-lang, внутренняя перелинковка.
4. **Оркестрация от идеи до live-сайта** — домен, Cloudflare, nginx, Search Console, backlinks в одной трубе.
5. **Resume/stop/status** — run-ориентированная state-машина, переживает рестарт.

### A.9. Слабые места и долг (для целей seobuilder3)

1. **Визуальная вариативность ограничена ~160 комбинациями.** Секции всегда одни и те же по составу; меняется только порядок (shuffle) и палитра/шрифт. На объёмах 1k+ это узнаваемо.
2. **Все палетки тёмные.** Нет light-темы, нет смешанных градиентов, нет serif-шрифтов.
3. **Нет шаблонных вариантов секций** — одна реализация `Hero`, один `FAQ`, один `Reviews`. Расплата за вариативность отдана палеткам и layout-seed'у.
4. **CommonJS + строковая конкатенация HTML**. Нет type safety, нет XSS-защиты (теоретически можно сломать контентом), нет IDE поддержки.
5. **Нет формальной схемы контента.** Поля шаблонов известны только по факту чтения кода.
6. **Blog uniqueness хрупкий.** 40 топиков на все сайты → пересечения неизбежны при сотнях сайтов.
7. **Nginx per-domain vhost + SSH reload** не масштабируется на 1000+ сайтов (inode, reload time).
8. **Стоимость AI**: ~2500 вызовов на сайт (rewrite×15 lang + blog). Нет кэширования, нет batch API.
9. **Фиксированные `relatedPages`** заданы кодом, не параметризуются на основе реальной связности контента.

---

## Часть B. sitebuilder

### B.1. Карта каталогов

```
site-builder/
├── builer.cjs                — точка входа (опечатка в имени — sic)
├── contentAI.cjs             — OpenAI-обёртка, заполняет Content.cjs
├── imageBuilder.cjs          — Replicate (Imagen), генерит 5 JPG
├── Content.cjs               — текущий контент одного сайта (перезаписывается)
│
├── common/
│   ├── style.cjs             — CSS-переменные (все темы)
│   ├── header.cjs            — nav + мобильное меню на checkbox-hack
│   ├── footer.cjs, form.cjs, icons.cjs (10+ inline SVG), head.cjs
│
├── section/                  — 8 секций, каждая со switch по version 1..3(4)
│   ├── hero.cjs, heroShort.cjs, about.cjs, features.cjs,
│   ├── testimonial.cjs, faq.cjs, contact.cjs, news.cjs (v1..v4, часто как декоратор)
│
├── data/
│   ├── data-content.cjs      — жёстко заданный контент
│   ├── radomItems.cjs        — рандомайзер (без seed)
│   ├── url.cjs               — about/faq/contact routes
│   └── legalDoc.cjs
│
└── public/{siteName}/        — артефакт: 8 HTML + images/img01..img05.jpg + contact.php
```

Зависимости `package.json`: `openai`, `replicate`. Ничего больше.

### B.2. Схема композиции сайта

```
Site ≡ один siteName  →  ровно 4 публичных HTML + 3 legal + PHP-форма

index.html:
  Header
    Hero            version = 1..3   (layouts: single / 2-col / dark)
    News            version = 1..4   (декоративный разделитель-слоган)
    About           version = 1..3
    Features        version = 1..3
    News            version = 1..4
    Testimonial     version = 1..3
    News            version = 1..4
    FAQ             version = 1..3
    Contact         version = 1..3
    News            version = 1..4
  Footer

Выбор версий: randomItems.cjs при старте билда, без seed, без ограничений совместимости.
```

**Декоративная логика** (`builer.cjs:35–39`):
```js
decoreSection = {
  first: (heroVersion ∈ {2,3}) ? 1 : 2,
  two:   (featuresVersion === 2) ? 3 : 2,
  three: (testimoniaVersion === 2) ? 3 : 2,
}
```
Единственная попытка связать версии между собой — примитивная.

### B.3. Сущности данных

```
Site { siteName, brandName, country, pages[] }

Page { url, title, meta, sections[] }

Section
  type: 'hero' | 'about' | 'features' | 'faq' | 'testimonial' | 'contact' | 'news'
  version: 1..3 (или 1..4 для news)
  content: SectionContent // форма зависит от type

Theme  // всё глобально на сайт, не per-section
  borderRadius: int(0..30)
  mainTitle, mainTitleDesk: int
  sectionPaddingBlock: int(80..120)
  textPrimary, textTertiary, textWhite, textPre: hex
  colorsBgPrimary, bgBrandSection, buttonBgPrimary: hex
  textTitleStyle: 'uppercase' | 'normal' | 'capitalize'

Content (в Content.cjs)
  metaTitle, lang
  hero { title, subtitle, imgPrompt }
  about { title, shortTitle, subtitle[], imgPrompt }
  features { title, shortTitle, subtitle, imgPrompt, items[{title,text}]×3..8 }
  faq { shortTitle, title, subtitle, imgPrompt, items[{question,answer}]×3..10 }
  testimonial { shortTitle, title, subtitle, items[{name,tg,text}]×3..6 }
  contact { shortTitle, title, subtitle, phone, adress, imgPrompt }  // sic
  contact_form { name, email, message }
```

### B.4. Переиспользуемые механизмы

| Механизм | Файл:строка | Роль |
|---|---|---|
| CSS-переменные как дизайн-токены | `common/style.cjs:1–303` | единый пул переменных; секции только их используют, не пишут свои цвета |
| Тема-рандомайзер | `data/radomItems.cjs:61–85` | палитры, радиусы, spacing, transform |
| Версионирование внутри секции | `section/*.cjs` | switch(version) → разная разметка при одном контракте данных |
| Mobile nav на checkbox-hack | `common/header.cjs:3–102` | без JS, чисто CSS |
| Inline SVG-массив | `common/icons.cjs` | 10+ иконок, выбор по индексу |
| `decoreSection` связка | `builer.cjs:35–39` | примитивная корреляция версий |

### B.5. Сильные стороны

1. **Вариативность на уровне layout-вариантов секций**: один контентный контракт — три структурно разных реализации.
2. **CSS-переменные как единственный источник стиля**: любая тема применяется ко всем секциям, секции не «знают» цветов.
3. **Радикальная простота билда**: `node builer.cjs` → 8 HTML без инфраструктуры.
4. **Нулевой рантайм**: всё статика + PHP для формы.

### B.6. Слабые места и долг (для целей seobuilder3)

1. **Контентный контракт не подходит под длинный SEO-текст.** Testimonial = short text, Features items = короткие descriptions, FAQ.answer может быть длинным, но в вёрстке не предусмотрено `<h3>/<ul>/<table>` внутри.
2. **Нет SEO-слоя.** Нет hreflang, нет JSON-LD, нет sitemap.xml, нет canonical, нет x-default. Title/description — одно поле `metaTitle`.
3. **Нет мультиязычности.** Есть одно поле `lang`, дальше ничего.
4. **Нет блога и статей.** Полный белый лист.
5. **Фиксированный порядок секций** на index.html. Категорий/хабов не существует.
6. **Рандомизация без seed** — нельзя воспроизвести результат, нельзя сравнить два билда.
7. **Никакой валидации совместимости** версий секций — работает только за счёт того, что все версии оформлены одинаковыми CSS-переменными.
8. **Vanilla JS + CJS**, нет типов, нет тестов.
9. **Hardcoded image paths** (`./images/img02.jpg` и т.п.), нет responsive/srcset/lazy.
10. **Form-handler на PHP** без валидации и защиты от спама.

### B.7. Что перенести в seobuilder3

Самое ценное в sitebuilder — **паттерн версий секций при едином контенте** и **CSS-токены как единственный источник стиля**. Всё остальное придётся заменить или достроить.

---

## Сводная таблица сильных/слабых сторон

| Аспект | seobuilder2 | sitebuilder |
|---|---|---|
| SEO-слой | ✅ полный | ❌ отсутствует |
| Мультиязычность | ✅ 17 языков | ❌ одно поле |
| Блог/статьи | ✅ AI-генерация | ❌ нет |
| Категории/хабы | ⚠ частично (related pages) | ❌ нет |
| Антишаблонность текста | ✅ два уровня | ❌ нет |
| Визуальные варианты | ⚠ 160 комбо, но 1 реализация секции | ✅ 3 layout на секцию |
| Seed-детерминизм | ⚠ hash домена для порядка секций | ❌ полный рандом |
| Инфра-обвязка | ✅ Cloudflare/Nginx/SC/Bing/IndexNow | ❌ нет |
| TypeScript | ❌ (CommonJS) | ❌ (CommonJS) |
| Контракт данных | ⚠ по факту использования | ⚠ по факту использования |
| Защита совместимости | ❌ | ❌ |
| Масштаб на 10k сайтов | ⚠ узкие места в инфре | ❌ архитектура не заложена |

---

## Честные неопределённости

1. Точное содержимое `_translate.cjs` и `_generate-blog.cjs` читал агент — моё понимание основано на его выжимке. Детали промптов могут отличаться.
2. Финальный порядок секций на homepage seobuilder2 подразумевается «shuffle по hash домена», но я не читал конкретную реализацию shuffle — в роадмапе уточнить.
3. SQL-инъекция в PHP-форме seobuilder2 упомянута как риск — фактически файл `send.php` не читал, оценка косвенная.
4. Фактическое количество вариантов layout в seobuilder2 указано как «5», но не проверено по коду `randomItems.cjs:7–96` построчно.

Эти точки уточним при реализации перед тем, как переносить соответствующие механизмы.
