import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function getWsUrl() {
  const envUrl = import.meta.env.VITE_WS_CHAT_URL;
  if (envUrl && typeof envUrl === "string") return envUrl;
  return "ws://localhost:8080/ws/chat";
}

/**
 * Realtime chat WebSocket hook.
 * Backend protocol expects JSON events:
 * - JOIN_GROUP { groupId }
 * - LEAVE_GROUP { groupId }
 * - SEND_MESSAGE { groupId, content, chatType?, messageType?, metadata? }
 * Receives:
 * - MESSAGE_CREATED { payload: { id, groupId, senderMemberId, senderFullName, senderAvatarUrl, content, ... } }
 * - ERROR { message }
 */
export function useChatWebSocket({ token, onEvent }) {
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const [status, setStatus] = useState("closed"); // connecting | open | closed | error

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const outboxRef = useRef([]);
  const intentionalCloseRef = useRef(false);

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

  const joinGroup = useCallback(
    (groupId) => {
      if (groupId == null) return false;
      return sendJson({ type: "JOIN_GROUP", groupId: Number(groupId) });
    },
    [sendJson],
  );

  const leaveGroup = useCallback(
    (groupId) => {
      if (groupId == null) return false;
      return sendJson({ type: "LEAVE_GROUP", groupId: Number(groupId) });
    },
    [sendJson],
  );

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

  return {
    status,
    isOpen: status === "open",
    connect,
    joinGroup,
    leaveGroup,
    sendMessage,
  };
}

