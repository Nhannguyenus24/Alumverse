import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { useCreatePoll } from '../../hooks/forum/useCreatePoll';

const CreatePollDialog = ({ open, onClose, topicId, organizationId, memberId, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);
  const { createPollAsync, isPending, errorMessage, reset } = useCreatePoll();

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async () => {
    // Validate
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề poll');
      return;
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      alert('Poll cần ít nhất 2 lựa chọn');
      return;
    }

    try {
      const pollData = {
        topicId,
        organizationId,
        createdByMemberId: memberId,
        title: title.trim(),
        description: description.trim() || null,
        options: validOptions,
        allowMultipleVotes,
      };

      await createPollAsync(pollData);
      
      // Reset form
      setTitle('');
      setDescription('');
      setOptions(['', '']);
      setAllowMultipleVotes(false);
      onSuccess?.();
      onClose();
      reset();
    } catch (error) {
      console.error('Error creating poll:', error);
    }
  };

  const handleDialogClose = () => {
    setTitle('');
    setDescription('');
    setOptions(['', '']);
    setAllowMultipleVotes(false);
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleDialogClose} maxWidth="sm" fullWidth>
      <DialogTitle>Tạo Poll</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {/* Error Message */}
          {errorMessage && (
            <Alert severity="error">{errorMessage}</Alert>
          )}

          {/* Title */}
          <TextField
            label="Tiêu đề"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxRows={2}
            placeholder="Ví dụ: Ngôn ngữ lập trình yêu thích của bạn?"
          />

          {/* Description */}
          <TextField
            label="Mô tả (tùy chọn)"
            fullWidth
            multiline
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả thêm về poll này..."
          />

          {/* Allow Multiple Votes */}
          <FormControlLabel
            control={
              <Checkbox
                checked={allowMultipleVotes}
                onChange={(e) => setAllowMultipleVotes(e.target.checked)}
              />
            }
            label="Cho phép chọn nhiều lựa chọn"
          />

          {/* Options */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Lựa chọn
            </Typography>
            <Stack spacing={1}>
              {options.map((option, index) => (
                <Stack key={index} direction="row" spacing={1} alignItems="flex-start">
                  <TextField
                    label={`Lựa chọn ${index + 1}`}
                    fullWidth
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder="Nhập lựa chọn..."
                    size="small"
                  />
                  {options.length > 2 && (
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveOption(index)}
                      sx={{ mt: 0.5 }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              ))}
            </Stack>

            {/* Add Option Button */}
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddOption}
              size="small"
              sx={{ mt: 1 }}
            >
              Thêm lựa chọn
            </Button>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDialogClose} disabled={isPending}>
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isPending || !title.trim()}
        >
          {isPending ? 'Đang tạo...' : 'Tạo Poll'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePollDialog;
