import type { Monitor } from "../../database/drizzle/schema/monitors";
import type { CheckResultData } from "../check";

export interface NotifyPayload {
  monitor: Monitor;
  result: CheckResultData;
  previouslyUp: boolean;
}

export interface NotifierChannelMeta {
  id: number;
  name: string;
  type: string;
}

export interface Notifier {
  name: string;
  channel?: NotifierChannelMeta;
  notify(payload: NotifyPayload): Promise<void>;
}
