import { type HTTPPath, type OpenAPI, oc, type Route } from "@orpc/contract";
import { z } from "zod";

const MonitorSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  displayName: z.string().nullable(), // 公開時に表示する名前
  url: z.string().optional(),
  method: z.string(),
  headers: z.string().nullable(),
  body: z.string().nullable(),
  timeout: z.number().int(),
  expectedStatus: z.number().int(),
  active: z.boolean(),
  createdAt: z.string(),
});

const CheckResultSchema = z.object({
  id: z.number().int(),
  monitorId: z.number().int(),
  statusCode: z.number().int().nullable(),
  responseTime: z.number().int().nullable(),
  isUp: z.boolean(),
  status: z.enum(["up", "down", "maintenance"]),
  errorMessage: z.string().nullable(),
  checkedAt: z.string(),
});

const MaintenanceEventSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  message: z.string().nullable(),
  startAt: z.string(),
  endAt: z.string(),
  createdAt: z.string(),
  monitorIds: z.array(z.number().int()),
});

const IncidentEventSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  message: z.string().nullable(),
  resolvedAt: z.string().nullable(),
  createdAt: z.string(),
});

const StatusInfoSchema = z.object({
  maintenanceEvents: z.array(MaintenanceEventSchema),
  activeMaintenance: MaintenanceEventSchema.nullable(),
  incidents: z.array(IncidentEventSchema),
  activeIncident: IncidentEventSchema.nullable(),
  canCreateIncident: z.boolean(),
});

const NotificationTemplateFieldsSchema = z.object({
  template: z.string().nullable(),
  downTemplate: z.string().nullable(),
  upTemplate: z.string().nullable(),
});

const NotificationChannelBaseSchema = NotificationTemplateFieldsSchema.extend({
  id: z.number().int(),
  name: z.string(),
  active: z.boolean(),
  createdAt: z.string(),
});

const NotificationChannelDiscordSchema = NotificationChannelBaseSchema.extend({
  type: z.literal("discord"),
  webhookUrl: z.string().nullable(),
  discordContent: z.string().nullable(),
  discordUsername: z.string().nullable(),
  discordAvatarUrl: z.string().nullable(),
  discordTts: z.boolean().nullable(),
  discordEmbedEnabled: z.boolean().nullable(),
  discordEmbedTitle: z.string().nullable(),
  discordEmbedDescription: z.string().nullable(),
  discordDownEmbedDescription: z.string().nullable(),
  discordUpEmbedDescription: z.string().nullable(),
  discordEmbedUrl: z.string().nullable(),
  discordEmbedColor: z.string().nullable(),
  discordEmbedAuthorName: z.string().nullable(),
  discordEmbedAuthorUrl: z.string().nullable(),
  discordEmbedAuthorIconUrl: z.string().nullable(),
  discordEmbedThumbnailUrl: z.string().nullable(),
  discordEmbedImageUrl: z.string().nullable(),
  discordEmbedFooterText: z.string().nullable(),
  discordEmbedFooterIconUrl: z.string().nullable(),
  discordEmbedTimestamp: z.boolean().nullable(),
  discordAllowUserMentions: z.boolean().nullable(),
  discordAllowRoleMentions: z.boolean().nullable(),
  discordAllowEveryoneMentions: z.boolean().nullable(),
  discordSuppressEmbeds: z.boolean().nullable(),
  discordSuppressNotifications: z.boolean().nullable(),
  discordThreadName: z.string().nullable(),
  discordAppliedTags: z.string().nullable(),
});

const NotificationChannelSlackSchema = NotificationChannelBaseSchema.extend({
  type: z.literal("slack"),
  slackMode: z.enum(["webhook", "bot"]),
  webhookUrl: z.string().nullable(),
  slackBotToken: z.string().nullable(),
  slackChannel: z.string().nullable(),
});

const NotificationChannelTelegramSchema = NotificationChannelBaseSchema.extend({
  type: z.literal("telegram"),
  telegramBotToken: z.string().nullable(),
  telegramChatId: z.string().nullable(),
});

