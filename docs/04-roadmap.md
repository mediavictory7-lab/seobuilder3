# 04 — Дорожная карта

От пустого репозитория до работающего генератора. Каждый этап завершается проверяемым артефактом. Порядок фиксированный — этапы не перескакиваем, пока не зелёный check у текущего.

Обозначения:
- **(2)** — переносим механизм из seobuilder2
- **(sb)** — переносим идею из sitebuilder
- **(new)** — пишем с нуля

---

## Этап 0. Каркас и инфраструктура разработки

**Цель**: скелет репозитория, который компилируется и проходит lint.

**Deliverable**:
- `package.json` с `"type": "module"`, TypeScript strict, ESM everywhere.
- `tsconfig.json` с `moduleResolution: "nodenext"`, `target: es2022`.
- Структура каталогов (см. ниже).
- Скрипты `build`, `typecheck`, `lint`, `test`, `dev`.
- Каркасные пустые файлы, импорты между ними проходят.
- CI-конфиг (GitHub Actions) — `pnpm typecheck && pnpm test`.

**Как проверить**:
```bash
pnpm i && pnpm typecheck && pnpm lint && pnpm test
# должно пройти без ошибок, даже если тестов почти нет
```

**Структура каталогов (целевая)**:
```
seobuilder3/
├── src/
│   ├── config.ts                      — env + секреты
│   ├── domain/                        — типы: Site, Page, Theme, …
│   │   ├── site.ts
│   │   ├── theme.ts
│   │   ├── page.ts
│   │   ├── section.ts
│   │   ├── article.ts
│   │   └── manifest.ts
│   ├── content/
│   │   ├── locale.ts                  — 17 языков
│   │   ├── brand.ts                   — density, synonyms
│   │   ├── rewrite/
│   │   │   ├── ai.ts                  — callAI (Claude→OpenAI fallback)
│   │   │   ├── strip-ai-patterns.ts
│   │   │   ├── strip-kw-tags.ts
│   │   │   ├── dedup-brand-words.ts
│   │   │   ├── limit-brand-density.ts
│   │   │   ├── limit-html-brand-density.ts
│   │   │   └── brand-synonyms-i18n.ts
│   │   ├── plan/                      — planner: разбор brief → план сайта
│   │   │   ├── plan-site.ts
│   │   │   ├── plan-blog.ts
│   │   │   └── identity.ts            — generateCompanyIdentity
│   │   └── generate/                  — генерация текстов секций
│   │       ├── section.ts
│   │       └── article.ts
│   ├── theme/
│   │   ├── palette.ts                 — OKLCH-генератор с WCAG
│   │   ├── typography.ts
│   │   ├── tokens.ts
│   │   └── seed.ts                    — site_seed → Theme
│   ├── templates/
│   │   ├── registry.ts
│   │   ├── layouts/
│   │   │   ├── home/
│   │   │   ├── category/
│   │   │   ├── article/
│   │   │   ├── blog-index/
│   │   │   └── service/
│   │   └── sections/
│   │       ├── hero/
│   │       │   ├── hero.v1.tsx
│   │       │   ├── hero.v2.tsx
│   │       │   └── hero.v3.tsx
│   │       ├── features/
│   │       ├── faq/
│   │       ├── reviews/
│   │       ├── cta/
│   │       ├── footer/
│   │       └── … (см. список в §3.4)
│   ├── compose/
│   │   ├── seed.ts                    — site_seed, section_seed
│   │   ├── pick-layout.ts
│   │   ├── pick-template.ts
│   │   ├── compatibility.ts
│   │   └── uniqueness-score.ts
│   ├── seo/
│   │   ├── head.tsx                   — <title>, <meta>, canonical, hreflang
│   │   ├── jsonld.ts                  — Organization, WebSite, Article, …
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   └── linker.ts                  — граф перелинковки
│   ├── render/
│   │   ├── renderer.ts                — preact renderToString
│   │   ├── page.ts                    — собирает Page → HTML
│   │   └── site.ts                    — собирает Site → dist
│   ├── deploy/
│   │   ├── deployer.ts                — интерфейс
│   │   ├── sftp.ts                    — MVP-реализация
│   │   └── cdn.ts                     — позже
│   ├── infra/
│   │   ├── cloudflare.ts
│   │   ├── domain.ts                  — Spaceship
│   │   ├── nginx.ts
│   │   ├── search-console.ts
│   │   ├── bing.ts
│   │   └── indexnow.ts
│   ├── cli/
│   │   ├── index.ts                   — sb3 build/deploy/status
│   │   └── parse-brief.ts
│   ├── bot/
│   │   └── telegram.ts                — /seogen, /status, /stop, /resume
│   ├── run/
│   │   ├── runner.ts                  — оркестратор пайплайна
│   │   ├── state.ts                   — RUN_{id}.json (как в sb2)
│   │   └── stages.ts
│   └── utils/
│       ├── hash.ts
│       ├── slug.ts
│       ├── html.ts
│       └── fs.ts
├── templates-data/
│   └── layouts/                       — JSON манифесты page-layout'ов
├── sites/                             — per-site inputs (brief + content)
│   └── example/
│       ├── brief.yaml
│       └── content/
├── dist/                              — артефакт билда (gitignored)
├── docs/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── CLAUDE.md
├── PROJECT_DESCRIPTION.md
├── README.md
├── .env.example
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── .github/workflows/ci.yml
```

