import { useState, useEffect } from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useSnackbar } from 'notistack';
import { eventApi } from '../../utils/api';
import JoinEventDialog from '../event/JoinEventDialog';
import { useEventQuestions, formatAnswersForApi } from '../../hooks/events/useEventQuestions';
import { getEventRegisteredState } from '../../utils/eventRegistration';
import { useCanContribute } from '../../hooks/useCanContribute';
import { ContributeGuardTooltip } from '../ContributeGuard';

const ArticleEventCard = ({ article, isAdmin = false, onEdit }) => {
  const { t } = useTranslation(['common', 'event']);
  const { enqueueSnackbar } = useSnackbar();
  const { canContribute } = useCanContribute();
  const [isInterested, setIsInterested] = useState(false);
  const [isJoined, setIsJoined] = useState(() => getEventRegisteredState(article));
  const [loadingInterest, setLoadingInterest] = useState(false);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [openJoinDialog, setOpenJoinDialog] = useState(false);
  const { data: questions = [] } = useEventQuestions(article?.id, !isAdmin && Boolean(article?.id));

  useEffect(() => {
    if (isAdmin || !article?.id) return;
    eventApi.checkInterest(article.id)
      .then((res) => setIsInterested(res?.isInterested ?? false))
      .catch(() => {});
    setCheckingRegistration(true);
    eventApi.checkRegistered(article.id)
      .then((res) => setIsJoined(getEventRegisteredState(res)))
      .catch(() => {})
      .finally(() => setCheckingRegistration(false));
  }, [article?.id, isAdmin]);

  const handleInterest = async (e) => {
    e.stopPropagation();
    if (loadingInterest || !canContribute) return;
    setLoadingInterest(true);
    try {
      if (isInterested) {
        await eventApi.removeInterest(article.id);
        setIsInterested(false);
      } else {
        await eventApi.addInterest(article.id);
        setIsInterested(true);
      }
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || t('common:action_failed'), { variant: 'error' });
    } finally {
      setLoadingInterest(false);
    }
  };

  const handleJoinClick = (e) => {
    e.stopPropagation();
    if (loadingJoin || checkingRegistration || isJoined || !canContribute) return;
    setOpenJoinDialog(true);
  };

  const handleConfirmJoin = async (answerMap) => {
    if (loadingJoin || checkingRegistration || isJoined || !canContribute) return;
    setLoadingJoin(true);
    try {
      const payload = questions.length > 0
        ? { answers: formatAnswersForApi(answerMap, questions) }
        : {};
      await eventApi.registerForEvent(article.id, payload);
      setIsJoined(true);
      setOpenJoinDialog(false);
      enqueueSnackbar(t('event:register_success'), { variant: 'success' });
    } catch (err) {
      if (err?.response?.status === 409) {
        setIsJoined(true);
        enqueueSnackbar(t('event:already_registered'), { variant: 'info' });
      } else {
        enqueueSnackbar(err?.response?.data?.message || t('event:register_failed'), { variant: 'error' });
      }
    } finally {
      setLoadingJoin(false);
    }
  };

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        gap: 1,
        transition: 'transform 0.25s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: 180,
          borderRadius: 1,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <Box
          component="img"
          src={article.image}
          alt={article.title}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease',
            transform: hovered ? 'scale(1.06)' : 'scale(1)',
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 0.5 }}>
        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
          {article.date}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              flex: 1,
              color: hovered ? 'primary.main' : 'text.primary',
              transition: 'color 0.2s ease',
            }}
          >
            {article.title}
          </Typography>

          <ArrowForwardIcon
            fontSize="small"
            sx={{
              mt: '3px',
              flexShrink: 0,
              color: 'primary.main',
              opacity: hovered ? 1 : 0,
              transform: hovered ? 'translateX(0)' : 'translateX(-6px)',
              transition: 'opacity 0.2s ease, transform 0.2s ease',
            }}
          />
        </Box>

        <Typography variant="body2" color="text.secondary">
          {article.organizer || t('event:organizer_fallback')}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          {t('event:participants_interested', { participants: article.participants || 0, interested: article.interested || 0 })}
        </Typography>
      </Box>

      <Typography
        variant="body2"
        sx={{
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {article.description}
      </Typography>

      <Box sx={{ flex: 1 }} />

      {isAdmin ? (
        <Stack direction="row" spacing={1}>
          <Button
            fullWidth
            variant="outlined"
            color="secondary"
            startIcon={<EditOutlinedIcon />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
          >
            {t('common:edit')}
          </Button>
        </Stack>
      ) : (
        <Stack direction="row" spacing={1}>
          <ContributeGuardTooltip sx={{ flex: 1 }}>
            <Button
              fullWidth
              variant={isInterested ? 'outlined' : 'contained'}
              color="primary"
              disabled={loadingInterest || !canContribute}
              onClick={handleInterest}
            >
              {isInterested ? t('event:interested') : t('event:mark_interested')}
            </Button>
          </ContributeGuardTooltip>

          <ContributeGuardTooltip sx={{ flex: 1 }}>
            <Button
              fullWidth
              variant={isJoined ? 'outlined' : 'contained'}
              color="accent"
              disabled={loadingJoin || checkingRegistration || isJoined || !canContribute}
              onClick={handleJoinClick}
            >
              {isJoined ? t('event:joined') : t('event:join')}
            </Button>
          </ContributeGuardTooltip>
        </Stack>
      )}

      <JoinEventDialog
        open={openJoinDialog}
        onClose={() => setOpenJoinDialog(false)}
        eventTitle={article.title}
        questions={questions}
        loading={loadingJoin}
        onConfirm={handleConfirmJoin}
      />
    </Box>
  );
};

export default ArticleEventCard;
