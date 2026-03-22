import { oc } from "@orpc/contract";
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
});

export const contract = {
  monitor: {
    list: oc.output(z.array(MonitorWithStatusSchema)),
    get: oc.input(z.object({ id: z.number().int() })).output(MonitorWithStatusSchema.nullable()),
    create: oc
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
      .input(
        z.object({
          id: z.number().int(),
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
      .input(z.object({ id: z.number().int() }))
      .output(z.object({ status: z.literal("OK") })),
    history: oc
      .input(z.object({ id: z.number().int(), limit: z.number().int().max(500).optional() }))
      .output(z.array(CheckResultSchema)),
    checkNow: oc.input(z.object({ id: z.number().int() })).output(CheckResultSchema),
  },
  notification: {
    list: oc.output(
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
      .input(
        z.object({
          id: z.number().int(),
          name: z.string().min(1).max(100).optional(),
          webhookUrl: z.string().url().optional(),
          template: z.string().nullable().optional(),
          active: z.boolean().optional(),
        }),
      )
      .output(z.object({ status: z.literal("OK") })),
    delete: oc
      .input(z.object({ id: z.number().int() }))
      .output(z.object({ status: z.literal("OK") })),
    test: oc
      .input(z.object({ id: z.number().int() }))
      .output(z.object({ status: z.literal("OK") })),
  },
  auth: {
    login: oc.input(z.object({ password: z.string() })).output(z.object({ success: z.boolean() })),
  },
};
