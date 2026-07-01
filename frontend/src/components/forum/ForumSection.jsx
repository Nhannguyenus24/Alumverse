import { Box, Paper, Typography } from '@mui/material';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import ForumBoardRow from './ForumBoardRow';

const ForumSection = ({ title, boards = [], onBoardClick }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 0,
        overflow: 'hidden',
        backgroundColor: 'background.paper',
        boxShadow: 'none',
      }}
    >
      <Box
        sx={{
          px: { xs: 1.5, sm: 2, md: 2.75 },
          py: { xs: 1.2, sm: 1.4, md: 1.7 },
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <ChatBubbleOutlineOutlinedIcon
          sx={{
            fontSize: 22,
            color: 'primary.contrastText',
            '& path': { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 },
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
            <ForumBoardRow
              board={b}
              onClick={onBoardClick ? () => onBoardClick(b) : undefined}
            />
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default ForumSection;
