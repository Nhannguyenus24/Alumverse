import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router';
import { Box, Container, Typography, Button, Stack, CircularProgress } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Page from '../../components/Page';
import { eventApi } from '../../utils/api';

const ERROR_MESSAGES = {
  INVITATION_NOT_FOUND: 'Lời mời không tồn tại hoặc đường dẫn không hợp lệ.',
  INVITATION_ALREADY_USED: 'Lời mời này đã được xác nhận trước đó.',
  INVITATION_EXPIRED: 'Lời mời đã hết hạn (quá 7 ngày). Vui lòng liên hệ ban tổ chức để được mời lại.',
};

const EventConfirmInvitationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { slug } = useParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Thiếu thông tin xác nhận trong đường dẫn.');
      return;
    }
    eventApi
      .confirmInvitation(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        const errorCode = err?.response?.data?.errorCode;
        setErrorMessage(
          ERROR_MESSAGES[errorCode] || err?.response?.data?.message || 'Không thể xác nhận lời mời. Vui lòng thử lại sau.',
        );
        setStatus('error');
      });
  }, [token]);

  return (
    <Page title="Xác nhận tham gia sự kiện">
      <Container maxWidth="sm" sx={{ py: { xs: 8, md: 12 } }}>
        <Stack alignItems="center" spacing={3} textAlign="center">
          {status === 'processing' && (
            <>
              <CircularProgress size={48} />
              <Typography variant="h6">Đang xác nhận lời mời...</Typography>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircleOutlineIcon color="success" sx={{ fontSize: 64 }} />
              <Typography variant="h5" fontWeight={700}>Xác nhận tham gia thành công!</Typography>
              <Typography color="text.secondary">
                Vé tham dự của bạn đã được tạo. Hẹn gặp bạn tại sự kiện.
              </Typography>
              <Button variant="contained" onClick={() => navigate(`/${slug}/events`)}>
                Xem sự kiện
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <ErrorOutlineIcon color="error" sx={{ fontSize: 64 }} />
              <Typography variant="h5" fontWeight={700}>Không thể xác nhận</Typography>
              <Typography color="text.secondary">{errorMessage}</Typography>
              <Button variant="outlined" onClick={() => navigate(`/${slug}/events`)}>
                Về trang sự kiện
              </Button>
            </>
          )}
        </Stack>
      </Container>
    </Page>
  );
};

export default EventConfirmInvitationPage;
