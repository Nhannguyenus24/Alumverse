import { useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Container,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import Page from '../../components/Page';
import WYSIWYG from '../../components/WYSIWYG';
import { useAuth } from '../../hooks/useAuth';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';

const RequestAchievementsPage = () => {
  const navigate = useOrgNavigate();
  const { t } = useTranslation('honors');
  const { verificationLevel } = useAuth();
  // Only org-verified alumni (verification level >= 2) may submit achievement requests.
  const canRequest = (verificationLevel ?? 0) >= 2;

  const [image, setImage] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [proofLink, setProofLink] = useState('');

  const handleCancel = () => {
    navigate('/honors');
  };

  const handleSubmit = () => {
    if (!canRequest) return;
    navigate('/honors');
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  return (
    <Page
      title={t('request_page_title')}
      meta={<meta name="description" content={t('request_meta_desc')} />}
    >
      {/* PAGE BACKGROUND */}
      <Box sx={{ minHeight: '100vh' }}>

        {/* COVER SECTION */}
        <Box
          sx={{
            height: 220,
            backgroundColor: 'primary.main',
          }}
        />

        {/* MAIN CONTENT WRAPPER */}
        <Container maxWidth="lg">

          {/* FLOATING CARD */}
          <Box
            sx={{
              width: { xs: '100%', md: '70%' },
              mx: 'auto',
              mt: -12,
              mb: 6,
              backgroundColor: '#fff',
              borderRadius: 3,
              boxShadow: 3,
              p: { xs: 3, md: 4 },
            }}
          >

            {/* TITLE */}
            <Typography
                variant="h1"
                fontWeight={800}
                color="primary.main"
                sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' }, textAlign: 'center', mb: 3 }}
            >
                {t('request_heading')}
            </Typography>

            {/* DESCRIPTION */}
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {t('request_description')}
            </Typography>

            {!canRequest && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                {t('warn_alumni_verification_required')}
              </Alert>
            )}

            {/* POST SECTION */}
            <Stack spacing={2}>

              {/* TITLE INPUT */}
              <TextField
                fullWidth
                variant="standard"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('request_title_placeholder')}
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    fontSize: '1.15rem',
                    fontWeight: 600,
                    pb: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  },
                }}
              />

            {/* CONTENT INPUT */}
              <Box sx={{ pb: { xs: 8, md: 4 } }}>
                <WYSIWYG
                  value={content}
                  onChange={setContent}
                  placeholder={t('request_content_placeholder')}
                  height={400}
                />
              </Box>

              {/* PROOF LINK INPUT */}
              <TextField
                fullWidth
                variant="outlined"
                value={proofLink}
                onChange={(e) => setProofLink(e.target.value)}
                placeholder={t('request_proof_link_placeholder')}

              />

              {/* IMAGE UPLOAD */}
              <Box>
                <Button variant="outlined" component="label">
                  {t('request_upload_image')}
                  <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                </Button>
                {image && (
                  <Box sx={{ mt: 2 }}>
                    <img src={image} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
                  </Box>
                )}
              </Box>

              {/* ACTION BUTTONS */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 1,
                  pt: 4,
                }}
              >
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleCancel}
                >
                  {t('request_cancel')}
                </Button>

                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={!canRequest}
                >
                  {t('request_submit')}
                </Button>
              </Box>

            </Stack>
          </Box>
        </Container>
      </Box>
    </Page>
  );
};

export default RequestAchievementsPage;
