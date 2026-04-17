# 03 — Архитектура seobuilder3

Это проектное решение на бумаге. Код — в следующей сессии.

---

## 3.1. Принципы

1. **Данные отдельно от представления.** Контент хранится в валидируемом JSON (zod-схема), шаблоны его только рендерят. Шаблону запрещено знать конкретный бренд, язык или домен — только через props.
2. **Композиция вместо размножения кода.** Страница = манифест ссылок на шаблоны секций + props. Новая «главная» не требует нового кода, только новой композиции.
3. **Детерминизм от seed.** Всё, что «рандомизируется» (выбор шаблонов, тема, порядок), — это функция `f(site_seed, page_slug, section_id)`. Один и тот же site_seed даёт идентичный сайт. Это основа воспроизводимости и аудита.
4. **Уникальность соседних сайтов как прямое требование.** Расстояние между двумя сайтами в пространстве (тема × layout × шаблоны секций × порядок) должно быть достаточно большим, чтобы два случайно сгенерированных сайта не выглядели клонами. Это проверяется эвристиками на build-time.
5. **Шаблоны ничего не знают о стиле.** Все цвета/размеры/радиусы — CSS-переменные, заданные темой. Шаблон, прописавший `color: #123`, считается сломанным.
6. **Мультиязычность первого класса.** Каждый артефакт сайта — набор `{lang → content}`; любая фича обязана ответить на вопрос «как это работает для 17 языков».
7. **SEO-слой — не декоратор.** Title, canonical, hreflang, JSON-LD, sitemap, robots — часть пайплайна, а не добавка. Build завершается только после прохождения SEO-линтера.
8. **Артефакт сайта — иммутабелен и описывает себя.** Каждый build кладёт `manifest.json` с seed, версиями шаблонов, палеткой, списком страниц. По манифесту можно воспроизвести сайт или сравнить два билда.
9. **Масштаб закладываем в интерфейсы, не в реализацию.** Сейчас — sequential рендер и SFTP-деплой; `Job` и `Deployer` — интерфейсы, которые позже подменяются на queue/worker/CDN.
10. **Без over-engineering.** Абстракция появляется только когда у неё есть два разных применения. До этого — прямая реализация.

---

## 3.2. Доменная модель

Сущности в порядке наследования.

```
SiteBrief                         ← вход: запрос человека
  keyword, country, tld, celebrities[], langs?[], seed?, theme_hint?

Site
  id, seed, domain, primaryLang, langs[], createdAt
  identity: SiteIdentity          ← brand, company, address, phone, email
  theme: Theme                    ← генерируется от seed
  pages: Page[]                   ← плоский список всех страниц всех языков
  graph: InternalLinkGraph
  manifest: SiteManifest          ← результат билда

Theme
  id (= hash)
  mode: 'light' | 'dark' | 'duotone'
  palette: Palette (12 слотов, OKLCH, с контрастом проверенным)
  typography: { heading: FontFace, body: FontFace, mono?: FontFace }
  tokens: { radius, spacing_base, container_max, grid_gap, section_gap }

Page
  siteId, lang, slug, type: PageType, layoutId, seoMeta
  sections: SectionInstance[]     ← упорядоченный список

PageType = 'home' | 'category' | 'article' | 'blog-index' | 'service'
         | 'about' | 'contact' | 'legal' | 'thank-you' | '404'

SectionInstance
  kind: SectionKind               ← 'hero' | 'features' | 'faq' | 'reviews' | 'cta' | …
  templateId: string              ← 'hero.v2'
  props: SectionProps             ← валидируется zod-контрактом шаблона
  id: string                      ← для anchor-ссылок и shuffle stability

Category
  siteId, slug, name, keywords[], description
  pillarArticleId?                ← опорная статья категории
  articleIds[]

Article (BlogPost)
  siteId, categoryId, slug, lang, title, excerpt, publishedAt
  sections: SectionInstance[]     ← та же модель, что у Page
  wordCount, readingTime, tags: KeywordTag[]

KeywordTag
  lang, text, weight              ← density-таргет для контент-генератора

Locale
  code, name, rtl, primary, dateFormat, numberFormat
  brandSynonyms: string[]         ← из BRAND_SYNONYMS_I18N
  genericBrandWords: string[]

Template                          ← декларация шаблона в реестре
  id, kind, version
  contract: ZodSchema             ← какие props принимает
  compatibility: { tags: string[], conflicts?: string[] }
  suggestedThemeModes?: ('light'|'dark'|'duotone')[]
  minContentLength?, maxContentLength?

SiteManifest
  siteId, seed, builtAt, themeId
  pages: { slug, lang, type, layoutId, templateIds[] }[]
  links: LinkEdge[]               ← граф, сохранённый
  checks: { seoLint: pass|warn|fail, uniqueness: number }
```

