import LoadingSkeleton from '../../components/LoadingSkeleton';
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  IconButton,
  Tooltip,
  useTheme,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LinkIcon from "@mui/icons-material/Link";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import Page from "../../components/Page";
import useOrganizationStore from "../../stores/organizationStore";
import { useOrganization } from "../../hooks/useOrganization";
import { useArticleById } from "../../hooks/articles/useArticleById";
import DOMPurify from "dompurify";
import { formatDate, formatDateRange } from "../../utils/dateFormatter";
import { formatNumberVi } from "../../utils/numberFormatter";
import { normalizeRichTextHtml } from "../../utils/stringUtils";
import JoinEventDialog from "../../components/event/JoinEventDialog";
import { eventApi, savedItemApi } from "../../utils/api";
import { useEventQuestions, formatAnswersForApi } from "../../hooks/events/useEventQuestions";
import { useCanContribute } from "../../hooks/useCanContribute";
import { ContributeGuardTooltip, VerificationRequiredAlert } from "../../components/ContributeGuard";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";
import { findCancelableTicketForEvent, getEventActionState, getEventRegisteredState } from "../../utils/eventRegistration";
import { extractMainImageCaption } from "../../utils/articleContentCaption";
import { usePublicProfile } from "../../hooks/profile/usePublicProfile";
import {
  ScrollReveal,
  ScrollRevealGroup,
  ScrollRevealItem,
} from "../../components/animations/ScrollReveal";
import { useAuth } from "../../hooks/useAuth";
import CommentSection from "../../components/comments/CommentSection";
import { useEventComments } from "../../hooks/event/useEventComments";
import { useCreateEventComment } from "../../hooks/event/useCreateEventComment";
import { useReplyToEventComment } from "../../hooks/event/useReplyToEventComment";
import { useUpdateEventComment } from "../../hooks/event/useUpdateEventComment";
import { useDeleteEventComment } from "../../hooks/event/useDeleteEventComment";
import { useNewsComments } from "../../hooks/article/useNewsComments";
import { useCreateNewsComment } from "../../hooks/article/useCreateNewsComment";
import { useReplyToNewsComment } from "../../hooks/article/useReplyToNewsComment";
import { useUpdateNewsComment } from "../../hooks/article/useUpdateNewsComment";
import { useDeleteNewsComment } from "../../hooks/article/useDeleteNewsComment";
import { useAlumniPostComments } from "../../hooks/article/useAlumniPostComments";
import { useCreateAlumniPostComment } from "../../hooks/article/useCreateAlumniPostComment";
import { useReplyToAlumniPostComment } from "../../hooks/article/useReplyToAlumniPostComment";
import { useUpdateAlumniPostComment } from "../../hooks/article/useUpdateAlumniPostComment";
import { useDeleteAlumniPostComment } from "../../hooks/article/useDeleteAlumniPostComment";

const isLightInlineBackground = (value) => {
  if (!value) return false;
  const normalized = value.toLowerCase().replace(/\s+/g, "");
  if (normalized.includes("white") || normalized.includes("#fff")) return true;

  const rgbMatch = normalized.match(/rgba?\((\d+),(\d+),(\d+)(?:,([.\d]+))?\)/);
  if (!rgbMatch) return false;

  const [, red, green, blue, alphaValue] = rgbMatch;
  const alphaNumber = alphaValue === undefined ? 1 : Number(alphaValue);
  if (alphaNumber === 0) return false;
  return [red, green, blue].every((channel) => Number(channel) >= 245);
};

