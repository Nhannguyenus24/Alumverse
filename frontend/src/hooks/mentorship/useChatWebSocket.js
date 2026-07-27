import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function getWsUrl() {
  const envUrl = import.meta.env.VITE_WS_CHAT_URL;
  if (envUrl && typeof envUrl === "string") return envUrl;
  return "wss://alumni-api-hcmus.duckdns.org/ws/chat";
}

/**
 * Realtime chat WebSocket hook.
 * Backend protocol expects JSON events:
 * - JOIN_GROUP { groupId }
 * - LEAVE_GROUP { groupId }
 * - SEND_MESSAGE { groupId, content, chatType?, messageType?, metadata? }
 * - TYPING { groupId, isTyping }
 * Receives:
 * - MESSAGE_CREATED { payload: { id, groupId, senderMemberId, senderFullName, senderAvatarUrl, content, ... } }
 * - TYPING { payload: { groupId, memberId, senderName, isTyping } }
 * - ERROR { message }
 */
export function useChatWebSocket({ token, onEvent, onReconnect }) {
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const onReconnectRef = useRef(onReconnect);
  useEffect(() => {
    onReconnectRef.current = onReconnect;
  }, [onReconnect]);

  const [status, setStatus] = useState("closed"); // connecting | open | closed | error

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const outboxRef = useRef([]);
  const intentionalCloseRef = useRef(false);
  // groupIds joined so far; re-sent on every (re)open so a fresh connection
  // (after any drop — busy uplink, sleep, wifi switch, network blip) is
  // always routed correctly server-side, regardless of what caused the drop.
  const joinedGroupsRef = useRef(new Set());
  const hasOpenedOnceRef = useRef(false);

  const wsUrl = useMemo(() => {
    if (!token) return null;
    const base = getWsUrl();
    const joinChar = base.includes("?") ? "&" : "?";
    return `${base}${joinChar}token=${encodeURIComponent(token)}`;
  }, [token]);

  const cleanup = useCallback(() => {
    intentionalCloseRef.current = true;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    const ws = wsRef.current;
    wsRef.current = null;
    if (
      ws &&
      (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)
    ) {
      ws.close();
    }
  }, []);

  const flushOutbox = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const queue = outboxRef.current;
    if (!queue.length) return;
    outboxRef.current = [];
    queue.forEach((msg) => ws.send(msg));
  }, []);

  const sendJson = useCallback(
    (obj) => {
      const text = JSON.stringify(obj);
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(text);
        return true;
      }
      outboxRef.current.push(text);
      return false;
    },
    [],
  );

  const connectRef = useRef();

  const connect = useCallback(() => {
    if (!wsUrl) return;
    intentionalCloseRef.current = false;
    const existing = wsRef.current;
    if (
      existing &&
      (existing.readyState === WebSocket.OPEN ||
        existing.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    setStatus("connecting");
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptRef.current = 0;
      setStatus("open");
      flushOutbox();
      joinedGroupsRef.current.forEach((gid) => {
        ws.send(JSON.stringify({ type: "JOIN_GROUP", groupId: gid }));
      });
      if (hasOpenedOnceRef.current) {
        onReconnectRef.current?.();
      }
      hasOpenedOnceRef.current = true;
    };

    ws.onmessage = (e) => {
      try {
        const json = JSON.parse(e.data);
        onEventRef.current?.(json);
      } catch {
        onEventRef.current?.({ type: "RAW", payload: e.data });
      }
    };

    ws.onerror = () => {
      setStatus("error");
    };

    ws.onclose = () => {
      setStatus("closed");
      if (intentionalCloseRef.current) return;
      if (!wsUrl) return;
      const attempt = Math.min(reconnectAttemptRef.current + 1, 6);
      reconnectAttemptRef.current = attempt;
      const delayMs = Math.min(1000 * 2 ** (attempt - 1), 15000);
      reconnectTimerRef.current = setTimeout(() => {
        connectRef.current();
      }, delayMs);
    };
  }, [flushOutbox, wsUrl]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    cleanup();
    outboxRef.current = [];
    reconnectAttemptRef.current = 0;
    hasOpenedOnceRef.current = false;
    if (!wsUrl) {
      const timer = setTimeout(() => setStatus("closed"), 0);
      return () => {
        cleanup();
        clearTimeout(timer);
      };
    }
    const timer = setTimeout(connect, 0);
    return () => {
      cleanup();
      clearTimeout(timer);
    };
  }, [cleanup, connect, wsUrl]);

  // joinGroup/leaveGroup intentionally do NOT go through sendJson's outbox
  // queue: joinedGroupsRef is already re-sent in full on every ws.onopen
  // (initial connect and every reconnect). Queuing here too would cause a
  // duplicate JOIN_GROUP send (once from the flushed outbox, once from the
  // onopen re-join loop) whenever the socket wasn't open yet when this was
  // called (e.g. the very first join on mount, before the socket finishes
  // connecting).
  const joinGroup = useCallback((groupId) => {
    if (groupId == null) return false;
    const gid = Number(groupId);
    joinedGroupsRef.current.add(gid);
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "JOIN_GROUP", groupId: gid }));
      return true;
    }
    return false;
  }, []);

  const leaveGroup = useCallback((groupId) => {
    if (groupId == null) return false;
    const gid = Number(groupId);
    joinedGroupsRef.current.delete(gid);
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "LEAVE_GROUP", groupId: gid }));
      return true;
    }
    return false;
  }, []);

  const sendMessage = useCallback(
    ({ groupId, content, chatType, messageType = "TEXT", metadata = null }) => {
      if (groupId == null) return false;
      if (!content || typeof content !== "string") return false;
      return sendJson({
        type: "SEND_MESSAGE",
        groupId: Number(groupId),
        content,
        chatType,
        messageType,
        metadata,
      });
    },
    [sendJson],
  );

  // Ephemeral "is typing" ping. Never queued in the outbox: a stale typing
  // signal that arrives after the socket reconnects is worthless (the peer's
  // indicator auto-expires), so we simply drop it when the socket isn't open.
  const sendTyping = useCallback(({ groupId, isTyping }) => {
    if (groupId == null) return false;
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "TYPING",
          groupId: Number(groupId),
          isTyping: Boolean(isTyping),
        }),
      );
      return true;
    }
    return false;
  }, []);

  return {
    status,
    isOpen: status === "open",
    connect,
    joinGroup,
    leaveGroup,
    sendMessage,
    sendTyping,
  };
}

