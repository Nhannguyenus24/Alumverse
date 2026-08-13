import LoadingSkeleton from '../../components/LoadingSkeleton';
import { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Box, Typography, Button, TextField,
  Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton,
  Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  Tab, Tabs,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AdminSectionPanel from '../../components/admin/AdminSectionPanel';
import { useSnackbar } from 'notistack';
import { AdminAiProvidersContent } from './AdminAiProvidersPage';
import useAuthStore from '../../stores/authStore';
import {
  streamFitBotResponse,
  listKnowledge,
  importKnowledge,
  deleteKnowledge,
  downloadKnowledgeFile,
} from '../../utils/fitBotApi';

const MIN_QUESTION_LENGTH = 3;

// Every FitBOT /api/knowledge/* endpoint requires a Bearer JWT (editor/admin scope).
const authHeaders = () => {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const AdminAIBotConfigPage = () => {
  const { t } = useTranslation('admin');
  const { setBreadcrumbs } = useOutletContext() || {};
  const [searchParams, setSearchParams] = useSearchParams();
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  const [question, setQuestion] = useState('');
  const [botResponse, setBotResponse] = useState(null);
  const [asking, setAsking] = useState(false);
  const trimmedQuestion = question.trim();
  const questionTooShort =
    trimmedQuestion.length > 0 && trimmedQuestion.length < MIN_QUESTION_LENGTH;

  const [viewFilename, setViewFilename] = useState(null);
  const [viewContent, setViewContent] = useState('');
  const [viewLoading, setViewLoading] = useState(false);
  const tabParam = searchParams.get('tab');
  const activeTab = ['providers'].includes(tabParam) ? tabParam : 'knowledge';

  useEffect(() => {
    if (setBreadcrumbs) {
      setBreadcrumbs([
        { label: t('nav_bot_config'), active: true },
      ]);
    }
  }, [setBreadcrumbs, t]);

  useEffect(() => {
    if (activeTab === 'knowledge') {
      fetchFiles();
    }
  }, [activeTab]);

  const handleTabChange = (_, nextTab) => {
    if (nextTab === 'knowledge') {
      setSearchParams({});
      return;
    }
    setSearchParams({ tab: nextTab });
  };

  const fetchFiles = async () => {
    setLoadingFiles(true);
    setApiError(null);
    try {
      const items = await listKnowledge({ headers: authHeaders() });
      setFiles(items);
    } catch (error) {
      console.error(error);
      setApiError(t('bot_api_connect_error'));
      setFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      await importKnowledge(file, { headers: authHeaders(), overwrite: true });
      await fetchFiles();
    } catch (error) {
      enqueueSnackbar(error.message, { variant: 'error' });
    } finally {
      setUploading(false);
      e.target.value = null; // reset input
    }
  };

  const handleDeleteFile = async (name) => {
    if (!window.confirm(t('bot_confirm_delete_file', { filename: name }))) return;
    try {
      await deleteKnowledge(name, { headers: authHeaders() });
      await fetchFiles();
    } catch (error) {
      console.error(error);
      enqueueSnackbar(error.message, { variant: 'error' });
    }
  };

  const handleViewFile = async (name) => {
    setViewFilename(name);
    setViewContent('');
    setViewLoading(true);
    try {
      const { isTextual, text } = await downloadKnowledgeFile(name, { headers: authHeaders() });
      setViewContent(isTextual ? text : t('bot_view_binary'));
    } catch (error) {
      console.error(error);
      enqueueSnackbar(t('bot_view_error'), { variant: 'error' });
      setViewFilename(null);
    } finally {
      setViewLoading(false);
    }
  };

  const handleCloseView = () => {
    setViewFilename(null);
    setViewContent('');
  };

  const handleAskBot = async () => {
    if (trimmedQuestion.length < MIN_QUESTION_LENGTH) return;
    setAsking(true);
    setBotResponse({ answer: '', sources: [] });
    try {
      const token = useAuthStore.getState().token;
      let currentAnswer = '';
      let currentSources = [];
      await streamFitBotResponse(trimmedQuestion, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        onContent: (chunk) => {
          currentAnswer += chunk;
          setBotResponse({ answer: currentAnswer, sources: currentSources });
        },
        onSources: (sources) => {
          currentSources = sources;
          setBotResponse({ answer: currentAnswer, sources: currentSources });
        },
      });
    } catch (error) {
      setBotResponse({ answer: t('bot_error_prefix') + error.message, sources: [] });
    } finally {
      setAsking(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
          {t('bot_config_title')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
          {t('bot_config_subtitle')}
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab value="knowledge" label={t('bot_config_tab_knowledge')} sx={{ textTransform: 'none', fontWeight: 700 }} />
          <Tab value="providers" label={t('bot_config_tab_providers')} sx={{ textTransform: 'none', fontWeight: 700 }} />
        </Tabs>
      </Box>

      {activeTab === 'providers' ? (
        <AdminAiProvidersContent showHeader={false} />
      ) : (
        <Stack spacing={4}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
              {t('bot_knowledge_section_title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
              {t('bot_knowledge_section_subtitle')}
            </Typography>
          </Box>

          {/* Document Management Section */}
          <AdminSectionPanel
            title={t('bot_kb_title')}
            subtitle={t('bot_kb_subtitle')}
            action={(
              <Button
                variant="contained"
                component="label"
                startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <UploadFileIcon />}
                disabled={uploading}
              >
                {t('bot_upload_btn')}
                <input type="file" hidden onChange={handleFileUpload} accept=".txt,.pdf,.md,.csv,.json" />
              </Button>
            )}
          >
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 800 }}>{t('bot_filename')}</TableCell>
                      <TableCell sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 800 }}>{t('bot_status')}</TableCell>
                      <TableCell align="right" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 800 }}>{t('col_actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingFiles ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center"><LoadingSkeleton /></TableCell>
                      </TableRow>
                    ) : apiError ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          <Typography color="error">{apiError}</Typography>
                        </TableCell>
                      </TableRow>
                    ) : files.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center">{t('bot_no_files')}</TableCell>
                      </TableRow>
                    ) : (
                      files.map((file) => (
                        <TableRow key={file.name}>
                          <TableCell>{file.name}</TableCell>
                          <TableCell>
                            <Chip
                              label={file.sync_status || 'PENDING'}
                              size="small"
                              color={
                                file.sync_status === 'SYNCED'
                                  ? 'success'
                                  : file.sync_status === 'ERROR'
                                    ? 'error'
                                    : 'default'
                              }
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton color="primary" onClick={() => handleViewFile(file.name)} title={t('bot_view_file')}>
                              <VisibilityIcon />
                            </IconButton>
                            <IconButton color="error" onClick={() => handleDeleteFile(file.name)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
          </AdminSectionPanel>

          {/* Bot Testing Section */}
          <AdminSectionPanel title={t('bot_test_title')} subtitle={t('bot_test_subtitle')}>
              <Stack direction="row" spacing={2} mb={2}>
                <Box sx={{ position: 'relative', flex: 1 }}>
                  {questionTooShort && (
                    <Typography
                      variant="caption"
                      role="alert"
                      sx={{
                        position: 'absolute',
                        left: 8,
                        bottom: 'calc(100% + 4px)',
                        zIndex: 1,
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: 'background.paper',
                        color: 'primary.main',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
                        pointerEvents: 'none',
                      }}
                    >
                      {t('bot_question_too_short')}
                    </Typography>
                  )}
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder={t('bot_question_placeholder')}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskBot()}
                    disabled={asking}
                    sx={{
                      ...(questionTooShort && {
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: 'primary.main' },
                          '&:hover fieldset': { borderColor: 'primary.main' },
                          '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                        },
                      }),
                    }}
                  />
                </Box>
                <Button
                  variant="contained"
                  onClick={handleAskBot}
                  disabled={asking || trimmedQuestion.length < MIN_QUESTION_LENGTH}
                  sx={{ minWidth: 120 }}
                >
                  {asking ? <CircularProgress size={24} color="inherit" /> : t('bot_send')}
                </Button>
              </Stack>

              {botResponse && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" color="text.secondary" mb={1}>{t('bot_answer_label')}</Typography>
                  <Box sx={{
                    '& p': { margin: '0 0 0.5em 0', '&:last-child': { margin: 0 } },
                    '& ul, & ol': { margin: '0 0 0.5em 0', paddingLeft: '1.5em' },
                    '& li': { marginBottom: '0.2em' },
                    '& table': {
                      display: 'block',
                      maxWidth: '100%',
                      overflowX: 'auto',
                      borderCollapse: 'collapse',
                      margin: '0 0 0.5em 0',
                      fontSize: '0.85rem',
                    },
                    '& th, & td': {
                      border: '1px solid',
                      borderColor: 'divider',
                      padding: (theme) => theme.spacing(0.5, 1),
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                    },
                    '& thead th': {
                      bgcolor: 'action.hover',
                    },
                    fontSize: '0.95rem',
                    lineHeight: 1.5,
                    wordWrap: 'break-word',
                  }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {botResponse.answer}
                    </ReactMarkdown>
                  </Box>

                  {botResponse.sources && botResponse.sources.length > 0 && (
                    <Box mt={2}>
                      <Typography variant="subtitle2" color="text.secondary" mb={1}>{t('bot_sources_label')}</Typography>
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        {[...new Set(botResponse.sources.map((src, i) => src.metadata?.source || `Source ${i+1}`))].map((uniqueSource, i) => (
                          <Chip key={i} label={uniqueSource} size="small" variant="outlined" />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Box>
              )}
          </AdminSectionPanel>
        </Stack>
      )}

      <Dialog open={Boolean(viewFilename)} onClose={handleCloseView} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, wordBreak: 'break-all' }}>{viewFilename}</DialogTitle>
        <DialogContent dividers>
          {viewLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <LoadingSkeleton />
            </Box>
          ) : (
            <Box
              component="pre"
              sx={{
                m: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                lineHeight: 1.5,
              }}
            >
              {viewContent}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseView}>{t('bot_view_close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminAIBotConfigPage;
