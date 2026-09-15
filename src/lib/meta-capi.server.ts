/**
 * Meta Conversions API (server-side events).
 *
 * Sends a server copy of the browser pixel events. Both copies carry the same
 * event_id so Meta deduplicates them — the browser event stays the source of
 * truth and nothing here can affect checkout or the app's own behaviour.
 */
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";

const GRAPH_VERSION = "v21.0";

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export type ServerEventInput = {
  eventName: string;
  eventId: string;
  eventSourceUrl?: string | undefined;
  email?: string | undefined;
  externalId?: string | undefined;
  fbp?: string | undefined;
  fbc?: string | undefined;
  value?: number | undefined;
  currency?: string | undefined;
  customData?: Record<string, unknown> | undefined;
  testEventCode?: string | undefined;
};

/** Posts one event to Meta. Never throws — tracking must not break a request. */
export async function sendMetaServerEvent(input: ServerEventInput): Promise<{ sent: boolean }> {
  const pixelId = process.env["VITE_META_PIXEL_ID"] ?? process.env["META_PIXEL_ID"];
  const token = process.env["META_CAPI_ACCESS_TOKEN"];
  if (!pixelId || !token) return { sent: false };

  const userData: Record<string, unknown> = {};
  const ip = getRequestHeader("cf-connecting-ip") ?? getRequestIP({ xForwardedFor: true });
  const ua = getRequestHeader("user-agent");
  if (ip) userData["client_ip_address"] = ip;
  if (ua) userData["client_user_agent"] = ua;
  if (input.fbp) userData["fbp"] = input.fbp;
  if (input.fbc) userData["fbc"] = input.fbc;
  if (input.email) userData["em"] = [await sha256(input.email)];
  if (input.externalId) userData["external_id"] = [await sha256(input.externalId)];

  const customData: Record<string, unknown> = { ...(input.customData ?? {}) };
  if (typeof input.value === "number") customData["value"] = input.value;
  if (input.currency) customData["currency"] = input.currency;

  const payload = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: "website",
        ...(input.eventSourceUrl ? { event_source_url: input.eventSourceUrl } : {}),
        user_data: userData,
        ...(Object.keys(customData).length ? { custom_data: customData } : {}),
      },
    ],
    ...(input.testEventCode ? { test_event_code: input.testEventCode } : {}),
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      console.error("Meta CAPI rejected event", input.eventName, await res.text());
      return { sent: false };
    }
    return { sent: true };
  } catch (error) {
    console.error("Meta CAPI request failed", error);
    return { sent: false };
  }
}
