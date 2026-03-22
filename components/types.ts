export interface CheckResult {
  id: number;
  monitorId: number;
  statusCode: number | null;
  responseTime: number | null;
  isUp: boolean;
  errorMessage: string | null;
  checkedAt: string;
}

export interface MonitorWithStatus {
  id: number;
  name: string;
  url: string;
  method: string;
  headers: string | null;
  body: string | null;
  timeout: number;
  expectedStatus: number;
  active: boolean;
  createdAt: string;
  lastCheck: CheckResult | null;
  uptimePercent: number | null;
}
