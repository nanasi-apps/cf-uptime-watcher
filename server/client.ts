import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import type { contract } from "./contract";

const link = new RPCLink({
  url: () => {
    if (typeof window === "undefined") {
      throw new Error("RPCLink is not allowed on the server side.");
    }
    return `${window.location.origin}/rpc`;
  },
  headers: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) return { authorization: `Bearer ${token}` };
    }
    return {};
  },
});

export const client: ContractRouterClient<typeof contract> = createORPCClient(link);
