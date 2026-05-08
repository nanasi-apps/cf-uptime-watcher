# cf-uptime-watcher 🛰️

> Serverless uptime monitoring for Cloudflare Workers and D1.

[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](./LICENSE)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-f38020.svg)](https://workers.cloudflare.com/)
[![Nuxt 4](https://img.shields.io/badge/Nuxt-4-00dc82.svg)](https://nuxt.com/)

Language: English | [日本語](./README.ja.md)

**cf-uptime-watcher** is a self-hosted uptime dashboard that runs as a Cloudflare Worker. It checks HTTP endpoints on a 5-minute cron, stores results in Cloudflare D1, and sends Slack or Discord alerts only when a monitor changes state.

- 🌐 Live usage example: https://uptime.nanasi-apps.xyz/
- ☁️ Runtime: Cloudflare Workers + D1
- 🎨 Frontend: Nuxt 4, Vue 3, Tailwind CSS v4, DaisyUI, Element Plus

## ✨ Why Did I Build This?

Most uptime tools either require a long-running server or become paid once you need private checks and notifications. This project keeps the moving parts small enough for webhook notifications to run with just one Worker, one D1 database, and Cron Triggers.

It is designed for personal services, small teams, hobby projects, and lightweight public status dashboards.

## 🚀 Features

- ☁️ **Serverless checks** - Cloudflare Cron Triggers run active monitors every 5 minutes.
- 🛠️ **HTTP monitor settings** - configure `GET` or `POST`, headers, body, timeout, expected status, and active state.
- 📊 **Dashboard views** - list/grid monitor overview, status summary, detail page, and recent check history.
- 🔐 **Admin workflow** - password login for creating, editing, duplicating, deleting, importing, and manually checking monitors.
- 📦 **Bulk import** - upload a JSON array of monitors and optionally skip duplicate URLs.
- 🔔 **Notifications** - Slack and Discord webhook channels with test sends and per-monitor channel assignment.
- 🚦 **State-change alerts** - notifications are sent when a monitor goes down or recovers, not on every scheduled check.
- 🧾 **Custom templates** - shared, down-only, and recovery-only messages with variables such as `{{ monitor.name }}`, `{{ status }}`, `{{ responseTime }}`, and `{{ error }}`.
- 🎛️ **Discord payload controls** - customize username/avatar overrides, embeds, timestamps, mention controls, and notification suppression.
- 🌏 **Japanese and English UI** - Nuxt i18n with Japanese as the default locale.
- 🌙 **Light/dark theme** - persisted theme setting with system preference detection.

## 👀 Live Usage Example

This is an actual deployed instance I use as a public example of how the dashboard looks in operation:

https://uptime.nanasi-apps.xyz/

## 🧱 Tech Stack

| Layer         | Technology                                                                          |
| ------------- | ----------------------------------------------------------------------------------- |
| App framework | [Nuxt 4](https://nuxt.com/) / [Vue 3](https://vuejs.org/)                           |
| Runtime       | [Cloudflare Workers](https://workers.cloudflare.com/) via Nitro `cloudflare-module` |
| Database      | [Cloudflare D1](https://developers.cloudflare.com/d1/)                              |
| ORM           | [Drizzle ORM](https://orm.drizzle.team/)                                            |
| UI            | Tailwind CSS v4, DaisyUI, Element Plus                                              |
| Tooling       | [Vite+](https://github.com/uncenter/vite-plus) command wrapper, Wrangler            |

## 🚢 Deploy To Cloudflare

### ✅ Prerequisites

- Node.js 20+
- pnpm 10.32.1+
- A Cloudflare account with Wrangler authentication already set up
- Vite+ CLI available as `vp`

### 1. Clone And Install

```sh
git clone https://github.com/mattyatea/cf-uptime-watcher.git
cd cf-uptime-watcher
vp install
```

### 2. Create A D1 Database

```sh
vp exec wrangler d1 create healthcheck
```

Copy the generated `database_id` into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "healthcheck"
database_id = "<your-database-id>"
migrations_dir = "database/migrations"
```

### 3. Configure The Admin Password

Store `AUTH_PASSWORD` as a Cloudflare Worker secret:

```sh
vp exec wrangler secret put AUTH_PASSWORD
```

### 4. Apply Remote Migrations

```sh
vp run drizzle:migrate
```

### 5. Deploy The Worker

```sh
vp run deploy
```

Open your deployed Worker URL and log in with `AUTH_PASSWORD` to manage monitors.

The deployment uses:

- `wrangler.toml` for Worker name, D1 binding, assets, and Cron Trigger configuration.
- `nuxt.config.ts` for the Nitro Cloudflare module preset and scheduled task registration.
- `database/migrations` for D1 schema migrations.

The health check schedule is configured in both places and should stay aligned:

```toml
[triggers]
crons = ["*/5 * * * *"]
```

```ts
scheduledTasks: { "*/5 * * * *": ["healthcheck"] }
```

## ⚙️ Configuration

### 🔑 Secrets

| Name            | Required | Description                    |
| --------------- | -------- | ------------------------------ |
| `AUTH_PASSWORD` | Yes      | Admin password used to log in. |

### 📥 Monitor JSON

Bulk import expects a JSON array:

```json
[
  {
    "name": "Service",
    "url": "https://service.example.com/health",
    "method": "GET",
    "timeout": 30,
    "expectedStatus": 200
  },
  {
    "name": "Webhook",
    "url": "https://service.example.com/webhook-test",
    "method": "POST",
    "headers": "{\"Content-Type\": \"application/json\"}",
    "body": "{\"ping\": true}",
    "timeout": 30,
    "expectedStatus": 200
  }
]
```

Supported monitor fields:

| Field            | Description                                                     |
| ---------------- | --------------------------------------------------------------- |
| `name`           | Internal monitor name.                                          |
| `displayName`    | Optional public-facing display name.                            |
| `url`            | Target URL.                                                     |
| `method`         | `GET` or `POST`.                                                |
| `headers`        | JSON string of request headers.                                 |
| `body`           | Request body used for `POST` monitors.                          |
| `timeout`        | Timeout in seconds, from 1 to 120. Defaults to `30` in imports. |
| `expectedStatus` | HTTP status that counts as healthy. Defaults to `200`.          |
| `active`         | Whether scheduled checks should run.                            |

## 🔔 Notifications

Notification channels are configured from the settings page after logging in.

### Slack

Create a Slack Incoming Webhook and add Slack as a notification channel.
Messages are sent as attachment payloads with a green recovery color or red down color.

### Discord

Create a Discord webhook and add Discord as a notification channel.
Discord channels can configure:

- username/avatar overrides
- embeds
- timestamps
- mention controls
- notification suppression

### 🧾 Templates

Templates support variables from the monitor and check result:

| Variable               | Description                             |
| ---------------------- | --------------------------------------- |
| `{{ monitor.name }}`   | Monitor name.                           |
| `{{ monitor.url }}`    | Target URL.                             |
| `{{ monitor.method }}` | HTTP method.                            |
| `{{ status }}`         | `DOWN` or `RECOVERED`.                  |
| `{{ statusCode }}`     | HTTP status code or `N/A`.              |
| `{{ responseTime }}`   | Response time in milliseconds or `N/A`. |
| `{{ error }}`          | Error details when the check failed.    |
| `{{ timestamp }}`      | Check timestamp.                        |

## 🧑‍💻 Development

Use Vite+ commands so the pinned pnpm lockfile and repository hooks stay consistent.

```sh
# Start Nuxt dev server
vp run dev

# Build for Cloudflare Workers
vp run build

# Run linting, formatting, and type checks
vp check

# Run tests
vp test

# Run a focused test file
vp test server/notifiers/template.test.ts

# Generate Drizzle migrations after schema changes
vp run drizzle:generate

# Open Drizzle Studio
vp run drizzle:studio

# Regenerate Cloudflare type bindings
vp run generate-types
```

## 🗂️ Project Structure

```text
app/                         Nuxt app, pages, components, composables, i18n-aware UI
server/                      Worker handlers, scheduled task, health checks, notifiers
database/drizzle/schema/     Drizzle table definitions
database/drizzle/queries/    Database query helpers
database/migrations/         Generated D1 migrations
wrangler.toml                Cloudflare Worker, D1, assets, and cron configuration
nuxt.config.ts               Nuxt, Nitro, i18n, CSS, and scheduled task configuration
```

## 🤝 Contributing

Issues and pull requests are welcome. Before opening a PR, run:

```sh
vp check
vp test
```

If you change the database schema, generate and include a migration:

```sh
vp run drizzle:generate
```

## 📜 License

[AGPL-3.0](./LICENSE)
