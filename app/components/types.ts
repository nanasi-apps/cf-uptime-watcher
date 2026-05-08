export interface CheckResult {
  id: number;
  monitorId: number;
  statusCode: number | null;
  responseTime: number | null;
  isUp: boolean;
  status: "up" | "down" | "maintenance";
  errorMessage: string | null;
  checkedAt: string;
}

export interface MaintenanceEvent {
  id: number;
  title: string;
  message: string | null;
  startAt: string;
  endAt: string;
  createdAt: string;
  monitorIds: number[];
}

export interface IncidentEvent {
  id: number;
  title: string;
  message: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface StatusInformation {
  maintenanceEvents: MaintenanceEvent[];
  activeMaintenance: MaintenanceEvent | null;
  incidents: IncidentEvent[];
  activeIncident: IncidentEvent | null;
  canCreateIncident: boolean;
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
  channelIds: number[];
  recentChecks?: CheckResult[];
}