const NotificationChannelZapierSchema = NotificationChannelBaseSchema.extend({
  type: z.literal("zapier"),
  webhookUrl: z.string().nullable(),
});

const NotificationChannelTwilioSchema = NotificationChannelBaseSchema.extend({
  type: z.literal("twilio"),
  twilioAccountSid: z.string().nullable(),
  twilioAuthToken: z.string().nullable(),
  twilioFrom: z.string().nullable(),
  twilioTo: z.string().nullable(),
});

const NotificationChannelSchema = z.discriminatedUnion("type", [
  NotificationChannelDiscordSchema,
  NotificationChannelSlackSchema,
  NotificationChannelTelegramSchema,
  NotificationChannelZapierSchema,
  NotificationChannelTwilioSchema,
]);

const NotificationTemplateInputSchema = z.object({
  template: z.string().nullable().optional(),
  downTemplate: z.string().nullable().optional(),
  upTemplate: z.string().nullable().optional(),
});

const NotificationChannelCreateBaseSchema = NotificationTemplateInputSchema.extend({
  name: z.string().min(1).max(100),
});

const NotificationChannelDiscordInputSchema = NotificationChannelCreateBaseSchema.extend({
  type: z.literal("discord"),
  webhookUrl: z.string().min(1),
  discordContent: z.string().nullable().optional(),
  discordUsername: z.string().nullable().optional(),
  discordAvatarUrl: z.string().nullable().optional(),
  discordTts: z.boolean().nullable().optional(),
  discordEmbedEnabled: z.boolean().nullable().optional(),
  discordEmbedTitle: z.string().nullable().optional(),
  discordEmbedDescription: z.string().nullable().optional(),
  discordDownEmbedDescription: z.string().nullable().optional(),
  discordUpEmbedDescription: z.string().nullable().optional(),
  discordEmbedUrl: z.string().nullable().optional(),
  discordEmbedColor: z.string().nullable().optional(),
  discordEmbedAuthorName: z.string().nullable().optional(),
  discordEmbedAuthorUrl: z.string().nullable().optional(),
  discordEmbedAuthorIconUrl: z.string().nullable().optional(),
  discordEmbedThumbnailUrl: z.string().nullable().optional(),
  discordEmbedImageUrl: z.string().nullable().optional(),
  discordEmbedFooterText: z.string().nullable().optional(),
  discordEmbedFooterIconUrl: z.string().nullable().optional(),
  discordEmbedTimestamp: z.boolean().nullable().optional(),
  discordAllowUserMentions: z.boolean().nullable().optional(),
  discordAllowRoleMentions: z.boolean().nullable().optional(),
  discordAllowEveryoneMentions: z.boolean().nullable().optional(),
  discordSuppressEmbeds: z.boolean().nullable().optional(),
  discordSuppressNotifications: z.boolean().nullable().optional(),
  discordThreadName: z.string().nullable().optional(),
  discordAppliedTags: z.string().nullable().optional(),
});

const NotificationChannelSlackInputSchema = NotificationChannelCreateBaseSchema.extend({
  type: z.literal("slack"),
  slackMode: z.enum(["webhook", "bot"]),
  webhookUrl: z.string().optional(),
  slackBotToken: z.string().nullable().optional(),
  slackChannel: z.string().nullable().optional(),
});

const NotificationChannelTelegramInputSchema = NotificationChannelCreateBaseSchema.extend({
  type: z.literal("telegram"),
  telegramBotToken: z.string().min(1),
  telegramChatId: z.string().min(1),
});

const NotificationChannelZapierInputSchema = NotificationChannelCreateBaseSchema.extend({
  type: z.literal("zapier"),
  webhookUrl: z.string().min(1),
});

const NotificationChannelTwilioInputSchema = NotificationChannelCreateBaseSchema.extend({
  type: z.literal("twilio"),
  twilioAccountSid: z.string().min(1),
  twilioAuthToken: z.string().min(1),
  twilioFrom: z.string().min(1),
  twilioTo: z.string().min(1),
});

