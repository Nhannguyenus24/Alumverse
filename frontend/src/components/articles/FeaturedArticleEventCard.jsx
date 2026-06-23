import { useState, useEffect } from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useSnackbar } from 'notistack';
import { eventApi } from '../../utils/api';
import JoinEventDialog from '../event/JoinEventDialog';
import { useEventQuestions, formatAnswersForApi } from '../../hooks/events/useEventQuestions';

const FeaturedArticleEventCard = ({ article, isAdmin = false, onEdit, onDelete }) => {
  const { t } = useTranslation(['common', 'event']);
  const { enqueueSnackbar } = useSnackbar();
  const [isInterested, setIsInterested] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [loadingInterest, setLoadingInterest] = useState(false);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [openJoinDialog, setOpenJoinDialog] = useState(false);
  const { data: questions = [] } = useEventQuestions(article?.id, !isAdmin && Boolean(article?.id));

  useEffect(() => {
    if (isAdmin || !article?.id) return;
    eventApi.checkInterest(article.id)
      .then((res) => setIsInterested(res?.isInterested ?? false))
      .catch(() => {});
    eventApi.checkRegistered(article.id)
      .then((res) => { if (res?.isRegistered) setIsJoined(true); })
      .catch(() => {});
  }, [article?.id, isAdmin]);

  const handleInterest = async (e) => {
    e.stopPropagation();
    if (loadingInterest) return;
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
    if (loadingJoin || isJoined) return;
    setOpenJoinDialog(true);
  };

  const handleConfirmJoin = async (answerMap) => {
    if (loadingJoin || isJoined) return;
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
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: 'center' },
        width: '100%',
        gap: 3,
        transition: 'transform 0.25s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      {/* IMAGE */}
      <Box
        sx={{
          width: { xs: '100%', md: '45%' },
          height: { xs: 200, md: 250 },
          borderRadius: 2,
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

      {/* CONTENT */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
            {article.date}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <Typography
              variant="h2"
              fontWeight={700}
              sx={{
                flex: 1,
                fontSize: { xs: '1.4rem', md: '2rem' },
                color: hovered ? 'primary.main' : 'text.primary',
                transition: 'color 0.2s ease',
              }}
            >
              {article.title}
            </Typography>

            <ArrowForwardIcon
              sx={{
                mt: '6px',
                color: 'primary.main',
                flexShrink: 0,
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
          sx={{
            mt: 1,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {article.description}
        </Typography>

        <Box sx={{ flex: 1 }} />

        {/* ACTION BUTTONS */}
        {isAdmin ? (
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              startIcon={<EditOutlinedIcon />}
              sx={{ textTransform: 'none', fontWeight: 600 }}
              onClick={onEdit}
            >
              {t('common:edit')}
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="error"
              startIcon={<DeleteOutlineOutlinedIcon />}
              sx={{ textTransform: 'none', fontWeight: 600 }}
              onClick={onDelete}
            >
              {t('common:delete')}
            </Button>
          </Stack>
        ) : (
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button
              fullWidth
              variant={isInterested ? 'outlined' : 'contained'}
              color="primary"
              disabled={loadingInterest}
              sx={{ bgcolor: isInterested ? 'white' : 'primary.main' }}
              onClick={handleInterest}
            >
              {isInterested ? t('event:interested') : t('event:mark_interested')}
            </Button>

            <Button
              fullWidth
              variant={isJoined ? 'outlined' : 'contained'}
              color="success"
              disabled={loadingJoin || isJoined}
              sx={{ bgcolor: isJoined ? 'white' : 'success.main' }}
              onClick={handleJoinClick}
            >
              {isJoined ? t('event:joined') : t('event:join')}
            </Button>
          </Stack>
        )}
      </Box>

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

export default FeaturedArticleEventCard;