const parseCssColorChannels = (value) => {
  if (!value) return null;
  const normalized = value.toLowerCase().replace(/\s+/g, "");
  if (normalized.includes("black")) return [0, 0, 0];

  const rgbMatch = normalized.match(/rgba?\((\d+),(\d+),(\d+)(?:,([.\d]+))?\)/);
  if (rgbMatch) {
    const [, red, green, blue, alphaValue] = rgbMatch;
    const alphaNumber = alphaValue === undefined ? 1 : Number(alphaValue);
    if (alphaNumber === 0) return null;
    return [red, green, blue].map(Number);
  }

  const hexMatch = normalized.match(/#([0-9a-f]{3}|[0-9a-f]{6})\b/);
  if (!hexMatch) return null;

  const hex = hexMatch[1];
  if (hex.length === 3) {
    return hex.split("").map((character) => parseInt(`${character}${character}`, 16));
  }

  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
};

const isDarkNeutralInlineText = (value) => {
  const channels = parseCssColorChannels(value);
  if (!channels) return false;

  const darkest = Math.min(...channels);
  const lightest = Math.max(...channels);
  return lightest <= 90 && lightest - darkest <= 28;
};

const normalizeArticleHtml = (html) => {
  if (!html || typeof document === "undefined") return html;

  const container = document.createElement("div");
  container.innerHTML = html;

  const textWalker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (textWalker.nextNode()) textNodes.push(textWalker.currentNode);

  textNodes.forEach((node) => {
    node.nodeValue = (node.nodeValue ?? "").replace(/\u00a0/g, " ");
  });

  container.querySelectorAll("[style]").forEach((element) => {
    const inlineBackground = element.style.background || "";
    const inlineBackgroundColor = element.style.backgroundColor || "";
    const inlineColor = element.style.color || "";

    if (isLightInlineBackground(inlineBackground) || isLightInlineBackground(inlineBackgroundColor)) {
      element.style.removeProperty("background");
      element.style.removeProperty("background-color");
    }

    if (isDarkNeutralInlineText(inlineColor)) {
      element.style.removeProperty("color");
    }
  });

  container.querySelectorAll("a").forEach((anchor) => {
    const walker = document.createTreeWalker(anchor, NodeFilter.SHOW_TEXT);
    const anchorTextNodes = [];
    while (walker.nextNode()) anchorTextNodes.push(walker.currentNode);

    anchorTextNodes.forEach((node) => {
      const text = node.nodeValue ?? "";
      if (!/[/-]/.test(text)) return;

      const fragment = document.createDocumentFragment();
      text.split(/([/-])/).forEach((part) => {
        if (!part) return;
        fragment.appendChild(document.createTextNode(part));
        if (part === "/" || part === "-") {
          fragment.appendChild(document.createElement("wbr"));
        }
      });
      node.parentNode?.replaceChild(fragment, node);
    });
  });

  container.querySelectorAll("img").forEach((image) => {
    image.removeAttribute("width");
    image.removeAttribute("height");
    image.style.removeProperty("width");
    image.style.removeProperty("height");
    image.style.removeProperty("min-width");
    image.style.removeProperty("max-width");
    image.style.removeProperty("min-height");
    image.style.removeProperty("max-height");
    image.style.removeProperty("object-fit");
    image.classList.add("ql-content-image");
    image.style.setProperty("display", "block");
    image.style.setProperty("width", "auto", "important");
    image.style.setProperty("height", "auto", "important");
    image.style.setProperty("max-width", "min(100%, 560px)", "important");
    image.style.setProperty("max-height", "80vh");
    image.style.setProperty("object-fit", "contain");
    image.style.setProperty("margin", "16px auto");

    const imageParagraph = image.closest("p");
    if (imageParagraph && imageParagraph.textContent.trim() === "") {
      imageParagraph.classList.add("ql-image-line");
    }
  });

  container.querySelectorAll("p").forEach((paragraph) => {
    const hasOnlyBreaks = Array.from(paragraph.childNodes).every((node) => (
      node.nodeType === Node.ELEMENT_NODE && node.nodeName === "BR"
    ));
    if ((paragraph.textContent ?? "").trim() === "" && hasOnlyBreaks) {
      paragraph.classList.add("ql-empty-line");
    }
  });

  ["left", "center", "right", "justify"].forEach((alignment) => {
    container.querySelectorAll(`.ql-align-${alignment}`).forEach((element) => {
      // Keep Quill alignment authoritative even when surrounding page styles differ.
      element.style.setProperty("text-align", alignment, "important");
    });
  });

  return container.innerHTML;
};

/** Maps an article's display channel to the itemType used by the saved-items API. */
const SAVE_ITEM_TYPE_BY_CHANNEL = {
  news: "NEWS",
  alumni: "ALUMNI_POST",
  achievement: "ACHIEVEMENT",
};

/** Heart toggle to save ("quan tâm") an article or alumni post via the generic saved-items
 * bookmark table. Events don't use this — they have their own interest button on ArticleHighlightCard. */
const SaveArticleButton = ({ itemId, itemType }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation(['common', 'article']);
  const { canContribute, isAuthenticated } = useCanContribute();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setSaved(false);
      return undefined;
    }

    let active = true;
    savedItemApi.check(itemType, itemId)
      .then((v) => { if (active) setSaved(Boolean(v)); })
      .catch(() => {});
    return () => { active = false; };
  }, [isAuthenticated, itemId, itemType]);

  const toggle = async () => {
    if (busy || !canContribute) return;
    setBusy(true);
    try {
      if (saved) {
        await savedItemApi.unsave(itemType, itemId);
        setSaved(false);
        enqueueSnackbar(t('article:unsaved_article'), { variant: "info" });
      } else {
        await savedItemApi.save(itemType, itemId);
        setSaved(true);
        enqueueSnackbar(t('article:saved_article'), { variant: "success" });
      }
    } catch {
      enqueueSnackbar(t('common:action_failed'), { variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  const guardTitle = !canContribute
    ? (isAuthenticated ? t('common:verification_required_tooltip') : t('common:verification_required_login'))
    : (saved ? t('article:unsave') : t('article:save_interest'));

  return (
    <Tooltip title={guardTitle} arrow>
      <Box component="span" sx={{ display: "inline-flex" }}>
        <IconButton
          onClick={toggle}
          disabled={busy || !canContribute}
          sx={{ color: saved ? "accent.main" : "text.secondary" }}
        >
          {saved ? <FavoriteIcon /> : <FavoriteBorderIcon />}
        </IconButton>
      </Box>
    </Tooltip>
  );
};

const ArticleHighlightCard = ({ data, channel, eventId, isAdmin = false, sharedInterest = null, onToggleSharedInterest = null }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation(['common', 'article', 'event', 'donation', 'admin']);
  const { canContribute, canUseBasicActions } = useCanContribute();
  const queryClient = useQueryClient();
  const canUseArticleAction = channel === "event" || channel === "donation"
    ? canUseBasicActions
    : canContribute;
  const [isInterestedLocal, setIsInterestedLocal] = useState(false);
  const [isJoined, setIsJoined] = useState(() => getEventRegisteredState(data));
  const [ticketStatus, setTicketStatus] = useState(null);
  const [interestedCountLocal, setInterestedCountLocal] = useState(data.stats?.[0]?.value ?? 0);
  const [joinedCount, setJoinedCount] = useState(data.stats?.[1]?.value ?? 0);
  const [loadingInterestLocal, setLoadingInterestLocal] = useState(false);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(false);
  const [openJoinDialog, setOpenJoinDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const { data: questions = [] } = useEventQuestions(eventId, !isAdmin && canUseArticleAction && channel === "event" && Boolean(eventId));

  const isTicketUsed = ["USED", "CHECKED_IN"].includes(String(ticketStatus ?? "").toUpperCase());
  const isTicketBanned = String(ticketStatus ?? "").toUpperCase() === "BANNED";
  const eventActionState = getEventActionState({
    event: data,
    isJoined,
    ticketStatus,
    canUseAction: canUseArticleAction,
    loading: loadingJoin,
    checking: checkingRegistration,
  });
  const eventActionIcon = eventActionState.icon === "available"
    ? <EventAvailableOutlinedIcon />
    : <EventBusyOutlinedIcon />;

  const isInterested = sharedInterest ? sharedInterest.isInterested : isInterestedLocal;
  const interestedCount = sharedInterest ? sharedInterest.interestedCount : interestedCountLocal;
  const loadingInterest = sharedInterest ? sharedInterest.loading : loadingInterestLocal;

  useEffect(() => {
    if (isAdmin || channel !== "event" || !eventId) return;

    if (canUseArticleAction) {
      if (!sharedInterest) {
        eventApi.checkInterest(eventId)
          .then((res) => {
            const checked = res?.isInterested ?? res?.data?.isInterested ?? false;
            setIsInterestedLocal(checked);
          })
          .catch(() => {});
      }
      setCheckingRegistration(true);
      eventApi.checkRegistered(eventId)
        .then((res) => {
          setIsJoined(getEventRegisteredState(res));
        })
        .catch(() => {})
        .finally(() => setCheckingRegistration(false));
      eventApi.getMyTickets({ page: 0, limit: 100 })
        .then((ticketsPage) => {
          const tickets = ticketsPage?.items ?? ticketsPage?.content ?? ticketsPage?.data ?? [];
          const ticket = tickets.find((t) => Number(t?.eventId) === Number(eventId));
          setTicketStatus(ticket?.status ?? null);
        })
        .catch(() => {});
    } else {
      setIsInterestedLocal(false);
      setIsJoined(getEventRegisteredState(data));
      setCheckingRegistration(false);
      setTicketStatus(null);
    }

    eventApi.getEventStatisticsById(eventId)
      .then((res) => {
        if (res?.interestedCount != null && !sharedInterest) setInterestedCountLocal(res.interestedCount);
        if (res?.registeredCount != null) setJoinedCount(res.registeredCount);
      })
      .catch(() => {});
  }, [canUseArticleAction, channel, data, eventId, isAdmin, sharedInterest]);

  const handleInterest = async () => {
    if (sharedInterest) {
      if (sharedInterest.loading || !canUseArticleAction) return;
      try {
        await onToggleSharedInterest();
      } catch (err) {
        enqueueSnackbar(err?.response?.data?.message || t('common:action_failed'), { variant: "error" });
      }
      return;
    }
    if (loadingInterestLocal || !canUseArticleAction) return;
    setLoadingInterestLocal(true);
    try {
      if (isInterestedLocal) {
        await eventApi.removeInterest(eventId);
        setIsInterestedLocal(false);
        setInterestedCountLocal((c) => Math.max(0, c - 1));
        enqueueSnackbar(t('event:unmark_interested_success', { defaultValue: 'Đã hủy quan tâm sự kiện' }), { variant: 'info' });
      } else {
        await eventApi.addInterest(eventId);
        setIsInterestedLocal(true);
        setInterestedCountLocal((c) => c + 1);
        enqueueSnackbar(t('event:mark_interested_success', { defaultValue: 'Đã quan tâm sự kiện' }), { variant: 'success' });
      }
      queryClient.invalidateQueries({ queryKey: ['publishedEvents'] });
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || t('common:action_failed'), { variant: "error" });
    } finally {
      setLoadingInterestLocal(false);
    }
  };

  const handleJoinClick = () => {
    if (eventActionState.disabled) return;
    if (isJoined) {
      if (isTicketUsed || isTicketBanned) return;
      setOpenCancelDialog(true);
      return;
    }
    setOpenJoinDialog(true);
  };

  const handleConfirmJoin = async (answerMap) => {
    if (loadingJoin || checkingRegistration || isJoined || !canUseArticleAction) return;
    setLoadingJoin(true);
    try {
      const payload = questions.length > 0
        ? { answers: formatAnswersForApi(answerMap, questions) }
        : {};
      await eventApi.registerForEvent(eventId, payload);
      setIsJoined(true);
      setJoinedCount((c) => c + 1);
      setOpenJoinDialog(false);
      enqueueSnackbar(t('event:registered_success'), { variant: "success" });
    } catch (err) {
      if (err?.response?.status === 409) {
        setIsJoined(true);
        enqueueSnackbar(t('event:already_registered'), { variant: "info" });
      } else {
        enqueueSnackbar(err?.response?.data?.message || t('event:register_failed'), { variant: "error" });
      }
    } finally {
      setLoadingJoin(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim() || loadingJoin || checkingRegistration || !canUseArticleAction) return;
    setLoadingJoin(true);
    try {
      const ticketsPage = await eventApi.getMyTickets({ page: 0, limit: 100 });
      const tickets = ticketsPage?.items ?? ticketsPage?.content ?? ticketsPage?.data ?? [];
      const ticket = findCancelableTicketForEvent(tickets, eventId);
      if (!ticket) {
        enqueueSnackbar(t('event:ticket_not_found'), { variant: "error" });
        return;
      }
      await eventApi.cancelTicketByCode(ticket.ticketCode, cancelReason.trim());
      setIsJoined(false);
      setJoinedCount((c) => Math.max(0, c - 1));
      setCancelReason("");
      setOpenCancelDialog(false);
      enqueueSnackbar(t('event:cancel_ticket_success'), { variant: "info" });
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || t('event:cancel_ticket_error'), { variant: "error" });
    } finally {
      setLoadingJoin(false);
    }
  };

  const displayStats = channel === "event"
    ? [
        { value: interestedCount, label: t('article:stat_interested') },
        { value: joinedCount, label: t('event:stat_joined') },
      ]
    : data.stats;

  return (
    <Box
      sx={(theme) => ({
        mt: 3,
        mb: 6,
        p: { xs: 2.5, sm: 4, md: 5 },
        bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.14 : 0.08),
        border: "1px solid",
        borderColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.28 : 0.14),
        borderRadius: 2,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: { xs: 2, md: 3 },
      })}
    >
      {/* LEFT */}
      <Box sx={{ flex: 1 }}>
        <Typography variant="h4" sx={{ color: "primary.main", fontSize: { xs: "0.9rem", sm: "1.1rem", md: "1.25rem" } }}>{data.channel}</Typography>
        <Typography
          variant="h2"
          sx={{
            color: "primary.main",
            fontSize: { xs: "1.15rem", sm: "1.4rem", md: "1.85rem" },
            fontWeight: 700,
            my: 1,
            wordBreak: "break-word",
            lineHeight: 1.3,
          }}
        >
          {data.title}
        </Typography>
        <Typography variant="body1" sx={{ fontSize: { xs: "0.9rem", md: "1rem" } }}>{data.organizer}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, fontSize: { xs: "0.8rem", md: "0.875rem" } }}>{data.date}</Typography>
      </Box>

      {/* RIGHT */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 2 }}>
        {/* STATS */}
        <Box sx={{ display: "flex", justifyContent: "space-around" }}>
          {displayStats?.map((item, i) => (
            <Box key={i} textAlign="center">
              <Typography variant="h2" fontWeight={700}>{item.value}</Typography>
              <Typography variant="body2" color="text.secondary">{item.label}</Typography>
            </Box>
          ))}
        </Box>

        {/* BUTTONS */}
        {!isAdmin && channel === "donation" && <VerificationRequiredAlert required="basic" sx={{ mb: 1 }} />}
        {isAdmin ? null : channel === "donation" ? (
          <ContributeGuardTooltip required="basic" sx={{ width: "100%", opacity: canUseArticleAction ? 1 : 0.58, filter: canUseArticleAction ? "none" : "grayscale(0.25)" }}>
            <Button fullWidth variant="contained" color="accent" disabled={!canUseArticleAction}>{t('donation:donate_button')}</Button>
          </ContributeGuardTooltip>
        ) : (
          <Stack direction="row" spacing={1}>
            <ContributeGuardTooltip required="basic" sx={{ flex: 1, opacity: canUseArticleAction ? 1 : 0.58, filter: canUseArticleAction ? "none" : "grayscale(0.25)" }}>
              <Button
                fullWidth
                variant={isInterested ? "outlined" : "contained"}
                disabled={loadingInterest || !canUseArticleAction}
                startIcon={isInterested ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                onClick={handleInterest}
              >
                {isInterested ? t('event:unmark_interested') : t('article:interest_action')}
              </Button>
            </ContributeGuardTooltip>

            <ContributeGuardTooltip required="basic" sx={{ flex: 1, opacity: canUseArticleAction ? 1 : 0.58, filter: canUseArticleAction ? "none" : "grayscale(0.25)" }}>
              <Button
                fullWidth
                variant={eventActionState.variant}
                color={eventActionState.color}
                disabled={eventActionState.disabled}
                sx={eventActionState.disabled ? { pointerEvents: "none" } : undefined}
                onClick={handleJoinClick}
                startIcon={eventActionIcon}
              >
                {t(eventActionState.state === "join" ? "event:register_action" : eventActionState.labelKey)}
              </Button>
            </ContributeGuardTooltip>
          </Stack>
        )}
      </Box>
      
      {/* EVENT QUESTIONS */}
      <JoinEventDialog
        open={openJoinDialog}
        onClose={() => setOpenJoinDialog(false)}
        eventTitle={data.title}
        questions={questions}
        loading={loadingJoin}
        onConfirm={handleConfirmJoin}
      />
      <Dialog open={openCancelDialog} onClose={() => setOpenCancelDialog(false)} maxWidth="xs" fullWidth>
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
          <Button onClick={() => setOpenCancelDialog(false)}>{t('common:cancel')}</Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<EventBusyOutlinedIcon />}
            disabled={!cancelReason.trim() || loadingJoin}
            onClick={handleConfirmCancel}
          >
            {t('event:confirm_cancel_ticket')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    
  );
};

