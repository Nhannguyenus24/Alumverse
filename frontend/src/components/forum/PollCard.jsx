import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import HowToVoteOutlinedIcon from '@mui/icons-material/HowToVoteOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useVoteOnPoll } from '../../hooks/forum/useVoteOnPoll';

const PollCard = ({ poll, memberId, onVoteSuccess, onError }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [openConfirm, setOpenConfirm] = useState(false);
  const { vote, isPending, errorMessage, isSuccess, reset } = useVoteOnPoll();

  if (!poll) return null;

  const totalVotes = poll.options?.reduce((sum, opt) => sum + (opt.voteCount || 0), 0) || 0;
  const hasUserVoted = poll.options?.some(opt => opt.hasVoted);

  const handleVoteClick = (optionId) => {
    setSelectedOption(optionId);
    setOpenConfirm(true);
  };

  const handleConfirmVote = () => {
    if (selectedOption && memberId) {
      vote(
        {
          memberId,
          pollId: poll.id,
          pollOptionId: selectedOption,
        },
        {
          onSuccess: () => {
            setOpenConfirm(false);
            setSelectedOption(null);
            onVoteSuccess?.();
            reset();
          },
          onError: (error) => {
            onError?.(error);
          },
        }
      );
    }
  };

  const handleCancel = () => {
    setOpenConfirm(false);
    setSelectedOption(null);
    reset();
  };

  return (
    <>
      <Card sx={{ mb: 2, backgroundColor: '#f9f9f9' }}>
        <CardContent>
          {/* Poll Header */}
          <Stack direction="row" spacing={1} alignItems="center" mb={2}>
            <HowToVoteOutlinedIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ flex: 1 }}>
              {poll.title}
            </Typography>
            {!poll.isActive && (
              <Chip label="Đã đóng" size="small" color="error" variant="outlined" />
            )}
          </Stack>

          {poll.description && (
            <Typography variant="body2" color="textSecondary" mb={2}>
              {poll.description}
            </Typography>
          )}

          {/* Error Message */}
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          {/* Poll Options */}
          <Stack spacing={2}>
            {poll.options?.map((option, index) => {
              const percentage = totalVotes > 0 ? (option.voteCount / totalVotes * 100) : 0;
              const isSelected = selectedOption === option.id;

              return (
                <Box key={option.id || index}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {option.optionText}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {option.voteCount || 0} vote{option.voteCount !== 1 ? 's' : ''}
                    </Typography>
                  </Stack>

                  <Box sx={{ position: 'relative' }}>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: option.hasVoted ? '#4caf50' : '#2196f3',
                        },
                      }}
                    />
                    {percentage > 0 && (
                      <Typography
                        variant="caption"
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          color: '#fff',
                          fontWeight: 'bold',
                          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                        }}
                      >
                        {percentage.toFixed(1)}%
                      </Typography>
                    )}
                  </Box>

                  {/* Vote Button */}
                  {poll.isActive && !hasUserVoted && (
                    <Button
                      size="small"
                      variant={isSelected ? 'contained' : 'outlined'}
                      onClick={() => handleVoteClick(option.id)}
                      disabled={isPending}
                      sx={{ mt: 1 }}
                    >
                      Vote
                    </Button>
                  )}

                  {option.hasVoted && (
                    <Stack direction="row" spacing={0.5} alignItems="center" mt={1}>
                      <CheckCircleOutlineIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                      <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 500 }}>
                        Bạn đã chọn
                      </Typography>
                    </Stack>
                  )}
                </Box>
              );
            })}
          </Stack>

          {/* Poll Info Footer */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mt={3} pt={2} borderTop="1px solid #eee">
            <Typography variant="caption" color="textSecondary">
              Tổng: {totalVotes} votes
            </Typography>
            {!poll.isActive && (
              <Chip label="Phiếu đã đóng" size="small" variant="outlined" />
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={openConfirm} onClose={handleCancel} maxWidth="xs" fullWidth>
        <DialogTitle>Xác nhận bình chọn</DialogTitle>
        <DialogContent>
          <Typography variant="body2" mt={2}>
            Bạn chỉ có thể bình chọn một lần cho mỗi poll. Bạn chắc chắn chọn lựa chọn này?
          </Typography>
          <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 'bold' }}>
            {poll.options?.find(opt => opt.id === selectedOption)?.optionText}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} disabled={isPending}>
            Hủy
          </Button>
          <Button onClick={handleConfirmVote} variant="contained" disabled={isPending}>
            {isPending ? 'Đang bình chọn...' : 'Xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PollCard;
