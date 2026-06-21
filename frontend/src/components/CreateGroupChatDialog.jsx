import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import GroupAddIcon from '@mui/icons-material/GroupAdd';

import ChatAvatar from './ChatAvatar';
import { usePrivateChatList } from '../hooks/chat/usePrivateChatList';
import { useCreateGroupChat } from '../hooks/chat/useCreateGroupChat';

const MIN_OTHER_MEMBERS = 2;
const MAX_OTHER_MEMBERS = 9; // 10 total including creator
const DIALOG_PAGE_SIZE = 20;

const CreateGroupChatDialog = ({ open, onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);

  const { items: contacts, isPending: contactsPending } = usePrivateChatList({
    searchQuery: searchInput,
    page: 1,
    pageSize: DIALOG_PAGE_SIZE,
  });

  const resetState = useCallback(() => {
    setTitle('');
    setSearchInput('');
    setSelectedMembers([]);
  }, []);

  const { mutate: createGroup, isPending: isCreating } = useCreateGroupChat({
    onSuccess: (createdGroup) => {
      onCreated?.(createdGroup);
      resetState();
      onClose();
    },
  });

  const handleClose = useCallback(() => {
    if (isCreating) return;
    resetState();
    onClose();
  }, [isCreating, resetState, onClose]);

  const handleToggleMember = useCallback((contact) => {
    setSelectedMembers((prev) => {
      const alreadySelected = prev.some((m) => m.peerMemberId === contact.peerMemberId);
      if (alreadySelected) {
        return prev.filter((m) => m.peerMemberId !== contact.peerMemberId);
      }
      if (prev.length >= MAX_OTHER_MEMBERS) return prev;
      return [...prev, { peerMemberId: contact.peerMemberId, peerStudentId: contact.peerStudentId, peerAvatarUrl: contact.peerAvatarUrl }];
    });
  }, []);

  const handleRemoveSelected = useCallback((memberId) => {
    setSelectedMembers((prev) => prev.filter((m) => m.peerMemberId !== memberId));
  }, []);

  const handleSubmit = useCallback(() => {
    if (selectedMembers.length < MIN_OTHER_MEMBERS) return;
    createGroup({
      title: title.trim() || null,
      memberIds: selectedMembers.map((m) => m.peerMemberId),
    });
  }, [selectedMembers, createGroup, title]);

  const canSubmit = selectedMembers.length >= MIN_OTHER_MEMBERS && selectedMembers.length <= MAX_OTHER_MEMBERS && !isCreating;

  useEffect(() => {
    if (!open) {
      setTitle('');
      setSearchInput('');
      setSelectedMembers([]);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <GroupAddIcon color="primary" fontSize="small" />
        <Typography variant="subtitle1" fontWeight={700} component="span">
          Tạo nhóm chat
        </Typography>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Tên nhóm (tùy chọn)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          size="small"
          fullWidth
          inputProps={{ maxLength: 100 }}
          disabled={isCreating}
        />

        <TextField
          placeholder="Tìm bạn bè..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          size="small"
          fullWidth
          disabled={isCreating}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />

        {selectedMembers.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {selectedMembers.map((m) => (
              <Chip
                key={m.peerMemberId}
                label={m.peerStudentId}
                size="small"
                onDelete={() => handleRemoveSelected(m.peerMemberId)}
                disabled={isCreating}
                sx={{ fontWeight: 500 }}
              />
            ))}
          </Box>
        )}

        <Typography
          variant="caption"
          color={
            selectedMembers.length < MIN_OTHER_MEMBERS
              ? 'error'
              : selectedMembers.length >= MAX_OTHER_MEMBERS
                ? 'warning.main'
                : 'text.secondary'
          }
        >
          Đã chọn {selectedMembers.length} người (tối thiểu {MIN_OTHER_MEMBERS}, tối đa {MAX_OTHER_MEMBERS})
          {selectedMembers.length >= MAX_OTHER_MEMBERS ? ' — đã đạt giới hạn' : ''}
        </Typography>

        <Box
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {contactsPending ? (
            <Stack alignItems="center" py={3}>
              <CircularProgress size={22} />
            </Stack>
          ) : contacts.length === 0 ? (
            <Box sx={{ px: 2, py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Không tìm thấy kết quả.
              </Typography>
            </Box>
          ) : (
            <List dense disablePadding>
              {contacts.map((contact) => {
                const isSelected = selectedMembers.some((m) => m.peerMemberId === contact.peerMemberId);
                const isDisabled = isCreating || (!isSelected && selectedMembers.length >= MAX_OTHER_MEMBERS);
                return (
                  <ListItem key={contact.peerMemberId} disablePadding>
                    <ListItemButton
                      onClick={() => handleToggleMember(contact)}
                      disabled={isDisabled}
                      dense
                      sx={{ px: 1.5 }}
                    >
                      <ListItemAvatar sx={{ minWidth: 40 }}>
                        <ChatAvatar
                          avatarUrl={contact.peerAvatarUrl}
                          name={contact.peerStudentId}
                          size={32}
                        />
                      </ListItemAvatar>
                      <ListItemText
                        primary={contact.peerStudentId}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                      />
                      <Checkbox
                        edge="end"
                        checked={isSelected}
                        tabIndex={-1}
                        disableRipple
                        size="small"
                        disabled={isDisabled}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 2.5, py: 1.5, gap: 1 }}>
        <Button onClick={handleClose} disabled={isCreating} size="small" color="inherit">
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          variant="contained"
          size="small"
          startIcon={isCreating ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {isCreating ? 'Đang tạo...' : 'Tạo nhóm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateGroupChatDialog;
