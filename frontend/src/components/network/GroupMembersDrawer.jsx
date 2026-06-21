import { useState } from 'react';
import {
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
import { useMutation, useQueryClient } from '@tanstack/react-query';

import ChatAvatar from '../ChatAvatar';
import Scrollbar from '../Scrollbar';
import AddGroupMemberDialog from '../AddGroupMemberDialog';
import { useGroupMembers } from '../../hooks/chat/useGroupMembers';
import { invalidateChatListQueries, invalidateGroupBlockedMembersQueries } from '../../hooks/chat/invalidateChatQueries';
import { chatApi } from '../../utils/api';

const MAX_GROUP_SIZE = 10;

const ROLE_LABELS = {
  OWNER: 'Trưởng nhóm',
  MEMBER: 'Thành viên',
};

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
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>
          Hủy
        </Button>
        <Button onClick={onConfirm} color={confirmColor} variant="contained" disabled={loading} startIcon={loading ? <CircularProgress size={14} /> : null}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function GroupMembersDrawer({ open, onClose, groupId, groupName, currentUserId, onLeaveSuccess }) {
  const queryClient = useQueryClient();
  const [kickTarget, setKickTarget] = useState(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');

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
    (renameMutation.isError ? renameMutation.error?.response?.data?.message ?? renameMutation.error?.message : null);

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
                Thành viên
                {totalItem > 0 ? ` (${totalItem})` : ''}
              </Typography>
              {groupName ? (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {groupName}
                </Typography>
              ) : null}
            </Box>
            <IconButton size="small" onClick={onClose} aria-label="Đóng">
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
                Chưa có thành viên nào.
              </Typography>
            ) : null}

            {!isPending && !isError && members.length > 0 ? (
              <List disablePadding>
                {members.map((member) => {
                  const roleLabel = ROLE_LABELS[member.role] ?? member.role ?? 'Thành viên';
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
                                (Bạn)
                              </Typography>
                            ) : null}
                          </Typography>
                        }
                        secondary={
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.25 }}>
                            <Chip
                              label={roleLabel}
                              size="small"
                              color={member.role === 'OWNER' ? 'primary' : 'default'}
                              sx={{ height: 22, fontSize: '0.7rem' }}
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
                        <Tooltip title="Xóa khỏi nhóm">
                          <IconButton
                            size="small"
                            color="primary"
                            aria-label={`Xóa ${displayName}`}
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
                    Đổi tên nhóm
                  </Button>
                ) : null}
                {isOwner && totalItem < MAX_GROUP_SIZE ? (
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setAddMemberDialogOpen(true)}
                  >
                    Thêm thành viên
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
                  Rời khỏi nhóm
                </Button>
              </Box>
            </>
          ) : null}
        </Stack>
      </Drawer>

      <ConfirmDialog
        open={Boolean(kickTarget)}
        title="Xóa thành viên"
        description={`Bạn có chắc muốn xóa "${kickTarget?.fullName?.trim() || `User #${kickTarget?.memberId}`}" khỏi nhóm không?`}
        confirmLabel="Xóa"
        onConfirm={handleKickConfirm}
        onCancel={() => setKickTarget(null)}
        loading={removeMutation.isPending}
      />

      <ConfirmDialog
        open={leaveDialogOpen}
        title="Rời khỏi nhóm"
        description={
          isOwner
            ? 'Bạn là trưởng nhóm. Khi rời, quyền trưởng nhóm sẽ được chuyển cho thành viên tham gia lâu nhất. Bạn có chắc muốn rời không?'
            : 'Bạn có chắc muốn rời khỏi nhóm không?'
        }
        confirmLabel="Rời nhóm"
        onConfirm={handleLeaveConfirm}
        onCancel={() => setLeaveDialogOpen(false)}
        loading={leaveMutation.isPending}
      />

      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Đổi tên nhóm</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Tên nhóm"
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
            Hủy
          </Button>
          <Button
            onClick={handleRenameConfirm}
            variant="contained"
            disabled={renameMutation.isPending || !renameValue.trim()}
            startIcon={renameMutation.isPending ? <CircularProgress size={14} /> : null}
          >
            Lưu
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
