const AUTH_TOKEN_KEY = "auth_token";

export function useAuthToken() {
  const token = useState<string | null>(AUTH_TOKEN_KEY, () => null);

  function read() {
    if (import.meta.client) {
      token.value = localStorage.getItem(AUTH_TOKEN_KEY);
      return token.value;
    }

    token.value = useCookie<string | null>(AUTH_TOKEN_KEY).value ?? null;
    return token.value;
  }

  function set(value: string) {
    token.value = value;

    if (import.meta.client) localStorage.setItem(AUTH_TOKEN_KEY, value);
    useCookie<string | null>(AUTH_TOKEN_KEY, { path: "/", sameSite: "lax" }).value = value;
  }

  function clear() {
    token.value = null;

    if (import.meta.client) localStorage.removeItem(AUTH_TOKEN_KEY);
    useCookie<string | null>(AUTH_TOKEN_KEY, { path: "/", sameSite: "lax" }).value = null;
  }

  function syncCookie() {
    if (!import.meta.client) return read();

    const value = localStorage.getItem(AUTH_TOKEN_KEY);
    token.value = value;
    useCookie<string | null>(AUTH_TOKEN_KEY, { path: "/", sameSite: "lax" }).value = value;
    return value;
  }

  return { token, read, set, clear, syncCookie };
}
