import { computed } from "vue";
import type { Ref } from "vue";

const CONTENT_TYPE_HEADER = "Content-Type";

const CONTENT_TYPE_OPTIONS = [
  "application/json",
  "application/x-www-form-urlencoded",
  "text/plain",
];

function parseHeadersText(headersText: string, invalidMessage: string): Record<string, string> {
  if (!headersText.trim()) return {};

  const parsed: unknown = JSON.parse(headersText);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(invalidMessage);
  }

  return Object.fromEntries(
    Object.entries(parsed as Record<string, unknown>).map(([key, value]) => [
      key,
      typeof value === "string" ? value : value == null ? "" : JSON.stringify(value),
    ]),
  );
}

function tryParseHeadersText(headersText: string, invalidMessage: string): Record<string, string> {
  try {
    return parseHeadersText(headersText, invalidMessage);
  } catch {
    return {};
  }
}

function stringifyHeaders(headers: Record<string, string>): string {
  const entries = Object.entries(headers).filter(([, value]) => value.trim() !== "");
  return entries.length > 0 ? JSON.stringify(Object.fromEntries(entries), null, 2) : "";
}

export function useHeadersEditor(headersText: Ref<string>) {
  const { t } = useI18n();
  const invalidJsonObject = computed(() => t("headers.invalidJsonObject"));

  function parseHeaders(headers: string) {
    return parseHeadersText(headers, invalidJsonObject.value);
  }

  function tryParseHeaders(headers: string) {
    return tryParseHeadersText(headers, invalidJsonObject.value);
  }

  const selectedContentType = computed(() => {
    const headers = tryParseHeaders(headersText.value);
    const contentType = headers[CONTENT_TYPE_HEADER];
    if (!contentType) return "";

    return CONTENT_TYPE_OPTIONS.includes(contentType) ? contentType : "custom";
  });

  function handleContentTypeChange(value: string | undefined) {
    const headers = tryParseHeaders(headersText.value);

    if (value === "custom") return;

    if (value) {
      headers[CONTENT_TYPE_HEADER] = value;
    } else {
      delete headers[CONTENT_TYPE_HEADER];
    }

    headersText.value = stringifyHeaders(headers);
  }

  return {
    parseHeaders,
    tryParseHeaders,
    selectedContentType,
    handleContentTypeChange,
    CONTENT_TYPE_OPTIONS,
  };
}
