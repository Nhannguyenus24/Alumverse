import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Button, TextField, Paper, Typography, Avatar, Fade, Tooltip } from '@mui/material';
import { Close as CloseIcon, Send as SendIcon } from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';

const CHAT_HISTORY_STORAGE_KEY = 'fitbot_chat_history';
const CHAT_HISTORY_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const CHAT_HISTORY_MAX_MESSAGES = 10;

const buildDefaultMessage = (greeting) => ({
  id: 1,
  text: greeting,
  isBot: true,
  timestamp: new Date(),
});

const normalizeAndPruneMessages = (messages) => {
  const now = Date.now();

  const normalized = messages
    .map((message) => ({
      ...message,
      timestamp: message.timestamp instanceof Date
        ? message.timestamp
        : new Date(message.timestamp),
    }))
    .filter((message) => {
      if (!message || typeof message.text !== 'string' || !message.text.trim()) {
        return false;
      }

      const timestampValue = message.timestamp?.getTime?.();
      if (!Number.isFinite(timestampValue)) {
        return false;
      }

      return now - timestampValue <= CHAT_HISTORY_TTL_MS;
    });

  if (normalized.length <= CHAT_HISTORY_MAX_MESSAGES) {
    return normalized;
  }

  return normalized.slice(-CHAT_HISTORY_MAX_MESSAGES);
};

const loadMessagesFromStorage = (greeting) => {
  try {
    const rawHistory = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    if (!rawHistory) {
      return [buildDefaultMessage(greeting)];
    }

    const parsedHistory = JSON.parse(rawHistory);
    if (!Array.isArray(parsedHistory)) {
      return [buildDefaultMessage(greeting)];
    }

    const prunedHistory = normalizeAndPruneMessages(parsedHistory);
    return prunedHistory.length > 0 ? prunedHistory : [buildDefaultMessage(greeting)];
  } catch {
    return [buildDefaultMessage(greeting)];
  }
};

const saveMessagesToStorage = (messages) => {
  try {
    const prunedMessages = normalizeAndPruneMessages(messages);
    const serializableMessages = prunedMessages.map((message) => ({
      ...message,
      timestamp: message.timestamp.toISOString(),
    }));

    localStorage.setItem(
      CHAT_HISTORY_STORAGE_KEY,
      JSON.stringify(serializableMessages)
    );
  } catch {
    // Ignore error
  }
};

// Animations
const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

const bounce = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Styled Components
const AvatarWrapper = styled(Box)(({ theme }) => ({
  position: 'fixed',
  bottom: 90,
  right: 20,
  cursor: 'pointer',
  zIndex: 999,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const AnimatedAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => prop !== 'isAnimating',
})(({ isAnimating, theme }) => ({
  width: 60,
  height: 60,
  backgroundColor: theme.palette.primary.lighter,
  animation: isAnimating ? `${pulse} 1.5s ease-in-out infinite` : 'none',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.1)',
  },
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.palette.mode === 'dark'
    ? '0 4px 14px rgba(0, 0, 0, 0.45)'
    : '0 4px 12px rgba(0, 0, 0, 0.15)',
}));

const SuggestionBubble = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  right: '100%',
  marginRight: theme.spacing(1.5),
  transform: 'translateY(-50%)',
  padding: theme.spacing(1.5, 2.5),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  borderRadius: theme.spacing(2),
  cursor: 'pointer',
  minWidth: 280,
  wordWrap: 'break-word',
  fontSize: '0.875rem',
  animation: `${slideUp} 0.4s ease-out`,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-50%) scale(1.05)',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.25)',
  },
  [theme.breakpoints.down('sm')]: {
    minWidth: 220,
  },
}));

const ChatWindow = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  right: 96,
  width: 380,
  height: 500,
  borderRadius: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
  zIndex: 998,
  backgroundColor: theme.palette.background.paper,
  [theme.breakpoints.down('sm')]: {
    right: 10,
    bottom: 90,
    width: 'calc(100% - 20px)',
    height: 'calc(100vh - 120px)',
  },
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(2),
  borderRadius: `${theme.spacing(2)} ${theme.spacing(2)} 0 0`,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const MessageContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  backgroundColor: theme.palette.mode === 'dark'
    ? theme.palette.background.default
    : theme.palette.background.paper,
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: theme.palette.mode === 'dark'
      ? theme.palette.grey[800]
      : theme.palette.grey[300],
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.primary.main,
    borderRadius: '3px',
  },
}));

const Message = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isBot',
})(({ isBot }) => ({
  display: 'flex',
  justifyContent: isBot ? 'flex-start' : 'flex-end',
  animation: `${slideUp} 0.3s ease-out`,
}));

