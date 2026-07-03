import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  alpha,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import ChatAvatar from '../ChatAvatar';
import Scrollbar from '../Scrollbar';
import AddGroupMemberDialog from '../AddGroupMemberDialog';
import { useGroupMembers } from '../../hooks/chat/useGroupMembers';
import { invalidateChatListQueries, invalidateGroupBlockedMembersQueries } from '../../hooks/chat/invalidateChatQueries';
import { chatApi } from '../../utils/api';
import { fileToBase64, IMAGE_ACCEPT, validateImageFile } from '../../utils/imageUtils';

const MAX_GROUP_SIZE = 10;

function formatJoinedAt(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function ConfirmDialog({ open, title, description, confirmLabel, confirmColor = 'primary', onConfirm, onCancel, loading }) {
  const { t } = useTranslation(['common']);
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>
          {t('common:cancel')}
        </Button>
        <Button onClick={onConfirm} color={confirmColor} variant="contained" disabled={loading} startIcon={loading ? <CircularProgress size={14} /> : null}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function GroupMembersDrawer({ open, onClose, groupId, groupName, currentUserId, onLeaveSuccess }) {
  const { t } = useTranslation(['network', 'common']);
  const queryClient = useQueryClient();
  const [kickTarget, setKickTarget] = useState(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const imageInputRef = useRef(null);

  const { members, totalItem, isPending, isError, errorMessage } = useGroupMembers(groupId, {
    enabled: open && Boolean(groupId),
  });

  const currentMember = members.find((m) => m.memberId === currentUserId);
  const isOwner = currentMember?.role === 'OWNER';

  const removeMutation = useMutation({
    mutationFn: ({ gId, mId }) => chatApi.removeMemberFromGroup(gId, mId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'group-members', groupId] });
      invalidateChatListQueries(queryClient);
      invalidateGroupBlockedMembersQueries(queryClient);
      setKickTarget(null);
    },
  });

  const leaveMutation = useMutation({
    mutationFn: (gId) => chatApi.leaveGroup(gId),
    onSuccess: () => {
      invalidateChatListQueries(queryClient);
      invalidateGroupBlockedMembersQueries(queryClient);
      setLeaveDialogOpen(false);
      onClose();
      if (onLeaveSuccess) onLeaveSuccess(groupId);
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ gId, title }) => chatApi.updateGroup(gId, title),
    onSuccess: () => {
      invalidateChatListQueries(queryClient);
      setRenameDialogOpen(false);
    },
  });

  const changeImageMutation = useMutation({
    mutationFn: async ({ gId, file }) => {
      const validation = validateImageFile(file, t);
      if (!validation.valid) {
        throw new Error(validation.message);
      }
      const base64 = await fileToBase64(file);
      const avatarUrl = await chatApi.uploadChatImage(base64);
      if (!avatarUrl) {
        throw new Error(t('network:chat.image_update_failed'));
      }
      return chatApi.updateGroupImage(gId, avatarUrl);
    },
    onSuccess: () => {
      invalidateChatListQueries(queryClient);
    },
  });

  const handleImageSelected = (event) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';
    if (!file || !groupId) return;
    changeImageMutation.mutate({ gId: groupId, file });
  };

  const openRenameDialog = () => {
    setRenameValue(groupName ?? '');
    setRenameDialogOpen(true);
  };

  const handleRenameConfirm = () => {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    renameMutation.mutate({ gId: groupId, title: trimmed });
  };

  const handleKickConfirm = () => {
    if (!kickTarget) return;
    removeMutation.mutate({ gId: groupId, mId: kickTarget.memberId });
  };

  const handleLeaveConfirm = () => {
    leaveMutation.mutate(groupId);
  };

  const mutationError =
    (removeMutation.isError ? removeMutation.error?.response?.data?.message ?? removeMutation.error?.message : null) ??
    (leaveMutation.isError ? leaveMutation.error?.response?.data?.message ?? leaveMutation.error?.message : null) ??
    (renameMutation.isError ? renameMutation.error?.response?.data?.message ?? renameMutation.error?.message : null) ??
    (changeImageMutation.isError ? changeImageMutation.error?.response?.data?.message ?? changeImageMutation.error?.message : null);

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 360 },
            maxWidth: '100%',
          },
        }}
      >
        <Stack sx={{ height: '100%' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1.5,
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Box sx={{ minWidth: 0, pr: 1 }}>
              <Typography variant="subtitle1" fontWeight={700} noWrap>
                {t('network:group_members_title')}
                {totalItem > 0 ? ` (${totalItem})` : ''}
              </Typography>
              {groupName ? (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {groupName}
                </Typography>
              ) : null}
            </Box>
            <IconButton size="small" onClick={onClose} aria-label={t('network:close_aria')}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Scrollbar sx={{ flex: 1 }}>
            {isPending ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={28} />
              </Box>
            ) : null}

            {(isError || mutationError) ? (
              <Alert severity="error" sx={{ m: 2, borderRadius: 1.5 }}>
                {errorMessage ?? mutationError}
              </Alert>
            ) : null}

            {!isPending && !isError && members.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                {t('network:no_members_yet')}
              </Typography>
            ) : null}

            {!isPending && !isError && members.length > 0 ? (
              <List disablePadding>
                {members.map((member) => {
                  const roleLabel = member.role === 'OWNER' ? t('network:role_owner') : member.role === 'MEMBER' ? t('network:role_member') : (member.role ?? t('network:role_member'));
                  const displayName = member.fullName?.trim() || `User #${member.memberId}`;
                  const isSelf = member.memberId === currentUserId;
                  const canKick = isOwner && !isSelf && member.role !== 'OWNER';

                  return (
                    <ListItem
                      key={member.memberId}
                      sx={{
                        px: 2,
                        py: 1.25,
                        borderBottom: 1,
                        borderColor: 'divider',
                        alignItems: 'center',
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 48 }}>
                        <ChatAvatar avatarUrl={member.avatarUrl} name={displayName} size={40} />
                      </ListItemAvatar>
                      <ListItemText
                        sx={{ minWidth: 0, mr: canKick ? 1 : 0 }}
                        primary={
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {displayName}
                            {isSelf ? (
                              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
                                {t('network:you_label')}
                              </Typography>
                            ) : null}
                          </Typography>
                        }
                        secondary={
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.25 }}>
                            <Chip
                              label={roleLabel}
                              size="small"
                              variant="outlined"
                              sx={(theme) => {
                                const palette = member.role === 'OWNER' ? theme.palette.primary : theme.palette.text;
                                const main = member.role === 'OWNER' ? palette.main : palette.secondary;
                                return {
                                  height: 22,
                                  fontSize: '0.7rem',
                                  bgcolor: alpha(main, theme.palette.mode === 'dark' ? 0.14 : 0.06),
                                  color: main,
                                  borderColor: alpha(main, theme.palette.mode === 'dark' ? 0.34 : 0.2),
                                  fontWeight: 700,
                                };
                              }}
                            />
                            {member.joinedAt ? (
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {formatJoinedAt(member.joinedAt)}
                              </Typography>
                            ) : null}
                          </Stack>
                        }
                      />
                      {canKick ? (
                        <Tooltip title={t('network:remove_from_group_tooltip')}>
                          <IconButton
                            size="small"
                            color="primary"
                            aria-label={`${t('network:kick_confirm_label')} ${displayName}`}
                            onClick={() => setKickTarget(member)}
                            sx={{ flexShrink: 0 }}
                          >
                            <PersonRemoveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                    </ListItem>
                  );
                })}
              </List>
            ) : null}
          </Scrollbar>

          {currentMember ? (
            <>
              <Divider />
              <Box sx={{ px: 2, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {isOwner ? (
                  <Button
                    fullWidth
                    variant="outlined"
                    color="primary"
                    startIcon={<DriveFileRenameOutlineIcon />}
                    onClick={openRenameDialog}
                    disabled={renameMutation.isPending}
                  >
                    {t('network:rename_group')}
                  </Button>
                ) : null}
                {isOwner ? (
                  <>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept={IMAGE_ACCEPT}
                      onChange={handleImageSelected}
                      style={{ display: 'none' }}
                    />
                    <Button
                      fullWidth
                      variant="outlined"
                      color="primary"
                      title={t('network:change_group_image_title')}
                      startIcon={changeImageMutation.isPending ? <CircularProgress size={14} /> : <PhotoCameraIcon />}
                      onClick={() => imageInputRef.current?.click()}
                      disabled={changeImageMutation.isPending}
                    >
                      {t('network:change_group_image')}
                    </Button>
                  </>
                ) : null}
                {isOwner && totalItem < MAX_GROUP_SIZE ? (
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setAddMemberDialogOpen(true)}
                  >
                    {t('network:add_member')}
                  </Button>
                ) : null}
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  startIcon={<ExitToAppIcon />}
                  onClick={() => setLeaveDialogOpen(true)}
                  disabled={leaveMutation.isPending}
                >
                  {t('network:leave_group')}
                </Button>
              </Box>
            </>
          ) : null}
        </Stack>
      </Drawer>

      <ConfirmDialog
        open={Boolean(kickTarget)}
        title={t('network:kick_member_title')}
        description={t('network:kick_member_confirm', { name: kickTarget?.fullName?.trim() || `User #${kickTarget?.memberId}` })}
        confirmLabel={t('network:kick_confirm_label')}
        onConfirm={handleKickConfirm}
        onCancel={() => setKickTarget(null)}
        loading={removeMutation.isPending}
      />

      <ConfirmDialog
        open={leaveDialogOpen}
        title={t('network:leave_group_title')}
        description={
          isOwner
            ? t('network:leave_group_confirm_owner')
            : t('network:leave_group_confirm_member')
        }
        confirmLabel={t('network:leave_confirm_label')}
        onConfirm={handleLeaveConfirm}
        onCancel={() => setLeaveDialogOpen(false)}
        loading={leaveMutation.isPending}
      />

      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('network:rename_group')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label={t('network:group_name_label')}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            inputProps={{ maxLength: 100 }}
            disabled={renameMutation.isPending}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleRenameConfirm();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)} disabled={renameMutation.isPending}>
            {t('common:cancel')}
          </Button>
          <Button
            onClick={handleRenameConfirm}
            variant="contained"
            disabled={renameMutation.isPending || !renameValue.trim()}
            startIcon={renameMutation.isPending ? <CircularProgress size={14} /> : null}
          >
            {t('common:save')}
          </Button>
        </DialogActions>
      </Dialog>

      <AddGroupMemberDialog
        open={addMemberDialogOpen}
        onClose={() => setAddMemberDialogOpen(false)}
        groupId={groupId}
        existingMemberIds={members.map((m) => m.memberId)}
        currentMemberCount={totalItem}
      />
    </>
  );
}

export default GroupMembersDrawer;