---

## Этап 1. Доменная модель + zod-схемы

**Цель**: типизированное представление всего, с чем работает система.

**Deliverable**:
- `src/domain/*.ts`: Site, Page, SectionInstance, Template, Theme, Category, Article, Locale, SiteBrief, SiteManifest — как TS-типы **и** zod-схемы.
- `src/content/locale.ts`: константы 17 языков с кодами, rtl, primary-флагом.
- Unit-тесты на zod-валидацию (валидный/невалидный кейс на каждый тип).

**Как проверить**: `pnpm test tests/unit/domain/*.test.ts` — все зелёные. Импорт любого типа из `src/domain` в рандомный файл `src/` компилируется.

**Что переносим**: типологию языков **(2)**, структуру Content **(2)**.

---

## Этап 2. Генератор темы (palette + typography + tokens) от seed

**Цель**: детерминированный `Theme` по site_seed.

**Deliverable**:
- `theme/palette.ts`: `generatePalette(hue, mode) → Palette` с WCAG-контрастом.
- `theme/typography.ts`: пул пар `{heading, body}` (10+), выбор по seed.
- `theme/tokens.ts`: `radius`, `spacing`, `container` — от seed.
- `theme/seed.ts`: `deriveTheme(site_seed) → Theme`.
- CLI-команда `sb3 theme <seed>` → печатает сгенерированную тему (JSON + CSS custom properties).

**Как проверить**:
- `sb3 theme abc123` и `sb3 theme abc123` дают идентичный результат.
- Разные seed'ы дают разный hue buckets.
- 100 сгенерированных тем проходят WCAG AA для основных пар цветов (тест).

**Что переносим**: никакие палетки из исходников не тащим, но смотрим `seobuilder2/data/randomItems.cjs` **(2)** как reference для шрифтов и spacing'ов.

---

## Этап 3. Реестр шаблонов + первый рабочий шаблон

**Цель**: рендер одного `SectionInstance` по контракту.

**Deliverable**:
- `templates/registry.ts`: импорт через `glob` или явный, экспорт `Map<templateId, Template>`.
- Первый шаблон: `templates/sections/hero/hero.v1.tsx` с zod-контрактом, `meta`, `render`.
- Второй шаблон: `hero.v2.tsx` — с другим layout'ом, тот же контракт.
- `render/renderer.ts`: функция `renderSectionInstance(instance, ctx) → string` (preact renderToString).
- Тест: «дан SectionInstance{templateId:'hero.v1', props:{…}}, получил HTML, в HTML есть `title` и `cta.label`».

**Как проверить**:
```bash
pnpm test tests/unit/templates/hero.test.ts
pnpm sb3 render-section --template hero.v2 --props fixtures/hero-props.json
# печатает HTML секции в stdout
```