Связи:
```
SiteBrief ─┬─▶ Site ─┬─▶ Theme
           │          ├─▶ Page[]  ─▶ SectionInstance[]  ─▶ Template (реестр)
           │          ├─▶ Category[] ─▶ Article[]
           │          ├─▶ InternalLinkGraph
           │          └─▶ SiteManifest
           └─▶ Locale[] (17)
```

---

## 3.3. Типы страниц

Таблица обязательных SEO-элементов, базовых секций и того, что меняется при росте контента.

### 3.3.1. Homepage

| Элемент | Требование |
|---|---|
| SEO | title ≤ 60, description ≤ 160, canonical на `/{lang}/` (или `/` для primary), `x-default` hreflang, JSON-LD: `WebSite` + `Organization` + `BreadcrumbList` |
| Обязательные секции | hero, value-proposition, features, faq, cta |
| Опциональные | reviews, how-it-works, stats, latest-articles, categories-overview, trust-badges |
| Применимые шаблоны | любые секции с `compatibility.tags ⊇ {"home"}` |
| При росте контента | если keyword-объём большой — добавляется `longform-intro` секция (~400–800 слов) между hero и features |

### 3.3.2. Category / Hub

| Элемент | Требование |
|---|---|
| SEO | canonical, hreflang, JSON-LD: `BreadcrumbList` + `CollectionPage`, `ItemList` для списка статей |
| Обязательные | hero (категория), longform-intro, articles-list |
| Опциональные | featured-article, siblings-categories, cta, faq |
| Шаблоны | `category-*`, `articles-list-*` |
| При росте контента | `articles-list` работает в режимах `grid-12`, `featured-plus-list`, `masonry`; при >50 статьях — пагинация с `/{lang}/category/{slug}/page/2/` |

### 3.3.3. Blog-index

| Элемент | Требование |
|---|---|
| SEO | `CollectionPage`, пагинация (`rel="next"`/`rel="prev"` в заголовках) |
| Обязательные | hero (блог), articles-list |
| Опциональные | tags-cloud, categories-nav |
| Шаблоны | `blog-hero-*`, `articles-list-*` |
| Рост | пагинация по 12 статей |

### 3.3.4. Article

| Элемент | Требование |
|---|---|
| SEO | `Article` JSON-LD (author=brand entity, publisher=Organization, datePublished, dateModified, image), `BreadcrumbList`, optional `FAQPage` при наличии FAQ-секции |
| Обязательные | article-hero, toc (если ≥5 H2), article-body, author, related-articles, breadcrumbs |
| Опциональные | faq, cta, share-bar, key-takeaways |
| Шаблоны | `article-hero-*` (3+), `article-body-*` (2+: с сайдбаром/без), `related-*` |
| Рост | при объёме ≥1500 слов включается `toc` и `key-takeaways`; при ≥2500 — sticky-nav |

### 3.3.5. Служебные (about / contact / legal / 404 / thank-you)

| Элемент | Требование |
|---|---|
| SEO | canonical, hreflang. Thank-you и 404 — `noindex`. Legal — `index, follow`. |
| Шаблоны | `service-page-*` (2–3 варианта). Не главный приоритет вариативности. |

---

## 3.4. Система шаблонов

### 3.4.1. Иерархия

```
site-layout                — обёртка: <html>, <head>, <body>, глобальные скрипты
  └─ page-layout           — сетка страницы (обычно 1 колонка или hero+main+sidebar)
       └─ section          — блок с контрактом данных (hero, features, faq, …)
            └─ block       — атомарный элемент внутри секции (feature-card, faq-item, review-card)
```

