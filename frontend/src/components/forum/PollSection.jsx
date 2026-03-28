import { Box, Stack, Typography, CircularProgress, Alert, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import HowToVoteOutlinedIcon from '@mui/icons-material/HowToVoteOutlined';
import PollCard from './PollCard';

const PollSection = ({
  polls = [],
  isLoading = false,
  error = null,
  memberId,
  onCreateClick,
  onVoteSuccess,
}) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!polls || polls.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', backgroundColor: '#f5f5f5', borderRadius: 1 }}>
        <HowToVoteOutlinedIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
        <Typography color="textSecondary">
          Không có poll nào trong chủ đề này
        </Typography>
        {onCreateClick && (
          <Button
            startIcon={<AddIcon />}
            onClick={onCreateClick}
            sx={{ mt: 2 }}
            variant="outlined"
          >
            Tạo Poll
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {polls.map((poll) => (
        <PollCard
          key={poll.id}
          poll={poll}
          memberId={memberId}
          onVoteSuccess={onVoteSuccess}
        />
      ))}
    </Stack>
  );
};

export default PollSection;
