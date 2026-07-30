import { Avatar, Badge, Tooltip } from '@mui/material';
import PollOutlinedIcon from '@mui/icons-material/PollOutlined';
import { styled, keyframes } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import useSurveyPromptStore from '../../stores/surveyPromptStore';

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

const FloatingAvatar = styled(Avatar)(({ theme }) => ({
  width: 60,
  height: 60,
  backgroundColor: theme.palette.accent.main,
  cursor: 'pointer',
  animation: `${pulse} 1.8s ease-in-out infinite`,
  transition: 'transform 0.2s, box-shadow 0.2s',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  '&:hover': {
    transform: 'scale(1.1)',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
  },
}));

export default function SurveyFloatingButton() {
  const { t } = useTranslation('survey');
  const pendingCount = useSurveyPromptStore((s) => s.pending.length);
  const openModal = useSurveyPromptStore((s) => s.openModal);

  if (pendingCount === 0) return null;

  return (
    <Tooltip title={t('prompt_tooltip')} placement="left">
      <Badge
        badgeContent={pendingCount}
        color="error"
        max={99}
        overlap="circular"
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <FloatingAvatar
          onClick={openModal}
          aria-label={t('prompt_tooltip')}
        >
          <PollOutlinedIcon sx={{ fontSize: 30, color: 'accent.contrastText' }} />
        </FloatingAvatar>
      </Badge>
    </Tooltip>
  );
}