const ArticlePage = () => {
  const { t } = useTranslation(['common', 'article', 'event', 'donation']);
  const { slug, channel, id } = useParams();
  const adminBase = slug ? `/${slug}/admin` : "/admin";
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const { isOrgManager } = useCanContribute();
  const loadErrorShownRef = useRef(false);
  const { article, isPending, isError, errorMessage } = useArticleById(channel, id);
  const authorId = article?.authorMemberId ?? null;
  const { data: authorProfile } = usePublicProfile(authorId, {
    enabled: Boolean(authorId) && article?.channel !== "donation",
  });

  const { cleanContent, mainImageCaption } = useMemo(() => {
    const parsedContent = extractMainImageCaption(article?.content ?? "");
    return {
      cleanContent: normalizeRichTextHtml(parsedContent.content || ""),
      mainImageCaption: parsedContent.caption,
    };
  }, [article]);
  
  const navigate = useOrgNavigate();
  const contentRef = useRef(null);
  const heroRef = useRef(null);
  const [placeholderHeight, setPlaceholderHeight] = useState(600);
  const isAdmin = isOrgManager;
  const isDark = theme.palette.mode === "dark";
  const contentFrameBg = "background.paper";
  const contentFrameShadow = isDark
    ? `0 18px 46px ${alpha(theme.palette.common.black, 0.46)}, 0 0 0 1px ${alpha(theme.palette.common.white, 0.08)}`
    : "0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)";

  const recalcPlaceholder = useCallback(() => {
    if (!contentRef.current || !heroRef.current) return;
    const heroH = heroRef.current.getBoundingClientRect().height;
    const contentH = contentRef.current.getBoundingClientRect().height;
    const contentTopInHero = heroH * 0.54;
    const overflow = contentH - (heroH - contentTopInHero);
    setPlaceholderHeight(Math.max(overflow + 140, 140));
  }, []);

  useEffect(() => {
    if (!contentRef.current) return;
    const ro = new ResizeObserver(recalcPlaceholder);
    ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, [article, recalcPlaceholder]);

  useEffect(() => {
    if (isPending) return;
    if (isError || !article) {
      if (!loadErrorShownRef.current) {
        enqueueSnackbar(errorMessage ?? t('article:not_found'), { variant: "error" });
        loadErrorShownRef.current = true;
      }
      return;
    }
    loadErrorShownRef.current = false;
  }, [isPending, isError, article, errorMessage, enqueueSnackbar, t]);

  // Comment hooks must be called unconditionally (before any early return) to
  // satisfy Rules of Hooks. Each is internally gated via `enabled: !!id`, so
  // only the hook matching the article's actual channel below fires network
  // calls; the other two stay idle.
  const { user } = useAuth();
  const { canUseBasicActions } = useCanContribute();
  const currentUserId = user?.id ?? null;

  const eventIdForComments = article?.channel === "event" ? id : null;
  const newsIdForComments = article?.channel === "news" ? id : null;
  const alumniPostIdForComments = article?.channel === "alumni" ? id : null;

  const eventComments = useEventComments(eventIdForComments);
  const { createComment: createEventComment, isPending: creatingEventComment } = useCreateEventComment();
  const { replyToComment: replyToEventComment } = useReplyToEventComment();
  const { updateComment: updateEventComment } = useUpdateEventComment();
  const { deleteComment: deleteEventComment, isPending: deletingEventComment } = useDeleteEventComment();

  const newsComments = useNewsComments(newsIdForComments);
  const { createComment: createNewsComment, isPending: creatingNewsComment } = useCreateNewsComment();
  const { replyToComment: replyToNewsComment } = useReplyToNewsComment();
  const { updateComment: updateNewsComment } = useUpdateNewsComment();
  const { deleteComment: deleteNewsComment, isPending: deletingNewsComment } = useDeleteNewsComment();

  const alumniPostComments = useAlumniPostComments(alumniPostIdForComments);
  const { createComment: createAlumniPostComment, isPending: creatingAlumniPostComment } = useCreateAlumniPostComment();
  const { replyToComment: replyToAlumniPostComment } = useReplyToAlumniPostComment();
  const { updateComment: updateAlumniPostComment } = useUpdateAlumniPostComment();
  const { deleteComment: deleteAlumniPostComment, isPending: deletingAlumniPostComment } = useDeleteAlumniPostComment();

  // Shared event-interest state, lifted here so the heart icon (SaveArticleButton) and the
  // "Quan tâm" button (ArticleHighlightCard) — two separate controls for the same event_interests
  // row — stay in sync without a reload. Only active for the event channel.
  const isEventChannel = article?.channel === "event";
  const queryClient = useQueryClient();
  const { canUseBasicActions: canToggleEventInterest, isAuthenticated: isAuthedForInterest } = useCanContribute();
  const [eventInterestState, setEventInterestState] = useState({ isInterested: false, countDelta: 0, loading: false });
  const eventInterest = {
    isInterested: eventInterestState.isInterested,
    interestedCount: Math.max(0, (article?.interestedCount ?? 0) + eventInterestState.countDelta),
    loading: eventInterestState.loading,
  };

  useEffect(() => {
    setEventInterestState((prev) => ({ ...prev, countDelta: 0 }));
  }, [article?.interestedCount, id]);

  useEffect(() => {
    if (!isEventChannel || !id || !isAuthedForInterest) return undefined;
    let active = true;
    eventApi.checkInterest(id)
      .then((res) => {
        if (active) setEventInterestState((prev) => ({ ...prev, isInterested: res?.isInterested ?? false }));
      })
      .catch(() => {});
    return () => { active = false; };
  }, [isEventChannel, id, isAuthedForInterest]);

  const toggleEventInterest = async () => {
    if (eventInterestState.loading || !canToggleEventInterest) return;
    setEventInterestState((prev) => ({ ...prev, loading: true }));
    try {
      if (eventInterestState.isInterested) {
        await eventApi.removeInterest(id);
        setEventInterestState((prev) => ({ ...prev, isInterested: false, countDelta: prev.countDelta - 1, loading: false }));
        enqueueSnackbar(t('event:unmark_interested_success', { defaultValue: 'Đã hủy quan tâm sự kiện' }), { variant: 'info' });
      } else {
        await eventApi.addInterest(id);
        setEventInterestState((prev) => ({ ...prev, isInterested: true, countDelta: prev.countDelta + 1, loading: false }));
        enqueueSnackbar(t('event:mark_interested_success', { defaultValue: 'Đã quan tâm sự kiện' }), { variant: 'success' });
      }
      queryClient.invalidateQueries({ queryKey: ['publishedEvents'] });
      await queryClient.invalidateQueries({ queryKey: ['article', { channel: 'event', id }], exact: false });
    } catch (err) {
      setEventInterestState((prev) => ({ ...prev, loading: false }));
      throw err;
    }
  };

  const { organization } = useOrganization();
  const currentOrgId = organization?.id ?? null;
  const orgHeroBannerUrl = useMemo(() => {
    if (!organization) return null;
    let url = null;

    try {
      if (organization.brandConfig) {
        const b = typeof organization.brandConfig === 'string' ? JSON.parse(organization.brandConfig) : organization.brandConfig;
        url = b?.hero_banner_url || b?.heroBannerUrl;
      }
    } catch (e) {}

    if (!url && organization.featuresConfig) {
      try {
        const f = typeof organization.featuresConfig === 'string' ? JSON.parse(organization.featuresConfig) : organization.featuresConfig;
        const b = f?.brand_config || f?.brandConfig;
        url = b?.hero_banner_url || b?.heroBannerUrl;
      } catch (e) {}
    }

    return url || organization?.heroBannerUrl || organization?.hero_banner_url || null;
  }, [organization]);

  const articleOrgId = article?.organizationId ?? article?.organization_id;
  const isOrgMismatch = Boolean(
    article &&
    currentOrgId &&
    articleOrgId &&
    String(articleOrgId) !== String(currentOrgId)
  );

  if (isPending) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <LoadingSkeleton />
      </Box>
    );
  }

  if (isOrgMismatch) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "60vh", textAlign: "center", px: 3 }}>
        <Typography variant="h5" color="error.main" fontWeight={800} sx={{ mb: 1 }}>
          {t('article:not_found_in_org_title', 'Nội dung không thuộc về tổ chức này')}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 500 }}>
          {t('article:not_found_in_org_desc', 'Nội dung này thuộc về một tổ chức khác và không thể xem từ đường dẫn hiện tại.')}
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/')}>
          {t('common:back_to_home', 'Quay về trang chủ')}
        </Button>
      </Box>
    );
  }

  if (isError || !article) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Typography color="text.secondary">{t('article:display_error')}</Typography>
      </Box>
    );
  }

  const resolvedChannel = article.channel;
  const isEventArticle = resolvedChannel === "event";

  const commentSectionProps =
    resolvedChannel === "event"
      ? {
          comments: eventComments.comments,
          isLoading: eventComments.isPending,
          isSubmitting: creatingEventComment,
          isDeleting: deletingEventComment,
          onCreate: (content) => createEventComment({ eventId: id, payload: { authorMemberId: currentUserId, content } }),
          onReply: (commentId, content) => replyToEventComment({ eventId: id, commentId, payload: { authorMemberId: currentUserId, content } }),
          onUpdate: (commentId, content) => updateEventComment({ eventId: id, commentId, payload: { content } }),
          onDelete: (commentId) => deleteEventComment({ eventId: id, commentId }),
        }
      : resolvedChannel === "news"
      ? {
          comments: newsComments.comments,
          isLoading: newsComments.isPending,
          isSubmitting: creatingNewsComment,
          isDeleting: deletingNewsComment,
          onCreate: (content) => createNewsComment({ newsId: id, payload: { authorMemberId: currentUserId, content } }),
          onReply: (commentId, content) => replyToNewsComment({ newsId: id, commentId, payload: { authorMemberId: currentUserId, content } }),
          onUpdate: (commentId, content) => updateNewsComment({ newsId: id, commentId, payload: { content } }),
          onDelete: (commentId) => deleteNewsComment({ newsId: id, commentId }),
        }
      : resolvedChannel === "alumni"
      ? {
          comments: alumniPostComments.comments,
          isLoading: alumniPostComments.isPending,
          isSubmitting: creatingAlumniPostComment,
          isDeleting: deletingAlumniPostComment,
          onCreate: (content) => createAlumniPostComment({ alumniPostId: id, payload: { authorMemberId: currentUserId, content } }),
          onReply: (commentId, content) => replyToAlumniPostComment({ alumniPostId: id, commentId, payload: { authorMemberId: currentUserId, content } }),
          onUpdate: (commentId, content) => updateAlumniPostComment({ alumniPostId: id, commentId, payload: { content } }),
          onDelete: (commentId) => deleteAlumniPostComment({ alumniPostId: id, commentId }),
        }
      : null;

  const authorName =
    authorProfile?.fullName
    || authorProfile?.name
    || article.memberName
    || article.authorName
    || null;

  const highlightData =
    resolvedChannel === "event"
      ? {
          channel: t('event:channel_label'),
          title: article.title,
          organizer: article.organizer ?? article.location ?? "",
          date: formatDateRange(article.eventDate, article.eventEndDate),
          stats: [{ value: article.interestedCount ?? 0, label: t('article:stat_interested') }, { value: article.joinedCount ?? 0, label: t('event:stat_joined') }],
          isRegistered: article.isRegistered,
          registrationEndAt: article.registrationEndAt,
          startTime: article.eventDate,
          endTime: article.eventEndDate,
        }
      : resolvedChannel === "donation"
      ? {
          channel: t('donation:channel_label'),
          title: article.title,
          organizer: article.organizer ?? "",
          date: formatDateRange(article.donationDate, article.donationEndDate),
          stats: [{ value: article.donorCount ?? 0, label: t('donation:stat_donors') }, { value: t('donation:currency_vnd', { amount: formatNumberVi(article.targetAmount ?? 0) }), label: t('donation:stat_target') }],
        }
      : null;

  const activeHeroBanner = article.thumbnailUrl || orgHeroBannerUrl;

  return (
    <Page title={article.title} meta={<meta name="description" content={`${article.title} - AlumVerse`} />}>
      <Container maxWidth={false} disableGutters sx={{ display: "flex", flexDirection: "column" }}>
        {/* Hero + absolute content frame wrapper */}
        <Box ref={heroRef} sx={{ position: "relative", top: "-1px", pt: "1px", height: { xs: "42vh", sm: "50vh", md: "62vh" }, minHeight: { xs: 300, sm: 380, md: 480 } }}>
          {/* Hero banner */}
          <ScrollReveal direction="none" duration={0.82} amount={0.05} sx={{ position: "absolute", inset: 0, top: "-1px", backgroundColor: "primary.dark", backgroundImage: activeHeroBanner ? `url(${activeHeroBanner})` : "none", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />
          {/* Main content frame */}
          <Box ref={contentRef} sx={{ position: "absolute", top: { xs: "54%", sm: "56%", md: "54%" }, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", px: { xs: 2, sm: 3 } }}>
            <ScrollRevealGroup stagger={0.09} sx={{ width: "100%", maxWidth: 1200, backgroundColor: contentFrameBg, borderRadius: 2, boxShadow: contentFrameShadow, overflow: "hidden", py: { xs: 5, md: 6 }, px: { xs: 3, sm: 4, md: 6 } }}>
              {/* Breadcrumb */}
              <ScrollRevealItem sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", mb: { xs: 4, md: 5 } }}>
                <Button startIcon={<NavigateBeforeIcon />} onClick={() => navigate(-1)} size="small" sx={{ color: "text.secondary", textTransform: "none", pl: 0 }}>
                  {t('back')}
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                {(article.url || article.linkUrl) && (
                  <Button
                    variant="outlined"
                    color="accent"
                    size="medium"
                    startIcon={<LinkIcon />}
                    onClick={() => window.open(article.url || article.linkUrl, '_blank', 'noopener,noreferrer')}
                    sx={{ textTransform: "none", fontWeight: 700 }}
                  >
                    {t('article:visit_link')}
                  </Button>
                )}
                {isAdmin && (
                  <>
                    <Button
                      variant="contained"
                      color="secondary"
                      size="medium"
                      startIcon={<EditOutlinedIcon />}
                      onClick={() => navigate(isEventArticle ? `/post/event/${id}` : `${adminBase}/article/${resolvedChannel}/${id}/edit`)}
                      sx={{ textTransform: "none", fontWeight: 700 }}
                    >
                      {isEventArticle ? t('event:edit_event') : t('article:edit_article')}
                    </Button>
                    <Button
                      variant="outlined"
                      size="medium"
                      startIcon={isEventArticle ? <EventOutlinedIcon /> : <ArticleOutlinedIcon />}
                      onClick={() => navigate(isEventArticle ? `${adminBase}/events` : `${adminBase}/article`)}
                      sx={{ textTransform: "none", fontWeight: 700 }}
                    >
                      {isEventArticle ? t('admin:manage_events') : t('admin:manage_articles')}
                    </Button>
                  </>
                )}
                {!isEventArticle && SAVE_ITEM_TYPE_BY_CHANNEL[resolvedChannel] && (
                  <SaveArticleButton itemId={Number(id)} itemType={SAVE_ITEM_TYPE_BY_CHANNEL[resolvedChannel]} />
                )}
              </ScrollRevealItem>

              {/* Title */}
              <ScrollRevealItem><Typography
                variant="h1"
                component="h1"
                fontWeight={700}
                color="primary.main"
                textAlign="center"
                sx={{
                  mt: { xs: 2, md: 3 },
                  mb: { xs: 1.5, md: 2 },
                  fontSize: { xs: "1.65rem", md: "2.1rem" },
                  lineHeight: 1.22,
                  overflowWrap: "break-word",
                  wordBreak: "normal",
                }}
              >
                {article.title}
              </Typography></ScrollRevealItem>

              {/* Author + Date */}
              {(authorName || article.updatedAt || article.createdAt || article.publishedAt) && (
                <ScrollRevealItem><Typography variant="body2" sx={{ textAlign: "center", color: "text.secondary", mb: { xs: 5, md: 6 } }}>
                  {[authorName, (article.updatedAt || article.createdAt || article.publishedAt) ? formatDate(article.updatedAt || article.createdAt || article.publishedAt) : null].filter(Boolean).join(" · ")}
                </Typography></ScrollRevealItem>
              )}

              {/* HIGHLIGHT */}
              {highlightData && (
                <ScrollRevealItem><ArticleHighlightCard
                  data={highlightData}
                  channel={resolvedChannel}
                  eventId={id}
                  isAdmin={isAdmin}
                  sharedInterest={isEventArticle ? eventInterest : null}
                  onToggleSharedInterest={isEventArticle ? toggleEventInterest : null}
                /></ScrollRevealItem>
              )}

              {/* Thumbnail */}
              {article.thumbnailUrl && (
                <ScrollRevealItem sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: { xs: 2, md: 3 }, mb: { xs: 5, md: 6 } }}>
                  <Box component="img" src={article.thumbnailUrl} alt={article.title} sx={{ display: "block", width: "100%", height: "auto", objectFit: "contain", borderRadius: 1 }} />
                  {mainImageCaption && (
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", mt: 1, fontStyle: "italic", textAlign: "center", maxWidth: "100%" }}
                    >
                      {mainImageCaption}
                    </Typography>
                  )}
                </ScrollRevealItem>
              )}

              {/* Article Content */}
              <ScrollRevealItem
                sx={{
                  ...theme.typography.body1,
                  color: "text.primary",
                  fontFamily: theme.typography.fontFamily,
                  textAlign: "justify",
                  whiteSpace: "normal",
                  overflowWrap: "normal",
                  wordBreak: "normal",
                  hyphens: "none",
                  minWidth: 0,

                  "& *": {
                    boxSizing: "border-box",
                    overflowWrap: "normal",
                    wordBreak: "normal",
                    hyphens: "none",
                  },
                  ...(theme.palette.mode === "dark" && {
                    "& span, & p, & strong, & em, & u, & s, & h1, & h2, & h3, & h4, & h5, & h6, & li, & blockquote": {
                      backgroundColor: "transparent !important",
                    },
                    "& [style*='background-color' i], & [style*='background:' i]": {
                      backgroundColor: "transparent !important",
                      background: "transparent !important",
                    },
                    "& [style*='color: rgb(0' i], & [style*='color:#000' i], & [style*='color: #000' i], & [style*='color: #000000' i], & [style*='color:#000000' i], & [style*='color:black' i], & [style*='color: black' i]": {
                      color: `${theme.palette.text.primary} !important`,
                    },
                  }),
                  "& p": {
                    ...theme.typography.body1,
                    my: 0,
                    minHeight: "1.65em",
                    textAlign: "inherit",
                  },
                  "& p.ql-empty-line": {
                    display: "block",
                    minHeight: "1.65em",
                    lineHeight: "1.65em",
                    my: 0,
                  },
                  "& p:has(> br:only-child)": {
                    minHeight: "1.65em",
                    lineHeight: "1.65em",
                    my: 0,
                  },
                  "& h1": { ...theme.typography.h1, mt: 3, mb: 1.5, textAlign: "left" },
                  "& h2": { ...theme.typography.h2, mt: 2.5, mb: 1.25, textAlign: "left" },
                  "& h3": { ...theme.typography.h3, mt: 2.25, mb: 1.1, textAlign: "left" },
                  "& h4": { ...theme.typography.h4, mt: 2, mb: 1, textAlign: "left" },
                  "& h5": { ...theme.typography.h5, mt: 1.75, mb: 0.8, textAlign: "left" },
                  "& h6": { ...theme.typography.h6, mt: 1.5, mb: 0.7, textAlign: "left" },
                  "& .ql-size-small": {
                    fontSize: theme.typography.body2.fontSize,
                    lineHeight: theme.typography.body2.lineHeight,
                  },
                  "& .ql-size-large": {
                    fontSize: theme.typography.h4.fontSize,
                    lineHeight: theme.typography.h4.lineHeight,
                    fontWeight: theme.typography.h4.fontWeight,
                  },
                  "& .ql-size-huge": {
                    fontSize: theme.typography.h2.fontSize,
                    lineHeight: theme.typography.h2.lineHeight,
                    fontWeight: theme.typography.h2.fontWeight,
                  },
                  "& .ql-align-left, & [style*='text-align: left' i]": { textAlign: "left !important" },
                  "& .ql-align-center, & [style*='text-align: center' i]": { textAlign: "center !important" },
                  "& .ql-align-right, & [style*='text-align: right' i]": { textAlign: "right !important" },
                  "& .ql-align-justify, & [style*='text-align: justify' i]": { textAlign: "justify !important" },
                  "& img, & img.rich-content-image, & img.ql-content-image": {
                    display: "block",
                    maxWidth: "100% !important",
                    width: "100% !important",
                    height: "auto !important",
                    objectFit: "contain",
                    mx: "auto",
                    my: 2,
                    borderRadius: 1,
                  },
                  "& p > span > img, & li > span > img, & h1 > span > img, & h2 > span > img, & h3 > span > img, & h4 > span > img, & h5 > span > img, & h6 > span > img": {
                    display: "inline-block !important",
                    width: "1.1em !important",
                    height: "1.1em !important",
                    maxWidth: "1.5em !important",
                    verticalAlign: "-0.2em !important",
                    objectFit: "contain",
                    mx: 0,
                    my: 0,
                    borderRadius: 0,
                  },
                  "& p.ql-image-line": {
                    minHeight: 0,
                    my: 2,
                  },
                  "& p.ql-image-line img": {
                    my: 0,
                  },
                  "& a": {
                    color: "primary.main",
                    textDecoration: "underline",
                  },
                  "& ul, & ol": {
                    pl: 3,
                    my: 1.25,
                  },
                  "& blockquote": {
                    borderLeft: "4px solid",
                    borderColor: "divider",
                    pl: 2,
                    my: 2,
                    color: "text.secondary",
                  },
                }}
                dangerouslySetInnerHTML={{ __html: cleanContent }}
              />
            </ScrollRevealGroup>

            {commentSectionProps && (
              <ScrollReveal sx={{ width: "100%", maxWidth: 1200, mx: "auto", mt: { xs: 3, md: 4 } }}>
                <CommentSection
                  {...commentSectionProps}
                  currentUserId={currentUserId}
                  currentUserName={user?.fullName || user?.name || ""}
                  currentUserAvatarUrl={user?.avatarUrl}
                  isAdmin={isAdmin}
                  canComment={canUseBasicActions}
                  sx={{ boxShadow: contentFrameShadow }}
                />
              </ScrollReveal>
            )}
          </Box>
        </Box>

        {/* Placeholder space */}
        <Box sx={{ height: placeholderHeight }} />
      </Container>
    </Page>
  );
};

export default ArticlePage;
