import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { eq } from "drizzle-orm";
import { db, users } from "../db";
import type { UserRole } from "../db/schema";

// WebSocket message types
export type WSMessageType = "comment" | "worker_signup" | "worker_cancel" | "event_update" | "guest_signup";

export interface WSMessage {
  type: WSMessageType;
  eventId: string;
  data: Record<string, unknown>;
  timestamp: string;
}

// Active connections store: eventId -> Set of WebSocket instances
const eventSubscriptions = new Map<string, Set<any>>();

// User authentication for WebSocket
export async function authenticateWS(token: string): Promise<{ id: string; name: string; role: UserRole } | null> {
  try {
    // Decode JWT manually since we don't have access to the jwt plugin here
    const [headerB64, payloadB64] = token.split(".");
    if (!payloadB64) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    if (!payload.userId) return null;

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
      columns: {
        id: true,
        name: true,
        role: true,
        deactivated: true,
      },
    });

    if (!user || user.deactivated) return null;

    return {
      id: user.id,
      name: user.name,
      role: user.role as UserRole,
    };
  } catch {
    return null;
  }
}

// Subscribe a connection to an event
export function subscribeToEvent(eventId: string, ws: any): void {
  if (!eventSubscriptions.has(eventId)) {
    eventSubscriptions.set(eventId, new Set());
  }
  eventSubscriptions.get(eventId)!.add(ws);
}

// Unsubscribe a connection from an event
export function unsubscribeFromEvent(eventId: string, ws: any): void {
  const subs = eventSubscriptions.get(eventId);
  if (subs) {
    subs.delete(ws);
    if (subs.size === 0) {
      eventSubscriptions.delete(eventId);
    }
  }
}

// Unsubscribe from all events (when connection closes)
export function unsubscribeFromAll(ws: any): void {
  for (const [eventId, subs] of eventSubscriptions.entries()) {
    subs.delete(ws);
    if (subs.size === 0) {
      eventSubscriptions.delete(eventId);
    }
  }
}

// Broadcast message to all subscribers of an event
export function broadcastToEvent(eventId: string, message: WSMessage): void {
  const subs = eventSubscriptions.get(eventId);
  if (!subs || subs.size === 0) return;

  const messageStr = JSON.stringify(message);

  for (const ws of subs) {
    try {
      ws.send(messageStr);
    } catch (error) {
      // Connection might be closed, ignore
      console.error("Failed to send WebSocket message:", error);
    }
  }
}

// Create WebSocket handler
export function createWebSocketHandler() {
  return new Elysia({ prefix: "/ws" })
    .use(
      jwt({
        secret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
        exp: "7d",
      })
    )
    .ws("/", {
      // Connection opened
      open(ws) {
        console.log("WebSocket connection opened");
      },

      // Message received
      async message(ws, message: { type: string; eventId?: string; token?: string }) {
        try {
          switch (message.type) {
            case "auth": {
              // Authenticate connection
              if (!message.token) {
                ws.send(JSON.stringify({ type: "error", message: "Token required" }));
                return;
              }

              const user = await authenticateWS(message.token);
              if (!user) {
                ws.send(JSON.stringify({ type: "error", message: "Invalid token" }));
                return;
              }

              // Store user data on the websocket
              (ws as any).data = { ...(ws as any).data, user };
              ws.send(JSON.stringify({ type: "auth", status: "success" }));
              break;
            }

            case "subscribe": {
              if (!message.eventId) {
                ws.send(JSON.stringify({ type: "error", message: "eventId required" }));
                return;
              }

              subscribeToEvent(message.eventId, ws);
              ws.send(JSON.stringify({ type: "subscribed", eventId: message.eventId }));
              break;
            }

            case "unsubscribe": {
              if (!message.eventId) {
                ws.send(JSON.stringify({ type: "error", message: "eventId required" }));
                return;
              }

              unsubscribeFromEvent(message.eventId, ws);
              ws.send(JSON.stringify({ type: "unsubscribed", eventId: message.eventId }));
              break;
            }

            default:
              ws.send(JSON.stringify({ type: "error", message: "Unknown message type" }));
          }
        } catch (error) {
          console.error("WebSocket message handler error:", error);
          ws.send(JSON.stringify({ type: "error", message: "Internal error" }));
        }
      },

      // Connection closed
      close(ws) {
        console.log("WebSocket connection closed");
        unsubscribeFromAll(ws);
      },

      // Body schema for validation
      body: t.Object({
        type: t.String(),
        eventId: t.Optional(t.String()),
        token: t.Optional(t.String()),
      }),
    });
}

// Export the WebSocket functions for use in routes
export const ws = {
  subscribeToEvent,
  unsubscribeFromEvent,
  unsubscribeFromAll,
  broadcastToEvent,
};
