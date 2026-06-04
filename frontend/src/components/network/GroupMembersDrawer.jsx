import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import ChatAvatar from '../ChatAvatar';
import Scrollbar from '../Scrollbar';
import { useGroupMembers } from '../../hooks/chat/useGroupMembers';

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

function GroupMembersDrawer({ open, onClose, groupId, groupName }) {
  const { members, totalItem, isPending, isError, errorMessage } = useGroupMembers(groupId, {
    enabled: open && Boolean(groupId),
  });

  return (
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

          {isError ? (
            <Alert severity="error" sx={{ m: 2, borderRadius: 1.5 }}>
              {errorMessage}
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

                return (
                  <ListItem
                    key={member.memberId}
                    sx={{
                      px: 2,
                      py: 1.25,
                      borderBottom: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 48 }}>
                      <ChatAvatar avatarUrl={member.avatarUrl} name={displayName} size={40} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {displayName}
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
                  </ListItem>
                );
              })}
            </List>
          ) : null}
        </Scrollbar>
      </Stack>
    </Drawer>
  );
}

export default GroupMembersDrawer;
