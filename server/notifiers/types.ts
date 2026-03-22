import type { Monitor } from "../../database/drizzle/schema/monitors";
import type { CheckResultData } from "../check";

export interface NotifyPayload {
  monitor: Monitor;
  result: CheckResultData;
  previouslyUp: boolean;
}

export interface Notifier {
  name: string;
  notify(payload: NotifyPayload): Promise<void>;
}
