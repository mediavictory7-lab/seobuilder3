# CLAUDE.md

Инструкции для будущих сессий Claude Code в этом репозитории. Прочитай до того, как что-то менять.

---

## Что это за проект

seobuilder3 — генератор SEO-сайтов. Синтез двух предшественников: `seobuilder2` (SEO-ядро) и `sitebuilder` (шаблонное разнообразие). См. `PROJECT_DESCRIPTION.md`.

**Пути к предшественникам** (читать можно, редактировать — нельзя):
- `C:/ZProjects/seobuilder2/site-builder/` — действующий SEO-генератор на CommonJS
- `C:/ZProjects/site-builder/` — генератор лендингов на CommonJS

---

## Стек

- **Node.js ≥ 20**, **TypeScript strict**, **ESM only** (`"type": "module"`).
- `moduleResolution: "nodenext"`, импорты с `.js`-расширениями в TS-исходниках.
- Пакетный менеджер — `pnpm`.
- Рендер — `preact` SSR (если владелец подтвердит; альтернативы в `docs/02-mapping.md §5.1`).
- Валидация — `zod`.
- Тесты — `vitest`.
- AI — Anthropic SDK (Claude Sonnet) как primary, OpenAI SDK (GPT-4o) как fallback. Вызовы через глобальный `fetch` или SDK — см. `src/content/rewrite/ai.ts`.

---

## Конвенции кода

1. **TypeScript strict, без `any`.** Если очень нужен — `unknown` и zod-parse.
2. **Функции — чистые, где возможно.** Побочные эффекты (fs, network) — только в `src/infra/`, `src/deploy/`, `src/run/`.
3. **Zod-схема — единственный источник истины** для формы данных. TS-тип выводится через `z.infer`.
4. **Имена файлов — kebab-case.** `strip-ai-patterns.ts`, не `stripAiPatterns.ts`.
5. **Каждая фича = модуль в своём каталоге** (если у неё >1 файла). Один большой файл лучше размазанной папки из тривиальных.
6. **Комментариев в коде почти нет.** Пишем комментарий только если без него непонятно *почему*, а не *что*. Ничего не комментируем «для читателя из будущего».
7. **JSX.** Preact JSX, pragma через `tsconfig.json`, не inline. Компоненты без `React.FC`.
8. **Escape** HTML — только через renderer. Никакого `dangerouslySetInnerHTML` кроме случаев вставки заранее санитизированного JSON-LD.
9. **Импорты**: относительные внутри модуля, alias `~/` (настроенный через tsconfig paths) для `src/`.
10. **Детерминизм**. Любая «рандомная» функция принимает `seed: number` явно. `Math.random()` в прод-коде запрещён.

---

## Anti-Fingerprint Rules (never break)

Эти правила — **жёсткие**. Любое нарушение = инцидент уровня «может деиндексироваться вся сеть». seobuilder2 уже умер по этой причине. Правила не предметны к обсуждению в рамках фичи; если чувствуется, что правило мешает — это сигнал, что архитектура неверна, а не что правило надо обойти.

Каждое правило ссылается на соответствующий слой `docs/03-architecture.md §3.13`.

1. **NEVER deploy >5 sites per week.** → §3.13 слой 10 (launch timing). Запуски разнесены, `deploy_queue.scheduled_at` уважается.
2. **NEVER put >10 sites on one /24 subnet.** → слой 1 (hosting IP). Проверяется `anti-fingerprint:shared-ip` перед deploy.
3. **NEVER verify >5 sites under one Google account.** → слой 3 (identity separation). Поле `google_identities.max_sites` ≤ 5.
4. **NEVER use same GA4 property for multiple sites.** → слой 3. Property создаётся per-site и привязывается к `sites.ga4_property_id`.
5. **NEVER link from one network site to another.** → слой 9 (zero interlinking). Блокирующий `anti-fingerprint:interlink-lint` перед deploy — deploy падает при любом матче.
6. **NEVER use single render system for >30% of network sites.** → слой 5 (template fingerprint). Проверяется `render_systems.assigned_sites_count / total`.
7. **NEVER use single LLM model for >35% of network sites.** → слой 6 (LLM diversity).
8. **NEVER use same registrar for >45% of network domains.** → слой 4 (registrar diversity).
9. **NEVER skip the 30-day aging period before site launch.** → слой 10. Поле `domains.aging_ready_at = registered_at + 30d`; deploy падает, если `now < aging_ready_at`.
10. **NEVER reuse system prompts verbatim across sites.** → слой 6. System-prompt синтезируется из `personas` и шаблона per-model, не хранится как единая строка. Копирование system-prompt между сайтами — bug.
11. **NEVER include `<meta generator>` or similar identifiable signatures.** → слой 5. Нет подписи генератора ни в HTML, ни в HTTP-заголовках, ни в комментариях.
12. **NEVER bulk-submit IndexNow/GSC for multiple sites simultaneously.** → слой 10. `indexation_queue.scheduled_at` разнесён; bulk-скрипт запрещён архитектурно.

