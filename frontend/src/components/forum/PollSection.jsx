import { useEffect, useRef } from 'react';
import { useSnackbar } from 'notistack';
import { Box, Stack, Typography, CircularProgress, Button } from '@mui/material';
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
  const { enqueueSnackbar } = useSnackbar();
  const prevErrorRef = useRef(null);

  useEffect(() => {
    if (error && String(error) !== prevErrorRef.current) {
      enqueueSnackbar(String(error), { variant: 'error' });
      prevErrorRef.current = String(error);
    }
    if (!error) {
      prevErrorRef.current = null;
    }
  }, [error, enqueueSnackbar]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mb: 2, py: 2, px: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Không tải được danh sách poll.
        </Typography>
      </Box>
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
