import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Box, Typography, Button, Tabs, Tab, Paper, Stack, Divider, Chip, CircularProgress,
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination, Dialog, DialogTitle,
  DialogContent, IconButton, Tooltip, Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { surveyApi } from '../../utils/api';
import { useNotification } from '../../hooks/useNotification';
import { formatDateTime } from '../../utils/dateFormatter';
import { isChoiceType } from '../../constants/surveyQuestionTypes';

const CHART_COLOR = '#4f8df9';

const QuestionSummaryCard = ({ q, t }) => (
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
    <Typography variant="subtitle1" fontWeight={700}>{q.text}</Typography>
    <Typography variant="caption" color="text.secondary">{q.type}</Typography>
    <Divider sx={{ my: 1.5 }} />

    {q.optionCounts && (
      <Box sx={{ width: '100%', height: Math.max(120, q.optionCounts.length * 44) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={q.optionCounts} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="optionText" width={140} tick={{ fontSize: 12 }} />
            <RTooltip />
            <Bar dataKey="count" fill={CHART_COLOR} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    )}

    {q.numericStats && (
      <Stack direction="row" spacing={3}>
        <Box><Typography variant="caption" color="text.secondary">{t('survey:stat_count')}</Typography>
          <Typography variant="h6">{q.numericStats.count}</Typography></Box>
        <Box><Typography variant="caption" color="text.secondary">{t('survey:stat_avg')}</Typography>
          <Typography variant="h6">{q.numericStats.average?.toFixed(2)}</Typography></Box>
        <Box><Typography variant="caption" color="text.secondary">{t('survey:stat_min')}</Typography>
          <Typography variant="h6">{q.numericStats.min}</Typography></Box>
        <Box><Typography variant="caption" color="text.secondary">{t('survey:stat_max')}</Typography>
          <Typography variant="h6">{q.numericStats.max}</Typography></Box>
      </Stack>
    )}

    {q.textAnswers && (
      q.textAnswers.length === 0
        ? <Typography variant="body2" color="text.disabled">{t('survey:no_answers')}</Typography>
        : (
          <Stack spacing={0.5} sx={{ maxHeight: 220, overflow: 'auto' }}>
            {q.textAnswers.map((a, i) => (
              <Typography key={i} variant="body2" sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                {a}
              </Typography>
            ))}
          </Stack>
        )
    )}
  </Paper>
);

const AdminSurveyResultsPage = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(['survey', 'common']);
  const { showError, showSuccess } = useNotification();

  const [tab, setTab] = useState(0);
  const [survey, setSurvey] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const [subs, setSubs] = useState([]);
  const [subTotal, setSubTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [detail, setDetail] = useState(null);

  const [insight, setInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [s, sum] = await Promise.all([
          surveyApi.getAdminSurvey(surveyId),
          surveyApi.getSummary(surveyId),
        ]);
        setSurvey(s);
        setSummary(sum);
      } catch (e) {
        showError(e?.response?.data?.message || t('common:error_occurred'));
      } finally {
        setLoading(false);
      }
    })();
  }, [surveyId, showError, t]);

  const fetchSubs = useCallback(async () => {
    try {
      const data = await surveyApi.getSubmissions(surveyId, { page, size: pageSize });
      setSubs(data?.items || []);
      setSubTotal(data?.totalItem ?? 0);
    } catch (e) {
      showError(e?.response?.data?.message || t('common:error_occurred'));
    }
  }, [surveyId, page, pageSize, showError, t]);

  useEffect(() => { if (tab === 1) fetchSubs(); }, [tab, fetchSubs]);

  const optionLabel = (question, value) => {
    if (!question?.options) return String(value);
    const opt = question.options.find((o) => o.id === value);
    return opt ? opt.text : String(value);
  };

  const answerToText = (question, ans) => {
    if (ans == null) return '';
    if (Array.isArray(ans)) return ans.map((v) => optionLabel(question, v)).join(', ');
    if (isChoiceType(question?.type)) return optionLabel(question, ans);
    return String(ans);
  };

  const handleExport = async () => {
    try {
      const XLSX = await import('xlsx');
      // Fetch all submissions (not just current page)
      const first = await surveyApi.getSubmissions(surveyId, { page: 0, size: 1000 });
      const all = first?.items || [];
      const questions = survey?.questions || [];
      const header = ['#', t('survey:respondent'), 'Email', t('survey:submitted_at'),
        ...questions.map((q) => q.text)];
      const rows = all.map((sub, idx) => [
        idx + 1,
        sub.memberName || '',
        sub.memberEmail || '',
        sub.submittedAt ? formatDateTime(sub.submittedAt) : '',
        ...questions.map((q) => answerToText(q, sub.answers?.[q.id])),
      ]);
      const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Responses');
      XLSX.writeFile(wb, `survey_${surveyId}_responses.xlsx`);
      showSuccess(t('survey:export_success'));
    } catch (e) {
      showError(e?.message || t('common:error_occurred'));
    }
  };

  const handleInsight = async () => {
    setInsightLoading(true);
    try {
      const data = await surveyApi.getInsight(surveyId);
      setInsight(data);
    } catch (e) {
      showError(e?.response?.data?.message || t('common:error_occurred'));
    } finally {
      setInsightLoading(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate(-1)}><ArrowBackIcon /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={800}>{survey?.title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('survey:total_responses')}: {summary?.totalSubmissions ?? 0}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<FileDownloadOutlinedIcon />} onClick={handleExport}>
          {t('survey:export_excel')}
        </Button>
        <Button variant="contained" startIcon={<AutoAwesomeOutlinedIcon />}
          onClick={handleInsight} disabled={insightLoading}>
          {insightLoading ? t('common:loading') : t('survey:ai_insight')}
        </Button>
      </Stack>

      {insight && (
        <Alert severity={insight.generatedByAi ? 'success' : 'info'} sx={{ mb: 2, whiteSpace: 'pre-line' }}
          onClose={() => setInsight(null)}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            {t('survey:ai_insight')} {insight.generatedByAi ? '' : `(${t('survey:ai_fallback')})`}
          </Typography>
          {insight.insight}
        </Alert>
      )}

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={t('survey:tab_summary')} />
        <Tab label={t('survey:tab_respondents')} />
      </Tabs>

      {tab === 0 && (
        <Stack spacing={2}>
          {(summary?.questions || []).map((q) => (
            <QuestionSummaryCard key={q.questionId} q={q} t={t} />
          ))}
          {(summary?.questions || []).length === 0 && (
            <Typography color="text.secondary">{t('survey:no_data')}</Typography>
          )}
        </Stack>
      )}

      {tab === 1 && (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>{t('survey:respondent')}</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>{t('survey:submitted_at')}</TableCell>
                <TableCell align="right">{t('common:actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subs.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography color="text.disabled">{t('survey:no_data')}</Typography>
                </TableCell></TableRow>
              ) : subs.map((s, idx) => (
                <TableRow key={s.id} hover>
                  <TableCell>{page * pageSize + idx + 1}</TableCell>
                  <TableCell>{s.memberName || t('survey:anonymous')}</TableCell>
                  <TableCell>{s.memberEmail || '—'}</TableCell>
                  <TableCell>{s.submittedAt ? formatDateTime(s.submittedAt) : '—'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title={t('survey:view_answers')}>
                      <IconButton size="small" onClick={() => setDetail(s)}>
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={subTotal}
            page={page}
            rowsPerPage={pageSize}
            onPageChange={(e, p) => setPage(p)}
            onRowsPerPageChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </Paper>
      )}

      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{detail?.memberName || t('survey:anonymous')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {(survey?.questions || []).map((q) => (
              <Box key={q.id}>
                <Typography variant="subtitle2" fontWeight={700}>{q.text}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {answerToText(q, detail?.answers?.[q.id]) || '—'}
                </Typography>
              </Box>
            ))}
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AdminSurveyResultsPage;
