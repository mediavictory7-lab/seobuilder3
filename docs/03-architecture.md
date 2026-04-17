# 03 — Архитектура seobuilder3

Это проектное решение на бумаге. Код — в следующей сессии.

---

## 3.1. Принципы

0. **Anti-fingerprint — первая обязанность.** Любая фича, модуль, зависимость и строка кода оцениваются по вопросу «создаёт ли это признак, по которому Google может связать два сайта сети». Если ответ «да» или «возможно» — фича проектируется через абстракцию + ротацию с записью выбора в SQLite. Это правило жёстче остальных и перекрывает их при конфликте. См. §3.13.
1. **Данные отдельно от представления.** Контент хранится в валидируемом JSON (zod-схема), шаблоны его только рендерят. Шаблону запрещено знать конкретный бренд, язык или домен — только через props.
2. **Композиция вместо размножения кода.** Страница = манифест ссылок на шаблоны секций + props. Новая «главная» не требует нового кода, только новой композиции.
3. **Детерминизм от seed.** Всё, что «рандомизируется» (выбор шаблонов, тема, порядок), — это функция `f(site_seed, page_slug, section_id)`. Один и тот же site_seed даёт идентичный сайт. Это основа воспроизводимости и аудита.
4. **Уникальность соседних сайтов как прямое требование.** Расстояние между двумя сайтами в пространстве (тема × layout × шаблоны секций × порядок × render-система × LLM-persona × hosting × DNS) должно быть достаточно большим, чтобы сеть не кластеризовалась. Проверяется anti-fingerprint-валидатором на build/deploy-time.
5. **Шаблоны ничего не знают о стиле.** Все цвета/размеры/радиусы — CSS-переменные, заданные темой. Шаблон, прописавший `color: #123`, считается сломанным.
6. **Мультиязычность первого класса.** Каждый артефакт сайта — набор `{lang → content}`; любая фича обязана ответить на вопрос «как это работает для 17 языков».
7. **SEO-слой — не декоратор.** Title, canonical, hreflang, JSON-LD, sitemap, robots — часть пайплайна, а не добавка. Build завершается только после прохождения SEO-линтера **и** anti-fingerprint-линтера.
8. **Артефакт сайта — иммутабелен и описывает себя.** Каждый build кладёт `manifest.json` с seed, render-system, темой, выбранными LLM-конфигом и персоной, списком страниц. По манифесту можно воспроизвести сайт или сравнить два билда.
9. **Масштаб закладываем в интерфейсы, не в реализацию.** `HostProvider`, `DnsProvider`, `DomainProvider`, `LLMProvider`, `SiteRenderer`, `Deployer` — все абстракции с первого дня, чтобы пул адаптеров можно было расширять без переписывания бизнес-логики.
10. **Без over-engineering.** Абстракция появляется только там, где у неё есть требование ротации (т.е. ≥2 реализации от старта) или где anti-fingerprint её прямо диктует. Спекулятивных слоёв не строим.

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

**Выбор модели и персоны**: при первом генерейшне сайта ему присваивается `(model, persona)` из пула `llm_configs` (§3.11, §3.13 слой 6). Связка фиксируется в `sites.llm_config_id` и не меняется. Это значит: все тексты одного сайта написаны одной «рукой» (стилистическая цельность), но сети в целом — разными «руками».

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

Только **статика**. Причина: 10k сайтов × 17 языков × 10–50 страниц = миллионы HTML. Сервер не нужен.

Рендер-систем в проекте **несколько** — это требование anti-fingerprint (§3.13 слой 5). Базовая — `preact + preact-render-to-string` (TSX-шаблоны); другие — Eleventy+Nunjucks, Astro static export, hand-rolled BEM-рендерер. Сайт получает одну render-систему при первом деплое и не меняет её. Общий интерфейс `SiteRenderer: (site, theme, contentByLang) → { files }` — единственное, что их объединяет.

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

## 3.11. Хранение состояния (SQLite + drizzle-orm)

Все ротации, распределения, идентичности, расписания и аудит живут в единой SQLite-базе `seobuilder3.db`. Drizzle-orm — схема в TypeScript, drizzle-kit — миграции.

### 3.11.1. Почему SQLite, не Postgres

