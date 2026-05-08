import type { RouterClient } from "@orpc/server";
import type { router } from "~~/server/router";

export type RpcClient = RouterClient<typeof router>;

export function useRpcClient() {
  return useNuxtApp().$client;
}

declare module "#app" {
  interface NuxtApp {
    $client: RpcClient;
  }
}

declare module "vue" {
  interface ComponentCustomProperties {
    $client: RpcClient;
  }
}
