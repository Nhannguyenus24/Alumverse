import { useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import SendIcon from '@mui/icons-material/Send';
import MoodIcon from '@mui/icons-material/Mood';
import Scrollbar from '../Scrollbar';

const MESSAGE_MAP = {
  1: [
    { id: 1, fromPeer: true, body: 'Chao ban, minh rat vui duoc ket noi voi ban.' },
    { id: 2, fromPeer: false, body: 'Cam on ban. Minh dang tim co hoi hop tac.' },
  ],
  2: [
    { id: 3, fromPeer: true, body: 'Team ben minh dang mo vi tri internship frontend.' },
    { id: 4, fromPeer: false, body: 'Hay qua, ban gui minh JD tham khao nhe.' },
  ],
  3: [
    { id: 5, fromPeer: true, body: 'Toi muon trao doi ve du an alumni community.' },
    { id: 6, fromPeer: false, body: 'Ok, minh ranh vao cuoi tuan.' },
    {id: 7, fromPeer: false, body: 'Vay thi di luon nhi '},
    {id: 8, fromPeer: false, body: 'Vay thi di luon nhi '},
    {id: 9, fromPeer: false, body: 'Vay thi di luon nhi '},
    {id: 10, fromPeer: false, body: 'Vay thi di luon nhi '},
    {id: 11, fromPeer: false, body: 'Vay thi di luon nhi '},
    {id: 12, fromPeer: false, body: 'Vay thi di luon nhi '},
    {id: 13, fromPeer: false, body: 'Vay thi di luon nhi '},
  ],
};

const NetworkChatPanel = ({ activeChat }) => {
  const [draft, setDraft] = useState('');
  const messages = useMemo(() => MESSAGE_MAP[activeChat?.id] ?? [], [activeChat?.id]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            NW
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {activeChat?.name ?? 'Network Chat'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              Placeholder UI inspired by mentorship chat
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" aria-label="More options">
          <MoreHorizIcon />
        </IconButton>
      </Box>

      <Scrollbar
        sx={{
          flex: 1,
          minHeight: 0,
          px: 2,
          py: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {messages.map((msg) => (
          <Box
            key={msg.id}
            sx={{
              display: 'flex',
              justifyContent: msg.fromPeer ? 'flex-start' : 'flex-end',
              alignItems: 'flex-end',
              gap: 1,
            }}
          >
            {msg.fromPeer && (
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: '0.75rem',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                }}
              >
                PE
              </Avatar>
            )}
            <Box
              sx={{
                maxWidth: { xs: '85%', sm: '72%' },
                px: 1.25,
                py: 1,
                borderRadius: 2,
                bgcolor: msg.fromPeer ? 'grey.200' : 'primary.main',
                color: msg.fromPeer ? 'text.primary' : 'primary.contrastText',
              }}
            >
              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                {msg.body}
              </Typography>
            </Box>
          </Box>
        ))}
      </Scrollbar>

      <Box
        sx={{
          flexShrink: 0,
          px: 2,
          py: 1.5,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Nhap tin nhan placeholder..."
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          variant="outlined"
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" aria-label="Emoji" edge="end">
                  <MoodIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <IconButton
          color="primary"
          aria-label="Send"
          disabled
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': { bgcolor: 'primary.dark' },
            '&.Mui-disabled': {
              bgcolor: 'action.disabledBackground',
              color: 'action.disabled',
            },
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default NetworkChatPanel;
