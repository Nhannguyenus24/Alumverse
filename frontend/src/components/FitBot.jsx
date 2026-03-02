import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, TextField, Paper, Typography, Avatar, Fade, Tooltip } from '@mui/material';
import { Close as CloseIcon, Send as SendIcon } from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

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

const AnimatedAvatar = styled(Avatar)(({ theme, isAnimating }) => ({
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

const Message = styled(Box)(({ theme, isBot }) => ({
  display: 'flex',
  justifyContent: isBot ? 'flex-start' : 'flex-end',
  animation: `${slideUp} 0.3s ease-out`,
}));

const MessageBubble = styled(Box)(({ theme, isBot }) => ({
  maxWidth: '80%',
  padding: theme.spacing(1.2, 1.6),
  borderRadius: theme.spacing(2),
  backgroundColor: isBot ? '#e3f2fd' : theme.palette.primary.main,
  color: isBot ? '#000' : '#fff',
  wordWrap: 'break-word',
  fontSize: '0.95rem',
  lineHeight: 1.4,
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
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

// Mock API response generator
const getMockResponse = (userMessage) => {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('khoa') || lowerMessage.includes('cntt') || lowerMessage.includes('it')) {
    return 'Khoa CNTT của chúng tôi là một trong những khoa hàng đầu, cung cấp các chương trình đào tạo về lập trình, AI, và công nghệ thông tin. Bạn muốn biết thêm về các ngành học cụ thể không?';
  }

  if (lowerMessage.includes('học bổng') || lowerMessage.includes('scholarship')) {
    return 'Chúng tôi cung cấp nhiều loại học bổng cho sinh viên xuất sắc, bao gồm học bổng toàn phần và bán phần. Vui lòng truy cập trang web của chúng tôi để biết thêm chi tiết!';
  }

  if (lowerMessage.includes('tuyển sinh') || lowerMessage.includes('admission') || lowerMessage.includes('enrollment')) {
    return 'Quy trình tuyển sinh của trường gồm các bước: 1) Nộp hồ sơ, 2) Dự thi đầu vào, 3) Phỏng vấn. Kỳ tuyển sinh năm nay bắt đầu vào tháng 5. Bạn cần giúp đỡ gì thêm?';
  }

  if (lowerMessage.includes('sinh viên') || lowerMessage.includes('student')) {
    return 'Chúng tôi có rất nhiều hoạt động dành cho sinh viên, từ các câu lạc bộ, sự kiện thể thao đến các chương trình trao đổi quốc tế. Có điều gì bạn quan tâm không?';
  }

  if (lowerMessage.includes('cảm ơn') || lowerMessage.includes('thank')) {
    return 'Vui lòng! Nếu bạn có thêm câu hỏi nào khác, cứ thoải mái hỏi tôi. Tôi luôn sẵn sàng giúp đỡ!';
  }

  return 'Cảm ơn bạn đã hỏi! Đó là một câu hỏi thú vị. Nếu bạn có thêm câu hỏi cụ thể hoặc cần thông tin chi tiết hơn, vui lòng để lại tin nhắn hoặc liên hệ với phòng tư vấn của chúng tôi.';
};

export default function FitBot() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Xin chào! 👋 Tôi là trợ lý ảo của HCMUS. Tôi có thể giúp bạn tìm hiểu thêm về trường, các chương trình đào tạo, và nhiều thông tin hữu ích khác. Có câu hỏi gì cho tôi không?',
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);
  const messageEndRef = useRef(null);
  const suggestionTimeoutRef = useRef(null);
  const suggestionHideTimeoutRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messageEndRef.current && isChatOpen) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isChatOpen]);

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

  // Stop animation when chat opens
  useEffect(() => {
    setIsAnimating(!isChatOpen);
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

    // Simulate API call with delay
    typingTimeoutRef.current = setTimeout(() => {
      const botResponse = getMockResponse(textToSend);
      
      // Typewriter effect
      let currentIndex = 0;
      const botMessageId = Date.now() + 1;
      let displayedText = '';

      const typeChar = () => {
        if (currentIndex < botResponse.length) {
          displayedText += botResponse[currentIndex];
          currentIndex++;

          setMessages((prev) => {
            const updatedMessages = [...prev];
            const botMessageIndex = updatedMessages.findIndex(
              (msg) => msg.id === botMessageId
            );

            if (botMessageIndex >= 0) {
              updatedMessages[botMessageIndex].text = displayedText;
            } else {
              updatedMessages.push({
                id: botMessageId,
                text: displayedText,
                isBot: true,
                timestamp: new Date(),
              });
            }

            return updatedMessages;
          });

          setTimeout(typeChar, 50); // 50ms per character for smooth typewriter effect
        } else {
          setIsTyping(false);
        }
      };

      // Initialize bot message with empty text
      setMessages((prev) => [
        ...prev,
        {
          id: botMessageId,
          text: '',
          isBot: true,
          timestamp: new Date(),
        },
      ]);

      typeChar();
    }, 1000 + Math.random() * 1000); // 1-2 seconds delay
  };

  const handleClose = () => {
    setIsChatOpen(false);
    setIsTyping(false);
    clearTimeout(typingTimeoutRef.current);
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
            🤖
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
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              🤖 HCMUS Assistant
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
                  {message.text}
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
