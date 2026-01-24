import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import Page from '../components/Page';
import Breadcrumb from '../components/Breadcrumb';
import Chart from '../components/Chart';
import ConfirmDialog from '../components/ConfirmDialog';
import ConsentDialog from '../components/ConsentDialog';
import EmojiPicker from '../components/EmojiPicker';
import LoadingScreen from '../components/LoadingScreen';
import Logo from '../components/Logo';
import ProgressBar from '../components/ProgressBar';
import ReCaptcha from '../components/ReCaptcha';
import Scrollbar from '../components/Scrollbar';
import Table from '../components/Table';
import WYSIWYG from '../components/WYSIWYG';

import { useNotification } from '../hooks/useNotification';

const SECTIONS = [
  { id: 'logo', label: 'Logo' },
  { id: 'breadcrumb', label: 'Breadcrumb' },
  { id: 'notistack', label: 'Notistack' },
  { id: 'progress', label: 'ProgressBar' },
  { id: 'loading', label: 'LoadingScreen' },
  { id: 'scrollbar', label: 'Scrollbar' },
  { id: 'table', label: 'Table + Pagination' },
  { id: 'chart', label: 'Chart' },
  { id: 'dialogs', label: 'Dialogs' },
  { id: 'emoji', label: 'EmojiPicker' },
  { id: 'wysiwyg', label: 'WYSIWYG' },
  { id: 'recaptcha', label: 'reCAPTCHA v2' },
  { id: 'error-pages', label: 'Error Pages' },
];

function Section({ id, title, description, children }) {
  return (
    <Box id={id} sx={{ scrollMarginTop: 96 }}>
      <Stack spacing={1} sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {description ? (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        ) : null}
      </Stack>
      <Card variant="outlined">
        <CardContent>{children}</CardContent>
      </Card>
    </Box>
  );
}