const MessageBubble = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isBot',
})(({ theme, isBot }) => ({
  maxWidth: '80%',
  padding: theme.spacing(1.2, 1.6),
  borderRadius: theme.spacing(2),
  backgroundColor: isBot
    ? (theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.primary.lighter)
    : theme.palette.primary.main,
  color: isBot ? theme.palette.text.primary : theme.palette.primary.contrastText,
  wordWrap: 'break-word',
  fontSize: '0.95rem',
  lineHeight: 1.4,
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  '& p': { margin: '0 0 0.5em 0', '&:last-child': { margin: 0 } },
  '& ul, & ol': { margin: '0 0 0.5em 0', paddingLeft: '1.5em' },
  '& li': { marginBottom: '0.2em' },
}));

const InputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  borderRadius: `0 0 ${theme.spacing(2)} ${theme.spacing(2)}`,
  display: 'flex',
  gap: theme.spacing(1),
  alignItems: 'flex-end',
}));

const TypingIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: '4px',
  alignItems: 'center',
  '& span': {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: theme.palette.primary.main,
    animation: `${bounce} 1.4s infinite`,
    '&:nth-of-type(2)': {
      animationDelay: '0.2s',
    },
    '&:nth-of-type(3)': {
      animationDelay: '0.4s',
    },
  },
}));

// Suggestion keys for i18n lookup — values defined in common locale
const SUGGESTION_KEYS = [
  'fitbot_suggestion_cntt',
  'fitbot_suggestion_admission',
  'fitbot_suggestion_scholarship',
  'fitbot_suggestion_clubs',
  'fitbot_suggestion_internship',
  'fitbot_suggestion_extracurricular',
  'fitbot_suggestion_admission_requirements',
  'fitbot_suggestion_dormitory',
  'fitbot_suggestion_career',
  'fitbot_suggestion_admin_office',
];

const FITBOT_API_URL = import.meta.env.VITE_FITBOT_API_URL;
const MIN_QUESTION_LENGTH = 3;

// Query the RAG API and return the answer. The endpoint responds with a
// single JSON body ({ answer, sources }), so we do a plain JSON POST that
// mirrors the working curl request rather than SSE streaming.
const streamSSEResponse = async (userMessage, onChunk, onComplete, onError, signal) => {
  const apiEndpoint = `${FITBOT_API_URL}/api/query`;

  try {
    const requestBody = {
      question: userMessage,
      top_k: 7,
      model: 'gemini-2.5-flash',
      use_reranker: false,
    };

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(requestBody),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const answer = typeof data === 'string'
      ? data
      : (data.answer || data.response || data.text || data.content || '');

    if (answer) onChunk(answer);
    onComplete();
  } catch (error) {
    if (error.name !== 'AbortError') {
      onError(error);
    }
  }
};

