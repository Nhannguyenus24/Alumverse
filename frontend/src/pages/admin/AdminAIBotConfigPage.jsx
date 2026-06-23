import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Box, Card, CardContent, Typography, Button, TextField,
  Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, CircularProgress,
  Chip, Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';

const FITBOT_API_URL = '/ngrok-api';

const AdminAIBotConfigPage = () => {
  const { t } = useTranslation('admin');
  const { setBreadcrumbs } = useOutletContext() || {};
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [apiError, setApiError] = useState(null);

  const [question, setQuestion] = useState('');
  const [botResponse, setBotResponse] = useState(null);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    if (setBreadcrumbs) {
      setBreadcrumbs([
        { label: t('breadcrumb_admin'), path: '../' },
        { label: t('nav_bot_config') },
      ]);
    }
    fetchFiles();
  }, [setBreadcrumbs]);

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
    setUploadError(null);
    try {
      const res = await fetch(`${FITBOT_API_URL}/api/files/upload?ingest=true`, {
        method: 'POST',
        headers: { 'ngrok-skip-browser-warning': 'true' },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      await fetchFiles();
    } catch (error) {
      setUploadError(error.message);
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

  const handleAskBot = async () => {
    if (!question.trim()) return;
    setAsking(true);
    setBotResponse(null);
    try {
      const res = await fetch(`${FITBOT_API_URL}/api/query`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ question, top_k: 7, model: "gemini-2.5-flash", use_reranker: false })
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setBotResponse(data);
    } catch (error) {
      setBotResponse({ answer: t('bot_error_prefix') + error.message });
    } finally {
      setAsking(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <SmartToyOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <Typography variant="h4" fontWeight={700}>
          {t('bot_config_title')}
        </Typography>
      </Box>

      <Stack spacing={4}>
        {/* Document Management Section */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>{t('bot_kb_title')}</Typography>
              <Button
                variant="contained"
                component="label"
                startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <UploadFileIcon />}
                disabled={uploading}
              >
                {t('bot_upload_btn')}
                <input type="file" hidden onChange={handleFileUpload} accept=".txt,.pdf,.md,.csv,.json" />
              </Button>
            </Box>
            
            {uploadError && <Alert severity="error" sx={{ mb: 2 }}>{uploadError}</Alert>}

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell>{t('bot_filename')}</TableCell>
                    <TableCell align="right">{t('col_actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingFiles ? (
                    <TableRow>
                      <TableCell colSpan={2} align="center"><CircularProgress size={24} /></TableCell>
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
                      <TableRow key={file}>
                        <TableCell>{file}</TableCell>
                        <TableCell align="right">
                          <IconButton color="error" onClick={() => handleDeleteFile(file)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Bot Testing Section */}
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} mb={2}>{t('bot_test_title')}</Typography>
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
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {botResponse.answer}
                </Typography>
                
                {botResponse.sources && botResponse.sources.length > 0 && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" color="text.secondary" mb={1}>{t('bot_sources_label')}</Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {botResponse.sources.map((src, i) => (
                        <Chip key={i} label={src.metadata?.source || `Source ${i+1}`} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};

export default AdminAIBotConfigPage;