Рекомендованная иерархия из ТЗ оставлена, но с поправкой: **на уровне `site-layout` вариативность не нужна** — семантически это всегда `<html lang>/<head>/<body>`. Вариативность начинается с `page-layout`.

### 3.4.2. Реестр шаблонов

Каждый шаблон декларируется:

```ts
// src/templates/sections/hero/hero.v2.ts
import { z } from 'zod'

export const contract = z.object({
  eyebrow: z.string().optional(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  cta: z.object({ label: z.string(), href: z.string() }).optional(),
  media: z.object({ src: z.string(), alt: z.string(), srcset: z.string().optional() }).optional(),
})

export const meta = {
  kind: 'hero' as const,
  version: 'v2',
  compatibility: { tags: ['home', 'category', 'article'], conflicts: [] },
  suggestedThemeModes: ['light', 'dark'] as const,
  minContentLength: 0,
  maxContentLength: 400,
}

export function render(props: z.infer<typeof contract>, ctx: RenderCtx): VNode { … }
```

Реестр — `src/templates/registry.ts` — собирается на старте через `import.meta.glob`/явные импорты и раздаёт `Template` по `id` = `{kind}.{version}`.

### 3.4.3. Композитор страницы

```
pickLayout(pageType, seed, themeMode) →
  1. фильтр пула layout-манифестов по pageType и theme-compat
  2. seeded-выбор одного
  3. для каждой секции из layout-манифеста — pickTemplate(kind, seed_section, context)
     3.1. фильтр реестра по kind
     3.2. фильтр по compatibility (другие выбранные секции страницы)
     3.3. фильтр по minContentLength/maxContentLength от props
     3.4. seeded-выбор
  4. возврат Page с SectionInstance[]
```

**Правила совместимости** — теги:
- `hero-dark` и `cta-dark` не должны идти подряд на светлой теме.
- `longform-intro` не может следовать сразу за `article-hero` (визуально тяжело).
- `compact` и `spacious` не смешиваются в одной странице.

Реализуем через `conflicts: [tag]` у шаблонов: композитор ведёт set активных тегов и отбраковывает конфликтующих.

### 3.4.4. Защита от клонов

Два сайта с близким brief'ом получат разные seed'ы (hash(domain)), а значит:

- Разная тема (palette, typography, layout-tokens).
- Разные page-layout'ы для home/category/article.
- Разные версии секций.
- Разные порядки секций (где допустимо).
- Разный пул блог-топиков (хеш-slice от общего списка).

На build-time считаем **uniqueness score** пары `(этот сайт, последние 50 сайтов)` — набор битовых признаков (тема, шрифт, набор templateId, palette-hue bucket). Если score < порога — меняем seed на `seed + 1` и перегенерируем. Порог и веса калибруем опытом.

### 3.4.5. Темы и шаблоны — раздельные оси

Шаблону запрещён `color: #…`. Все токены только через CSS custom properties:

```
:root {
  --color-bg, --color-surface, --color-text, --color-text-muted, --color-accent, --color-accent-contrast;
  --radius-sm, --radius-md, --radius-lg;
  --space-xs … --space-3xl;
  --container-max, --grid-gap, --section-gap;
  --font-heading, --font-body, --font-mono;
  --font-size-h1 … --font-size-base;
}
```

Тема — файл, инжектируемый в `<style>` в `<head>` до пользовательских стилей. Один файл per-site, общий `styles.css` — только статические правила, независимые от темы.

### 3.4.6. Контракт данных шаблона

Контракт = zod-схема + meta. Это единственный способ шаблону сказать «мне нужны такие props». Валидация — при сборке `SectionInstance`:
- невалидные props → build fails (fatal).
- отсутствует опциональное поле → секция рендерится в «сжатом» режиме (без блока).

Контент-генератор видит контракт и выдаёт данные под него; pick-алгоритм учитывает `minContentLength/maxContentLength`, чтобы длинный текст не падал в короткий hero.

---

## 3.5. Контентный пайплайн

### 3.5.1. Вход

