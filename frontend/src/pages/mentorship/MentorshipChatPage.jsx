import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from 'react-router';
import { Box, useTheme } from "@mui/material";
import { usePrivateChats } from "../../hooks/mentorship/usePrivateChats";
import useAuthStore from "../../stores/authStore";
import { useChatWebSocket } from "../../hooks/mentorship/useChatWebSocket";
import { useChatMessages } from "../../hooks/mentorship/useChatMessages";
import MentorshipChatSidebar from "../../components/mentorship/MentorshipChatSidebar";
import MentorshipChatPanel from "../../components/mentorship/MentorshipChatPanel";
import { useOrgNavigate } from '../../hooks/useOrgNavigate';

const CHAT_BASE = "/development/mentorship/chat";

function toUiMessage(message, currentUserId) {
  if (!message) return null;
  return {
    id: message.id,
    fromPeer:
      currentUserId != null ? message.senderMemberId !== currentUserId : true,
    body: message.content ?? "",
    createdAt: message.createdAt ?? null,
    metadata: message.metadata ?? null,
  };
}

function formatRelativeTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffM = Math.floor(diffMs / 60000);

  if (!Number.isFinite(diffM) || diffM < 0) return "";
  if (diffM <= 1) return "1m";
  if (diffM < 60) return `${diffM}m`;

  const diffH = Math.floor(diffM / 60);
  if (diffH < 24) return `${diffH}h`;

  const diffD = Math.floor(diffH / 24);
  return `${diffD}d`;
}

function getChatDisplayName(chat) {
  if (chat?.peerUserName) return chat.peerUserName;
  if (chat?.title) return chat.title;
  return `Private chat #${chat?.id ?? ""}`;
}

function mergeHistoryAndRealtime(history, realtime) {
  if (realtime == null || realtime.length === 0) return history;
  const byId = new Map();
  for (const m of history) {
    if (m?.id != null) byId.set(m.id, m);
  }
  for (const m of realtime) {
    if (m?.id != null && !byId.has(m.id)) byId.set(m.id, m);
  }
  return Array.from(byId.values()).sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (ta !== tb) return ta - tb;
    return Number(a.id ?? 0) - Number(b.id ?? 0);
  });
}

const MentorshipChatPage = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const navigate = useOrgNavigate();
  const { chatId } = useParams();
  const { token, user } = useAuthStore();
  const [draft, setDraft] = useState("");
  const [messagesByChat, setMessagesByChat] = useState({});
  const messagesEndRef = useRef(null);
  const prevChatIdRef = useRef(null);

  const { privateChats, isPending, isError, errorMessage } = usePrivateChats();

  const paramId = useMemo(() => {
    const n = chatId != null ? Number(chatId) : null;
    return n != null && Number.isFinite(n) ? n : null;
  }, [chatId]);

  const activeChatId = useMemo(() => {
    if (isPending) return null;
    if (!privateChats?.length) return null;
    if (paramId == null) return null;
    if (privateChats.some((g) => g.id === paramId)) return paramId;
    return privateChats[0]?.id ?? null;
  }, [privateChats, isPending, paramId]);

  useEffect(() => {
    if (activeChatId == null) return;
    if (paramId === activeChatId) return;
    navigate(`${CHAT_BASE}/${activeChatId}`, { replace: true });
  }, [activeChatId, navigate, paramId]);

  const selectedChat = useMemo(
    () => privateChats.find((c) => c.id === activeChatId) ?? null,
    [privateChats, activeChatId],
  );

  const selectedChatName = selectedChat
    ? getChatDisplayName(selectedChat)
    : "Private chat";
  const selectedChatLastSeen = selectedChat
    ? formatRelativeTime(selectedChat.updatedAt ?? selectedChat.createdAt)
    : "";
  const { messages: historyMessages, isPending: isHistoryLoading } =
    useChatMessages(activeChatId, 0, 20);

  const handleWsEvent = useCallback(
    (event) => {
      if (!event || typeof event !== "object") return;
      if (event.type !== "MESSAGE_CREATED") return;
      const payload = event.payload;
      const groupId = payload?.groupId;
      if (groupId == null) return;

      const ui = toUiMessage(payload, user?.id);
      if (!ui) return;

      setMessagesByChat((prev) => {
        const current = prev[groupId] ?? [];
        if (current.some((m) => m.id === ui.id)) return prev;
        return { ...prev, [groupId]: [...current, ui] };
      });
      queryClient.invalidateQueries({ queryKey: ["privateChats"] });
    },
    [user?.id, queryClient],
  );

  const {
    status: wsStatus,
    isOpen,
    joinGroup,
    leaveGroup,
    sendMessage,
  } = useChatWebSocket({ token, onEvent: handleWsEvent });

  const mappedHistoryMessages = useMemo(
    () => historyMessages.map((m) => toUiMessage(m, user?.id)).filter(Boolean),
    [historyMessages, user?.id],
  );

  const messages = useMemo(() => {
    if (activeChatId == null) return [];
    const realtime = messagesByChat[activeChatId];
    return mergeHistoryAndRealtime(mappedHistoryMessages, realtime);
  }, [activeChatId, mappedHistoryMessages, messagesByChat]);

  useEffect(() => {
    if (activeChatId == null) return;
    if (!isOpen) return;

    const prevId = prevChatIdRef.current;
    if (prevId != null && prevId !== activeChatId) {
      leaveGroup(prevId);
    }
    joinGroup(activeChatId);
    prevChatIdRef.current = activeChatId;
  }, [activeChatId, isOpen, joinGroup, leaveGroup]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatId, messages.length]);

  useEffect(() => {
    const html = document.documentElement;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    if (activeChatId == null) return;
    sendMessage({
      groupId: activeChatId,
      content: text,
    });
    setDraft("");
  };

  const chatShellHeight = `calc(100dvh - ${theme.mixins.toolbar.minHeight ?? 64}px)`;

  const mainView = useMemo(() => {
    if (isPending && paramId != null) return "loading";
    if (isPending && paramId == null) return "empty";
    if (activeChatId == null) return "empty";
    return "chat";
  }, [isPending, paramId, activeChatId]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        height: chatShellHeight,
        maxHeight: chatShellHeight,
        minHeight: 0,
        width: "100%",
        overflow: "hidden",
        [theme.breakpoints.down("md")]: {
          flexDirection: "column",
        },
      }}
    >
      <MentorshipChatSidebar
        paramId={paramId}
        isPending={isPending}
        isError={isError}
        errorMessage={errorMessage}
        privateChats={privateChats}
        activeChatId={activeChatId}
        navigate={navigate}
      />
      <MentorshipChatPanel
        mainView={mainView}
        paramId={paramId}
        isPending={isPending}
        privateChats={privateChats}
        isError={isError}
        errorMessage={errorMessage}
        selectedChatName={selectedChatName}
        selectedChatLastSeen={selectedChatLastSeen}
        token={token}
        isOpen={isOpen}
        wsStatus={wsStatus}
        messages={messages}
        isHistoryLoading={isHistoryLoading}
        messagesEndRef={messagesEndRef}
        draft={draft}
        setDraft={setDraft}
        handleSend={handleSend}
        navigate={navigate}
        activeChatId={activeChatId}
      />
    </Box>
  );
};

export default MentorshipChatPage;
