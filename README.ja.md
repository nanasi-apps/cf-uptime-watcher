# cf-uptime-watcher 🛰️

> Cloudflare Workers と D1 で動く、サーバーレスな死活監視ダッシュボード。

[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](./LICENSE)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-f38020.svg)](https://workers.cloudflare.com/)
[![Nuxt 4](https://img.shields.io/badge/Nuxt-4-00dc82.svg)](https://nuxt.com/)

言語: [English](./README.md) | 日本語

**cf-uptime-watcher** は、Cloudflare Worker として動くセルフホスト型の稼働監視ダッシュボードです。
5分ごとのCronでHTTPエンドポイントをチェックし、結果をCloudflare D1に保存します。
状態が変わったタイミングだけSlackまたはDiscordへ通知します。

- 🌐 実運用例: https://uptime.nanasi-apps.xyz/
- ☁️ 実行環境: Cloudflare Workers + D1
- 🎨 フロントエンド: Nuxt 4, Vue 3, Element Plus

## ✨ どうして作ったの？

多くの死活監視ツールは、常時起動するサーバーが必要だったり、プライベートな監視や通知を使う段階で有料になったりします。
このプロジェクトは、Worker 1つ、D1データベース 1つ、Cron Triggersだけで、Webhook通知が動くように構成要素をできるだけ小さくしています。

個人サービス、小さなチーム、趣味プロジェクト、軽量な公開ステータスダッシュボード向けです。

## 🚀 機能

- ☁️ **サーバーレス監視** - Cloudflare Cron Triggersで有効なモニターを5分ごとにチェックします。
- 🛠️ **HTTPモニター設定** - `GET` / `POST`、ヘッダー、ボディ、タイムアウト、期待ステータス、有効/無効を設定できます。
- 📊 **ダッシュボード表示** - リスト/グリッド表示、ステータス概要、詳細ページ、直近のチェック履歴を確認できます。
- 🔐 **管理者ワークフロー** - パスワードログイン後、モニターの作成、編集、複製、削除、インポート、手動チェックができます。
- 🛠️ **メンテナンス予定** - 設定画面から日時つきのメンテナンスを登録でき、期間中のチェックは `up` / `down` ではなく `maintenance` として記録されます。
- 🚨 **インシデント情報** - 現在Downのモニターがあり、かつメンテナンス中ではない場合に、障害情報を公開できます。
- 📦 **一括インポート** - JSON配列をアップロードし、重複URLをスキップしながらモニターを取り込めます。
- 🔔 **通知** - Slack / DiscordのWebhookチャンネル、テスト送信、モニターごとの通知チャンネル割り当てに対応しています。
- 🚦 **状態変化時のみ通知** - スケジュール実行のたびではなく、Downになった時と復旧した時だけ通知します。
- 🧾 **カスタムテンプレート** - 共通、Down専用、復旧専用のメッセージを `{{ monitor.name }}`、`{{ status }}`、`{{ responseTime }}`、`{{ error }}` などの変数で作れます。
- 🎛️ **Discordペイロード設定** - username/avatar上書き、embed、timestamp、mention制御、通知抑制を調整できます。
- 🌏 **日本語/英語UI** - Nuxt i18nを使い、日本語をデフォルト言語にしています。
- 🌙 **ライト/ダークテーマ** - システム設定を見つつ、選択したテーマを保存します。

## 👀 実運用例

作者が実際に動かしている公開インスタンスです。
ダッシュボードがどんな雰囲気で動くかを見る用途として置いています。

https://uptime.nanasi-apps.xyz/

## 🧱 技術スタック

| レイヤー     | 技術                                                                                   |
| ------------ | -------------------------------------------------------------------------------------- |
| アプリ       | [Nuxt 4](https://nuxt.com/) / [Vue 3](https://vuejs.org/)                              |
| ランタイム   | Nitro `cloudflare-module` 経由の [Cloudflare Workers](https://workers.cloudflare.com/) |
| データベース | [Cloudflare D1](https://developers.cloudflare.com/d1/)                                 |
| ORM          | [Drizzle ORM](https://orm.drizzle.team/)                                               |
| UI           | Element Plus                                                                           |
| ツール       | [Vite+](https://github.com/uncenter/vite-plus) command wrapper, Wrangler               |

## 🚢 Cloudflareへデプロイ

### ✅ 前提条件

- Node.js 20+
- pnpm 10.32.1+
- Wrangler認証済みのCloudflareアカウント
- Vite+ CLIを `vp` として使えること

### 1. クローンして依存関係をインストール

```sh
git clone https://github.com/mattyatea/cf-uptime-watcher.git
cd cf-uptime-watcher
vp install
```

### 2. D1データベースを作成

```sh
vp exec wrangler d1 create healthcheck
```

出力された `database_id` を `wrangler.toml` に設定します。

```toml
[[d1_databases]]
binding = "DB"
database_name = "healthcheck"
database_id = "<your-database-id>"
migrations_dir = "database/migrations"
```

### 3. 管理者パスワードを設定

`AUTH_PASSWORD` をCloudflare Worker secretとして保存します。

```sh
vp exec wrangler secret put AUTH_PASSWORD
```

### 4. リモートマイグレーションを適用

```sh
vp run drizzle:migrate
```

### 5. Workerをデプロイ

```sh
vp run deploy
```

デプロイされたWorker URLを開き、`AUTH_PASSWORD` でログインするとモニターを管理できます。

デプロイでは主に次の設定を使います。

- `wrangler.toml`: Worker名、D1 binding、assets、Cron Trigger設定。
- `nuxt.config.ts`: Nitro Cloudflare module preset と scheduled task登録。
- `database/migrations`: D1スキーママイグレーション。

ヘルスチェックのスケジュールは2か所で設定しているため、同じ値に保ってください。

```toml
[triggers]
crons = ["*/5 * * * *"]
```

```ts
scheduledTasks: { "*/5 * * * *": ["healthcheck"] }
```

## ⚙️ 設定

### 🔑 シークレット

| 名前            | 必須 | 説明                                 |
| --------------- | ---- | ------------------------------------ |
| `AUTH_PASSWORD` | Yes  | ログインするための管理者パスワード。 |

### 📥 モニターJSON

一括インポートではJSON配列を渡します。

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

対応しているモニターフィールド:

| フィールド       | 説明                                                           |
| ---------------- | -------------------------------------------------------------- |
| `name`           | 内部用のモニター名。                                           |
| `displayName`    | 任意の公開表示名。                                             |
| `url`            | 監視対象URL。                                                  |
| `method`         | `GET` または `POST`。                                          |
| `headers`        | リクエストヘッダーのJSON文字列。                               |
| `body`           | `POST` モニターで使うリクエストボディ。                        |
| `timeout`        | 1から120までのタイムアウト秒数で、インポート時の初期値は`30`。 |
| `expectedStatus` | 正常とみなすHTTPステータスで、初期値は`200`。                  |
| `active`         | スケジュールチェックを実行するかどうか。                       |

### 🛠️ メンテナンス / インシデント

ログイン後の設定ページから、公開ステータス情報を管理できます。

- **メンテナンス** - 「メンテナンス」タブで、タイトル、任意の詳細、開始/終了日時を指定して予定を作成・編集できます。期間中はスケジュールチェックの履歴が `maintenance` として保存され、稼働率計算ではメンテナンス履歴を除外します。
- **インシデント** - 「インシデント」タブで障害情報を作成・編集できます。新しいインシデントは、現在Downのモニターが1件以上あり、かつアクティブなメンテナンスがない場合のみ作成できます。解決済みのインシデントも履歴として残ります。

ダッシュボード上部にはアクティブなメンテナンスまたはインシデントが表示され、モニターカードや履歴バーでもメンテナンス状態を専用の警告色で確認できます。

## 🔔 通知

通知チャンネルは、ログイン後の設定ページから作成します。

### Slack

Slack Incoming Webhookを作成し、Slackを通知チャンネルとして追加します。
メッセージはattachment payloadとして送信され、復旧時は緑、Down時は赤の色が付きます。

### Discord

Discord webhookを作成し、Discordを通知チャンネルとして追加します。
Discordチャンネルでは、

- username/avatar上書き
- embed
- timestamp
- mention制御
- 通知抑制

を設定できます。

### 🧾 テンプレート

テンプレートでは、モニターとチェック結果の変数を使えます。

| 変数                   | 説明                                 |
| ---------------------- | ------------------------------------ |
| `{{ monitor.name }}`   | モニター名。                         |
| `{{ monitor.url }}`    | 監視対象URL。                        |
| `{{ monitor.method }}` | HTTPメソッド。                       |
| `{{ status }}`         | `DOWN` または `RECOVERED`。          |
| `{{ statusCode }}`     | HTTPステータスコード、または `N/A`。 |
| `{{ responseTime }}`   | レスポンスタイム(ms)、または `N/A`。 |
| `{{ error }}`          | チェック失敗時のエラー詳細。         |
| `{{ timestamp }}`      | チェック時刻。                       |

## 🧑‍💻 開発

固定されたpnpm lockfileとリポジトリフックを保つため、Vite+コマンドを使ってください。

```sh
# Nuxt dev serverを起動
vp run dev

# Cloudflare Workers向けにビルド
vp run build

# lint、format、type checkを実行
vp check

# テストを実行
vp test

# 特定のテストファイルだけ実行
vp test server/notifiers/template.test.ts

# スキーマ変更後にDrizzle migrationを生成
vp run drizzle:generate

# Drizzle Studioを起動
vp run drizzle:studio

# Cloudflare type bindingを再生成
vp run generate-types
```

## 🗂️ ディレクトリ構成

```text
app/                         Nuxt app, pages, components, composables, i18n-aware UI
server/                      Worker handlers, scheduled task, health checks, notifiers
database/drizzle/schema/     Drizzle table definitions
database/drizzle/queries/    Database query helpers
database/migrations/         Generated D1 migrations
wrangler.toml                Cloudflare Worker, D1, assets, and cron configuration
nuxt.config.ts               Nuxt, Nitro, i18n, CSS, and scheduled task configuration
```

## 🤝 コントリビュート

IssueやPull Requestを歓迎します。
PRを開く前に、次のコマンドを実行してください。

```sh
vp check
vp test
```

データベーススキーマを変更した場合は、マイグレーションを生成して含めてください。

```sh
vp run drizzle:generate
```

## 📜 ライセンス

[AGPL-3.0](./LICENSE)
