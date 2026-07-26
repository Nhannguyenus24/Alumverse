import { alpha, Avatar, Box, Button, Card, Chip, CircularProgress, ListItemIcon, ListItemText, MenuItem, Stack, Typography } from '@mui/material';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import { useTranslation } from 'react-i18next';

import IconButtonMenu from '../IconButtonMenu';
import { useNetworkMemberProfileNavigation } from '../../hooks/network/useNetworkMemberProfileNavigation';
import { networkCardClickableSx } from './networkCardUtils';
import { buildProgramMajorRows } from '../../utils/academicUtils';
import { useCanContribute } from '../../hooks/useCanContribute';
import { ContributeGuardTooltip } from '../ContributeGuard';

const ACADEMIC_TAG_KEYS = {
  regular: 'regular',
  'chinh quy': 'regular',
  master: 'master',
  'thac si': 'master',
  'advanced program': 'advanced_program',
  'chuong trinh tien tien': 'advanced_program',
  'tien tien apcs': 'advanced_program',
  apcs: 'advanced_program',
  'high quality program': 'high_quality_program',
  'chuong trinh chat luong cao': 'high_quality_program',
  'enhanced english program': 'enhanced_english_program',
  'tang cuong tieng anh': 'enhanced_english_program',
  'khoa hoc may tinh': 'computer_science',
  'information systems': 'information_systems',
  'he thong thong tin': 'information_systems',
  'information technology': 'information_technology',
  'cong nghe thong tin': 'information_technology',
  'software engineering': 'software_engineering',
  'ky thuat phan mem': 'software_engineering',
  'artificial intelligence': 'artificial_intelligence',
  'tri tue nhan tao': 'artificial_intelligence',
  'data science': 'data_science',
  'khoa hoc du lieu': 'data_science',
};

const normalizeAcademicTag = (value) => (
  String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
);

const formatAcademicTag = (label, t) => {
  const key = ACADEMIC_TAG_KEYS[normalizeAcademicTag(label)];
  return key ? t(`academic_tags.${key}`, { defaultValue: label }) : label;
};

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
  messageButtonVariant = 'contained',
}) => {
  const { t } = useTranslation('network');
  const { canUseBasicActions } = useCanContribute();
  const { navigateToProfile, handleCardKeyDown, stopActionPropagation } =
    useNetworkMemberProfileNavigation(userId);
  const displayName = fullName || 'N/A';
  const academicRows = buildProgramMajorRows(program, major);
  const resolvedButtonLabel = messageButtonLabel ?? t('connect');
  const actionIcon = (() => {
    if (isMessageLoading) return null;
    if (resolvedButtonLabel === t('message')) return <ChatBubbleOutlineOutlinedIcon />;
    if (resolvedButtonLabel === t('connect_pending')) return <HourglassEmptyOutlinedIcon />;
    return <PersonAddAlt1OutlinedIcon />;
  })();

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={navigateToProfile}
      onKeyDown={handleCardKeyDown}
      sx={{
        p: 3,
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        borderRadius: 2,
        border: '1px solid',
        borderColor: isDemo ? 'primary.light' : 'divider',
        boxShadow: 'none',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        height: '100%',
        minHeight: '100%',
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
                disabled={isBlockLoading || !canUseBasicActions}
                onClick={(event) => {
                  stopActionPropagation(event);
                  close();
                  if (!canUseBasicActions) return;
                  onBlock();
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <BlockOutlinedIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText primary={t('block_user_menu_label')} primaryTypographyProps={{ variant: 'body2' }} />
              </MenuItem>
            )}
          </IconButtonMenu>
        </Box>
      ) : null}

      <Stack spacing={1.5} alignItems="center" sx={{ width: '100%', minWidth: 0 }}>
        <Avatar src={avatar} sx={{ width: 80, height: 80 }} />

        <Box sx={{ width: '100%' }}>
          <Typography
            fontWeight={700}
            variant="subtitle1"
            sx={{
              lineHeight: 1.3,
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
            }}
          >
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
              minHeight: 32,
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
                {row.program ? <AcademicChip label={formatAcademicTag(row.program, t)} /> : null}
                {row.major ? <AcademicChip label={formatAcademicTag(row.major, t)} /> : null}
              </Stack>
            ))}
          </Box>
        </Box>
      </Stack>

      <ContributeGuardTooltip required="basic" sx={{ width: '100%', mt: 'auto', pt: 3, display: 'flex' }}>
        <Button
          variant={messageButtonVariant}
          fullWidth
          type="button"
          onClick={(event) => {
            stopActionPropagation(event);
            if (!canUseBasicActions) return;
            onMessage?.();
          }}
          disabled={!onMessage || isMessageLoading || !canUseBasicActions}
          startIcon={actionIcon}
        >
          {isMessageLoading ? (
            <CircularProgress size={22} color="inherit" />
          ) : (
            resolvedButtonLabel
          )}
        </Button>
      </ContributeGuardTooltip>
    </Card>
  );
};

const AcademicChip = ({ label }) => (
  <Chip
    label={label}
    size="small"
    variant="outlined"
    sx={(theme) => ({
      maxWidth: '100%',
      bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.14 : 0.08),
      color: 'primary.main',
      borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.34 : 0.22),
      fontWeight: 600,
      borderRadius: 999,
      '& .MuiChip-label': {
        px: 1.25,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },
    })}
  />
);

export default NetworkSearchMemberCard;
