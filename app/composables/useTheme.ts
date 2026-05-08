const STORAGE_KEY = "cf-hc-theme";

type Theme = "light" | "dark";

const theme = ref<Theme>("light");

function applyTheme(t: Theme) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }
}

export function useTheme() {
  function init() {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored) {
      theme.value = stored;
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      theme.value = "dark";
    }
    applyTheme(theme.value);
  }

  function toggle() {
    theme.value = theme.value === "light" ? "dark" : "light";
    localStorage.setItem(STORAGE_KEY, theme.value);
    applyTheme(theme.value);
  }

  function set(t: Theme) {
    theme.value = t;
    localStorage.setItem(STORAGE_KEY, t);
    applyTheme(t);
  }

  return { theme, init, toggle, set };
}
