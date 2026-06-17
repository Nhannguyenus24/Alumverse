import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, TextField, Paper, Typography, Avatar, Fade, Tooltip } from '@mui/material';
import { Close as CloseIcon, Send as SendIcon } from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const CHAT_HISTORY_STORAGE_KEY = 'fitbot_chat_history';
const CHAT_HISTORY_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const CHAT_HISTORY_MAX_MESSAGES = 30;

const buildDefaultMessage = () => ({
  id: 1,
  text: 'Xin chào! 👋 Tôi là trợ lý ảo của HCMUS. Tôi có thể giúp bạn tìm hiểu thêm về trường, các chương trình đào tạo, và nhiều thông tin hữu ích khác. Có câu hỏi gì cho tôi không?',
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

const loadMessagesFromStorage = () => {
  try {
    const rawHistory = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    if (!rawHistory) {
      return [buildDefaultMessage()];
    }

    const parsedHistory = JSON.parse(rawHistory);
    if (!Array.isArray(parsedHistory)) {
      return [buildDefaultMessage()];
    }

    const prunedHistory = normalizeAndPruneMessages(parsedHistory);
    return prunedHistory.length > 0 ? prunedHistory : [buildDefaultMessage()];
  } catch (error) {
    return [buildDefaultMessage()];
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
  } catch (error) {
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
  bottom: 20,
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
  backgroundColor: theme.palette.primary.main,
  animation: isAnimating ? `${pulse} 1.5s ease-in-out infinite` : 'none',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.1)',
  },
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
}));

const SuggestionBubble = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  bottom: 80,
  right: -10,
  padding: theme.spacing(1.5, 2.5),
  backgroundColor: theme.palette.primary.main,
  color: '#fff',
  borderRadius: theme.spacing(2),
  cursor: 'pointer',
  minWidth: 280,
  wordWrap: 'break-word',
  fontSize: '0.875rem',
  animation: `${slideUp} 0.4s ease-out`,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.25)',
  },
}));

const ChatWindow = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: 90,
  right: 20,
  width: 380,
  height: 500,
  borderRadius: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
  zIndex: 998,
  [theme.breakpoints.down('sm')]: {
    width: 'calc(100% - 20px)',
    height: 'calc(100vh - 100px)',
  },
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: '#fff',
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
  backgroundColor: '#f5f5f5',
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: '#e0e0e0',
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
  backgroundColor: isBot ? '#e3f2fd' : theme.palette.primary.main,
  color: isBot ? '#000' : '#fff',
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
  borderTop: '1px solid #e0e0e0',
  backgroundColor: '#fff',
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

// Mock suggestions list
const SUGGESTIONS = [
  'Bạn muốn tìm hiểu về khoa CNTT?',
  'Hỏi về quy trình tuyển sinh',
  'Muốn biết thêm về học bổng?',
  'Hỏi về các câu lạc bộ sinh viên',
  'Tìm hiểu về chương trình thực tập',
  'Hỏi về các hoạt động ngoại khóa',
  'Muốn biết điều kiện admission?',
  'Hỏi về dormitory và facilities',
  'Tìm hiểu về career support',
  'Liên hệ với administrative office',
];

// SSE response handler using fetch
const streamSSEResponse = async (userMessage, onChunk, onComplete, onError, signal) => {
  const apiEndpoint = '/ngrok-api/api/stream-query';
  
  try {
    const requestBody = {
      question: userMessage,
      top_k: 10,
      model: 'gemini-2.5-flash',
      use_reranker: false
    };

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'accept': 'text/event-stream, application/json',
        'Content-Type': 'application/json', 
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(requestBody),
      signal: signal
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    
    // If not streaming, just read all and return
    if (contentType.includes('application/json')) {
      let result = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
      }
      try {
        const data = JSON.parse(result);
        let answer = '';
        if (Array.isArray(data)) {
          answer = data.map(item => item.content || item.text || item.answer || '').join('');
        } else {
          answer = data.answer || data.response || data.text || data.content || (data.message ? data.message.content : '');
        }
        if (!answer && typeof data === 'string') {
          answer = data;
        }
        if (answer) onChunk(answer);
      } catch (e) {
        onChunk(result);
      }
      onComplete();
      return;
    }

    // SSE streaming handling
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the incomplete line

      for (const line of lines) {
        if (line.trim() === '') continue;
        if (line.startsWith('data:')) {
          const dataStr = line.slice(5).trim();
          if (dataStr === '[DONE]') {
            continue;
          }
          try {
            const data = JSON.parse(dataStr);
            let textChunk = '';
            if (Array.isArray(data)) {
              textChunk = data.map(item => item.content || item.text || item.answer || '').join('');
            } else if (data.type === 'sources' || (data.sources && Array.isArray(data.sources))) {
              textChunk = ''; // Không hiển thị nguồn tham khảo
            } else {
              textChunk = data.answer || data.response || data.text || data.content || (data.message ? data.message.content : '');
            }
            if (!textChunk && typeof data === 'string') {
              textChunk = data;
            }
            if (textChunk) onChunk(textChunk);
          } catch (e) {
            onChunk(dataStr);
          }
        }
      }
    }
    
    // Process remaining buffer
    if (buffer.startsWith('data:')) {
      const dataStr = buffer.slice(5).trim();
      if (dataStr && dataStr !== '[DONE]') {
        try {
          const data = JSON.parse(dataStr);
          const textChunk = data.answer || data.response || data.text || data.content || (data.message ? data.message.content : '') || dataStr;
          if (textChunk) onChunk(textChunk);
        } catch (e) {
          onChunk(dataStr);
        }
      }
    }

    onComplete();
  } catch (error) {
    if (error.name !== 'AbortError') {
      onError(error);
    }
  }
};

export default function FitBot() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const isAnimating = !isChatOpen;
  const [messages, setMessages] = useState(() => loadMessagesFromStorage());
  const [inputValue, setInputValue] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messageEndRef = useRef(null);
  const suggestionTimeoutRef = useRef(null);
  const suggestionHideTimeoutRef = useRef(null);
  const charIndexRef = useRef(0);
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
          const randomSuggestion =
            SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)];
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
  }, [isChatOpen]);

  const handleSuggestionClick = (suggestion) => {
    setShowSuggestion(false);
    setIsChatOpen(true);
    handleSendMessage(suggestion);
  };

  const handleSendMessage = async (messageText) => {
    const textToSend = messageText || inputValue.trim();
    if (!textToSend) return;

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
      (error) => {
        // On error - show fallback message
        const errorMessage =
          'Xin lỗi, có lỗi xảy ra khi kết nối với máy chủ. Vui lòng thử lại sau.';
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
  };

  const handleClose = () => {
    setIsChatOpen(false);
    setIsTyping(false);
    // Abort active stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  return (
    <>
      {/* Avatar */}
      <AvatarWrapper>
        <Tooltip title={isChatOpen ? '' : 'Chat với trợ lý ảo'} placement="left">
          <AnimatedAvatar
            onClick={() => setIsChatOpen(true)}
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
                color: '#fff',
                minWidth: 'auto',
                padding: '4px',
              }}
            >
              <CloseIcon fontSize="small" />
            </Button>
          </ChatHeader>

          {/* Messages */}
          <MessageContainer>
            {messages.map((message) => (
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
            ))}

            {/* Typing Indicator */}
            {isTyping && (
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
              placeholder="Gửi tin nhắn..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
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
              disabled={isTyping || !inputValue.trim()}
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