export default function FitBot({ isOpen = false, isBlocked = false, onOpen, onClose }) {
  const { t } = useTranslation('common');
  const isChatOpen = isOpen;
  const isAnimating = !isChatOpen;
  const [messages, setMessages] = useState(() => loadMessagesFromStorage(t('fitbot_greeting')));
  const [inputValue, setInputValue] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messageEndRef = useRef(null);
  const suggestionTimeoutRef = useRef(null);
  const suggestionHideTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messageEndRef.current && isChatOpen) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isChatOpen]);

  // Persist chat history to localStorage
  useEffect(() => {
    saveMessagesToStorage(messages);
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
      if (suggestionHideTimeoutRef.current) {
        clearTimeout(suggestionHideTimeoutRef.current);
      }
    };
  }, []);

  // Show random suggestion at random interval
  useEffect(() => {
    if (!isChatOpen) {
      const scheduleNextSuggestion = () => {
        suggestionTimeoutRef.current = setTimeout(() => {
          if (isBlocked) {
            scheduleNextSuggestion();
            return;
          }
          const randomKey =
            SUGGESTION_KEYS[Math.floor(Math.random() * SUGGESTION_KEYS.length)];
          const randomSuggestion = t(randomKey);
          setCurrentSuggestion(randomSuggestion);
          setShowSuggestion(true);

          // Auto-hide suggestion after 5-8 seconds
          suggestionHideTimeoutRef.current = setTimeout(() => {
            setShowSuggestion(false);
            // Schedule next suggestion after hiding
            scheduleNextSuggestion();
          }, Math.random() * 3000 + 5000); // 5-8 seconds
        }, Math.random() * 10000 + 10000); // 10-20 seconds
      };

      scheduleNextSuggestion();

      return () => {
        clearTimeout(suggestionTimeoutRef.current);
        clearTimeout(suggestionHideTimeoutRef.current);
      };
    }
  }, [isBlocked, isChatOpen, t]);


  const handleSendMessage = useCallback(async (messageText) => {
    const rawText = typeof messageText === 'string' ? messageText : inputValue;
    const textToSend = rawText.trim();
    if (textToSend.length < MIN_QUESTION_LENGTH) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: textToSend,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // Show typing indicator
    setIsTyping(true);

    // Add placeholder bot message
    const botMessageId = Date.now() + 1;
    setMessages((prev) => [
      ...prev,
      {
        id: botMessageId,
        text: '',
        isBot: true,
        timestamp: new Date(),
      },
    ]);

    let fullResponse = '';

    // Create abort controller for this stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Stream response from server via SSE
    streamSSEResponse(
      textToSend,
      (chunk) => {
        // Cập nhật trực tiếp ngay khi nhận chunk để markdown render không bị lỗi và chữ chạy nhanh hơn
        fullResponse += chunk;
        setMessages((prev) => {
          const updatedMessages = [...prev];
          const botMessageIndex = updatedMessages.findIndex(
            (msg) => msg.id === botMessageId
          );
          if (botMessageIndex >= 0) {
            updatedMessages[botMessageIndex].text = fullResponse;
          }
          return updatedMessages;
        });
      },
      () => {
        // On complete
        setIsTyping(false);
        abortControllerRef.current = null;
      },
      () => {
        // On error - show fallback message
        const errorMessage = t('fitbot_error_message');
        fullResponse = errorMessage;
        setMessages((prev) => {
          const updatedMessages = [...prev];
          const botMessageIndex = updatedMessages.findIndex(
            (msg) => msg.id === botMessageId
          );
          if (botMessageIndex >= 0) {
            updatedMessages[botMessageIndex].text = errorMessage;
          }
          return updatedMessages;
        });
        setIsTyping(false);
        abortControllerRef.current = null;
      },
      abortControllerRef.current.signal
    );
  }, [inputValue, t]);

  const handleSuggestionClick = useCallback((suggestion) => {
    setShowSuggestion(false);
    onOpen?.();
    handleSendMessage(suggestion);
  }, [handleSendMessage, onOpen]);

  const trimmedInput = inputValue.trim();
  const inputTooShort =
    trimmedInput.length > 0 && trimmedInput.length < MIN_QUESTION_LENGTH;

  const handleClose = useCallback(() => {
    onClose?.();
    setIsTyping(false);
    // Abort active stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, [onClose]);

  const renderedMessages = React.useMemo(() => {
    return messages
      .filter((message) => message.text !== '')
      .map((message) => (
      <Message key={message.id} isBot={message.isBot}>
        <MessageBubble isBot={message.isBot}>
          {message.isBot ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.text}
            </ReactMarkdown>
          ) : (
            message.text
          )}
        </MessageBubble>
      </Message>
    ));
  }, [messages]);

  return (
    <>
      {/* Avatar */}
      <AvatarWrapper>
        <Tooltip title={isChatOpen ? '' : t('fitbot_chat_tooltip')} placement="left">
          <AnimatedAvatar
            onClick={onOpen}
            isAnimating={isAnimating}
            sx={{
              cursor: 'pointer',
              fontSize: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src="/fitbot/FITBOT.svg"
              alt="FitBot"
              style={{ width: 36, height: 36 }}
            />
          </AnimatedAvatar>
        </Tooltip>

        {/* Suggestion Bubble */}
        <Fade in={showSuggestion} timeout={400}>
          <SuggestionBubble
            onClick={() => handleSuggestionClick(currentSuggestion)}
          >
            {currentSuggestion}
          </SuggestionBubble>
        </Fade>
      </AvatarWrapper>

      {/* Chat Window */}
      <Fade in={isChatOpen} timeout={300}>
        <ChatWindow>
          {/* Header */}
          <ChatHeader>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <img
                src="/fitbot/FITBOT.svg"
                alt="FitBot"
                style={{ width: 36, height: 36 }}
              />
              HCMUS Assistant
            </Typography>
            <Button
              size="small"
              onClick={handleClose}
              sx={{
                color: 'primary.contrastText',
                minWidth: 'auto',
                padding: '4px',
              }}
            >
              <CloseIcon fontSize="small" />
            </Button>
          </ChatHeader>

          {/* Messages */}
          <MessageContainer>
            {renderedMessages}

            {/* Typing Indicator */}
            {isTyping && messages.length > 0 && messages[messages.length - 1].isBot && messages[messages.length - 1].text === '' && (
              <Message isBot={true}>
                <TypingIndicator>
                  <span></span>
                  <span></span>
                  <span></span>
                </TypingIndicator>
              </Message>
            )}

            <div ref={messageEndRef} />
          </MessageContainer>

          {/* Input */}
          <InputContainer>
            <TextField
              fullWidth
              size="small"
              placeholder={t('fitbot_send_placeholder')}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              error={inputTooShort}
              helperText={inputTooShort ? t('fitbot_question_too_short') : undefined}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
              disabled={isTyping}
              multiline
              maxRows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '20px',
                  fontSize: '0.95rem',
                },
              }}
            />
            <Button
              variant="contained"
              onClick={() => handleSendMessage()}
              disabled={isTyping || trimmedInput.length < MIN_QUESTION_LENGTH}
              size="small"
              sx={{
                borderRadius: '50%',
                minWidth: '40px',
                width: '40px',
                height: '40px',
                padding: 0,
              }}
            >
              <SendIcon fontSize="small" />
            </Button>
          </InputContainer>
        </ChatWindow>
      </Fade>
    </>
  );
}