**Что переносим**: паттерн версий секций **(sb)**.

---

## Этап 4. Композитор страницы: layout + picks + совместимость

**Цель**: собрать `Page` из layout-манифеста и реестра шаблонов, детерминированно от seed.

**Deliverable**:
- `compose/seed.ts`: `deriveSectionSeed(site_seed, page_slug, section_id) → number`.
- `compose/pick-template.ts`: учитывает kind, совместимость, min/maxContentLength, seed.
- `compose/pick-layout.ts`: выбирает layout-манифест из пула.
- `compose/compatibility.ts`: правила конфликтов (set тегов активных секций).
- Пул **layout-манифестов** для `home`: ≥ 3 варианта.
- Пул секций (минимум): `hero` (×2), `features` (×2), `faq` (×1), `cta` (×2), `footer` (×1).

**Как проверить**:
```bash
sb3 compose --type home --seed abc123
# печатает список SectionInstance[] с templateId и props-каркасом
sb3 compose --type home --seed abc123
# идентичный результат
sb3 compose --type home --seed def456
# другой результат
```
Тест: «10 seed'ов дают ≥7 разных наборов templateId».

**Что переносим**: идею `decoreSection` **(sb)** как прото-compatibility.

---

## Этап 5. Первая полная страница с темой (без SEO и без контента-AI)

**Цель**: HTML-файл одной home на заглушенном контенте.

**Deliverable**:
- `render/page.ts`: Page → HTML с `<html><head><style>${themeCss}</style></head><body>${sections}</body></html>`.
- `render/site.ts`: Site → `dist/sites/{siteId}/index.html` + `assets/styles.css`.
- Тестовый brief + заранее подготовленный `content/en.json` со всеми полями.
- CLI `sb3 build sites/example/brief.yaml`.

**Как проверить**:
- `dist/sites/example/index.html` открывается в браузере, выглядит как сайт (не пустой div).
- Валидный HTML5 (html-validator в тесте).
- Тема корректно применяется (CSS переменные в `<head>`).

**Что переносим**: ничего нового.

---

## Этап 6. Мульти-страничный сайт (home + categories + articles + service + blog-index)

**Цель**: полноценный site с 20+ страницами, но всё ещё со заглушенным контентом.

**Deliverable**:
- Layout-манифесты для `category`, `article`, `blog-index`, `service`.
- Минимум ещё 8–10 шаблонов секций (article-hero×2, article-body×2, category-hero×2, articles-list×2, cta×1 extra).
- `render/site.ts` обходит все страницы и пишет структуру каталогов.
- Внутренняя перелинковка первого уровня: header nav, footer nav, breadcrumbs, related articles.