### Pre-commit mental check

Перед каждой новой фичей, изменением, рефакторингом — задай себе вопрос:

> «Может ли эта фича создать общий паттерн между сайтами сети?»

Если ответ «да» или «возможно» — **остановись**. Спроектируй через абстракцию + ротацию + запись в соответствующую таблицу. Проверь §3.13, нет ли уже профиля для этого измерения (content_profiles, seo_profiles, infra_profiles, render_systems и т.д.). Если профиля нет — обсуди с пользователем добавление нового.

Примеры «общих паттернов», которые выглядят безобидно, но создают footprint:
- Дефолтный шрифт во всех шаблонах. → каждый render-system или theme seed выбирает свой.
- Общий helper для `<head>`. → разные render-system пишут `<head>` по-своему.
- Единый `robots.txt` template. → `seo_profiles.robots_style` разный.
- Общий JSON с вариантами `OG`-image. → формат и aspect ratio — per-site.
- «Наш stack» в футере / meta-теге. → запрещено категорически.
- Единый Sentry DSN / error-tracker / analytics — видимый клиенту — footprint.

### При любом подозрении на нарушение

Останови, покажи пользователю конкретное место (файл:строка), укажи, какой слой §3.13 может быть нарушен. Не пытайся «починить на месте» без обсуждения.

---

## Что в этом проекте делать **не надо**

- **Не трогать предшественников.** `C:/ZProjects/seobuilder2`, `C:/ZProjects/site-builder` — read-only для этой сессии. Переносишь механизм — переписываешь в `src/` на TS.
- **Не создавать документацию**, если пользователь явно не попросил. В этом проекте уже есть `docs/` и `PROJECT_DESCRIPTION.md`. Новых файлов `*.md` не плодить без запроса.
- **Не добавлять фичи сверх roadmap'а.** Если видишь необходимость — обсуди с пользователем. Особенно `docs/04-roadmap.md`: этапы не перескакиваем и не расширяем.
- **Не вводить абстракции преждевременно.** Три похожих участка — это три участка, не новый хелпер. Второй одинаковый участок — тоже ещё не хелпер. Абстракция появляется на третьем, когда контуры точно видны.
- **Не писать комментарии-шум** (`// set x to 1` над `const x = 1`), не писать JSDoc для очевидных функций.
- **Не использовать CommonJS**. Никаких `require`, `module.exports`, `.cjs`, `__dirname`. Для `__dirname` — `import.meta.dirname` (Node ≥ 20).
- **Не коммитить секреты.** `.env` и `sites/*/brief.yaml` с реальными данными — в `.gitignore`.
- **Не бандлить в артефакт сайта JS-фреймворки.** Артефакт — чистый HTML + один CSS + шрифты + картинки. Никаких runtime JS, кроме минимальных включений (cookie banner, мобильное меню через CSS-hack).

---

## Порядок работы

1. **Перед любыми правками** прочитай `docs/` целиком. Архитектура и roadmap — контракт.
2. **Новая функциональность идёт по этапу из `docs/04-roadmap.md`.** Если задача вне этапов — спроси, куда её.
3. **Каждое изменение, затрагивающее доменную модель** (`src/domain/*.ts`), обязательно сопровождается:
   - обновлением zod-схемы;
   - тестом (valid/invalid);
   - миграцией существующих фикстур в `tests/fixtures/`.
4. **Новый шаблон секции** (`src/templates/sections/*`) требует:
   - zod-контракт экспортом;
   - `meta` с `kind`, `version`, `compatibility`, `suggestedThemeModes`, `minContentLength`, `maxContentLength`;
   - функцию `render(props, ctx)` без побочных эффектов;
   - регистрацию в `src/templates/registry.ts`;
   - фикстуру props + unit-тест.
5. **Никогда не хардкодить цвет/размер/радиус в шаблоне.** Только CSS-переменные темы. Лишний параметр шаблона — только если он токенный (`--section-gap-override: var(--space-xl)`).
6. **Перед коммитом**: `pnpm typecheck && pnpm lint && pnpm test`.