`SiteBrief` — в JSON или через формат команды seobuilder2 (`k: | c: | z: | s: | languages:`). Минимум:

```json
{
  "keyword": "Crypto Trading Platform",
  "country": "AU",
  "tld": ".online",
  "celebrities": ["Elon Musk"],
  "langs": ["en","es","de"],
  "seed": "optional-override"
}
```

### 3.5.2. Контент-план

```
1. generateSiteIdentity(brief)  →  SiteIdentity (как в seobuilder2)
2. generateSeedFromDomain(domain) → site_seed
3. generateTheme(site_seed) → Theme
4. planSite(brief, site_seed) → {
     homepage,
     categories: Category[],       ← 3–5, параметризуются keyword'ом
     articlesPerCategory: 3–7,
     servicePages: [about, contact, 4×legal, 404, thank-you]
   }
5. planBlog(brief, categories) → topics[] (уникальный slice от сгенерированного пула)
```

### 3.5.3. Генерация текстов

Пайплайн за секцию:

```
  for each section in page:
    1. shape = template.contract  // zod
    2. skeleton = buildSkeleton(shape, lang, keywordTags)
    3. filled = callAI(claude→openai, prompt(skeleton, style_seed, lang))
       └─ preserve tags <keyword>/<brandname>/<country>/<celebrity>
    4. filled = stripAiPatterns(filled)
    5. filled = applyBrandSynonyms(filled, lang)  ← заранее
    6. zod.parse(filled)  ← валидация
    7. SectionInstance { templateId, props: filled }
```

Дополнительно для longform (articles):
- генерация по секциям, а не монолитом (1 H2 = 1 AI-вызов);
- агрегирующий промпт на финише: «прочти и отредактируй для связности».

### 3.5.4. Раскладка по шаблонам

Композитор выбирает шаблоны **до** генерации текста. Это важно: шаблон диктует `minContentLength/maxContentLength`, это уходит в промпт как ограничение длины. Так мы не получаем 800-словный текст в hero.

### 3.5.5. Антидубликационная логика

Три уровня:

| Уровень | Что гарантирует | Где |
|---|---|---|
| **Лексический** | разные сайты с похожим brief не содержат одинаковых абзацев | temp=1.0 + stripAiPatterns + style_seed per-site |
| **Структурный** | разные сайты не имеют идентичной структуры страниц | seeded выбор layout+templates |
| **Визуальный** | два соседних сайта выглядят по-разному | тема от hue-seed, uniqueness-score |

Пост-проверка: для каждого текстового поля собираем shingle-set (n-gram=5), сверяем с последними 50 сайтами. Совпадение >15 % строк → regenerate этого поля.

---

## 3.6. SEO-слой

### 3.6.1. Meta

| Поле | Правило |
|---|---|
| `<title>` | `${page.seoTitle ?? section.title} | ${brand}`, ≤ 60 символов, обрезка по слову |
| `<meta description>` | 140–160 символов |
| `<link rel="canonical">` | абсолютный URL текущей страницы |
| `<link rel="alternate" hreflang>` | на каждый язык + `x-default` = primary |
| `<meta robots>` | `index,follow` по умолчанию; `noindex,follow` для thank-you, 404 |
| OG | `og:title`, `og:description`, `og:image`, `og:url`, `og:locale` |
| Twitter | `summary_large_image` |

### 3.6.2. JSON-LD

| Тип страницы | Типы schema.org |
|---|---|
| home | `WebSite`, `Organization`, `BreadcrumbList`, опц. `SoftwareApplication` |
| category | `CollectionPage`, `BreadcrumbList`, `ItemList` |
| article | `Article`, `BreadcrumbList`, опц. `FAQPage` |
| blog-index | `CollectionPage`, `BreadcrumbList` |
| service | `BreadcrumbList` |

**Review / AggregateRating намеренно не включаем** — повторяем решение seobuilder2 (политика Google против fake reviews).

### 3.6.3. sitemap.xml, robots.txt

- Один `sitemap_index.xml` на корень, на каждый язык — отдельный `sitemap-{lang}.xml`.
- `lastmod` = `builtAt` сайта (стабильно per-build, не случайное).
- `robots.txt`: `Allow: /`, `Disallow: /thank-you*`, `Disallow: /404*`, указание на `sitemap_index.xml`.

