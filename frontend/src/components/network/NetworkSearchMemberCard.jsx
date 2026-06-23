import { Avatar, Box, Button, Card, Chip, CircularProgress, ListItemIcon, ListItemText, MenuItem, Stack, Typography } from '@mui/material';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import { useTranslation } from 'react-i18next';

import IconButtonMenu from '../IconButtonMenu';
import { useNetworkMemberProfileNavigation } from '../../hooks/network/useNetworkMemberProfileNavigation';
import { networkCardClickableSx } from './networkCardUtils';
import { buildProgramMajorRows } from '../../utils/academicUtils';

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
  messageButtonLabel,
}) => {
  const { t } = useTranslation('network');
  const { navigateToProfile, handleCardKeyDown, stopActionPropagation } =
    useNetworkMemberProfileNavigation(userId);
  const displayName = fullName || 'N/A';
  const academicRows = buildProgramMajorRows(program, major);

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
            buttonAriaLabel={t('member_options_aria')}
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
                <ListItemText primary={t('block_user_menu_label')} primaryTypographyProps={{ variant: 'body2' }} />
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
          messageButtonLabel ?? t('message')
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

export default NetworkSearchMemberCard;
