import { Avatar, Box, Button, Card, Chip, CircularProgress, ListItemIcon, ListItemText, MenuItem, Stack, Typography } from '@mui/material';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';

import IconButtonMenu from '../IconButtonMenu';
import { useNetworkMemberProfileNavigation } from '../../hooks/network/useNetworkMemberProfileNavigation';
import { networkCardClickableSx } from './networkCardUtils';

/**
 * Card hiển thị một thành viên trong tab Tìm kiếm Network.
 * Dữ liệu: global_profiles (fullName), users (avatar), organization_members (program, major).
 */
const NetworkSearchMemberCard = ({
  userId,
  avatar,
  fullName,
  program,
  major,
  onMessage,
  onBlock,
  isDemo = false,
  isMessageLoading = false,
  isBlockLoading = false,
  messageButtonLabel = 'Nhắn tin',
}) => {
  const { navigateToProfile, handleCardKeyDown, stopActionPropagation } =
    useNetworkMemberProfileNavigation(userId);
  const displayName = fullName || 'N/A';
  const academicRows = buildAcademicRows(program, major);

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={navigateToProfile}
      onKeyDown={handleCardKeyDown}
      sx={{
        p: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: isDemo ? 'primary.light' : 'divider',
        boxShadow: 'none',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.2s',
        position: 'relative',
        ...networkCardClickableSx,
        '&:hover': { transform: 'translateY(-4px)' },
      }}
    >
      {onBlock ? (
        <Box sx={{ position: 'absolute', top: 8, right: 8 }} onClick={stopActionPropagation}>
          <IconButtonMenu
            menuId={`network-member-card-menu-${fullName}`}
            buttonAriaLabel="Tùy chọn thành viên"
          >
            {({ close }) => (
              <MenuItem
                disabled={isBlockLoading}
                onClick={(event) => {
                  stopActionPropagation(event);
                  close();
                  onBlock();
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <BlockOutlinedIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText primary="Chặn người dùng" primaryTypographyProps={{ variant: 'body2' }} />
              </MenuItem>
            )}
          </IconButtonMenu>
        </Box>
      ) : null}

      <Stack spacing={1.5} alignItems="center">
        <Avatar src={avatar} sx={{ width: 80, height: 80 }} />

        <Box sx={{ width: '100%' }}>
          <Typography fontWeight={700} variant="subtitle1" sx={{ lineHeight: 1.3 }}>
            {displayName}
          </Typography>
          <Box
            sx={{
              mt: 1.25,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.75,
            }}
          >
            {academicRows.map((row, index) => (
              <Stack
                key={`${row.program}-${row.major}-${index}`}
                direction="row"
                spacing={0.75}
                justifyContent="center"
                flexWrap="wrap"
                useFlexGap
                sx={{ width: '100%' }}
              >
                {row.program ? <AcademicChip label={row.program} /> : null}
                {row.major ? <AcademicChip label={row.major} /> : null}
              </Stack>
            ))}
          </Box>
        </Box>
      </Stack>

      <Button
        variant="contained"
        sx={{ mt: 3 }}
        fullWidth
        type="button"
        onClick={(event) => {
          stopActionPropagation(event);
          onMessage?.();
        }}
        disabled={!onMessage || isMessageLoading}
      >
        {isMessageLoading ? (
          <CircularProgress size={22} color="inherit" />
        ) : (
          messageButtonLabel
        )}
      </Button>
    </Card>
  );
};

const AcademicChip = ({ label }) => (
  <Chip
    label={label}
    size="small"
    sx={{
      maxWidth: '100%',
      bgcolor: 'primary.light',
      color: 'primary.main',
      fontWeight: 600,
      borderRadius: 999,
      '& .MuiChip-label': {
        px: 1.25,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },
    }}
  />
);

function buildAcademicRows(program, major) {
  const programs = parseAcademicItems(program, '—');
  const majors = parseAcademicItems(major, 'N/A');
  const rowCount = Math.max(programs.length, majors.length, 1);

  return Array.from({ length: rowCount }, (_, index) => ({
    program: programs[index] ?? null,
    major: majors[index] ?? null,
  })).filter((row) => row.program || row.major);
}

function parseAcademicItems(value, fallback) {
  if (Array.isArray(value)) {
    const items = value.filter(Boolean);
    return items.length > 0 ? items : [fallback];
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        const items = parsed.filter(Boolean);
        return items.length > 0 ? items : [fallback];
      }
    } catch {
      return [value];
    }
    return [value];
  }

  return [fallback];
}

export default NetworkSearchMemberCard;
