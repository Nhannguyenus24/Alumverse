import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
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
import PersonAddIcon from '@mui/icons-material/PersonAdd';

import ChatAvatar from './ChatAvatar';
import { usePrivateChatList } from '../hooks/chat/usePrivateChatList';
import { useAddGroupMembers } from '../hooks/chat/useAddGroupMembers';

const MAX_GROUP_SIZE = 10;
const DIALOG_PAGE_SIZE = 20;

const AddGroupMemberDialog = ({ open, onClose, groupId, existingMemberIds = [], currentMemberCount = 0 }) => {
  const { t } = useTranslation(['network', 'common']);
  const [searchInput, setSearchInput] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const { enqueueSnackbar } = useSnackbar();

  const remainingSlots = MAX_GROUP_SIZE - currentMemberCount;

  const { items: contacts, isPending: contactsPending } = usePrivateChatList({
    searchQuery: searchInput,
    page: 1,
    pageSize: DIALOG_PAGE_SIZE,
  });

  // Filter out contacts who are already in the group
  const availableContacts = useMemo(() => contacts.filter(
    (c) => !existingMemberIds.includes(c.peerMemberId),
  ), [contacts, existingMemberIds]);

  const resetState = useCallback(() => {
    setSearchInput('');
    setSelectedMembers([]);
  }, []);

  const { mutate: addMembers, isPending: isAdding, isError, error } = useAddGroupMembers({
    groupId,
    onSuccess: () => {
      resetState();
      onClose();
    },
  });

  const handleClose = useCallback(() => {
    if (isAdding) return;
    resetState();
    onClose();
  }, [isAdding, resetState, onClose]);

  const handleToggleMember = useCallback((contact) => {
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
          peerFullName: contact.peerFullName,
          peerAvatarUrl: contact.peerAvatarUrl,
        },
      ];
    });
  }, [remainingSlots]);

  const handleRemoveSelected = useCallback((memberId) => {
    setSelectedMembers((prev) => prev.filter((m) => m.peerMemberId !== memberId));
  }, []);

  const handleSubmit = useCallback(() => {
    if (selectedMembers.length === 0) return;
    addMembers(selectedMembers.map((m) => m.peerMemberId));
  }, [selectedMembers, addMembers]);

  const canSubmit = selectedMembers.length > 0 && !isAdding;

  useEffect(() => {
    if (!open) {
      setSearchInput('');
      setSelectedMembers([]);
    }
  }, [open]);

  const errorMessage = isError
    ? error?.response?.data?.message ?? error?.message ?? t('network:generic_error')
    : null;

  useEffect(() => {
    if (errorMessage) {
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  }, [errorMessage, enqueueSnackbar]);


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
          {t('network:add_member_dialog_title')}
        </Typography>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>

        {remainingSlots <= 0 ? (
          <Alert severity="warning" sx={{ borderRadius: 1.5 }}>
            {t('network:group_full_warning', { max: MAX_GROUP_SIZE })}
          </Alert>
        ) : (
          <>
            <Typography variant="caption" color="text.secondary">
              {t('network:remaining_slots', { count: remainingSlots, max: MAX_GROUP_SIZE })}
            </Typography>

            <TextField
              placeholder={t('network:search_friends_placeholder')}
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
                    label={m.peerFullName}
                    size="small"
                    onDelete={() => handleRemoveSelected(m.peerMemberId)}
                    disabled={isAdding}
                    sx={{ fontWeight: 500 }}
                  />
                ))}
              </Box>
            )}

            <Typography variant="caption" color={selectedMembers.length === 0 ? 'text.secondary' : 'primary'}>
              {t('network:selected_count', { count: selectedMembers.length })}
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
                      ? t('network:no_search_result')
                      : t('network:all_connections_in_group')}
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
                              name={contact.peerFullName}
                              size={32}
                            />
                          </ListItemAvatar>
                          <ListItemText
                            primary={contact.peerFullName}
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
          {t('common:cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || remainingSlots <= 0}
          variant="contained"
          size="small"
          startIcon={isAdding ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {isAdding ? t('network:adding') : t('network:add_to_group')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddGroupMemberDialog;