const NotificationChannelCreateInputSchema = z.discriminatedUnion("type", [
  NotificationChannelDiscordInputSchema,
  NotificationChannelSlackInputSchema,
  NotificationChannelTelegramInputSchema,
  NotificationChannelZapierInputSchema,
  NotificationChannelTwilioInputSchema,
]);

const NotificationChannelUpdateInputSchema = z.discriminatedUnion("type", [
  NotificationChannelDiscordInputSchema.extend({
    id: z.coerce.number().int(),
    active: z.boolean().optional(),
  }),
  NotificationChannelSlackInputSchema.extend({
    id: z.coerce.number().int(),
    active: z.boolean().optional(),
  }),
  NotificationChannelTelegramInputSchema.extend({
    id: z.coerce.number().int(),
    active: z.boolean().optional(),
  }),
  NotificationChannelZapierInputSchema.extend({
    id: z.coerce.number().int(),
    active: z.boolean().optional(),
  }),
  NotificationChannelTwilioInputSchema.extend({
    id: z.coerce.number().int(),
    active: z.boolean().optional(),
  }),
]);

const MonitorWithStatusSchema = MonitorSchema.extend({
  lastCheck: CheckResultSchema.nullable(),
  uptimePercent: z.number().nullable(),
  channelIds: z.array(z.number().int()),
  recentChecks: z.array(CheckResultSchema).optional(),
});

const MonitorIdInputSchema = z.object({ id: z.coerce.number().int() });
const ChannelIdInputSchema = z.object({ id: z.coerce.number().int() });

function withBearerAuth(
  summary: string,
  description: string,
  path: HTTPPath,
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  tags: string[],
) {
  return {
    method,
    path,
    summary,
    description,
    tags,
    spec: (operation: OpenAPI.OperationObject) => ({
      ...operation,
      security: [{ bearerAuth: [] }],
    }),
  } satisfies Route;
}

