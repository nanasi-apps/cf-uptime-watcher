const STORAGE_KEY = "cf-hc-theme";

type Theme = "light" | "dark";

const theme = ref<Theme>("light");

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark";
}

function getPreferredTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (isTheme(stored)) return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(t: Theme) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", t);
    document.documentElement.classList.toggle("dark", t === "dark");
    document.documentElement.style.colorScheme = t;
  }
}

function persistTheme(t: Theme) {
  localStorage.setItem(STORAGE_KEY, t);
  document.cookie = `${STORAGE_KEY}=${t}; path=/; SameSite=Lax`;
}

export function useTheme() {
  function init() {
    theme.value = getPreferredTheme();
    applyTheme(theme.value);
  }

  function initDom() {
    applyTheme(getPreferredTheme());
  }

  function toggle() {
    theme.value = theme.value === "light" ? "dark" : "light";
    persistTheme(theme.value);
    applyTheme(theme.value);
  }

  function set(t: Theme) {
    theme.value = t;
    persistTheme(t);
    applyTheme(t);
  }

  return { theme, init, initDom, toggle, set };
}
