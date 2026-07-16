import LoadingSkeleton from '../../components/LoadingSkeleton';
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import Page from "../../components/Page";
import { useArticleById } from "../../hooks/articles/useArticleById";
import DOMPurify from "dompurify";
import { formatDate, formatDateRange } from "../../utils/dateFormatter";
import { formatNumberVi } from "../../utils/numberFormatter";
import JoinEventDialog from "../../components/event/JoinEventDialog";
import { eventApi, savedItemApi } from "../../utils/api";
import { useEventQuestions, formatAnswersForApi } from "../../hooks/events/useEventQuestions";
import { useAuth } from "../../hooks/useAuth";
import { useCanContribute } from "../../hooks/useCanContribute";
import { ContributeGuardTooltip, VerificationRequiredAlert } from "../../components/ContributeGuard";
import { useOrgNavigate } from "../../hooks/useOrgNavigate";
import { findCancelableTicketForEvent, getEventRegisteredState } from "../../utils/eventRegistration";
import { extractMainImageCaption } from "../../utils/articleContentCaption";
import {
  ScrollReveal,
  ScrollRevealGroup,
  ScrollRevealItem,
} from "../../components/animations/ScrollReveal";

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

  return container.innerHTML;
};

/** Heart toggle to save ("quan tâm") an article. itemType is fixed to NEWS. */
const SaveArticleButton = ({ itemId }) => {
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
    savedItemApi
      .check("NEWS", itemId)
      .then((v) => { if (active) setSaved(Boolean(v)); })
      .catch(() => {});
    return () => { active = false; };
  }, [isAuthenticated, itemId]);

  const toggle = async () => {
    if (busy || !canContribute) return;
    setBusy(true);
    try {
      if (saved) {
        await savedItemApi.unsave("NEWS", itemId);
        setSaved(false);
        enqueueSnackbar(t('article:unsaved_article'), { variant: "info" });
      } else {
        await savedItemApi.save("NEWS", itemId);
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

const ArticleHighlightCard = ({ data, channel, eventId, isAdmin = false }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation(['common', 'article', 'event', 'donation', 'admin']);
  const { canContribute } = useCanContribute();
  const [isInterested, setIsInterested] = useState(false);
  const [isJoined, setIsJoined] = useState(() => getEventRegisteredState(data));
  const [interestedCount, setInterestedCount] = useState(data.stats?.[0]?.value ?? 0);
  const [joinedCount, setJoinedCount] = useState(data.stats?.[1]?.value ?? 0);
  const [loadingInterest, setLoadingInterest] = useState(false);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(false);
  const [openJoinDialog, setOpenJoinDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const { data: questions = [] } = useEventQuestions(eventId, !isAdmin && canContribute && channel === "event" && Boolean(eventId));

  useEffect(() => {
    if (isAdmin || channel !== "event" || !eventId) return;

    if (canContribute) {
      eventApi.checkInterest(eventId)
        .then((res) => {
          const checked = res?.isInterested ?? res?.data?.isInterested ?? false;
          setIsInterested(checked);
        })
        .catch(() => {});
      setCheckingRegistration(true);
      eventApi.checkRegistered(eventId)
        .then((res) => {
          setIsJoined(getEventRegisteredState(res));
        })
        .catch(() => {})
        .finally(() => setCheckingRegistration(false));
    } else {
      setIsInterested(false);
      setIsJoined(getEventRegisteredState(data));
      setCheckingRegistration(false);
    }

    eventApi.getEventStatisticsById(eventId)
      .then((res) => {
        if (res?.interestedCount != null) setInterestedCount(res.interestedCount);
        if (res?.registeredCount != null) setJoinedCount(res.registeredCount);
      })
      .catch(() => {});
  }, [canContribute, channel, data, eventId, isAdmin]);

  const handleInterest = async () => {
    if (loadingInterest || !canContribute) return;
    setLoadingInterest(true);
    try {
      if (isInterested) {
        await eventApi.removeInterest(eventId);
        setIsInterested(false);
        setInterestedCount((c) => Math.max(0, c - 1));
      } else {
        await eventApi.addInterest(eventId);
        setIsInterested(true);
        setInterestedCount((c) => c + 1);
      }
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || t('common:action_failed'), { variant: "error" });
    } finally {
      setLoadingInterest(false);
    }
  };

  const handleJoinClick = () => {
    if (loadingJoin || checkingRegistration || !canContribute) return;
    if (isJoined) {
      setOpenCancelDialog(true);
      return;
    }
    setOpenJoinDialog(true);
  };

  const handleConfirmJoin = async (answerMap) => {
    if (loadingJoin || checkingRegistration || isJoined || !canContribute) return;
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
    if (!cancelReason.trim() || loadingJoin || checkingRegistration || !canContribute) return;
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
        p: 5,
        bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.14 : 0.08),
        border: "1px solid",
        borderColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.28 : 0.14),
        borderRadius: 2,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: 3,
      })}
    >
      {/* LEFT */}
      <Box sx={{ flex: 1 }}>
        <Typography variant="h4" sx={{ color: "primary.main" }}>{data.channel}</Typography>
        <Typography variant="h2" sx={{ color: "primary.main" }}>{data.title}</Typography>
        <Typography variant="body1">{data.organizer}</Typography>
        <Typography variant="body2" color="text.secondary">{data.date}</Typography>
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
        {!isAdmin && channel === "donation" && <VerificationRequiredAlert sx={{ mb: 1 }} />}
        {isAdmin ? null : channel === "donation" ? (
          <ContributeGuardTooltip sx={{ width: "100%", opacity: canContribute ? 1 : 0.58, filter: canContribute ? "none" : "grayscale(0.25)" }}>
            <Button fullWidth variant="contained" color="accent" disabled={!canContribute}>{t('donation:donate_button')}</Button>
          </ContributeGuardTooltip>
        ) : (
          <Stack direction="row" spacing={1}>
            <ContributeGuardTooltip sx={{ flex: 1, opacity: canContribute ? 1 : 0.58, filter: canContribute ? "none" : "grayscale(0.25)" }}>
              <Button
                fullWidth
                variant={isInterested ? "outlined" : "contained"}
                disabled={loadingInterest || !canContribute}
                startIcon={isInterested ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                onClick={handleInterest}
              >
                {isInterested ? t('event:unmark_interested') : t('article:interest_action')}
              </Button>
            </ContributeGuardTooltip>

            <ContributeGuardTooltip sx={{ flex: 1, opacity: canContribute ? 1 : 0.58, filter: canContribute ? "none" : "grayscale(0.25)" }}>
              <Button
                fullWidth
                variant={isJoined ? "outlined" : "contained"}
                color={isJoined ? "error" : "accent"}
                disabled={loadingJoin || checkingRegistration || !canContribute}
                onClick={handleJoinClick}
                startIcon={isJoined ? <CancelOutlinedIcon /> : <EventAvailableOutlinedIcon />}
              >
                {isJoined ? t('event:cancel_ticket') : t('event:register_action')}
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
            startIcon={<CancelOutlinedIcon />}
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
  const { channel, id } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const { user } = useAuth();
  const loadErrorShownRef = useRef(false);
  const { article, isPending, isError, errorMessage } = useArticleById(channel, id);

  const { cleanContent, mainImageCaption } = useMemo(() => {
    const parsedContent = extractMainImageCaption(article?.content ?? "");
    return {
      cleanContent: normalizeArticleHtml(parsedContent.content ? DOMPurify.sanitize(parsedContent.content) : ""),
      mainImageCaption: parsedContent.caption,
    };
  }, [article]);
  
  const navigate = useOrgNavigate();
  const contentRef = useRef(null);
  const heroRef = useRef(null);
  const [placeholderHeight, setPlaceholderHeight] = useState(600);
  const isAdmin = user?.role === "ADMIN";
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

  if (isPending) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <LoadingSkeleton />
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

  const highlightData =
    resolvedChannel === "event"
      ? {
          channel: t('event:channel_label'),
          title: article.title,
          organizer: article.organizer ?? article.location ?? "",
          date: formatDateRange(article.eventDate, article.eventEndDate),
          stats: [{ value: article.interestedCount ?? 0, label: t('article:stat_interested') }, { value: article.joinedCount ?? 0, label: t('event:stat_joined') }],
          isRegistered: article.isRegistered,
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
  
  return (
    <Page title={article.title} meta={<meta name="description" content={`${article.title} - AlumVerse`} />}>
      <Container maxWidth={false} disableGutters sx={{ display: "flex", flexDirection: "column" }}>
        {/* Hero + absolute content frame wrapper */}
        <Box ref={heroRef} sx={{ position: "relative", top: "-1px", pt: "1px", height: { xs: "42vh", sm: "50vh", md: "62vh" }, minHeight: { xs: 300, sm: 380, md: 480 } }}>
          {/* Hero banner */}
          <ScrollReveal direction="none" duration={0.82} amount={0.05} sx={{ position: "absolute", inset: 0, top: "-1px", backgroundColor: "primary.dark", backgroundImage: article.thumbnailUrl ? `url(${article.thumbnailUrl})` : "none", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />
          {/* Main content frame */}
          <Box ref={contentRef} sx={{ position: "absolute", top: { xs: "54%", sm: "56%", md: "54%" }, left: 0, right: 0, display: "flex", justifyContent: "center", px: { xs: 2, sm: 3 } }}>
            <ScrollRevealGroup stagger={0.09} sx={{ width: "100%", maxWidth: 1200, backgroundColor: contentFrameBg, borderRadius: 2, boxShadow: contentFrameShadow, overflow: "hidden", py: { xs: 5, md: 6 }, px: { xs: 3, sm: 4, md: 6 } }}>
              {/* Breadcrumb */}
              <ScrollRevealItem sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: { xs: 4, md: 5 } }}>
                <Button startIcon={<NavigateBeforeIcon />} onClick={() => navigate(-1)} size="small" sx={{ color: "text.secondary", textTransform: "none", pl: 0 }}>
                  {t('back')}
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                {isAdmin && (
                  <>
                    <Button
                      variant="contained"
                      color="secondary"
                      size="medium"
                      startIcon={<EditOutlinedIcon />}
                      onClick={() => navigate(isEventArticle ? `/post/event/${id}` : `/admin/article/${resolvedChannel}/${id}/edit`)}
                      sx={{ textTransform: "none", fontWeight: 700 }}
                    >
                      {isEventArticle ? t('event:edit_event') : t('article:edit_article')}
                    </Button>
                    <Button
                      variant="outlined"
                      size="medium"
                      startIcon={isEventArticle ? <EventOutlinedIcon /> : <ArticleOutlinedIcon />}
                      onClick={() => navigate(isEventArticle ? "/admin/events" : "/admin/article")}
                      sx={{ textTransform: "none", fontWeight: 700 }}
                    >
                      {isEventArticle ? t('admin:manage_events') : t('admin:manage_articles')}
                    </Button>
                  </>
                )}
                <SaveArticleButton itemId={Number(id)} />
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

              {/* Date */}
              {article.publishedAt && (
                <ScrollRevealItem><Typography variant="body2" sx={{ textAlign: "center", color: "text.secondary", mb: (article.url || article.linkUrl) ? 2 : { xs: 5, md: 6 } }}>
                  {formatDate(article.publishedAt)}
                </Typography></ScrollRevealItem>
              )}

              {/* URL / External Link */}
              {(article.url || article.linkUrl) && (
                <ScrollRevealItem sx={{ display: "flex", justifyContent: "center", mb: { xs: 5, md: 6 } }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<LinkIcon />}
                    onClick={() => window.open(article.url || article.linkUrl, '_blank', 'noopener,noreferrer')}
                  >
                    {t('article:visit_link')}
                  </Button>
                </ScrollRevealItem>
              )}

              {/* HIGHLIGHT */}
              {highlightData && (
                <ScrollRevealItem><ArticleHighlightCard data={highlightData} channel={resolvedChannel} eventId={id} isAdmin={isAdmin} /></ScrollRevealItem>
              )}

              {/* Thumbnail */}
              {article.thumbnailUrl && (
                <ScrollRevealItem sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: { xs: 2, md: 3 }, mb: { xs: 5, md: 6 } }}>
                  <Box component="img" src={article.thumbnailUrl} alt={article.title} sx={{ width: { xs: "100%", md: "72%" }, aspectRatio: "16 / 10", objectFit: "cover", borderRadius: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }} />
                  {mainImageCaption && (
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", mt: 1, fontStyle: "italic", textAlign: "center", maxWidth: { xs: "100%", md: "72%" } }}
                    >
                      {mainImageCaption}
                    </Typography>
                  )}
                </ScrollRevealItem>
              )}

              {/* Article Content */}
              <ScrollRevealItem
                sx={(theme) => ({
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
                    my: 1.25,
                    textAlign: "justify",
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
                  "& .ql-align-left": { textAlign: "left" },
                  "& .ql-align-center": { textAlign: "center" },
                  "& .ql-align-right": { textAlign: "right" },
                  "& .ql-align-justify": { textAlign: "justify" },
                  "& img": {
                    maxWidth: "100%",
                    height: "auto",
                  },
                  "& img + p, & p:has(img) + p": {
                    color: "text.secondary",
                    fontSize: theme.typography.caption.fontSize,
                    fontStyle: "italic",
                    textAlign: "center",
                    mt: 0.75,
                    mb: 2,
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
                })}
                dangerouslySetInnerHTML={{ __html: cleanContent }}
              />
            </ScrollRevealGroup>
          </Box>
        </Box>

        {/* Placeholder space */}
        <Box sx={{ height: placeholderHeight }} />
      </Container>
    </Page>
  );
};

export default ArticlePage;