export default function UiPlaygroundPage() {
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning, showInfo } = useNotification();

  const [filter, setFilter] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);

  const [loadingOpen, setLoadingOpen] = useState(false);

  const [emojiAnchor, setEmojiAnchor] = useState(null);

  const [wysiwygValue, setWysiwygValue] = useState('<p>Hello UI playground!</p>');

  const [tablePage, setTablePage] = useState(0);
  const [tableRowsPerPage, setTableRowsPerPage] = useState(5);

  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState(null);

  const filteredSections = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return SECTIONS;
    return SECTIONS.filter((s) => s.label.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
  }, [filter]);

  const tableColumns = useMemo(
    () => [
      { id: 'id', label: 'ID', align: 'left' },
      { id: 'name', label: 'Name', align: 'left' },
      { id: 'status', label: 'Status', align: 'left' },
    ],
    []
  );

  const allRows = useMemo(
    () =>
      Array.from({ length: 42 }).map((_, i) => ({
        id: i + 1,
        name: `Row ${i + 1}`,
        status: i % 3 === 0 ? 'Active' : i % 3 === 1 ? 'Pending' : 'Disabled',
      })),
    []
  );

  const pagedRows = useMemo(() => {
    const start = tablePage * tableRowsPerPage;
    return allRows.slice(start, start + tableRowsPerPage);
  }, [allRows, tablePage, tableRowsPerPage]);

  const chartData = useMemo(
    () => [
      { name: 'Mon', value: 12 },
      { name: 'Tue', value: 18 },
      { name: 'Wed', value: 9 },
      { name: 'Thu', value: 24 },
      { name: 'Fri', value: 14 },
      { name: 'Sat', value: 20 },
      { name: 'Sun', value: 16 },
    ],
    []
  );

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const triggerLoading = () => {
    setLoadingOpen(true);
    window.setTimeout(() => setLoadingOpen(false), 900);
  };

  return (
    <Page
      title="UI Playground"
      meta={<meta name="description" content="Quick UI preview for common components" />}
      sx={{ p: 3 }}
    >
      {loadingOpen ? <LoadingScreen message="Preview loading..." /> : null}

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper variant="outlined" sx={{ position: { md: 'sticky' }, top: { md: 16 }, p: 2 }}>
            <Stack spacing={2}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Quick nav
              </Typography>

              <TextField
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter components..."
                size="small"
              />

              <Divider />

              <List dense disablePadding>
                {filteredSections.map((s) => (
                  <ListItemButton key={s.id} onClick={() => scrollTo(s.id)}>
                    <ListItemText primary={s.label} />
                  </ListItemButton>
                ))}
              </List>

              <Divider />

              <Stack spacing={1}>
                <Button variant="contained" onClick={triggerLoading}>
                  Show LoadingScreen
                </Button>
                <Button variant="outlined" onClick={() => scrollTo('recaptcha')}>
                  Jump to reCAPTCHA
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={9}>
          <Stack spacing={3}>
            <Section id="logo" title="Logo" description="Basic rendering / sizing.">
              <Stack spacing={2}>
                <Logo size="small" />
                <Logo size="medium" />
                <Logo size="large" />
              </Stack>
            </Section>

            <Section id="breadcrumb" title="Breadcrumb (max 3 levels)" description="Pass 4 items to verify it truncates to the last 3.">
              <Breadcrumb
                items={[
                  { label: 'Home', path: '/' },
                  { label: 'Section', path: '/dashboard' },
                  { label: 'Sub', path: '/ui' },
                  { label: 'Current' },
                ]}
              />
              <Alert severity="info" sx={{ mt: 2 }}>
                If you click a breadcrumb link, it should navigate.
              </Alert>
            </Section>

            <Section id="notistack" title="Notistack" description="Quick toast preview via useNotification hook.">
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap">
                <Button variant="contained" onClick={() => showSuccess('Success toast')}>
                  Success
                </Button>
                <Button variant="contained" color="error" onClick={() => showError('Error toast')}>
                  Error
                </Button>
                <Button variant="contained" color="warning" onClick={() => showWarning('Warning toast')}>
                  Warning
                </Button>
                <Button variant="contained" color="info" onClick={() => showInfo('Info toast')}>
                  Info
                </Button>
              </Stack>
            </Section>

            <Section id="progress" title="ProgressBar" description="Determinate + indeterminate.">
              <Stack spacing={2} sx={{ maxWidth: 520 }}>
                <ProgressBar value={35} />
                <ProgressBar value={78} color="secondary" />
                <ProgressBar variant="indeterminate" showLabel={false} />
              </Stack>
            </Section>

            <Section id="loading" title="LoadingScreen" description="Use the button on the left to show it briefly.">
              <Alert severity="info">Click “Show LoadingScreen” to preview the overlay.</Alert>
            </Section>

            <Section id="scrollbar" title="Scrollbar" description="Scroll container with custom scrollbar styling.">
              <Scrollbar sx={{ height: 180, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
                <Stack spacing={1}>
                  {Array.from({ length: 30 }).map((_, i) => (
                    <Typography key={i} variant="body2">
                      Scroll item {i + 1}
                    </Typography>
                  ))}
                </Stack>
              </Scrollbar>
            </Section>

            <Section id="table" title="Table with pagination" description="Client-side paging demo (UI only).">
              <Table
                columns={tableColumns}
                rows={pagedRows}
                page={tablePage}
                rowsPerPage={tableRowsPerPage}
                totalRows={allRows.length}
                onPageChange={(p) => setTablePage(p)}
                onRowsPerPageChange={(rpp) => {
                  setTableRowsPerPage(rpp);
                  setTablePage(0);
                }}
              />
            </Section>

            <Section id="chart" title="Chart" description="Line / bar / pie previews with the same data.">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Chart type="line" title="Line chart" data={chartData} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Chart type="bar" title="Bar chart" data={chartData} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Chart type="pie" title="Pie chart" data={chartData} />
                </Grid>
              </Grid>
            </Section>

            <Section id="dialogs" title="Dialogs" description="ConfirmDialog + ConsentDialog open/close.">
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button variant="contained" onClick={() => setConfirmOpen(true)}>
                  Open ConfirmDialog
                </Button>
                <Button variant="outlined" onClick={() => setConsentOpen(true)}>
                  Open ConsentDialog
                </Button>
              </Stack>

              <ConfirmDialog
                open={confirmOpen}
                title="Confirm action"
                message="UI preview only. Click confirm/cancel to close."
                onCancel={() => setConfirmOpen(false)}
                onConfirm={() => {
                  setConfirmOpen(false);
                  showSuccess('Confirmed');
                }}
              />

              <ConsentDialog
                open={consentOpen}
                onDecline={() => setConsentOpen(false)}
                onAccept={() => {
                  setConsentOpen(false);
                  showInfo('Accepted');
                }}
              />
            </Section>

            <Section id="emoji" title="EmojiPicker" description="Click button to open the popover and pick an emoji.">
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                <Button
                  variant="contained"
                  onClick={(e) => setEmojiAnchor(e.currentTarget)}
                >
                  Open EmojiPicker
                </Button>
                <Typography variant="body2" color="text.secondary">
                  Picked: {recaptchaToken ? '(token exists)' : '—'}
                </Typography>
              </Stack>

              <EmojiPicker
                open={Boolean(emojiAnchor)}
                anchorEl={emojiAnchor}
                onClose={() => setEmojiAnchor(null)}
                onEmojiClick={(emoji) => {
                  showInfo(`Emoji: ${emoji?.emoji || ''}`);
                }}
              />
            </Section>

            <Section id="wysiwyg" title="WYSIWYG" description="Basic editor preview (UI only).">
              <WYSIWYG value={wysiwygValue} onChange={setWysiwygValue} height={260} />
            </Section>

            <Section id="recaptcha" title="reCAPTCHA v2" description="Paste a v2 site key to see the widget render.">
              <Stack spacing={2}>
                <TextField
                  label="reCAPTCHA v2 site key"
                  value={recaptchaSiteKey}
                  onChange={(e) => setRecaptchaSiteKey(e.target.value)}
                  placeholder="6Lc... (v2 site key)"
                  fullWidth
                />

                <ReCaptcha
                  siteKey={recaptchaSiteKey}
                  onChange={(token) => {
                    setRecaptchaToken(token);
                    showSuccess('Got reCAPTCHA token');
                  }}
                  onExpired={() => {
                    setRecaptchaToken(null);
                    showWarning('reCAPTCHA expired');
                  }}
                  onError={() => showError('reCAPTCHA error')}
                />

                <Alert severity="info">
                  Token status: {recaptchaToken ? 'received' : 'not received'}
                </Alert>
              </Stack>
            </Section>

            <Section id="error-pages" title="Error Pages" description="Navigate to error pages to preview their UI.">
              <Stack spacing={2}>
                <Alert severity="info">
                  Click buttons below to navigate to each error page and preview their design.
                </Alert>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => navigate('/404')}
                      sx={{ py: 1.5 }}
                    >
                      404 Not Found
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => navigate('/500')}
                      sx={{ py: 1.5 }}
                    >
                      500 Server Error
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => navigate('/unauthorized')}
                      sx={{ py: 1.5 }}
                    >
                      403 Unauthorized
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => navigate('/maintenance')}
                      sx={{ py: 1.5 }}
                    >
                      Maintenance
                    </Button>
                  </Grid>
                </Grid>
                <Alert severity="warning" sx={{ mt: 2 }}>
                  After viewing, use browser back button or navigate to /ui to return.
                </Alert>
              </Stack>
            </Section>
          </Stack>
        </Grid>
      </Grid>
    </Page>
  );
}

