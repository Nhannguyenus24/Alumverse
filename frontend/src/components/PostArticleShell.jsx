import { Box, Button, Container, Typography } from '@mui/material';
import Page from './Page';
import CoverUpload from './CoverUpload';

/**
 * Shared layout shell for all PostArticle pages.
 * Renders the Page wrapper, cover upload area, card container,
 * title, children (the form), and Cancel/Submit action buttons.
 */
const PostArticleShell = ({
  pageTitle,
  pageDescription,
  coverPreview,
  onCoverChange,
  onCancel,
  onSubmit,
  isPending,
  submitLabel = 'Đăng bài',
  pendingLabel = 'Đang đăng...',
  children,
}) => (
  <Page
    title={pageTitle}
    meta={<meta name="description" content={pageDescription ?? `${pageTitle} - AlumVerse`} />}
  >
    <Box sx={{ minHeight: '100vh' }}>
      <CoverUpload value={coverPreview} onChange={onCoverChange} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 10 }}>
        <Box
          sx={{
            width: { xs: '100%', md: '85%', lg: '75%' },
            mx: 'auto',
            mt: -10,
            mb: 6,
            backgroundColor: 'background.paper',
            borderRadius: 2,
            boxShadow: (theme) => theme.customShadows?.z24 || 10,
            p: { xs: 3, md: 5 },
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography
            variant="h1"
            fontWeight={800}
            color="primary.main"
            sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' }, textAlign: 'center', mb: 3 }}
          >
            ĐĂNG BÀI
          </Typography>

          {children}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2, mt: 3 }}>
            <Button variant="outlined" color="inherit" onClick={onCancel} sx={{ px: 4 }}>
              Huỷ
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={onSubmit}
              disabled={isPending}
              sx={{ px: 4 }}
            >
              {isPending ? pendingLabel : submitLabel}
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  </Page>
);

export default PostArticleShell;
