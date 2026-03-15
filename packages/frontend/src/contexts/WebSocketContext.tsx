import React, { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from "react";

export type WSMessageType = "comment" | "worker_signup" | "worker_cancel" | "event_update" | "guest_signup";

export interface WSMessage {
  type: WSMessageType;
  eventId: string;
  data: Record<string, unknown>;
  timestamp: string;
}

type MessageHandler = (message: WSMessage) => void;

interface WebSocketContextType {
  isConnected: boolean;
  isAuthenticated: boolean;
  subscribe: (eventId: string, handler: MessageHandler) => void;
  unsubscribe: (eventId: string, handler: MessageHandler) => void;
  sendMessage: (message: unknown) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

// Use environment variable for WS URL, fallback to relative path for Docker/proxy setups
const WS_URL = import.meta.env.VITE_WS_URL?.trim() || "/ws";
const RECONNECT_DELAY = 3000; // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 5;
const PING_INTERVAL = 30000; // 30 seconds - keepalive to prevent nginx timeout

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlersRef = useRef<Map<string, Set<MessageHandler>>>(new Map());
  const pendingSubscriptionsRef = useRef<Set<string>>(new Set());
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;

        // Authenticate
        const token = localStorage.getItem("token");
        if (token) {
          ws.send(JSON.stringify({ type: "auth", token }));
        }

        // Resubscribe to any pending events
        pendingSubscriptionsRef.current.forEach((eventId) => {
          ws.send(JSON.stringify({ type: "subscribe", eventId }));
        });

        // Start keepalive ping to prevent nginx idle timeout
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, PING_INTERVAL);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          // Handle auth response
          if (message.type === "auth" && message.status === "success") {
            setIsAuthenticated(true);
            return;
          }

          // Handle errors
          if (message.type === "error") {
            console.error("WebSocket error:", message.message);
            return;
          }

          // Handle subscription confirmations
          if (message.type === "subscribed" || message.type === "unsubscribed") {
            return;
          }

          // Broadcast message to handlers
          const msg = message as WSMessage;
          const handlers = handlersRef.current.get(msg.eventId);
          if (handlers) {
            handlers.forEach((handler) => {
              try {
                handler(msg);
              } catch (error) {
                console.error("Message handler error:", error);
              }
            });
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        setIsAuthenticated(false);
        wsRef.current = null;

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          console.log(`Attempting to reconnect... (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
          reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
    }
  }, []);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    reconnectAttemptsRef.current = MAX_RECONNECT_ATTEMPTS; // Prevent auto-reconnect

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsAuthenticated(false);
  }, []);

  // Subscribe to an event
  const subscribe = useCallback((eventId: string, handler: MessageHandler) => {
    // Add handler
    if (!handlersRef.current.has(eventId)) {
      handlersRef.current.set(eventId, new Set());
    }
    handlersRef.current.get(eventId)!.add(handler);

    // Track pending subscription
    pendingSubscriptionsRef.current.add(eventId);

    // Send subscribe message if connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "subscribe", eventId }));
    } else if (!isConnected) {
      // Connect if not already connected
      connect();
    }
  }, [isConnected, connect]);

  // Unsubscribe from an event
  const unsubscribe = useCallback((eventId: string, handler: MessageHandler) => {
    // Remove handler
    const handlers = handlersRef.current.get(eventId);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        handlersRef.current.delete(eventId);
      }
    }

    // Send unsubscribe message if connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "unsubscribe", eventId }));
    }

    // Remove from pending subscriptions
    pendingSubscriptionsRef.current.delete(eventId);
  }, []);

  // Send a message
  const sendMessage = useCallback((message: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected");
    }
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Re-authenticate when token changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token") {
        if (e.newValue) {
          // Token added/changed - re-authenticate
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "auth", token: e.newValue }));
          }
        } else {
          // Token removed - disconnect
          disconnect();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [disconnect]);

  const value: WebSocketContextType = {
    isConnected,
    isAuthenticated,
    subscribe,
    unsubscribe,
    sendMessage,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}

// Hook for subscribing to a specific event
export function useEventSubscription(eventId: string, onMessage: MessageHandler) {
  const { subscribe, unsubscribe, isConnected } = useWebSocket();

  useEffect(() => {
    subscribe(eventId, onMessage);
    return () => unsubscribe(eventId, onMessage);
  }, [eventId, onMessage, subscribe, unsubscribe]);

  return { isConnected };
}
