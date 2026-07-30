import { IconButton, Badge, Tooltip } from '@mui/material';
import PollOutlinedIcon from '@mui/icons-material/PollOutlined';
import { useTranslation } from 'react-i18next';
import useSurveyPromptStore from '../../stores/surveyPromptStore';

/**
 * Header icon giving the user a permanent way to (re-)open pending surveys,
 * even after dismissing the popup. The badge shows how many open surveys the
 * user has not answered yet. Renders nothing when there are none.
 */
const SurveyBell = ({ headerTextColor = 'text.primary' }) => {
  const { t } = useTranslation(['survey']);
  const pendingCount = useSurveyPromptStore((s) => s.pending.length);
  const openModal = useSurveyPromptStore((s) => s.openModal);

  if (pendingCount === 0) return null;

  return (
    <Tooltip title={t('survey:prompt_tooltip')} arrow placement="bottom">
      <IconButton
        size="small"
        aria-label={t('survey:prompt_tooltip')}
        onClick={openModal}
        sx={{ color: headerTextColor }}
      >
        <Badge badgeContent={pendingCount} color="error">
          <PollOutlinedIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};

export default SurveyBell;
