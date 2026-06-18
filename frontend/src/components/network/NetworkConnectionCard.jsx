import {
  Avatar,
  Box,
  Button,
  Card,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';

import IconButtonMenu from '../IconButtonMenu';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useNetworkMemberProfileNavigation } from '../../hooks/network/useNetworkMemberProfileNavigation';
import { truncateText } from '../../utils/stringUtils';
import { formatAcademicValue, networkCardClickableSx } from './networkCardUtils';

const SUBTITLE_MAX_LEN = 72;

const NetworkConnectionCard = ({
  connection,
  enableBlock = true,
  onBlock,
  isBlockLoading = false,
}) => {
  const navigate = useOrgNavigate();
  const { navigateToProfile, handleCardKeyDown, stopActionPropagation } =
    useNetworkMemberProfileNavigation(connection.peerMemberId);
  const displayName = connection.fullName || 'N/A';
  const programLabel = formatAcademicValue(connection.program, '—');
  const majorLabel = formatAcademicValue(connection.major, 'N/A');
  const subtitleFull = `${programLabel} · ${majorLabel}`;
  const subtitleDisplay = truncateText(subtitleFull, SUBTITLE_MAX_LEN, subtitleFull);

  const handleMessage = (event) => {
    stopActionPropagation(event);
    navigate('/chat');
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={navigateToProfile}
      onKeyDown={handleCardKeyDown}
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
        transition: 'transform 0.2s',
        ...networkCardClickableSx,
        '&:hover': { transform: 'translateY(-2px)' },
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 1.5, sm: 2 }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
          <Avatar src={connection.avatarUrl} sx={{ width: 56, height: 56, flexShrink: 0 }} />

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography fontWeight={700} variant="subtitle1" noWrap sx={{ lineHeight: 1.3 }}>
              {displayName}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              title={subtitleFull}
              sx={{ display: 'block', mt: 0.25, lineHeight: 1.3 }}
            >
              {subtitleDisplay}
            </Typography>
          </Box>
        </Stack>

        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          justifyContent={{ xs: 'flex-end', sm: 'flex-start' }}
          sx={{ flexShrink: 0 }}
          onClick={stopActionPropagation}
        >
          <Button
            variant="contained"
            size="small"
            type="button"
            onClick={handleMessage}
            sx={{ minWidth: 100 }}
          >
            Nhắn tin
          </Button>

          {enableBlock ? (
            <IconButtonMenu
              menuId={`network-connection-card-menu-${connection.peerMemberId}`}
              buttonAriaLabel="Tùy chọn kết nối"
            >
              {({ close }) => (
                <MenuItem
                  disabled={isBlockLoading}
                  onClick={(event) => {
                    stopActionPropagation(event);
                    close();
                    onBlock?.();
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <BlockOutlinedIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Chặn người dùng"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </MenuItem>
              )}
            </IconButtonMenu>
          ) : null}
        </Stack>
      </Stack>
    </Card>
  );
};

export default NetworkConnectionCard;
