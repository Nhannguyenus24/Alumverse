import { Box, Paper, Typography } from '@mui/material';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import ForumBoardRow from './ForumBoardRow';

const ForumSection = ({ title, boards = [] }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 0,
        overflow: 'hidden',
        backgroundColor: '#fff',
        boxShadow: 'none',
      }}
    >
      <Box
        sx={{
          px: { xs: 2, md: 2.75 },
          py: { xs: 1.4, md: 1.7 },
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          backgroundColor: '#0B4D8D',
          color: '#fff',
        }}
      >
        <ChatBubbleOutlineOutlinedIcon
          sx={{
            fontSize: 22,
            color: '#fff',
            '& path': { fill: 'none', stroke: '#fff', strokeWidth: 1.5 },
          }}
        />
        <Typography
          variant="subtitle1"
          fontWeight={900}
          sx={{ letterSpacing: 0.8, fontSize: { xs: '0.9rem', md: '1rem' } }}
        >
          {title}
        </Typography>
      </Box>

      <Box>
        {boards.map((b, idx) => (
          <Box
            key={b.id ?? idx}
            sx={{
              borderBottom: idx === boards.length - 1 ? 0 : 1,
              borderColor: 'divider',
            }}
          >
            <ForumBoardRow board={b} />
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default ForumSection;