**Как проверить**:
- `dist/sites/example/` содержит: `index.html`, `category/*/index.html` (3–5), `blog/index.html`, `blog/*/index.html` (9–20), `about/index.html`, legal pages.
- Все внутренние ссылки резолвятся (тест crawler'ом).

**Что переносим**: идея `relatedPages` **(2)** как стартовая форма линкера.

---

## Этап 7. SEO-слой

**Цель**: сайт проходит стандартный SEO-аудит.

**Deliverable**:
- `seo/head.tsx`: title, description, canonical, hreflang, OG/Twitter.
- `seo/jsonld.ts`: генерация нужного JSON-LD на тип страницы.
- `seo/sitemap.ts`: `sitemap_index.xml` + `sitemap-{lang}.xml` + корректные lastmod.
- `seo/robots.ts`: `robots.txt`.
- `seo/linker.ts`: полный граф перелинковки с правилами из §3.6.4.
- Самопроверка: `sb3 seo-lint <siteId>` — lint на отсутствие/длину тайтлов, дубли, каноникалы, hreflang-пары симметричны, sitemap содержит все страницы и только их.

**Как проверить**:
- `sb3 seo-lint` — 0 errors.
- Ручная проверка через https://www.rich-results-test (локально или на staging).
- В каждом HTML есть `<title>`, `<meta description>`, `<link rel=canonical>`, JSON-LD соответствующего типа.

**Что переносим**: `seoMeta.cjs` **(2)** (состав JSON-LD), `seo-check.cjs` **(2)** (самопроверка).

---

## Этап 8. Мультиязычность (на заглушенном контенте)

**Цель**: тот же сайт рендерится на 4–5 тестовых языках, hreflang-грид замкнут.

**Deliverable**:
- `content/{lang}.json` × N (ручные переводы заглушек).
- Рендерер обходит языки, кладёт non-primary в `/{lang}/`.
- `hreflang` симметричен, `x-default` указывает на primary.
- Sitemap per-lang.
- lang-switcher в шапке (TSX-компонент).

**Как проверить**:
- Структура `dist/sites/example/` содержит `es/`, `de/`, `fr/` зеркало primary.
- Тест: для каждой страницы набор hreflang одинаковый и включает себя.

**Что переносим**: URL-стратегия **(2)**, langSwitcher **(2)**.

---

## Этап 9. AI-контент: rewrite + strip AI patterns + brand density

**Цель**: генерация реального контента из brief.

**Deliverable**:
- `content/rewrite/ai.ts`: `callAI` с Claude→OpenAI fallback.
- `content/rewrite/strip-ai-patterns.ts`, `strip-kw-tags.ts`, `dedup-brand-words.ts`, `limit-brand-density.ts`, `limit-html-brand-density.ts` — портированные на TS.
- `content/generate/section.ts`: для каждого `SectionInstance` заполнить props через AI с учётом contract и min/max.
- `content/plan/identity.ts`: `generateCompanyIdentity` **(2)**.
- `content/plan/plan-site.ts`: разбор brief → план (home + N categories + M articles + service).
- Первый реальный билд из живого `brief.yaml`.

**Как проверить**:
- `sb3 build sites/realtest/brief.yaml` → реальный сайт с осмысленным контентом.
- Плотность бренда в HTML ≤ 40 по счётчику.
- Нет AI-клише из списка (regex-тест).
- `<keyword>/<country>/<celebrity>` тегов в финальном HTML нет.

**Что переносим**: **(2)** все чистильщики контента, **(2)** `BRAND_SYNONYMS_I18N`, **(2)** `callAI` fallback.

---

## Этап 10. Блог: генерация статей

**Цель**: блог с N статьями на сайт, каждая — из секций, с FAQ и TOC при объёме.

**Deliverable**:
- `content/plan/plan-blog.ts`: пул топиков под тематику сайта, hash-slice.
- `content/generate/article.ts`: посекционная генерация + финальный агрегирующий проход.
- Article-layout'ы: ≥ 2 (с sidebar/без).
- Автоматический TOC и key-takeaways при word_count ≥ 1500.
- Перелинковка: article → 3 сиблинг-статьи.

**Как проверить**:
- Сайт содержит 9+ статей в 3+ категориях.
- 2 статьи с объёмом ≥1500 слов имеют TOC.
- У каждой статьи ≥3 исходящих внутренних ссылок.

**Что переносим**: `_generate-blog.cjs` **(2)** — идею пула топиков и non-promotional стиля.

---

## Этап 11. Переводы на 17 языков

**Цель**: каждый сайт генерится на 17 языках.

**Deliverable**:
- `content/plan/translate.ts`: AI-rewrite не-primary из primary JSON с сохранением тегов (аналог `_translate.cjs`).
- Параллелизация per-lang (worker pool).
- Обработка отставаний: build сайта проходит с subset языков, манифест фиксирует pending.

**Как проверить**:
- Один brief → `dist/sites/{id}/` содержит 17 языковых версий.
- В `manifest.json` — список готовых языков.
- hreflang покрывает только готовые языки.

**Что переносим**: `_translate.cjs` **(2)**.

---

## Этап 12. Runner + persistent state + CLI + Telegram-бот

**Цель**: многошаговый пайплайн с /resume, как в seobuilder2.

**Deliverable**:
- `run/runner.ts`: оркестратор 18 шагов (из которых первые 7 уже готовы).
- `run/state.ts`: `RUN_{id}.json` с возможностью resume.
- CLI: `sb3 build`, `sb3 resume <runId>`, `sb3 status <runId>`, `sb3 stop <runId>`.
- Telegram-бот: `/seogen`, `/status`, `/stop`, `/resume`, `/clear`, single-instance lock через PID-file.

**Как проверить**:
- Ctrl+C во время билда → `sb3 resume` продолжает с того же шага.
- Два одновременно запущенных бота — второй отказывается стартовать.

**Что переносим**: `seogen-runner.cjs` **(2)**, `seogen-bot.cjs` **(2)** — UX и state-машину.

---

## Этап 13. Инфра-интеграции: домен + Cloudflare + деплой

**Цель**: от brief до live-URL.

**Deliverable**:
- `infra/domain.ts` (Spaceship) — check availability, register, set NS.
- `infra/cloudflare.ts` — create zone, DNS, wait for activation, SSL.
- `infra/nginx.ts` — SSH exec, per-domain vhost.
- `deploy/sftp.ts` — загрузка артефакта.
- Этапы runner'а 8–11 живые.

**Как проверить**: `sb3 build && sb3 deploy` → https://<domain>/ возвращает HTTP 200 и содержит нашу home.

**Что переносим**: `lib/domain.cjs`, `lib/cloudflare.cjs`, SSH-логику nginx **(2)**.

---

## Этап 14. Индексация: Search Console + Bing + IndexNow

**Цель**: сайт попадает в поисковики.

**Deliverable**:
- `infra/search-console.ts`, `infra/bing.ts`, `infra/indexnow.ts`.
- Runner: шаги 12–15 живые.
- Верификация: curl + проверка `<title>`, `<h1>`.

**Как проверить**: новый сайт появляется в Search Console как verified; IndexNow-пинг возвращает 200.

**Что переносим**: **(2)** все три интеграции.

---

## Этап 15. Масштабный путь: CDN-деплой, uniqueness-score

**Цель**: подготовка к 1k+ сайтов.

**Deliverable**:
- `deploy/cdn.ts`: S3-совместимое хранилище + wildcard-хост.
- Переключатель `deploy_target: sftp | cdn` в конфиге.
- `compose/uniqueness-score.ts`: эвристика на «расстояние» нового сайта от последних 50.
- Пост-билд: сохранение fingerprint сайта в локальный индекс.

**Как проверить**: два сайта с близкими brief'ами дают uniqueness_score выше порога; если нет — rebuild с seed+1.

**Что переносим**: ничего — новая логика.

---

## Этап 16. (Опц.) Backlinks + YouTube + GA4

**Цель**: довести обвязку до уровня seobuilder2.

**Deliverable**: `infra/backlinks.ts`, `infra/youtube.ts`, `infra/ga4.ts` — порт механик. Шаги 16–17 runner'а.

**Как проверить**: после `sb3 build && sb3 deploy` — GitHub/Telegraph/Blogger получили свой пост со ссылкой на сайт; YouTube-канал создан.

**Что переносим**: **(2)** всё, включая OAuth-флоу и Tumblr OAuth 1.0a.

---

## Контрольные точки

| После этапа | Можно сделать |
|---|---|
| 5 | Показать одну живую home с темой одному человеку |
| 8 | Презентация мульти-язычного сайта без AI |
| 9 | Полнофункциональный MVP на английском |
| 11 | Полнофункциональный на 17 языках |
| 14 | Реальный продакшн на первых 10 сайтах |
| 15 | Готовы к 1k сайтов |
| 16 | Полная замена seobuilder2 |

---

## Критерии «приступаем к реализации»

Перед этапом 0 от меня нужны ответы на открытые вопросы (см. список в `03-architecture.md` §3.11 и в итоговом сообщении сессии).

Минимум, без которого не стартуем: **(1) рендерер (preact или другое)**, **(2) деплой MVP (SFTP или сразу S3)**, **(3) список языков (16 или 17)**.

Остальные решения можно отложить до соответствующих этапов.
