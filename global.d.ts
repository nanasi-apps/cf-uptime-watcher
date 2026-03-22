import type { dbD1 } from "./database/drizzle/db";

interface Env {
  DB: D1Database;
  AUTH_PASSWORD: string;
}

declare global {
  namespace Vike {
    interface PageContextServer {
      env: Env;
      db: ReturnType<typeof dbD1>;
    }
  }
}

export {};