- Одна запись per-operation, один процесс-владелец (runner) — классический SQLite use-case.
- На 10 000 сайтов БД ≈ 100–300 МБ, ноль проблем с производительностью.
- Миграция на Postgres, если понадобится, — прозрачна через drizzle (`pg` adapter).
- Репликация — litestream в S3-совместимое хранилище.

### 3.11.2. Группы таблиц

| Группа | Таблицы | Назначение |
|---|---|---|
| **Identity** | `google_identities`, `browser_profiles`, `proxies` | §3.13 слой 3 |
| **Hosting & infra** | `hosts`, `dns_providers`, `infra_profiles` | §3.13 слои 1, 2, 11 |
| **Domains** | `domains`, `registrars` | §3.13 слой 4 |
| **Sites & content** | `sites`, `pages`, `articles`, `categories`, `content_profiles` | §3.13 слой 7 |
| **Rendering** | `render_systems`, `themes` | §3.13 слой 5 |
| **LLM** | `llm_configs`, `personas` | §3.13 слой 6 |
| **SEO** | `seo_profiles` | §3.13 слой 8 |
| **Queues & schedules** | `deploy_queue`, `publish_queue`, `indexation_queue`, `run_state` | §3.13 слой 10 |
| **Audit** | `site_metrics`, `audit_events`, `fingerprint_snapshots` | §3.12 |

### 3.11.3. Persistence-инварианты

1. **Ни один ротационный выбор не делается на лету.** Провайдер, модель, persona, render-system — сначала записываются в таблицу выбора, затем применяются. Только так возможен аудит и воспроизведение.
2. **Все исходящие события имеют строку в очереди** (`indexation_queue`, `deploy_queue`, `publish_queue`) с `scheduled_at`, `submitted_at`, `error`. Прямые вызовы API без очереди — анти-паттерн.
3. **Site ↔ profile-связки постоянны.** После первого присвоения `site.render_system_id`, `site.llm_config_id`, `site.content_profile_id`, `site.seo_profile_id`, `site.infra_profile_id` не меняются. Смена = разрыв истории = footprint.
4. **Backup**: ежедневный `sqlite3 .backup` в объектное хранилище. Drizzle-kit snapshots схемы — в git.

---

## 3.12. Мониторинг и детекция дрейфа

Сеть сайтов — live-система. Footprint'ы могут появиться не только в момент деплоя, но и постепенно (например, обновление библиотеки меняет порядок CSS-правил одинаково у всех сайтов одной render-системы — и начинается сигнатурное совпадение там, где его не было).

### 3.12.1. Что отслеживаем

1. **Индексация** — GSC API в batch-режиме через Google-идентичности (§3.13 слой 3). На сайт: сколько URL в индексе, дата последнего sitemap-fetch, наличие manual/algorithmic action. Храним в `site_metrics` с датой.
2. **Fingerprint drift** — еженедельный скан всех живых сайтов: извлекается feature-vector (DOM-сигнатура через нормализованный AST страницы, хэш CSS-классов первого уровня, IP/ASN, NS-набор, SSL-issuer, HTTP-заголовки). Хэш сохраняется в `fingerprint_snapshots`. При совпадении >порога между ≥3 сайтами — алерт.
3. **Distribution dashboards** — текущее распределение сети по каждому слою §3.13 (провайдеры, регистраторы, модели, персоны, seo-профили, render-системы). Отклонение >5 % от целевого — warning; >10 % — критично, новые сайты в этот ведро не генерируются, пока баланс не восстановлен.
4. **Expiry alerts** — домены с renewal в ближайшие 30 дней, SSL <14 дней, `google_identities.refresh_token` близок к истечению.

### 3.12.2. Каналы

- Telegram-бот — суточная сводка + алерты на критичные события.
- `sb3 network audit` — полный отчёт в stdout.
- `sb3 drift-scan` — запуск fingerprint-drift-сканера вручную.
- Опционально: Grafana + Prometheus или Plausible для дашбордов (см. §3.14).

### 3.12.3. Что **не** делаем

- Не встраиваем никаких аналитик/мониторингов в **сами сайты**. Все аналитики — только server-side через официальные API Google/Bing, вне пользовательского браузера. Любой внешний tracker (Sentry, LogRocket, PostHog) на сайтах — прямой footprint, запрещён.

