import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useCanContribute } from '../hooks/useCanContribute';
import { VerificationRequiredAlert } from './ContributeGuard';

const MIN_OTHER_MEMBERS = 2;
const MAX_OTHER_MEMBERS = 9; // 10 total including creator
const DIALOG_PAGE_SIZE = 20;

const CreateGroupChatDialog = ({ open, onClose, onCreated }) => {
  const { t } = useTranslation(['network', 'common']);
  const { canContribute } = useCanContribute();
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
      return [...prev, { peerMemberId: contact.peerMemberId, peerFullName: contact.peerFullName, peerAvatarUrl: contact.peerAvatarUrl }];
    });
  }, []);

  const handleRemoveSelected = useCallback((memberId) => {
    setSelectedMembers((prev) => prev.filter((m) => m.peerMemberId !== memberId));
  }, []);

  const handleSubmit = useCallback(() => {
    if (selectedMembers.length < MIN_OTHER_MEMBERS || !canContribute) return;
    createGroup({
      title: title.trim() || null,
      memberIds: selectedMembers.map((m) => m.peerMemberId),
    });
  }, [selectedMembers, createGroup, title, canContribute]);

  const canSubmit = canContribute && selectedMembers.length >= MIN_OTHER_MEMBERS && selectedMembers.length <= MAX_OTHER_MEMBERS && !isCreating;

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
          {t('network:create_group_chat_title')}
        </Typography>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <VerificationRequiredAlert />
        <TextField
          label={t('network:group_name_optional_label')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          size="small"
          fullWidth
          inputProps={{ maxLength: 100 }}
          disabled={isCreating}
        />

        <TextField
          placeholder={t('network:search_friends_placeholder')}
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
                label={m.peerFullName}
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
          {t('network:selected_count_with_limits', { count: selectedMembers.length, min: MIN_OTHER_MEMBERS, max: MAX_OTHER_MEMBERS })}
          {selectedMembers.length >= MAX_OTHER_MEMBERS ? t('network:selected_count_limit_reached') : ''}
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
                {t('network:no_search_result')}
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
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 2.5, py: 1.5, gap: 1 }}>
        <Button onClick={handleClose} disabled={isCreating} size="small" color="inherit">
          {t('common:cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          variant="contained"
          size="small"
          startIcon={isCreating ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {isCreating ? t('network:creating') : t('network:create_group')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateGroupChatDialog;