### 3.6.4. Внутренняя перелинковка

Граф строится после генерации всех страниц:

- `article → category` (1)
- `article → 3 сиблинг-статьи` (детерм. выбор по seed)
- `category → pillar-article` (если есть)
- `category → 3 sibling categories`
- `home → top-N категорий`
- `home → latest 6 articles`
- Контекстные ссылки в longform-секциях — опц. автоинъекция по совпадению keyword и существующих slug'ов (стоп-лист чтобы не линковать сами на себя).

Ограничение: ≤ 100 исходящих ссылок с одной страницы (кроме блог-индекса).

### 3.6.5. URL-стратегия

```
primary lang (EN):  /                    /category/{slug}/    /blog/  /blog/{slug}/  /about/
non-primary:        /{lang}/             /{lang}/category/…   /{lang}/blog/ …

slugs: lower-kebab, только [a-z0-9-], транслит через ICU (для KO/JA/RU)
trailing slash: всегда присутствует (nginx add_trailing_slash при необходимости)
запрещённые символы: всё вне [a-z0-9-] → либо транслит, либо удаление
```

---

## 3.7. Мультиязычность

- 17 языков (см. 01-discovery.md).
- `content/{lang}.json` — per-lang, предвычислено (не runtime).
- Основной rewrite — на primary (EN), затем для каждого не-primary — **независимая генерация** (не машинный перевод строки в строку), с сохранением тегов.
- При отставании некоторых языков: билд сайта проходит, если есть primary. Отсутствующие языки помечаются в `manifest.json` как pending; sitemap и hreflang для них не эмитятся до готовности.
- **Инкрементальная достройка**: дозалив контента одного языка не требует полного ребилда; перезаписываем только страницы этого языка и обновляем `sitemap-{lang}.xml`.

---

## 3.8. Рендер и вывод

### 3.8.1. Статика vs SSR

Только **статика**. Причина: 10k сайтов × 16 языков × 14+ страниц = миллион HTML. Сервер не нужен. Фреймворк — `preact + preact-render-to-string` (рекомендация §5.1 mapping), код-сплиттинг не требуется.

### 3.8.2. Билд

- **Инкрементально per-site**: изменение одной категории → пересобирается категория, связанные статьи и sitemap того языка. Home всегда пересобирается (содержит счётчики/последние).
- **Параллельно per-page** внутри одного сайта: worker-пул по CPU.
- **Артефакт** — `dist/sites/{siteId}/…` + `dist/sites/{siteId}/manifest.json`.

### 3.8.3. Ассеты

- `styles.css` — общий per-site (22–30 KB), минифицирован.
- Theme inline в `<head>` (≤3 KB).
- Шрифты — либо self-host (woff2, subset per-lang), либо Google Fonts (решить, см. open questions).
- Изображения: AVIF + WebP + JPG fallback, `srcset` для ≥2 breakpoints, `loading="lazy"` на всём, кроме hero-image.
- Генерация изображений (Replicate или аналог) — на этапе `planSite`, не на рендере.

### 3.8.4. Выход

```
dist/sites/{siteId}/
  manifest.json
  sitemap_index.xml
  sitemap-en.xml sitemap-es.xml …
  robots.txt
  index.html             ← primary lang root
  category/{slug}/index.html
  blog/index.html
  blog/{slug}/index.html
  {about,contact,privacy,terms,…}/index.html
  {lang}/…                ← то же дерево для non-primary
  assets/
    styles.css
    fonts/…
    img/…
```

---

## 3.9. Конфигурация и запуск

### 3.9.1. Интерфейсы

| Интерфейс | MVP | Позже |
|---|---|---|
| CLI | ✅ `sb3 build <brief.json>`, `sb3 deploy <siteId>`, `sb3 status <siteId>` | — |
| Telegram-бот | ✅ команды `/seogen`, `/status`, `/stop`, `/resume` (UX из seobuilder2) | — |
| HTTP | ❌ MVP не требуется | REST endpoint для внешних интеграций (этап 4) |