export const contract = {
  monitor: {
    list: oc
      .route({
        method: "GET",
        path: "/monitors",
        summary: "List monitors",
        description:
          "Returns all monitors with their latest status, uptime percentage, and assigned notification channels.",
        tags: ["Monitor"],
      })
      .output(z.array(MonitorWithStatusSchema)),
    get: oc
      .route({
        method: "GET",
        path: "/monitors/{id}",
        summary: "Get a monitor by ID",
        description:
          "Returns a single monitor with its latest status and assigned notification channels.",
        tags: ["Monitor"],
      })
      .input(MonitorIdInputSchema)
      .output(MonitorWithStatusSchema.nullable()),
    create: oc
      .route(
        withBearerAuth(
          "Create a monitor",
          "Creates a new monitor. Use custom headers and body for APIs that require JSON, form-encoded, or other request formats.",
          "/monitors",
          "POST",
          ["Monitor"],
        ),
      )
      .input(
        z.object({
          name: z.string().min(1).max(100),
          displayName: z.string().min(1).max(100).nullable().optional(), // 公開時に表示する名前
          url: z.url(),
          method: z.enum(["GET", "POST"]),
          headers: z.string().nullable().optional(),
          body: z.string().nullable().optional(),
          timeout: z.number().int().min(1).max(120),
          expectedStatus: z.number().int().min(100).max(599).optional(),
        }),
      )
      .output(MonitorSchema),
    update: oc
      .route(
        withBearerAuth(
          "Update a monitor",
          "Updates monitor settings such as method, headers, body, timeout, expected status, and active state.",
          "/monitors/{id}",
          "PATCH",
          ["Monitor"],
        ),
      )
      .input(
        z.object({
          id: z.coerce.number().int(),
          name: z.string().min(1).max(100).optional(),
          displayName: z.string().min(1).max(100).nullable().optional(),
          url: z.url().optional(),
          method: z.enum(["GET", "POST"]).optional(),
          headers: z.string().nullable().optional(),
          body: z.string().nullable().optional(),
          timeout: z.number().int().min(1).max(120).optional(),
          expectedStatus: z.number().int().min(100).max(599).optional(),
          active: z.boolean().optional(),
        }),
      )
      .output(z.object({ status: z.literal("OK") })),
    delete: oc
      .route(
        withBearerAuth(
          "Delete a monitor",
          "Deletes a monitor and its associated check history.",
          "/monitors/{id}",
          "DELETE",
          ["Monitor"],
        ),
      )
      .input(MonitorIdInputSchema)
      .output(z.object({ status: z.literal("OK") })),
    history: oc
      .route({
        method: "GET",
        path: "/monitors/{id}/history",
        summary: "Get monitor check history",
        description:
          "Returns recent check results including response time, HTTP status, and any recorded error details.",
        tags: ["Monitor"],
      })
      .input(
        z.object({
          id: z.coerce.number().int(),
          limit: z.coerce.number().int().max(500).optional(),
        }),
      )
      .output(z.array(CheckResultSchema)),
    checkNow: oc
      .route(
        withBearerAuth(
          "Trigger a monitor check immediately",
          "Runs a check immediately and stores the result in history.",
          "/monitors/{id}/check",
          "POST",
          ["Monitor"],
        ),
      )
      .input(MonitorIdInputSchema)
      .output(CheckResultSchema),
    import: oc
      .route(
        withBearerAuth(
          "Import monitors from JSON",
          "Bulk-imports monitors from an array. Optionally skips entries whose URL already exists.",
          "/monitors/import",
          "POST",
          ["Monitor"],
        ),
      )
      .input(
        z.object({
          monitors: z.array(
            z.object({
              name: z.string().min(1).max(100),
              url: z.url(),
              method: z.enum(["GET", "POST"]),
              headers: z.string().nullable().optional(),
              body: z.string().nullable().optional(),
              timeout: z.number().int().min(1).max(120).optional(),
              expectedStatus: z.number().int().min(100).max(599).optional(),
            }),
          ),
          skipDuplicates: z.boolean().optional(),
        }),
      )
      .output(
        z.object({
          imported: z.number().int(),
          skipped: z.number().int(),
          errors: z.number().int(),
          details: z.array(
            z.object({
              name: z.string(),
              status: z.enum(["imported", "skipped", "error"]),
              message: z.string().optional(),
            }),
          ),
        }),
      ),
    setChannels: oc
      .route(
        withBearerAuth(
          "Set notification channels for a monitor",
          "Replaces the notification channel assignments for the specified monitor.",
          "/monitors/{id}/channels",
          "PUT",
          ["Monitor"],
        ),
      )
      .input(
        z.object({ id: z.coerce.number().int(), channelIds: z.array(z.coerce.number().int()) }),
      )
      .output(z.object({ status: z.literal("OK") })),
  },
  statusInfo: {
    get: oc
      .route({
        method: "GET",
        path: "/status-info",
        summary: "Get maintenance and incident information",
        description:
          "Returns maintenance windows, incident records, active status information, and whether a new incident can be created.",
        tags: ["StatusInfo"],
      })
      .output(StatusInfoSchema),
    getMaintenance: oc
      .route({
        method: "GET",
        path: "/status-info/maintenance/{id}",
        summary: "Get maintenance information",
        description: "Returns one scheduled maintenance window by ID.",
        tags: ["StatusInfo"],
      })
      .input(z.object({ id: z.coerce.number().int() }))
      .output(MaintenanceEventSchema.nullable()),
    createMaintenance: oc
      .route(
        withBearerAuth(
          "Create maintenance information",
          "Creates a scheduled maintenance window. Checks recorded during the window use maintenance status.",
          "/status-info/maintenance",
          "POST",
          ["StatusInfo"],
        ),
      )
      .input(
        z.object({
          title: z.string().min(1).max(100),
          message: z.string().max(500).nullable().optional(),
          startAt: z.iso.datetime(),
          endAt: z.iso.datetime(),
          monitorIds: z.array(z.coerce.number().int()).optional(),
        }),
      )
      .output(MaintenanceEventSchema),
    updateMaintenance: oc
      .route(
        withBearerAuth(
          "Update maintenance information",
          "Updates a maintenance window.",
          "/status-info/maintenance/{id}",
          "PATCH",
          ["StatusInfo"],
        ),
      )
      .input(
        z.object({
          id: z.coerce.number().int(),
          title: z.string().min(1).max(100),
          message: z.string().max(500).nullable().optional(),
          startAt: z.iso.datetime(),
          endAt: z.iso.datetime(),
          monitorIds: z.array(z.coerce.number().int()).optional(),
        }),
      )
      .output(z.object({ status: z.literal("OK") })),
    deleteMaintenance: oc
      .route(
        withBearerAuth(
          "Delete maintenance information",
          "Deletes a maintenance window.",
          "/status-info/maintenance/{id}",
          "DELETE",
          ["StatusInfo"],
        ),
      )
      .input(z.object({ id: z.coerce.number().int() }))
      .output(z.object({ status: z.literal("OK") })),
    createIncident: oc
      .route(
        withBearerAuth(
          "Create incident information",
          "Creates an active incident only when a monitor is currently down and no maintenance is active.",
          "/status-info/incidents",
          "POST",
          ["StatusInfo"],
        ),
      )
      .input(
        z.object({
          title: z.string().min(1).max(100),
          message: z.string().max(500).nullable().optional(),
        }),
      )
      .output(IncidentEventSchema),
    updateIncident: oc
      .route(
        withBearerAuth(
          "Update incident information",
          "Updates incident title, details, and resolved state.",
          "/status-info/incidents/{id}",
          "PATCH",
          ["StatusInfo"],
        ),
      )
      .input(
        z.object({
          id: z.coerce.number().int(),
          title: z.string().min(1).max(100),
          message: z.string().max(500).nullable().optional(),
          resolved: z.boolean(),
        }),
      )
      .output(z.object({ status: z.literal("OK") })),
    resolveIncident: oc
      .route(
        withBearerAuth(
          "Resolve incident information",
          "Marks an incident as resolved.",
          "/status-info/incidents/{id}/resolve",
          "POST",
          ["StatusInfo"],
        ),
      )
      .input(z.object({ id: z.coerce.number().int() }))
      .output(z.object({ status: z.literal("OK") })),
  },
  notification: {
    list: oc
      .route(
        withBearerAuth(
          "List notification channels",
          "Returns all configured notification channels.",
          "/notification-channels",
          "GET",
          ["Notification"],
        ),
      )
      .output(z.array(NotificationChannelSchema)),
    create: oc
      .route(
        withBearerAuth(
          "Create a notification channel",
          "Creates a notification destination.",
          "/notification-channels",
          "POST",
          ["Notification"],
        ),
      )
      .input(NotificationChannelCreateInputSchema)

      .output(NotificationChannelSchema),
    update: oc
      .route(
        withBearerAuth(
          "Update a notification channel",
          "Updates an existing notification channel.",
          "/notification-channels/{id}",
          "PATCH",
          ["Notification"],
        ),
      )
      .input(NotificationChannelUpdateInputSchema)

      .output(z.object({ status: z.literal("OK") })),
    delete: oc
      .route(
        withBearerAuth(
          "Delete a notification channel",
          "Deletes a notification channel.",
          "/notification-channels/{id}",
          "DELETE",
          ["Notification"],
        ),
      )
      .input(ChannelIdInputSchema)
      .output(z.object({ status: z.literal("OK") })),
    test: oc
      .route(
        withBearerAuth(
          "Send a test notification",
          "Sends a sample down alert to the selected notification channel.",
          "/notification-channels/{id}/test",
          "POST",
          ["Notification"],
        ),
      )
      .input(ChannelIdInputSchema)
      .output(z.object({ status: z.literal("OK") })),
  },
  auth: {
    login: oc
      .route({
        method: "POST",
        path: "/auth/login",
        summary: "Login",
        description:
          "Validates the admin password and returns whether the provided credentials are accepted.",
        tags: ["Auth"],
      })
      .input(z.object({ password: z.string() }))
      .output(z.object({ success: z.boolean() })),
    verify: oc
      .route(
        withBearerAuth(
          "Verify auth token",
          "Checks if the current Bearer token is valid.",
          "/auth/verify",
          "GET",
          ["Auth"],
        ),
      )
      .output(z.object({ valid: z.literal(true) })),
  },
};