---

## 3.13. Anti-Fingerprint Architecture

### 3.13.0. Контекст

seobuilder2 попал под массовую деиндексацию Google: вся сеть сайтов вылетела из индекса одновременно, одним ударом. Это классическая сигнатура **footprint-кластеризации** — Google распознал сайты как единую сеть по общим техническим признакам и применил санкцию к кластеру как к целому.

seobuilder3 проектируется вокруг обратного требования: произвести сайт, который **нельзя** связать с другими сайтами сети никакой комбинацией общедоступных признаков. Это не декоративное свойство — это главная цель архитектуры. Любой модуль, создающий общий признак между сайтами, считается дефектным и переделывается.

Раздел описывает 11 слоёв уникализации в порядке убывания важности. По каждому слою указан: footprint (что именно мы устраняем), требование (что система делает), реализация (таблицы/интерфейсы), правила ротации с долями, запреты. Таблицы SQLite приведены схематически; канонические drizzle-схемы — в `src/db/schema/` (создаются на этапе 1 roadmap'а).

### 3.13.1. Слой 1. Hosting IP diversity

**Footprint**: несколько сайтов на одном IP, одной /24, одном ASN читаются Google как единая сеть. Reverse-DNS лукапы по IP — стандартный инструмент anti-spam-команд поисковиков.

**Требование**: сайт разворачивается на одном из ≥5 независимых провайдеров, распределение по ASN и подсетям балансируется.

**Распределение (default)**:

| Провайдер | ASN | Доля |
|---|---|---|
| Hetzner | AS24940 | 25 % |
| DigitalOcean | AS14061 | 20 % |
| Vultr | AS20473 | 20 % |
| OVH | AS16276 | 15 % |
| AWS Lightsail | AS16509 | 10 % |
| Прочие (Linode, UpCloud, Contabo) | разные | 10 % |

**Реализация**:
- Таблица `hosts(id, provider, asn, region, ip, ssh_host, ssh_key_ref, capacity, current_load, status, created_at)`.
- `HostProvider` — абстрактный интерфейс: `provision(siteId)`, `deploy(siteId, artifact)`, `teardown(siteId)`, `inventory()`. Один адаптер на провайдера в `src/infra/hosts/{provider}.ts`.
- Выбор хоста на deploy: фильтр по `status=available`, затем по load, затем по целевому распределению.

**Правила ротации**:
- ≤ **10 сайтов на один /24**.
- ≤ **20 сайтов на одного провайдера** в сумме (пересматривается при росте сети).
- ≤ **5 сайтов в одном регионе** провайдера (гео-диверсификация).

**Запрещено**:
- Общий reverse-proxy / shared nginx / shared load-balancer на несколько сайтов сети.
- Деплой двух сайтов одного дня на один IP.
- Общий jump-host для SSH-доступа ко всей сети (это и tooling-footprint, и operational risk).

### 3.13.2. Слой 2. Nameserver diversity

**Footprint**: одинаковый набор NS-записей — один из первых сигналов в публичных DNS-базах (SecurityTrails, DNSdumpster). WHOIS хранит исторические NS, менять их задним числом не получается.

**Требование**: домен живёт у одного из ≥4 независимых DNS-провайдеров; NS-строки визуально выглядят как разные сервисы.

**Распределение (default)**:

| Провайдер | Доля |
|---|---|
| Cloudflare DNS | 30 % |
| AWS Route 53 | 20 % |
| DNS регистратора (Spaceship / Namecheap / Porkbun / Dynadot) | 30 % |
| DNSimple / Gandi / deSEC | 20 % |

**Реализация**:
- Таблица `dns_providers(id, name, api_endpoint, credentials_ref, ns_template, current_load, active)`.
- `DnsProvider` интерфейс: `createZone(domain)`, `setRecords(domain, records[])`, `delegate(domain, ns[])`, `verify()`.
- Выбор провайдера на регистрацию домена: `hash(domain + month)` mod weighted-pool + load awareness.

**Правила ротации**:
- Провайдер фиксируется за доменом **навсегда**: смена NS после регистрации создаёт коррелированный event в истории DNS, который anti-spam-инструменты используют как дополнительный признак.
- ≤ 40 % доменов сети на одном DNS-провайдере.

**Запрещено**:
- Единый self-hosted PowerDNS/BIND на всю сеть — самый яркий footprint.
- Общие NS-хосты (`ns1.ourcompany.com`) для >1 сайта.
- Автоматический failover NS при сбое без ручной эскалации.

### 3.13.3. Слой 3. Google-identity separation (критичный)

**Footprint**: верификация нескольких сайтов в Search Console под одним Google-аккаунтом — **прямая** связка в внутренних системах Google, которая не имеет публичного эквивалента и не обнаруживается внешним аудитом, но известна Google целиком. Один GA4 property с кодом на N сайтах — то же самое, только уже публично видимое в HTML.

**Требование**: ≥30 Google-идентичностей в ротации; каждая прогрета и ассоциирована с постоянным browser-отпечатком, работающим через постоянный прокси.

**Реализация**:
- Таблица `google_identities(id, email, ga4_property_id, gtm_container_id, gsc_refresh_token, browser_profile_id, proxy_id, warmed_since, sites_assigned_count, max_sites, status)`.
- Таблица `browser_profiles(id, provider, profile_id, user_agent, screen, timezone, locale, fingerprint_fp)` — провайдер AdsPower / Octo Browser / Multilogin (выбор — см. §3.14).
- Таблица `proxies(id, type, provider, endpoint, country, city, credentials_ref, assigned_identity_id)` — mobile + residential; одна прокси ≤ 2 identity, желательно 1:1.
- Создание identity — **вне main pipeline**, отдельный onboarding-flow (ручной или полуавтоматический) с периодом прогрева **28–35 дней** (точное число — см. §3.14).

**Правила ротации**:
- **≤ 3–5 сайтов на одну identity** (точный лимит фиксируется в `max_sites`, см. §3.14).
- GA4 property и GTM container создаются **per-site** и привязываются к `sites`. Не переиспользуются ни при каких условиях.
- Identity с `sites_assigned_count = max_sites` переводится в `retired`, не используется для новых верификаций.
- Логин в identity возможен **только** через закреплённый browser-profile через закреплённый proxy. Любое отклонение — инцидент.

**Запрещено**:
- Один Google-аккаунт для верификации ≥6 сайтов.
- Shared GA4 property или GTM container между сайтами.
- Использование identity до истечения срока прогрева.
- Смена browser-profile или proxy у уже используемой identity.

### 3.13.4. Слой 4. Registrar + TLD diversity

**Footprint**: массовая регистрация одного TLD у одного регистратора в узком временном окне — один из старейших паттернов сети в глазах поисковика и любых WHOIS-aggregators.

**Требование**: ≥5 регистраторов, ≥6 TLD в ротации; регистрация распределена во времени.

**Распределение регистраторов (default)**:

| Регистратор | Доля |
|---|---|
| Spaceship | 40 % |
| Namecheap | 20 % |
| Porkbun | 20 % |
| Cloudflare Registrar | 10 % |
| Dynadot | 10 % |

**Распределение TLD (default)**:

| TLD | Доля |
|---|---|
| .online | 40 % |
| .com | 25 % |
| .net | 15 % |
| .co | 10 % |
| .site / .store / .space (разбросом) | 10 % |

**Реализация**:
- Таблица `domains(id, name, tld, registrar, whois_privacy_provider, registered_at, registered_by_identity, aging_ready_at, launch_scheduled_at, launched_at, status, site_id)`.
- `DomainProvider` интерфейс: `checkAvailability(domain)`, `register(domain, contactRef)`, `setNameservers(domain, ns[])`, `renew(domain)`. Адаптер на каждого регистратора; `Spaceship` переиспользуется из seobuilder2.
- Веса распределения — динамические: при каждой новой регистрации выбор пары (registrar, tld) тянет сеть к целевому распределению.

**Правила ротации**:
- ≤ **45 % сети** на одном регистраторе.
- ≤ **7 доменов в неделю** регистрируется на всю сеть (синхронно с §3.13 слой 10).
- Различные whois-контакты (privacy-прокси разных регистраторов отличаются).

**Запрещено**:
- Bulk-регистрация одного TLD у одного регистратора в один день.
- Один аккаунт регистратора для >50 % сети (whois-контакт — footprint).
- Шаблонные имена доменов (`brand-1`, `best-keyword-site`, `keyword-online-2026`) — анти-паттерн.

### 3.13.5. Слой 5. Template / HTML fingerprint diversity

**Footprint**: одинаковые classList, структура DOM, порядок `<script>`/`<style>`, meta-комментарии, общий `styles.css` — всё это сигнатурно. «Скины» одного шаблона не помогают: string-matching по нормализованному DOM вскроет общий генератор.

**Требование**: ≥3 физически разных render-системы в пуле; каждый сайт закрепляется за одной системой навсегда.

**Стартовый пул**:

1. **Preact SSR + Tailwind-like utility CSS** (сгенерированный, не CDN, только используемые классы).
2. **Preact SSR + hand-rolled BEM CSS** (semantic-naming, отдельный стилистический backend).
3. **Eleventy + Nunjucks + utility CSS-variables, semantic HTML5 минимально**.
4. **Astro static export + CSS modules**.
5. *(резерв)* tagged-template literals с inline critical CSS, без фреймворка.

**Реализация**:
- Каталог `src/render-systems/{name}/`; каждый экспортирует `render: (site, theme, contentByLang) => { files: Map<path, content> }`.
- Таблица `render_systems(id, name, type, class_naming_convention, dom_style, assigned_sites_count, active)`.
- `sites.render_system_id` фиксируется при первом деплое, **не меняется**.

**Правила ротации**:
- ≤ **30 % сети** на одном рендерере.
- Новые рендереры добавляются по мере роста сети; соотношения пересчитываются.

**Запрещено**:
- `<meta name="generator">` с любым значением, указывающим на seobuilder3.
- HTML-комментарий с подписью билдера в начале/конце документа.
- Общие class-names (`.sb3-hero`, `.seo-section`) у сайтов разных рендереров.
- Общий `styles.css` между рендерерами — у каждого свой артефакт, своя минимизация, свой порядок правил.
- Шаринг фрагментов шаблона (header/footer/form) между рендерерами — каждая система пишет эти узлы своими руками в своём стиле.

### 3.13.6. Слой 6. LLM model + persona diversity

**Footprint**: у крупных LLM есть стилометрически узнаваемые риторические паттерны. Пул из 100 сайтов, написанных одной моделью под одним system-prompt, — стилистически один автор. OpenAI и Anthropic логируют system-prompts — если они идентичны, это отдельный ненужный сигнал.

**Требование**: ротация моделей и персон per-site.

**Распределение моделей (default)**:

| Модель | Доля |
|---|---|
| GPT-5.4-mini | 30 % |
| Claude Haiku 4.5 | 30 % |
| Claude Sonnet 4.5 | 15 % |
| Gemini 3 Flash | 15 % |
| DeepSeek / Qwen / Mistral (ротация) | 10 % |

**Persona pool** (20–30 персон). Каждая персона задаёт:
- среднюю длину предложения (короткие / средние / длинные);
- любимые риторические ходы (вопросы, метафоры, цифры, цитаты экспертов);
- частоту списков vs прозы (40/60, 10/90, 70/30);
- уровень формальности (разговорный → академический);
- склонность к FAQ / TL;DR / numbered steps;
- лексические триггеры (избегает / предпочитает определённые слова);
- имя-псевдоним «писателя», под которым пишется (молодой аналитик / опытный трейдер / скептичный журналист / преподаватель-педант и т. д.).

**Реализация**:
- Таблица `llm_configs(id, model, persona_id, style_params_json, sites_using_count)`.
- Таблица `personas(id, name, sentence_length_profile, list_proportion, formality, features_json)`.
- System-prompt **синтезируется** из `personas.features_json` и шаблона per-model; **не хранится** как единая строка. Две системы не должны давать идентичный system-prompt.
- Сайту присваивается одна связка `(model, persona)` при первом генерейшне; пишется в `sites.llm_config_id`, не меняется.

**Правила ротации**:
- ≤ **35 % сети** на одной модели.
- ≤ **5 сайтов** на одной персоне.

**Запрещено**:
- Все сайты на одной модели и одном system-prompt.
- Копирование system-prompt из seobuilder2 без изменений.
- Hardcoded style-guide в коде шаблонов (живёт в `personas`).

### 3.13.7. Слой 7. Content pattern diversity

**Footprint**: «все сайты сети имеют 15 страниц, все статьи 1800 слов, у всех FAQ из 6 вопросов, у всех один и тот же URL-паттерн» — контент-сигнатура, легко считываемая Google по sitemap + структуре страниц.

**Требование**: `content_profile` закреплён за сайтом и заметно отличается от других.

**Оси вариации**:

- **Объём статей**: Site A — фиксированные 1500 ± 10 %, Site B — 2500–4000 разбросом, Site C — 800–5000 широким разбросом.
- **Структурные фичи**: FAQ-блок (есть / только pillar / нет), TL;DR, boxed summary, таблицы сравнения, key-takeaways, pros-cons-блок — каждая toggled per-site.
- **URL-паттерны**: `/article-slug/`, `/blog/2026/slug/`, `/posts/{slug}`, `/category/{cat}/{slug}.html`, `/{slug}.html`.
- **Pages count**: разброс 10–50 (не у всех 15).
- **Частота публикации**: сайт-«взрыв» (весь контент в день запуска) vs сайт-«нарастающий» (delayed publishing 4–8 недель через `publish_queue`).

**Реализация**:
- Таблица `content_profiles(id, article_length_range_json, structure_features_json, url_pattern, publication_schedule_type, pages_count)`.
- Привязка `sites.content_profile_id` навсегда.
- `publish_queue(site_id, content_id, scheduled_at, published_at, status)` — для нарастающих.

**Правила ротации**:
- ≤ **40 %** сайтов с одним pages-count.
- ≤ **30 %** сайтов с одним URL-паттерном.

**Запрещено**:
- Bulk-публикация всех страниц всех сайтов в одну дату.
- Одинаковое число H2 на всех статьях сети (если content-generator детерминирует его глобально — рефакторинг).

### 3.13.8. Слой 8. Schema / Meta diversity

**Footprint**: одинаковый JSON-LD stack на всех сайтах сети — сигнатура, вычисляемая Google автоматически при парсинге страниц.

**Требование**: `seo_profile` закреплён за сайтом.

**Распределение**:

| Профиль | Состав JSON-LD | Доля |
|---|---|---|
| Full | Article + FAQPage + BreadcrumbList + Organization + WebSite | 30 % |
| Standard | Article + Organization | 40 % |
| Minimal | Article | 20 % |
| No-JSONLD | — | 10 % |

**Дополнительные оси**:

- OG-image aspect ratio: 1200×630, 1200×1200, 1080×1080 — per-site.
- Twitter Cards: включены / выключены — распределено.
- `robots.txt` стиль: минимальный / подробный / с `Crawl-delay` / без sitemap-ссылки / с.
- Sitemap формат: XML sitemap / sitemap index / RSS-совместимый (часть).

**Реализация**:
- Таблица `seo_profiles(id, jsonld_set, og_image_aspect, twitter_card_enabled, robots_style, sitemap_format)`.
- `sites.seo_profile_id` фиксируется.

**Запрещено**:
- Full JSON-LD stack у >50 % сети.
- Одинаковый байт-в-байт `robots.txt` у >50 % сети.

### 3.13.9. Слой 9. Zero interlinking between own sites (абсолютный запрет)

**Footprint**: любая ссылка с одного сайта сети на другой — явная связка, подтверждающая сеть в один клик. Самый дешёвый для Google сигнал.

**Требование**: outbound-граф каждого сайта **не пересекается** с множеством доменов сети. Ни в футере, ни в статьях, ни через 301, ни в «our network» виджете, ни как affiliate-redirect, ни в `<link rel="me">`, ни где-либо ещё.

**Реализация**:
- Каждый сайт имеет свой `outbound_link_pool` (Wikipedia, Investopedia, регуляторы, официальные брокеры, новостные агентства, академические статьи) — подбирается под тематику.
- **Блокирующий линтер `anti-fingerprint:interlink-lint`** перед deploy: обходит HTML артефакта, извлекает все `href` вне текущего домена, сверяет с `SELECT name FROM domains`. Любое совпадение — **fatal, deploy падает**.
- Дополнительный AST-линтер кода: в шаблонах запрещены конструкции, принимающие массив «own sites» (нет `OurNetwork`, `OtherProjects`, `RelatedSites` компонентов).

**Запрещено**:
- Любая ссылка A → B, где A и B — в `domains`.
- Переадресации через собственные промежуточные домены.
- Общий outbound link pool у нескольких сайтов (это тоже связка — Google видит совпадение авторитетных ссылок).

### 3.13.10. Слой 10. Launch timing diversification

**Footprint**: «100 новых доменов зарегистрированы за 3 дня, все индексируются в одну неделю» — anomaly-detection у любого поисковика срабатывает мгновенно.

**Требование**: регистрация и запуск разнесены во времени на месяцы.

**Правила**:

- ≤ **5 сайтов в неделю** в production-launch.
- Распределение запуска 100 сайтов — на **5–7 месяцев**.
- **Aging period**: от регистрации домена до первой публикации — **≥ 30 дней**. В это время домен обслуживается DNS-провайдером (parking-page или пустая заглушка), не пингуется в IndexNow/GSC, не присутствует в sitemap.
- Разнесение submit'ов: `scheduled_at_gsc`, `scheduled_at_indexnow`, `scheduled_at_bing` — разные времена, спред **2–4 суток** после deploy.

**Реализация**:
- Таблица `deploy_queue(site_id, status, deploy_scheduled_at, deployed_at)`.
- Таблица `indexation_queue(site_id, service, scheduled_at, submitted_at, error)`.
- Планировщик в TS (простой loop + cron-like expressions) читает очереди, уважает scheduled_at.

**Запрещено**:
- Bulk-deploy всех сайтов недели в одну дату.
- Синхронный IndexNow-ping на пачку сайтов.
- Автоматический «ускоритель индексации» (мотивирующий bulk-submit) без ручного подтверждения.

### 3.13.11. Слой 11. Operational / infrastructure patterns

**Footprint**: общие технические детали — SSL-issuer, `Server` header, порядок HTTP-заголовков, формат favicon, формат OG-image — складываются в сигнатуру даже при разнесённых IP, NS и контенте.

**Требование**: `infra_profile` закреплён за сайтом, распределён по сети.

**Оси вариации**:

- **SSL issuer**: Let's Encrypt 50 % / Google Trust Services 20 % / ZeroSSL 20 % / Buypass 10 %. Настраивается через Caddy (`acme_ca`) или Traefik (`certificatesResolvers`).
- **`Server` HTTP header**: убран / `nginx` / `Caddy` / произвольная строка (`apache`, пустой).
- **`Crawl-delay`**: часть сайтов с `Crawl-delay: 5`, часть без.
- **Cache-control стратегия**: `public, max-age=3600` / `public, max-age=86400` / `no-cache` (для части).
- **Favicon формат**: `.ico` / `.png` / `.svg`.
- **OG-image формат**: JPG / WebP / PNG.

**Реализация**:
- Таблица `infra_profiles(id, ssl_issuer, server_header_style, crawl_delay, cache_strategy, favicon_format, og_image_format)`.
- Применяется при деплое: веб-сервер на хосте (Caddy/nginx) конфигурируется через шаблон per-profile.

**Запрещено**:
- Все сайты на Let's Encrypt (даже если это проще).
- Идентичные HTTP-заголовки у всей сети.

### 3.13.12. Anti-fingerprint validator (sum)

На этапе deploy (roadmap этап 11) работает сквозной валидатор, блокирующий публикацию до прохождения всех проверок:

1. `interlink-lint` — нет ссылок на `domains.name`.
2. `shared-ip-check` — на выбранном IP / /24 нет других сайтов сверх лимита.
3. `shared-ns-check` — NS-набор не совпадает с >40 % других сайтов.
4. `shared-ga4-check` — `ga4_property_id` уникален в `sites`.
5. `render-distribution-check` — ≤30 %.
6. `llm-distribution-check` — ≤35 % на модель, ≤5 сайтов на персону.
7. `registrar-distribution-check` — ≤45 %.
8. `identity-load-check` — identity не превысила `max_sites`.
9. `aging-period-check` — `domains.aging_ready_at ≤ now`.
10. `generator-signature-check` — в HTML и заголовках нет подписи.
11. `tracker-signature-check` — в HTML нет внешних трекеров кроме разрешённого per-site GA4.

Любой FAIL → deploy не происходит, сайт откатывается в очередь с причиной.

---

## 3.14. Открытые вопросы

Собраны вопросы, требующие решения перед реализацией. Решения из предыдущих итераций, которые уже утверждены, — в `CLAUDE.md` (раздел «Утверждённые решения»).

### Критичные (без них не стартуем этапы 2–3 roadmap'а)

1. **Browser-fingerprint провайдер для Google-идентичностей**: AdsPower / Octo Browser / Multilogin / GoLogin. От этого зависит API для автоматизации логинов (этап 2 roadmap).
2. **Прокси-провайдер** для Google-идентичностей: какие именно mobile + residential пулы? (Soax, Oxylabs, Smartproxy, Bright Data — каждый с разной ценой и качеством.)
3. **`max_sites` на identity**: 3, 4 или 5? Консервативный выбор (3) снижает риск, но требует больше identity в обороте.
4. **Период прогрева identity**: 28 или 35 дней? И какой минимальный activity-pattern (логины/письма/YouTube) считается достаточным?
5. **Стартовый набор хостинг-провайдеров для MVP**: достаточно ли Hetzner + DigitalOcean + Vultr на этапе 3, с добавлением OVH и Lightsail позже? Или брать все 5 сразу?
6. **Регистраторы в MVP**: Spaceship + Namecheap + Porkbun хватит на старт, или сразу включаем Cloudflare Registrar и Dynadot?

### Важные (решаем до соответствующих этапов)

7. **DNS-провайдер в MVP**: Cloudflare + Route 53 + DNS регистратора (Namecheap/Porkbun) — достаточно? Нужен ли DNSimple/Gandi сразу?
8. **Render-системы в стартовом пуле**: preact+Tailwind, preact+BEM, Eleventy — этого достаточно для ≤30 % на одну, пока сеть ≤ 10 сайтов. На ≥20 сайтах нужен 4-й. Когда добавляем Astro?
9. **Фактические модели**: какие ключи/квоты у нас есть для GPT-5.4-mini, Claude Haiku 4.5, Claude Sonnet 4.5, Gemini 3 Flash, DeepSeek? Стартуем с меньшим пулом, если часть недоступна?
10. **Persona pool**: кто его создаёт в MVP — генерим LLM'ом (seed-list из 30 описаний) или пишем вручную? Второй вариант дороже, но предсказуемее.
11. **Content profile ratios**: утвердить ли default-распределение (article length, FAQ/TL;DR/tables toggling, URL pattern) или адаптировать после первых 10 сайтов?
12. **Backup и репликация SQLite**: litestream (async replicate в S3) vs простой `sqlite3 .backup` в cron? Первое устойчивее, второе проще.
13. **Мониторинг**: Grafana + Prometheus с самого начала, или Telegram-алерты + стоплоги + `sb3 network audit` достаточно для MVP?
14. **Lead-форма на сайтах**: свой Node endpoint (на одном из хостов сети — но это footprint) vs Formspree/Web3Forms vs endpoint на уникальном «технологическом» домене (не в `domains`). Выбор третьего варианта — рекомендуемый, но требует отдельного SSL и не-сетевого provider.
15. **Пул доменов aging-ready**: покупаем ли заранее пул и держим в aging, или регистрируем per-brief с обязательными 30 днями paroжа? (Рекомендуется первое — даёт запас и ритмичность.)
16. **Шрифты**: self-host (woff2 subset per-lang) или Google Fonts? Google Fonts — дополнительная связка (referer в Google-логах), self-host безопаснее. (Рекомендация — self-host.)
17. **Изображения**: Replicate / Cloudflare Images / Black Forest Labs / локальная генерация? Каждый — отдельный footprint-вектор (например, Replicate-URL в `srcset` — footprint).
18. **Visualization network audit**: нужен ли web-dashboard (`sb3 dashboard`), или CLI-отчёта достаточно?
19. **Мониторинг бота**: systemd / pm2 / docker — что выбираем?
20. **Когда переходим с SQLite на Postgres** — при какой численности сайтов/операций?
