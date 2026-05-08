import { computed, toValue } from "vue";
import type { MaybeRefOrGetter } from "vue";
import type { CheckResult } from "../components/types";

export function useMonitorStatus(
  lastCheck: MaybeRefOrGetter<CheckResult | null>,
  uptimePercent: MaybeRefOrGetter<number | null>,
) {
  const { t } = useI18n();
  const status = computed<"up" | "down" | "pending">(() => {
    const check = toValue(lastCheck);
    if (!check) return "pending";
    return check.isUp ? "up" : "down";
  });

  const statusColor = computed(() => {
    const map: Record<string, string> = {
      up: "status-dot-up",
      down: "status-dot-down",
      pending: "status-dot-pending",
    };
    return map[status.value];
  });

  const statusVariant = computed<"success" | "error" | "ghost">(() => {
    const map: Record<string, "success" | "error" | "ghost"> = {
      up: "success",
      down: "error",
      pending: "ghost",
    };
    return map[status.value] ?? "ghost";
  });

  const statusText = computed(() => {
    if (status.value === "up") return t("status.up");
    if (status.value === "down") return t("status.down");
    return t("status.pending");
  });

  const statusLabelKey = computed(() => {
    if (status.value === "up") return "status.up";
    if (status.value === "down") return "status.down";
    return "status.pending";
  });

  const uptimeColorClass = computed(() => {
    const p = toValue(uptimePercent);
    if (p === null) return "";
    if (p >= 99) return "uptime-success";
    if (p >= 95) return "uptime-warning";
    return "uptime-danger";
  });

  return { statusColor, statusVariant, statusText, statusLabelKey, status, uptimeColorClass };
}
