# cf-healthcheck

> Lightweight uptime monitoring that runs entirely on Cloudflare's free tier — no servers, no subscriptions.

**cf-healthcheck** is a self-hosted uptime monitor built on Cloudflare Workers and D1. It checks your HTTP endpoints every 5 minutes, stores history in a serverless SQLite database, and fires Slack or Discord alerts the moment a service goes down (or recovers).

## Features

- **Zero-infrastructure** — runs as a Cloudflare Worker with Cron Triggers; no VMs or containers
- **Scheduled checks** — polls every 5 minutes out of the box (configurable via cron)
- **Flexible HTTP checks** — GET or POST, custom headers, request body, configurable timeout and expected status code
- **Check history** — stores response time, HTTP status, and error messages for every check
- **Uptime percentage** — computed per-monitor across all stored results
- **Instant alerts** — notifies Slack and Discord when a monitor changes state (down → up or up → down)
- **Custom notification templates** — use `{{monitor.name}}`, `{{status}}`, `{{responseTime}}`, `{{error}}`, etc.
- **Bulk import** — import monitors from JSON with duplicate-skipping
- **Type-safe REST API** — powered by [oRPC](https://orpc.unnoq.com) with an auto-generated OpenAPI spec
- **Web dashboard** — built with Nuxt 4 + Vue 3, TailwindCSS, and DaisyUI
- **Password authentication** — simple bearer-token auth for write operations

## Tech Stack

| Layer      | Technology                                                                 |
| ---------- | -------------------------------------------------------------------------- |
| Runtime    | [Cloudflare Workers](https://workers.cloudflare.com)                       |
| Framework  | [Nuxt 4](https://nuxt.com) / [Vue 3](https://vuejs.org)                    |
| Database   | [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite)            |
| ORM        | [Drizzle ORM](https://orm.drizzle.team)                                    |
| API        | [oRPC](https://orpc.unnoq.com) + OpenAPI                                   |
| Validation | [Zod](https://zod.dev)                                                     |
| Styling    | [TailwindCSS v4](https://tailwindcss.com) + [DaisyUI](https://daisyui.com) |
| Deployment | [Wrangler](https://developers.cloudflare.com/workers/wrangler/)            |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 20+
- [pnpm](https://pnpm.io) 10+
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier is sufficient)

### 1. Clone and install

```sh
git clone https://github.com/mattyatea/cf-healthcheck.git
cd cf-healthcheck
pnpm install
```

### 2. Create the D1 database

```sh
pnpm wrangler d1 create healthcheck
```

Copy the `database_id` from the output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "healthcheck"
database_id = "<your-database-id>"
```

### 3. Run database migrations

```sh
# Apply to local (for development)
pnpm wrangler d1 migrations apply healthcheck --local

# Apply to remote (production)
pnpm drizzle:migrate
```

### 4. Set your admin password

Edit `wrangler.toml` and change the default password:

```toml
[vars]
AUTH_PASSWORD = "your-secure-password"
```

> For production, use [Cloudflare secrets](https://developers.cloudflare.com/workers/configuration/secrets/) instead of vars.

### 5. Start the development server

```sh
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

## Deployment

Build and deploy to Cloudflare Workers in a single command:

```sh
pnpm deploy
```

This runs `nuxi build && wrangler deploy` and publishes your Worker with the configured Cron Trigger (`*/5 * * * *`).

## Notification Channels

### Discord

Create a webhook in your Discord server (**Server Settings → Integrations → Webhooks**) and add a Discord channel via the dashboard or API.

### Slack

Create an [Incoming Webhook](https://api.slack.com/messaging/webhooks) for your Slack workspace and add it via the dashboard or API.

### Custom Templates

Both channel types support a Mustache-style template string. Available variables:

| Variable             | Description                       |
| -------------------- | --------------------------------- |
| `{{monitor.name}}`   | Monitor display name              |
| `{{monitor.url}}`    | Monitored URL                     |
| `{{monitor.method}}` | HTTP method                       |
| `{{status}}`         | `DOWN` or `RECOVERED`             |
| `{{statusCode}}`     | HTTP response code (or `N/A`)     |
| `{{responseTime}}`   | Response time in ms (or `N/A`)    |
| `{{error}}`          | Error message if the check failed |
| `{{timestamp}}`      | ISO 8601 timestamp of the check   |

**Default template:**

```
[{{status}}] {{monitor.name}}
URL: {{monitor.url}}
Status: {{statusCode}} | Response: {{responseTime}}
{{error}}
```

## API

The REST API is fully documented via an auto-generated OpenAPI spec. Once running, visit:

```
http://localhost:3000/api/openapi.json
```

Authentication for write operations uses a `Bearer` token that matches your `AUTH_PASSWORD`.

### Quick reference

| Method   | Path                                  | Auth   | Description                    |
| -------- | ------------------------------------- | ------ | ------------------------------ |
| `GET`    | `/api/monitors`                       | —      | List all monitors with status  |
| `POST`   | `/api/monitors`                       | Bearer | Create a monitor               |
| `PATCH`  | `/api/monitors/:id`                   | Bearer | Update a monitor               |
| `DELETE` | `/api/monitors/:id`                   | Bearer | Delete a monitor               |
| `POST`   | `/api/monitors/:id/check`             | Bearer | Trigger an immediate check     |
| `GET`    | `/api/monitors/:id/history`           | —      | Get check history              |
| `POST`   | `/api/monitors/import`                | Bearer | Bulk import monitors from JSON |
| `PUT`    | `/api/monitors/:id/channels`          | Bearer | Assign notification channels   |
| `GET`    | `/api/notification-channels`          | Bearer | List notification channels     |
| `POST`   | `/api/notification-channels`          | Bearer | Create a notification channel  |
| `POST`   | `/api/notification-channels/:id/test` | Bearer | Send a test alert              |
| `POST`   | `/api/auth/login`                     | —      | Validate admin password        |

### Bulk import example

```sh
curl -X POST https://your-worker.workers.dev/api/monitors/import \
  -H "Authorization: Bearer your-password" \
  -H "Content-Type: application/json" \
  -d '{
    "skipDuplicates": true,
    "monitors": [
      { "name": "API", "url": "https://api.example.com/health", "method": "GET" },
      { "name": "App", "url": "https://app.example.com", "method": "GET" }
    ]
  }'
```

## Configuration Reference

### `wrangler.toml`

| Key                          | Default       | Description                                |
| ---------------------------- | ------------- | ------------------------------------------ |
| `vars.AUTH_PASSWORD`         | `changeme`    | Admin password for authenticated endpoints |
| `triggers.crons`             | `*/5 * * * *` | Cron schedule for health checks            |
| `d1_databases[].database_id` | —             | Your Cloudflare D1 database ID             |

### Monitor options

| Field            | Type             | Description                          |
| ---------------- | ---------------- | ------------------------------------ |
| `name`           | `string`         | Display name (max 100 chars)         |
| `url`            | `string`         | Target URL                           |
| `method`         | `GET \| POST`    | HTTP method                          |
| `expectedStatus` | `number`         | Expected HTTP status (default `200`) |
| `timeout`        | `number`         | Request timeout in seconds (1–120)   |
| `headers`        | `string \| null` | JSON string of request headers       |
| `body`           | `string \| null` | Request body for POST monitors       |
| `active`         | `boolean`        | Whether the monitor runs on schedule |

## Development

```sh
# Start dev server
pnpm dev

# Type-check, lint, and format
vp check

# Run linter only
pnpm lint

# Generate Drizzle migrations after schema changes
pnpm drizzle:generate

# Open Drizzle Studio
pnpm drizzle:studio

# Regenerate Cloudflare type bindings
pnpm generate-types
```
