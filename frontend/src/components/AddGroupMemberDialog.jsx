import { useEffect, useState } from 'react';
import {
  Alert,
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
import PersonAddIcon from '@mui/icons-material/PersonAdd';

import ChatAvatar from './ChatAvatar';
import { usePrivateChatList } from '../hooks/chat/usePrivateChatList';
import { useAddGroupMembers } from '../hooks/chat/useAddGroupMembers';

const MAX_GROUP_SIZE = 10;
const DIALOG_PAGE_SIZE = 20;

const AddGroupMemberDialog = ({ open, onClose, groupId, existingMemberIds = [], currentMemberCount = 0 }) => {
  const [searchInput, setSearchInput] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);

  const remainingSlots = MAX_GROUP_SIZE - currentMemberCount;

  const { items: contacts, isPending: contactsPending } = usePrivateChatList({
    searchQuery: searchInput,
    page: 1,
    pageSize: DIALOG_PAGE_SIZE,
  });

  // Filter out contacts who are already in the group
  const availableContacts = contacts.filter(
    (c) => !existingMemberIds.includes(c.peerMemberId),
  );

  const resetState = () => {
    setSearchInput('');
    setSelectedMembers([]);
  };

  const { mutate: addMembers, isPending: isAdding, isError, error } = useAddGroupMembers({
    groupId,
    onSuccess: () => {
      resetState();
      onClose();
    },
  });

  const handleClose = () => {
    if (isAdding) return;
    resetState();
    onClose();
  };

  const handleToggleMember = (contact) => {
    setSelectedMembers((prev) => {
      const alreadySelected = prev.some((m) => m.peerMemberId === contact.peerMemberId);
      if (alreadySelected) {
        return prev.filter((m) => m.peerMemberId !== contact.peerMemberId);
      }
      if (prev.length >= remainingSlots) return prev;
      return [
        ...prev,
        {
          peerMemberId: contact.peerMemberId,
          peerUserName: contact.peerUserName,
          peerAvatarUrl: contact.peerAvatarUrl,
        },
      ];
    });
  };

  const handleRemoveSelected = (memberId) => {
    setSelectedMembers((prev) => prev.filter((m) => m.peerMemberId !== memberId));
  };

  const handleSubmit = () => {
    if (selectedMembers.length === 0) return;
    addMembers(selectedMembers.map((m) => m.peerMemberId));
  };

  const canSubmit = selectedMembers.length > 0 && !isAdding;

  useEffect(() => {
    if (!open) {
      setSearchInput('');
      setSelectedMembers([]);
    }
  }, [open]);

  const errorMessage = isError
    ? error?.response?.data?.message ?? error?.message ?? 'Đã xảy ra lỗi'
    : null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonAddIcon color="primary" fontSize="small" />
        <Typography variant="subtitle1" fontWeight={700} component="span">
          Thêm thành viên
        </Typography>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {errorMessage ? (
          <Alert severity="error" sx={{ borderRadius: 1.5 }}>
            {errorMessage}
          </Alert>
        ) : null}

        {remainingSlots <= 0 ? (
          <Alert severity="warning" sx={{ borderRadius: 1.5 }}>
            Nhóm đã đạt giới hạn {MAX_GROUP_SIZE} thành viên.
          </Alert>
        ) : (
          <>
            <Typography variant="caption" color="text.secondary">
              Còn <strong>{remainingSlots}</strong> chỗ trống (tối đa {MAX_GROUP_SIZE} thành viên)
            </Typography>

            <TextField
              placeholder="Tìm bạn bè..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              size="small"
              fullWidth
              disabled={isAdding}
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
                    label={m.peerUserName}
                    size="small"
                    onDelete={() => handleRemoveSelected(m.peerMemberId)}
                    disabled={isAdding}
                    sx={{ fontWeight: 500 }}
                  />
                ))}
              </Box>
            )}

            <Typography variant="caption" color={selectedMembers.length === 0 ? 'text.secondary' : 'primary'}>
              Đã chọn {selectedMembers.length} người
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
              ) : availableContacts.length === 0 ? (
                <Box sx={{ px: 2, py: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {contacts.length === 0
                      ? 'Không tìm thấy kết quả.'
                      : 'Tất cả kết nối đã có trong nhóm.'}
                  </Typography>
                </Box>
              ) : (
                <List dense disablePadding>
                  {availableContacts.map((contact) => {
                    const isSelected = selectedMembers.some((m) => m.peerMemberId === contact.peerMemberId);
                    const isDisabled = isAdding || (!isSelected && selectedMembers.length >= remainingSlots);

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
                              name={contact.peerUserName}
                              size={32}
                            />
                          </ListItemAvatar>
                          <ListItemText
                            primary={contact.peerUserName}
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
          </>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 2.5, py: 1.5, gap: 1 }}>
        <Button onClick={handleClose} disabled={isAdding} size="small" color="inherit">
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || remainingSlots <= 0}
          variant="contained"
          size="small"
          startIcon={isAdding ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {isAdding ? 'Đang thêm...' : 'Thêm vào nhóm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddGroupMemberDialog;