---

## Команды

(Будут валидны после этапа 0 roadmap'а. Пока — справочник.)

```bash
pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint
pnpm test             # vitest
pnpm test:unit        # vitest tests/unit
pnpm test:integration # vitest tests/integration (медленные, AI-вызовы моки)

pnpm sb3 theme <seed>
pnpm sb3 compose --type home --seed <seed>
pnpm sb3 build <brief.yaml>
pnpm sb3 deploy <siteId>
pnpm sb3 status <runId>
pnpm sb3 resume <runId>
pnpm sb3 stop <runId>
pnpm sb3 seo-lint <siteId>
pnpm sb3 render-section --template hero.v2 --props <props.json>

pnpm bot              # запуск Telegram-бота (polling)
```

---

## Тестирование

- Unit-тесты — для всего в `src/domain`, `src/content/rewrite`, `src/theme`, `src/compose`, `src/seo`. Тесты не должны дёргать сеть.
- Integration-тесты — AI-вызовы замоканы (`vi.mock('src/content/rewrite/ai.ts')`). Проверяем пайплайн до AI и после.
- End-to-end (опц., вне CI) — один полный билд тестового brief'а, проверка структуры `dist/`.
- Целевое покрытие: **не гонимся за процентом**, но все чистые функции анти-шаблонности (`strip-ai-patterns`, `dedup-brand-words`, `limit-brand-density`, `limit-html-brand-density`) покрыты с примерами на 17 языков.

---

## Как искать контекст

- **Архитектурное решение** — ищи в `docs/03-architecture.md`. Если там нет — спроси пользователя, не придумывай.
- **Откуда механизм** — ищи в `docs/01-discovery.md` ссылки на seobuilder2/sitebuilder, смотри оригинал на C:/ZProjects/... (не редактируй).
- **Что в какой этап** — `docs/04-roadmap.md`.
- **Что писать самому, что переносить** — `docs/02-mapping.md`.
- **Статус проекта** — `docs/04-roadmap.md` + ненулевые директории в `src/`.

---

## Что делать, если что-то не сходится

- Если архитектура в `docs/03-architecture.md` противоречит тому, что хочет пользователь на живой задаче, — останови выполнение, покажи противоречие пользователю, предложи обновить документ. Не переопределяй документ молча кодом.
- Если видишь в исходниках предшественников механизм, который следует перенести, но он не отмечен в `docs/02-mapping.md`, — добавь строку в mapping, напиши обоснование, покажи пользователю.
- Если тест падает при изменении, которое ты считаешь корректным, — **не удаляй тест**. Останови, разбери расхождение, спроси пользователя.

---

## Для AI-агентов (subagents)

- `Explore` агент — нормально для больших поисков по `C:/ZProjects/seobuilder2` и `C:/ZProjects/site-builder`, чтобы не захламлять контекст.
- При запуске subagent'а включай абсолютный путь и конкретный вопрос. Абстрактных «изучи проект» не присылай.
- Перепроверяй выжимки subagent'а для любого переноса кода: указанные строки могут быть приблизительны.

---

## Утверждённые решения (нижний уровень стека)

- **Рендерер**: Preact + TSX + `preact-render-to-string`. Один из ≥3 render-систем в пуле; остальные — см. §3.13 слой 5.
- **Языков**: 17 (включая RU).
- **LLM**: ротация моделей с распределением по §3.13 слой 6. Дефолтный писатель — GPT-5.4-mini как 30% пула.
- **Состояние**: SQLite + drizzle-orm. Одна база `seobuilder3.db`, мигрируемая через drizzle-kit. См. §3.11.
- **Домены**: Spaceship — один из ≥5 регистраторов, `.online` — один из ≥6 TLD, обязательно в ротации. См. §3.13 слой 4.
- **Деплой**: hosting abstraction layer с первого этапа, ≥5 провайдеров. См. §3.13 слой 1.

## Минимум перед первым коммитом кода

Должны быть получены ответы на открытые вопросы из `docs/03-architecture.md §3.14`. Критично для старта:
1. Browser-fingerprint провайдер (AdsPower / Octo Browser / Multilogin) — упирается в этап 2.
2. Прокси-провайдер для Google-identity (mobile + residential пул) — этап 2.
3. Точное число `max_sites` на identity (3 / 4 / 5).
4. Точные API-ключи и квоты для ≥5 хостингов и ≥5 регистраторов (или какой подмножество стартового MVP).

Остальные решения можно откладывать до соответствующих этапов.
