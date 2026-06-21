import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import {
  Box, Card, CardContent, Typography, Button, TextField,
  Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, CircularProgress,
  Chip, Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';

const FITBOT_API_URL = 'http://localhost:8000';

const AdminAIBotConfigPage = () => {
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
        { label: 'Trang chủ admin', path: '../' },
        { label: 'Cấu hình AI Bot' },
      ]);
    }
    fetchFiles();
  }, [setBreadcrumbs]);

  const fetchFiles = async () => {
    setLoadingFiles(true);
    setApiError(null);
    try {
      const res = await fetch(`${FITBOT_API_URL}/api/files`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error(error);
      setApiError('Không thể kết nối đến Bot API. Vui lòng kiểm tra lại server FitBOT.');
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
    if (!window.confirm(`Bạn có chắc muốn xóa file ${filename}?`)) return;
    try {
      const res = await fetch(`${FITBOT_API_URL}/api/files/${filename}`, {
        method: 'DELETE',
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, top_k: 7, model: "gemini-2.5-flash", use_reranker: false })
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setBotResponse(data);
    } catch (error) {
      setBotResponse({ answer: 'Có lỗi xảy ra: ' + error.message });
    } finally {
      setAsking(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <SmartToyOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <Typography variant="h4" fontWeight={700}>
          Cấu hình & Test AI Bot
        </Typography>
      </Box>

      <Stack spacing={4}>
        {/* Document Management Section */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>Quản lý tài liệu (Knowledge Base)</Typography>
              <Button
                variant="contained"
                component="label"
                startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <UploadFileIcon />}
                disabled={uploading}
              >
                Tải lên & Index
                <input type="file" hidden onChange={handleFileUpload} accept=".txt,.pdf,.md,.csv,.json" />
              </Button>
            </Box>
            
            {uploadError && <Alert severity="error" sx={{ mb: 2 }}>{uploadError}</Alert>}

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell>Tên file</TableCell>
                    <TableCell align="right">Hành động</TableCell>
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
                      <TableCell colSpan={2} align="center">Chưa có tài liệu nào.</TableCell>
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
            <Typography variant="h6" fontWeight={600} mb={2}>Kiểm tra Bot (Test Query)</Typography>
            <Stack direction="row" spacing={2} mb={2}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Nhập câu hỏi để test bot..."
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
                {asking ? <CircularProgress size={24} color="inherit" /> : 'Gửi'}
              </Button>
            </Stack>

            {botResponse && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" color="text.secondary" mb={1}>Trả lời:</Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {botResponse.answer}
                </Typography>
                
                {botResponse.sources && botResponse.sources.length > 0 && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" color="text.secondary" mb={1}>Nguồn tham khảo:</Typography>
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
