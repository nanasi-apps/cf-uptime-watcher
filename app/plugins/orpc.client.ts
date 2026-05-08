import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RpcClient } from "~/utils/rpc-client";

export default defineNuxtPlugin(() => {
  const link = new RPCLink({
    url: `${window.location.origin}/rpc`,
    headers: () => {
      const token = localStorage.getItem("auth_token");
      return token ? { authorization: `Bearer ${token}` } : {};
    },
  });

  const client: RpcClient = createORPCClient(link);

  return {
    provide: {
      client,
    },
  };
});
