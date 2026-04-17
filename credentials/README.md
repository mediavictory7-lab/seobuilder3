# credentials/

Пулы доступов, которые seobuilder3 читает и распределяет между сайтами. Система **не создаёт** эти записи — только читает и помечает занятыми.

## Как заполнять

1. Скопируй каждый файл без суффикса `.example`:
   ```
   cp google_accounts.example.csv  google_accounts.csv
   cp registrar_accounts.example.csv  registrar_accounts.csv
   # и т.д.
   ```
2. Заполни реальными данными. Первая строка — headers, не трогать. Пример-строка в `*.example.csv` можно игнорировать при копировании.
3. Пустые (нерелевантные) колонки оставляй пустыми — не дефис, не «—», не «n/a», именно пусто.
4. Кодировка — UTF-8. Разделитель — запятая. Значения с запятой внутри — в двойных кавычках.

## Что где хранится

| Файл | Назначение | Слой §3.13 |
|---|---|---|
| `google_accounts.csv` | Google-идентичности для GSC API (email + OAuth credentials) | 3 |
| `tracking_properties.csv` | GA4 property + GTM container, назначаются per-site | 3 |
| `registrar_accounts.csv` | API к регистраторам доменов | 4 |
| `hosting_servers.csv` | Уже поднятые VPS — по строке на сервер | 1 |
| `dns_accounts.csv` | API к DNS-провайдерам | 2 |
| `llm_api_keys.csv` | Ключи к LLM-провайдерам | 6 |
| `proxies.csv` | Прокси для API-вызовов от имени identity *(опционально)* | 3 |
| `bing_accounts.csv` | API Bing Webmaster *(опционально)* | 10 |
| `indexnow_keys.csv` | Ключи IndexNow *(опционально)* | 10 |

## Безопасность

- Все `*.csv` без суффикса `.example` — в `.gitignore`. Не коммитятся.
- SSH private-ключи — класть файлами в `credentials/ssh_keys/` и ссылаться на них в CSV по относительному пути (`ssh_keys/hetzner-1.pem`). Директория `ssh_keys/` тоже gitignored.
- OAuth refresh-токены, API-ключи — в CSV как есть, строкой. Файлы локальные, в git не попадут. При необходимости позже — миграция в зашифрованный vault.

## Импорт в БД

После заполнения:
```
sb3 credentials import
```
Команда читает все `*.csv`, валидирует (zod), раскладывает по таблицам SQLite. Повторный импорт — идемпотентный: существующие записи по натуральному ключу (email, api_key_fingerprint, ip и т.п.) обновляются, не дублируются.

`sb3 credentials status` — текущая загрузка пулов (занято / свободно / warmed).

## Альтернативный формат

Если удобнее вести одну Google Sheets с N листами — можно. Тогда добавим `sb3 credentials import --from=<sheet-url>` (требует OAuth-доступа к Sheets). Обсуждается — пока дефолт CSV.
