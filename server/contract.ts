import { type HTTPPath, type OpenAPI, oc, type Route } from "@orpc/contract";
import { z } from "zod";

const MonitorSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  url: z.string(),
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
  errorMessage: z.string().nullable(),
  checkedAt: z.string(),
});

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
          url: z.string().url(),
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
          url: z.string().url().optional(),
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
              url: z.string().url(),
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
      .output(
        z.array(
          z.object({
            id: z.number().int(),
            type: z.string(),
            name: z.string(),
            webhookUrl: z.string(),
            template: z.string().nullable(),
            active: z.boolean(),
            createdAt: z.string(),
          }),
        ),
      ),
    create: oc
      .route(
        withBearerAuth(
          "Create a notification channel",
          "Creates a Slack or Discord webhook destination.",
          "/notification-channels",
          "POST",
          ["Notification"],
        ),
      )
      .input(
        z.object({
          type: z.enum(["discord", "slack"]),
          name: z.string().min(1).max(100),
          webhookUrl: z.string().url(),
          template: z.string().nullable().optional(),
        }),
      )
      .output(
        z.object({
          id: z.number().int(),
          type: z.string(),
          name: z.string(),
          webhookUrl: z.string(),
          template: z.string().nullable(),
          active: z.boolean(),
          createdAt: z.string(),
        }),
      ),
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
      .input(
        z.object({
          id: z.coerce.number().int(),
          name: z.string().min(1).max(100).optional(),
          webhookUrl: z.string().url().optional(),
          template: z.string().nullable().optional(),
          active: z.boolean().optional(),
        }),
      )
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
