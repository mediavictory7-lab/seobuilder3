# 04 — Дорожная карта

Последовательность этапов переработана с учётом anti-fingerprint-приоритетов (см. `03-architecture.md §3.13`). **Идентичности и hosting-абстракция идут рано** — раньше, чем генерация контента. Причина проста: если начать генерировать сайты до того, как готова ротация инфраструктуры, первые же сайты осядут в сети с footprint'ами, которые позже будут наследоваться новыми.

Каждый этап завершается проверяемым артефактом. Порядок строгий. Не перескакиваем.

Обозначения:
- **(2)** — переносим из seobuilder2 (с ревизией на footprint — см. `02-mapping.md §0`)
- **(sb)** — идея из sitebuilder
- **(new)** — пишем с нуля
- **(afp)** — anti-fingerprint: специфичное требование §3.13

---

## Этап 1. Каркас + SQLite + drizzle

**Цель**: скелет проекта с рабочей базой данных и типизированной схемой.

**Deliverable**:
- `package.json` (TS strict, ESM, `"type": "module"`, `pnpm`).
- `tsconfig.json` с `nodenext`, `target: es2022`.
- Базовая структура каталогов (см. §3.9 roadmap'а ниже).
- **SQLite + drizzle-orm + drizzle-kit** установлены; файл БД `.data/seobuilder3.db`.
- Заготовки drizzle-схем для всех таблиц §3.11 (пустые, но типизированные).
- Миграции через `pnpm db:migrate`.
- ESLint, vitest, CI (GitHub Actions: `pnpm typecheck && pnpm test`).
- CLI каркас — `pnpm sb3 --help` печатает список команд, каждая — stub.

**Как проверить**:
```bash
pnpm i && pnpm typecheck && pnpm lint && pnpm test
pnpm db:migrate
sqlite3 .data/seobuilder3.db ".tables"   # таблицы созданы
```

**Что переносим**: ничего (новый каркас).

---

## Этап 2. Identity management module (afp-критично)

**Цель**: работающая инфраструктура Google-идентичностей, браузерных профилей и прокси — до любой генерации контента.

**Deliverable**:
- Таблицы `google_identities`, `browser_profiles`, `proxies` — заполнены схемами, CRUD через drizzle.
- `IdentityManager` модуль: `addIdentity`, `warmup-tracker` (таймер прогрева), `pickIdentity(siteId)` с учётом `max_sites`, `markRetired`.
- Адаптер к выбранному browser-fingerprint-провайдеру (AdsPower / Octo Browser / Multilogin — см. §3.14 вопрос 1). Одна реализация, интерфейс абстрактный.
- `ProxyPool` — ротация прокси, привязка 1:2 к identity.
- CLI:
  - `sb3 identity add --email … --profile … --proxy …`
  - `sb3 identity list` (статусы: warming, available, retired, count)
  - `sb3 identity warming-report` (время до готовности)
- Unit-тесты: выбор identity не возвращает retired, не превышает max_sites, не берёт warming.

**Как проверить**:
- Добавить 3 тестовые identity, 2 из них перевести в `warmed_since = now()`, одну оставить warming.
- `sb3 identity pick` возвращает только available; после 3 вызовов (max_sites=3) переводит в retired.
- Warming-тренер показывает правильное ETA.

**Что переносим**: ничего — в seobuilder2 identity-менеджмента не было, это источник проблемы. **(new, afp)**

**На этом этапе не делаем**: саму верификацию в Search Console (это этап 10). Пока только модель данных + менеджмент.

---

## Этап 3. Hosting abstraction layer (afp-критично)

**Цель**: унифицированный слой для ≥3 хостинг-провайдеров с выбором и балансировкой.

**Deliverable**:
- `HostProvider` интерфейс: `provision(siteId) → HostAssignment`, `deploy(siteId, artifact)`, `teardown(siteId)`, `inventory()`.
- Адаптеры в `src/infra/hosts/`: `hetzner.ts`, `digitalocean.ts`, `vultr.ts` — минимум 3 для старта. OVH и Lightsail — после подтверждения (§3.14 вопрос 5).
- Таблица `hosts` заполнена рабочими IP из API провайдеров.
- Балансировка в `pickHost(siteId)`: фильтры `status=available`, `/24`-лимит, `provider`-лимит, `region`-лимит.
- CLI:
  - `sb3 host list` — все провайдеры с загрузкой.
  - `sb3 host pick --site=<id>` — тестовый выбор (dry-run, без деплоя).
  - `sb3 host audit` — проверка правил §3.13 слой 1.
- Unit-тесты: балансировщик не размещает >10 сайтов на /24, >20 на провайдера, >5 в регионе.

**Как проверить**: симулятор 100 сайтов прогонит через балансировщик; распределение соответствует default'ам ±5 %.

**Что переносим**: идею SFTP-деплоя **(2)** — но как **один** из провайдеров (Hetzner via SSH), не глобальный путь. **(new, afp)**

---

## Этап 4. DNS abstraction layer (afp-критично)

**Цель**: ротация ≥3 DNS-провайдеров.

**Deliverable**:
- `DnsProvider` интерфейс.
- Адаптеры: `cloudflare.ts`, `route53.ts`, `registrar-dns.ts` (универсальный — использует DNS провайдера регистратора). DNSimple/Gandi — см. §3.14 вопрос 7.
- Таблица `dns_providers` с загрузкой.
- Ротация при создании зоны: детерминированно от `hash(domain + month)` + load.
- CLI:
  - `sb3 dns list`
  - `sb3 dns create-zone --domain=…` (выбирает провайдера, создаёт зону)
  - `sb3 dns audit`

**Как проверить**: 50 fictional-domains прогнаны через ротацию; ни один провайдер не набрал >40 %.

**Что переносим**: `lib/cloudflare.cjs` **(2)** — переписан как адаптер `cloudflare.ts` одного из ≥3 провайдеров.

---

## Этап 5. Domain abstraction layer + aging (afp-критично)

**Цель**: регистрация доменов у ≥3 регистраторов с aging-pool.

**Deliverable**:
- `DomainProvider` интерфейс.
- Адаптеры: `spaceship.ts` (из seobuilder2), `namecheap.ts`, `porkbun.ts`. Cloudflare/Dynadot — см. §3.14 вопрос 6.
- Таблица `domains` с `aging_ready_at = registered_at + 30 days`.
- Ротация регистратор × TLD — веса динамические к целевому распределению.
- Weekly-registration lock: не более 7 регистраций/неделю на сеть.
- CLI:
  - `sb3 domain register --keyword=… --tld=…` (или auto-pick TLD)
  - `sb3 domain list --filter=aging` — домены в прогреве
  - `sb3 domain audit`
- Интеграция с DNS (этап 4): после регистрации домен получает NS-делегирование выбранному DNS-провайдеру.

**Как проверить**: зарегистрировать тестовый домен → сквозной проход (регистрация → NS → parking-page), домен висит в aging 30 дней без деплоя.

**Что переносим**: `lib/domain.cjs` (Spaceship) **(2)** — как один из адаптеров. `findAvailableDomain` **(2)** — переиспользуется.

---

## Этап 6. Render systems pool (afp-критично)

**Цель**: ≥3 физически разных render-системы, каждая собирает один тестовый сайт.

**Deliverable**:
- `SiteRenderer` интерфейс: `render(site, theme, contentByLang) → { files: Map<string, Buffer|string> }`.
- Реализации в `src/render-systems/`:
  - `preact-tailwind/` — Preact + TSX + preact-render-to-string + utility CSS (sub-set Tailwind-like, сгенерированный).
  - `preact-bem/` — Preact + TSX + hand-rolled BEM-CSS.
  - `eleventy-nunjucks/` — Eleventy 3 + Nunjucks-шаблоны, minimalist semantic HTML.
- Таблица `render_systems` с распределением.
- Для каждой системы — пул ≥3 layout-манифестов на тип страницы (home, article, category) и ≥2 версии секций (hero, features, faq, cta, footer).
- CLI `sb3 render --site=<id>` — выбирает render-систему, собирает артефакт в `dist/sites/{id}/`.
- Тест: три сайта на трёх системах дают визуально и структурно разный HTML (normalized-DOM-hash отличается >0.7 по Jaccard).

**Как проверить**:
- Снять нормализованный AST HTML-выхода трёх сайтов, посчитать пересечение node-labels. Не должно быть >50 % общих.
- Проверить, что в каждом выходе **нет** `<meta name="generator">` и других подписей.

**Что переносим**: паттерн версий секций **(sb)**, CSS-переменные как токены **(sb)**. Из seobuilder2 — **ничего** как общий рендерер: его функции-конкатенации — источник единого fingerprint'а, это и была проблема.

---

## Этап 7. LLM diversity layer (afp-критично)

**Цель**: ротация моделей и персон.

**Deliverable**:
- `LLMProvider` интерфейс: `generate(prompt, systemPrompt, opts) → text`, с fallback-цепочкой.
- Адаптеры: `openai.ts` (GPT-5.4-mini), `anthropic.ts` (Claude Haiku 4.5, Sonnet 4.5), `google.ts` (Gemini 3 Flash), `openrouter.ts` (DeepSeek/Qwen/Mistral). Фактическая наличность моделей — см. §3.14 вопрос 9.
- Таблицы `llm_configs`, `personas` — заполнены (30 персон).
- `pickLLMConfig(siteId)` — ротация с учётом лимитов (≤35 % модель, ≤5 сайтов персона).
- System-prompt builder: из persona.features_json + per-model template → никогда одинаковый.
- Шаблон persona pool: **опция 1** — вручную 30 yaml-файлов описаний; **опция 2** — один seed-LLM-вызов, генерирующий пул и ревью человеком. См. §3.14 вопрос 10.
- CLI:
  - `sb3 llm list-configs`
  - `sb3 llm distribution` — текущее распределение.
  - `sb3 llm generate --config=<id> --prompt=…` (тестовый вызов).

**Как проверить**: прогон 50 сайтов через `pickLLMConfig` — распределение соответствует §3.13 слой 6.

**Что переносим**: идею `callAI` fallback **(2)** — расширяется до multi-provider пула, не статическая цепочка. `stripAiPatterns` **(2)** — чистая функция, переносится как есть.

---

## Этап 8. Content pipeline

**Цель**: генерация сайта от brief до полного набора контента на 17 языках, используя одну identity / один host / один render-system / один LLM-config (из уже готовых ротаций).

**Deliverable**:
- `src/content/plan/`: `plan-site.ts`, `plan-blog.ts`, `identity.ts` (`generateCompanyIdentity` from sb2 переписан).
- `src/content/generate/`: `section.ts` (генерация section props через выбранный LLM-config), `article.ts` (посекционная + aggregating).
- `src/content/rewrite/`: переносим `stripAiPatterns`, `stripKwTags`, `dedupBrandWords`, `limitBrandDensity`, `limitHtmlBrandDensity`, `BRAND_SYNONYMS_I18N` из seobuilder2 — на TS, с тестами.
- `content_profiles` — 4–6 профилей с разными (article_length, structure_features, url_pattern, pages_count, publication_schedule). Ротация `pickContentProfile`.
- Перевод на 17 языков (по sb2 schema): AI-rewrite с сохранением тегов, параллелизация per-lang.
- Полный thread от `brief.yaml` до `dist/sites/{id}/` со всеми страницами, но **без деплоя** (только локальный артефакт).

**Как проверить**:
- `sb3 build sites/example/brief.yaml` → `dist/sites/example/` с ≥10 страницами на 17 языках.
- Плотность бренда ≤40 на странице.
- AI-клише отсутствуют (regex-тест).
- `<keyword>/<country>/<celebrity>` тегов нет.
- `manifest.json` содержит: site_seed, render_system_id, llm_config_id, content_profile_id, identity_id (если уже присвоена), список страниц.

**Что переносим**: всё из `builder.cjs` (чистильщики), `_generate-blog.cjs` (идею пула топиков), `_translate.cjs` (rewrite за перевод) **(2)**.

**Что нельзя переносить**: фиксированную структуру 14 страниц, фиксированный набор секций, единый system-prompt, shared `relatedPages` — см. §3.13 слой 7 и `02-mapping.md §0`.

---

## Этап 9. SEO layer с профилями

**Цель**: сайт проходит SEO-аудит с учётом seo-профиля.

**Deliverable**:
- `src/seo/head.tsx` — title/description/canonical/hreflang/OG/Twitter. Варианты для `og_image_aspect`, `twitter_card_enabled` per profile.
- `src/seo/jsonld.ts` — generator под 4 профиля (Full/Standard/Minimal/No-JSONLD).
- `src/seo/sitemap.ts` — ≥3 формата (XML, sitemap-index, RSS-совместимый) per profile.
- `src/seo/robots.ts` — ≥4 стиля (минимальный, подробный, с Crawl-delay, без/с sitemap-ссылки).
- `src/seo/linker.ts` — внутренняя перелинковка с правилами §3.6.4, **только внутри сайта**.
- `seo_profiles` таблица заполнена, ротация `pickSeoProfile`.
- Линтер `sb3 seo-lint <siteId>` — проверка title/description length, canonical, hreflang-симметрия, sitemap полнота.

**Как проверить**:
- 4 сайта на 4 профилях дают разный состав `<head>` (количество JSON-LD блоков, формат sitemap, robots.txt-стиль).
- `sb3 seo-lint` — 0 errors на каждом.

**Что переносим**: `data/seoMeta.cjs` **(2)** — состав JSON-LD. `seo-check.cjs` **(2)** — идею самопроверки.

**Что нельзя переносить**: применение полного stack ко всем сайтам сети — теперь только 30 % сети получает Full.

---

## Этап 10. Deploy + launch scheduler + verification

**Цель**: сайт физически попадает на хост, в DNS, в SSL, в поисковики. С уважением aging-period и weekly-lock.

**Deliverable**:
- `src/deploy/`: `deployer.ts` (интерфейс), `sftp-deploy.ts` (для провайдеров с SSH), `s3-deploy.ts` (для тех, где объект-хранилище).
- Веб-сервер конфиг — Caddy (для SSL-issuer-ротации и автоматических сертификатов) или nginx. Выбор — см. §3.14 вопрос ниже; Caddy проще для SSL-diversity §3.13 слой 11. Рекомендую Caddy.
- `infra_profiles` таблица + генератор per-profile конфигов Caddy/nginx.
- `deploy_queue` + планировщик: ≤5 сайтов/неделя, ≥30 дней aging.
- `indexation_queue`: спред 2–4 суток между GSC, IndexNow, Bing submit'ами.
- Адаптеры: `infra/search-console.ts` (использует выбранную для сайта identity), `infra/bing.ts`, `infra/indexnow.ts`.
- Верификация: curl HTTP 200, `<title>`, `<h1>`, валидный sitemap, отсутствие `<meta generator>`.
- CLI:
  - `sb3 deploy <siteId>` — уважает scheduled_at и aging.
  - `sb3 deploy-queue` — список в очереди.
  - `sb3 launch-report --week` — сколько сайтов запущено за неделю.

**Как проверить**: сквозной прогон от brief до live-URL на реальном тестовом домене (aging 30 дней должен быть пройден — можно иметь "free-pass" флаг только для staging). Сайт в GSC верифицирован через выбранную identity.

**Что переносим**: `seogen-runner.cjs` state-machine + resume **(2)**. `infra/search-console.ts`, `infra/bing.ts`, `infra/indexnow.ts` **(2)**.

**Что нельзя переносить**: bulk-deploy, synchronous IndexNow на пачку, единый Google-аккаунт для всех GSC. Всё это — слой 10 и слой 3.

---

## Этап 11. Anti-fingerprint validator (блокирующий)

**Цель**: ни один deploy не проходит без прохождения всех 11 проверок §3.13.12.

**Deliverable**:
- `src/anti-fingerprint/` модуль с 11 чеками:
  1. `interlink-lint.ts` — AST-обход HTML на outbound ссылки.
  2. `shared-ip-check.ts`
  3. `shared-ns-check.ts`
  4. `shared-ga4-check.ts`
  5. `render-distribution-check.ts`
  6. `llm-distribution-check.ts`
  7. `registrar-distribution-check.ts`
  8. `identity-load-check.ts`
  9. `aging-period-check.ts`
  10. `generator-signature-check.ts`
  11. `tracker-signature-check.ts`
- Оркестратор `runAllChecks(siteId) → { pass: boolean, failures: Failure[] }`.
- Встроен в `sb3 deploy` как блокирующий шаг.
- CLI: `sb3 afp-check <siteId>` — запуск отдельно (dry-run).
- Логирование в `audit_events`.

**Как проверить**:
- 3 тестовых сайта: один чистый, один с cross-link между двумя сайтами сети, один с identity-overload.
- Первый — PASS, остальные — FAIL с конкретной причиной; deploy второго и третьего откатывается.

**Что переносим**: ничего — это новый модуль. **(new, afp)**

---

## Этап 12. Monitoring + drift detection

**Цель**: постоянный мониторинг состояния сети.

**Deliverable**:
- `src/monitoring/indexation-stats.ts` — GSC API batch для всех сайтов через их identity.
- `src/monitoring/fingerprint-drift.ts` — еженедельный feature-vector всех сайтов, `fingerprint_snapshots`.
- `src/monitoring/distribution-audit.ts` — текущее распределение по всем слоям §3.13.
- `src/monitoring/expiry.ts` — renewal/SSL/token expiry alerts.
- Telegram-бот — суточная сводка + алерты.
- CLI `sb3 network audit`, `sb3 drift-scan`, `sb3 expiry-report`.
- Grafana/Prometheus — опционально, по решению §3.14 вопрос 13.

**Как проверить**: mock-прогон 50 сайтов; audit выдаёт отчёт с dist'рибуциями, drift — baseline-снапшот, expiry — список того, что истекает.

**Что переносим**: `audit-all-sites.cjs` **(2)** идею periodic-аудита, переписано полностью.

---

## Этап 13. Backlinks (опциональный, за MVP-рубежом)

**Цель**: публикация с внешними ссылками на сайты сети.

**Deliverable**:
- `src/infra/backlinks/` — адаптеры для GitHub Pages / Telegraph / Blogger / Tumblr / Medium.
- Ротация платформ — каждый сайт получает 1–3 backlink'а из разных платформ.
- `publish_queue` backlink'ов, разнесённых по времени (≥24 часа спред).
- **Линтер**: backlinks-платформы не могут быть подряд использованы одной identity (GitHub-аккаунт/Blogger-аккаунт и т. п. — тоже ротация).

**Как проверить**: один сайт получает 2 backlink'а, каждый — своя платформа, свой аккаунт, спред во времени.

**Что переносим**: `lib/backlinks.cjs` **(2)** — адаптеры; ротационная обвязка — новая.

---

## Этап 14. Финальный cutover и выключение seobuilder2

**Цель**: seobuilder3 полностью заменяет seobuilder2.

**Deliverable**:
- Telegram-бот с полным UX `/seogen`, `/status`, `/stop`, `/resume`, `/clear`, + новые команды: `/identity-status`, `/network-audit`, `/drift-report`.
- Документированные runbook'и в `docs/runbooks/`.
- Decommission seobuilder2: остановка бота, архивация репо.

**Как проверить**: 10 новых сайтов запущены **только** через seobuilder3; seobuilder2 выключен ≥30 дней; сеть проходит anti-fingerprint-аудит без ошибок.

**Что переносим**: UX команд бота **(2)** — но код нужно писать заново на TS/ESM.

---

## Контрольные точки

| После этапа | Можно сделать |
|---|---|
| 1 | Демо каркаса + SQLite |
| 5 | Полный pre-generation стек готов (identity, hosts, DNS, domains) |
| 8 | Первый локальный сайт с реальным контентом (без деплоя) |
| 10 | Первый live-сайт на продакшне, с уважением aging |
| 11 | Гарантия anti-fingerprint на каждом deploy |
| 12 | Понимание здоровья сети, алерты |
| 14 | Полная замена seobuilder2 |

---

## Сколько это занимает

Оценка по активному разработчику, с учётом сложности API-интеграций:

| Этап | Нижняя оценка | Верхняя оценка |
|---|---:|---:|
| 1 Каркас | 1 день | 2 дня |
| 2 Identity | 4 дня | 7 дней |
| 3 Hosts | 4 дня | 7 дней |
| 4 DNS | 3 дня | 5 дней |
| 5 Domains | 3 дня | 5 дней |
| 6 Render pool | 7 дней | 14 дней |
| 7 LLM | 3 дня | 5 дней |
| 8 Content | 7 дней | 14 дней |
| 9 SEO | 4 дня | 7 дней |
| 10 Deploy | 7 дней | 14 дней |
| 11 Validator | 2 дня | 4 дня |
| 12 Monitoring | 3 дня | 5 дней |
| 13 Backlinks | 3 дня | 5 дней |
| 14 Cutover | 2 дня | 4 дня |
| **Итого** | **~53 дня** | **~98 дней** |

Это не календарные дни — это человеко-дни. С прогревом identity (28–35 дней) реальный старт production начинается не раньше этапа 10, даже если код готов раньше.

---

## Критерии «приступаем к реализации»

Перед этапом 2 требуются ответы на §3.14 вопросы **1–6** (browser-провайдер, прокси, max_sites, период прогрева, стартовый набор хостингов, стартовый набор регистраторов).

Остальные открытые вопросы — к этапам по мере прохождения.

**До кода** — утверждение этого roadmap'а и решения по критичным вопросам. Как только они есть — этап 1 стартует.
