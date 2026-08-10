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
import AdminFitBotKnowledgeContent from './AdminFitBotKnowledgePage';
import apiClient from '../../utils/axios';
import useAuthStore from '../../stores/authStore';

const FITBOT_API_URL = import.meta.env.VITE_FITBOT_API_URL;

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

  const [viewFilename, setViewFilename] = useState(null);
  const [viewContent, setViewContent] = useState('');
  const [viewLoading, setViewLoading] = useState(false);
  const tabParam = searchParams.get('tab');
  const activeTab = ['knowledge-db', 'providers'].includes(tabParam) ? tabParam : 'knowledge';

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
      const res = await fetch(`${FITBOT_API_URL}/api/files`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setFiles(data.files || []);
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

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await fetch(`${FITBOT_API_URL}/api/files/upload?ingest=true`, {
        method: 'POST',
        headers: { 'ngrok-skip-browser-warning': 'true' },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      await fetchFiles();
    } catch (error) {
      enqueueSnackbar(error.message, { variant: 'error' });
    } finally {
      setUploading(false);
      e.target.value = null; // reset input
    }
  };

  const handleDeleteFile = async (filename) => {
    if (!window.confirm(t('bot_confirm_delete_file', { filename }))) return;
    try {
      const res = await fetch(`${FITBOT_API_URL}/api/files/${filename}`, {
        method: 'DELETE',
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      if (res.ok) {
        await fetchFiles();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleViewFile = async (filename) => {
    setViewFilename(filename);
    setViewContent('');
    setViewLoading(true);
    try {
      const res = await fetch(`${FITBOT_API_URL}/api/files/${filename}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        setViewContent(data.content ?? data.text ?? JSON.stringify(data, null, 2));
      } else {
        setViewContent(await res.text());
      }
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
    if (!question.trim()) return;
    setAsking(true);
    setBotResponse({ answer: '', sources: [] });
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`${FITBOT_API_URL}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          question,
          top_k: 7,
          model: 'gemini-2.5-flash',
          use_reranker: false,
        })
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let buffer = '';
      let currentAnswer = '';
      let currentSources = [];

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          let newlineIndex;
          while ((newlineIndex = buffer.indexOf('\n\n')) >= 0) {
            const eventStr = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 2);
            
            const lines = eventStr.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim();
                if (dataStr === '[DONE]') {
                  done = true;
                  break;
                }
                try {
                  const data = JSON.parse(dataStr);
                  if (data.answer) {
                    currentAnswer += data.answer;
                    setBotResponse({ answer: currentAnswer, sources: currentSources });
                  }
                  if (data.sources) {
                    currentSources = data.sources;
                    setBotResponse({ answer: currentAnswer, sources: currentSources });
                  }
                } catch (e) {
                  // Ignore JSON parse errors for incomplete data chunks just in case
                  console.warn('Failed to parse SSE data', e, dataStr);
                }
              }
            }
          }
        }
      }
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
          <Tab value="knowledge-db" label={t('bot_config_tab_knowledge_db')} sx={{ textTransform: 'none', fontWeight: 700 }} />
          <Tab value="providers" label={t('bot_config_tab_providers')} sx={{ textTransform: 'none', fontWeight: 700 }} />
        </Tabs>
      </Box>

      {activeTab === 'providers' ? (
        <AdminAiProvidersContent showHeader={false} />
      ) : activeTab === 'knowledge-db' ? (
        <AdminFitBotKnowledgeContent />
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
                      <TableCell align="right" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 800 }}>{t('col_actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingFiles ? (
                      <TableRow>
                        <TableCell colSpan={2} align="center"><LoadingSkeleton /></TableCell>
                      </TableRow>
                    ) : apiError ? (
                      <TableRow>
                        <TableCell colSpan={2} align="center">
                          <Typography color="error">{apiError}</Typography>
                        </TableCell>
                      </TableRow>
                    ) : files.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} align="center">{t('bot_no_files')}</TableCell>
                      </TableRow>
                    ) : (
                      files.map((file) => (
                        <TableRow key={file.filename}>
                          <TableCell>{file.filename}</TableCell>
                          <TableCell align="right">
                            <IconButton color="primary" onClick={() => handleViewFile(file.filename)} title={t('bot_view_file')}>
                              <VisibilityIcon />
                            </IconButton>
                            <IconButton color="error" onClick={() => handleDeleteFile(file.filename)}>
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
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder={t('bot_question_placeholder')}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskBot()}
                  disabled={asking}
                />
                <Button
                  variant="contained"
                  onClick={handleAskBot}
                  disabled={asking || !question.trim()}
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
