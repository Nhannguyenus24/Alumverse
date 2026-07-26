import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  Stack,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useSnackbar } from 'notistack';
import { eventApi } from '../../utils/api';
import JoinEventDialog from '../event/JoinEventDialog';
import { useEventQuestions, formatAnswersForApi } from '../../hooks/events/useEventQuestions';
import { findCancelableTicketForEvent, getEventActionState, getEventRegisteredState } from '../../utils/eventRegistration';
import { useCanContribute } from '../../hooks/useCanContribute';
import { ContributeGuardTooltip } from '../ContributeGuard';
import { getCardTitleFontSize } from '../../utils/text';

const ArticleEventCard = ({ article, isAdmin = false, onEdit }) => {
  const { t } = useTranslation(['common', 'event']);
  const { enqueueSnackbar } = useSnackbar();
  const { canUseBasicActions } = useCanContribute();
  const queryClient = useQueryClient();
  const [isInterested, setIsInterested] = useState(false);
  const [interestedCount, setInterestedCount] = useState(article?.interested ?? 0);
  const [isJoined, setIsJoined] = useState(() => getEventRegisteredState(article));
  const [ticketStatus, setTicketStatus] = useState(null);
  const [loadingInterest, setLoadingInterest] = useState(false);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [openJoinDialog, setOpenJoinDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const { data: questions = [] } = useEventQuestions(article?.id, !isAdmin && canUseBasicActions && Boolean(article?.id));

  useEffect(() => {
    setInterestedCount(article?.interested ?? 0);
  }, [article?.interested]);

  useEffect(() => {
    if (isAdmin || !article?.id) return;
    if (!canUseBasicActions) {
      setIsInterested(false);
      setIsJoined(getEventRegisteredState(article));
      setCheckingRegistration(false);
      setTicketStatus(null);
      return;
    }
    eventApi.checkInterest(article.id)
      .then((res) => setIsInterested(res?.isInterested ?? false))
      .catch(() => {});
    setCheckingRegistration(true);
    eventApi.checkRegistered(article.id)
      .then((res) => setIsJoined(getEventRegisteredState(res)))
      .catch(() => {})
      .finally(() => setCheckingRegistration(false));
    eventApi.getMyTickets({ page: 0, limit: 100 })
      .then((ticketsPage) => {
        const tickets = ticketsPage?.items ?? ticketsPage?.content ?? ticketsPage?.data ?? [];
        const ticket = tickets.find((t) => Number(t?.eventId) === Number(article.id));
        setTicketStatus(ticket?.status ?? null);
      })
      .catch(() => {});
  }, [article, article?.id, canUseBasicActions, isAdmin]);

  const handleInterest = async (e) => {
    e.stopPropagation();
    if (loadingInterest || !canUseBasicActions) return;
    setLoadingInterest(true);
    try {
      if (isInterested) {
        await eventApi.removeInterest(article.id);
        setIsInterested(false);
        setInterestedCount((c) => Math.max(0, c - 1));
        enqueueSnackbar(t('event:unmark_interested_success', { defaultValue: 'Đã hủy quan tâm sự kiện' }), { variant: 'info' });
      } else {
        await eventApi.addInterest(article.id);
        setIsInterested(true);
        setInterestedCount((c) => c + 1);
        enqueueSnackbar(t('event:mark_interested_success', { defaultValue: 'Đã quan tâm sự kiện' }), { variant: 'success' });
      }
      queryClient.invalidateQueries({ queryKey: ['publishedEvents'] });
      queryClient.invalidateQueries({ queryKey: ['article'] });
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || t('common:action_failed'), { variant: 'error' });
    } finally {
      setLoadingInterest(false);
    }
  };

  const isTicketUsed = ["USED", "CHECKED_IN"].includes(String(ticketStatus ?? "").toUpperCase());
  const isTicketBanned = String(ticketStatus ?? "").toUpperCase() === "BANNED";
  const eventActionState = getEventActionState({
    event: article,
    isJoined,
    ticketStatus,
    canUseAction: canUseBasicActions,
    loading: loadingJoin,
    checking: checkingRegistration,
  });
  const eventActionIcon = eventActionState.icon === 'available'
    ? <EventAvailableOutlinedIcon />
    : <EventBusyOutlinedIcon />;

  const handleJoinClick = (e) => {
    e.stopPropagation();
    if (eventActionState.disabled) return;
    if (isJoined) {
      if (isTicketUsed || isTicketBanned) return;
      setOpenCancelDialog(true);
      return;
    }
    if (questions.length > 0) {
      setOpenJoinDialog(true);
    } else {
      handleDirectJoin([]);
    }
  };

  const handleDirectJoin = async (answersPayload = []) => {
    setLoadingJoin(true);
    try {
      await eventApi.registerForEvent(article.id, { answers: answersPayload });
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

  const handleConfirmJoin = async (answerMap) => {
    handleDirectJoin(formatAnswersForApi(answerMap, questions));
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim() || loadingJoin || checkingRegistration || !canUseBasicActions) return;
    setLoadingJoin(true);
    try {
      const ticketsPage = await eventApi.getMyTickets({ page: 0, limit: 100 });
      const tickets = ticketsPage?.items ?? ticketsPage?.content ?? ticketsPage?.data ?? [];
      const ticket = findCancelableTicketForEvent(tickets, article.id);
      if (!ticket) {
        enqueueSnackbar(t('event:ticket_not_found'), { variant: 'error' });
        return;
      }
      await eventApi.cancelTicketByCode(ticket.ticketCode, cancelReason.trim());
      setIsJoined(false);
      setCancelReason('');
      setOpenCancelDialog(false);
      enqueueSnackbar(t('event:cancel_ticket_success'), { variant: 'info' });
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || t('event:cancel_ticket_error'), { variant: 'error' });
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
        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: 180,
          borderRadius: 2,
          overflow: 'hidden',
          flexShrink: 0,
          boxShadow: hovered
            ? '0 8px 20px rgba(0,0,0,0.12)'
            : '0 2px 8px rgba(0,0,0,0.04)',
          transition: 'box-shadow 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '140%',
            height: '140%',
            transformOrigin: '100% 0%',
            background: (theme) =>
              `radial-gradient(circle at 100% 0%, ${alpha(theme.palette.primary.main, 0.34)} 0%, ${alpha(
                theme.palette.primary.main,
                0.12
              )} 40%, transparent 75%)`,
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'scale(1.15)' : 'scale(0.2)',
            transition: 'opacity 0.65s cubic-bezier(0.25, 1, 0.5, 1), transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)',
            pointerEvents: 'none',
            zIndex: 2,
          },
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
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
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
                fontSize: getCardTitleFontSize(article.title),
                lineHeight: 1.25,
                wordBreak: 'break-word',
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
          {t('event:interested_only', { interested: interestedCount || 0 })}
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
          <ContributeGuardTooltip required="basic" sx={{ flex: 1, opacity: canUseBasicActions ? 1 : 0.58, filter: canUseBasicActions ? 'none' : 'grayscale(0.25)' }}>
            <Button
              fullWidth
              variant={isInterested ? 'outlined' : 'contained'}
              color="primary"
              disabled={loadingInterest || !canUseBasicActions}
              startIcon={isInterested ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              onClick={handleInterest}
            >
              {isInterested ? t('event:unmark_interested') : t('event:mark_interested')}
            </Button>
          </ContributeGuardTooltip>

          <ContributeGuardTooltip required="basic" sx={{ flex: 1, opacity: canUseBasicActions ? 1 : 0.58, filter: canUseBasicActions ? 'none' : 'grayscale(0.25)' }}>
            <Button
              fullWidth
              variant={eventActionState.variant}
              color={eventActionState.color}
              disabled={eventActionState.disabled}
              sx={eventActionState.disabled ? { pointerEvents: 'none' } : undefined}
              startIcon={eventActionIcon}
              onClick={handleJoinClick}
            >
              {t(eventActionState.labelKey)}
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
      <Dialog
        open={openCancelDialog}
        onClose={(e) => {
          e?.stopPropagation?.();
          setOpenCancelDialog(false);
        }}
        onClick={(e) => e.stopPropagation()}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t('event:cancel_ticket')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('event:cancel_ticket_reason_prompt')}
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label={t('event:cancel_reason_label')}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="secondary" onClick={(e) => { e.stopPropagation(); setOpenCancelDialog(false); }}>
            {t('common:cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<EventBusyOutlinedIcon />}
            disabled={!cancelReason.trim() || loadingJoin}
            onClick={(e) => {
              e.stopPropagation();
              handleConfirmCancel();
            }}
          >
            {t('event:confirm_cancel_ticket')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ArticleEventCard;