### 3.9.2. Формат SiteBrief

```yaml
# brief.yaml
keyword: "Crypto Trading Platform"
country: AU
tld: .online
celebrities: [Elon Musk]
langs: [en, es, de, fr]    # optional, default — все 17
seed: null                 # optional, default — hash(keyword+country+tld+timestamp)
theme_hint:                # optional
  mode: dark               # light|dark|duotone|auto
  hue: 220                 # 0..360, default — derive from seed
plan_hint:                 # optional
  categories: 4            # override default 3–5
  articlesPerCategory: 5
```

### 3.9.3. Env и секреты

```
ANTHROPIC_API_KEY
OPENAI_API_KEY
REPLICATE_API_TOKEN          # опц., для изображений
SPACESHIP_API_USER / _KEY
CLOUDFLARE_API_TOKEN
SSH_HOST, SSH_USER, SSH_KEY_PATH
TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
GOOGLE_SA_JSON_PATH          # для Search Console / Sheets
BING_WEBMASTER_API_KEY
INDEXNOW_KEY
GA4_PROPERTY_ID (опц.)
```

Секреты читаются через `src/config.ts`, нигде в репозитории не хардкодятся.

---

## 3.10. Масштабируемость

| Масштаб | Что сломается | Превентивная мера |
|---|---|---|
| 100 сайтов | Ничего существенного. SFTP-деплой работает. | Достаточно sequential. |
| 1 000 сайтов | Nginx per-domain reload (время + риски), AI-бюджет, inode на диске | Переезд деплоя на S3+CDN с wildcard-хостом, кэш AI-ответов по keyword+lang, партиционирование `dist/sites/ab/{siteId}/` по двум префиксным символам |
| 10 000 сайтов | Telegram-бот в одном процессе не справится, очередь билдов, диск-IO | Вынос бота в `job-producer`, множество `job-worker` через очередь (Redis/SQS), артефакт только в объектном хранилище |

**Раннее решение**: интерфейсы `JobQueue`, `Storage`, `Deployer` — с первого дня. Реализация MVP — in-memory, filesystem, SFTP соответственно. Замена — без переписывания бизнес-логики.

**Критерии горизонтального масштабирования**:
- Воркеры stateless.
- Состояние run в Redis/Postgres, не в памяти процесса.
- AI-вызовы через центральный rate-limiter.

---

## 3.11. Открытые вопросы (агрегированный список)

Собраны вопросы, требующие решения владельца до реализации. Дублируются в финальном сообщении сессии.

1. **Рендерер**: `preact` SSR (моя рекомендация) vs tagged-template. Подтвердить.
2. **Список языков**: 16 (как в ТЗ) или 17 (как в коде seobuilder2, включая RU)?
3. **Деплой MVP**: сохраняем SFTP+nginx путь seobuilder2 для первой работающей версии, или сразу делаем S3/CDN? Второй вариант долже по setup, но устраняет рефакторинг позже.
4. **Шрифты**: self-host (woff2 subset) или Google Fonts? Self-host снимает зависимость и ускоряет LCP, но требует сабсет-пайплайна.
5. **Изображения**: оставляем Replicate или переходим на другое (Cloudflare Images / Black Forest Labs / локальный)?
6. **Backlinks + YouTube интеграции** из seobuilder2: переносить в MVP или в этап 4?
7. **Блог**: сохраняем per-site уникальный пул или идём в shared-pool с per-site rewrite? (Рекомендация — per-site.)
8. **Критерий uniqueness-score**: по каким фичам и с каким порогом считать? Нужен ли этот механизм вообще в MVP или достаточно seed'а?
9. **База данных vs файловая система** для хранения run-state и манифестов. MVP достаточно файлов; решение нужно для 1k+ сайтов.
10. **Lead-форма** на сайтах: куда шлём данные? (В seobuilder2 — PHP. В seobuilder3 — свой endpoint? сторонний Formspree?)
11. **Пул доменов**: покупаем ли заранее пул (как обсуждалось в анализе seobuilder2), или регистрируем at-build-time как сейчас?
12. **Мониторинг**: нужен ли в MVP health-check endpoint и автоперезапуск бота (systemd/pm2)?
