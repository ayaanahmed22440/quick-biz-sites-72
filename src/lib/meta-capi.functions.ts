import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  eventName: z.string().trim().min(1).max(60),
  eventId: z.string().trim().min(1).max(120),
  eventSourceUrl: z.string().trim().max(500).optional(),
  email: z.string().trim().email().max(255).optional(),
  externalId: z.string().trim().max(120).optional(),
  fbp: z.string().trim().max(200).optional(),
  fbc: z.string().trim().max(400).optional(),
  value: z.number().nonnegative().optional(),
  currency: z.string().trim().length(3).optional(),
  customData: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Server copy of a browser pixel event (Meta Conversions API). Shares the
 * event_id with the browser event so Meta deduplicates the pair.
 */
export const trackServerEvent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const { sendMetaServerEvent } = await import("./meta-capi.server");
    return sendMetaServerEvent(data);
  });
