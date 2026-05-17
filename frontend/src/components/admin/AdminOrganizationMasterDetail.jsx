import {
  Avatar,
  Box,
  Button,
  Card,
  Divider,
  Fade,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  alpha,
  Switch,
  FormControlLabel,
} from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import DOMPurify from 'dompurify';
import AdminStatusChip from './AdminStatusChip';
import { useState, useMemo, useEffect } from 'react';
import { useTheme } from '@mui/material';
import { adminOrganizationApi } from '../../api/adminOrganizationApi';

const formatOrgDate = (value) => {
  if (!value) {
    return '—';
  }
  try {
    return new Date(value).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

const normalizeList = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? '').trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item ?? '').trim()).filter(Boolean);
      }
    } catch {
      return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }

  return [];
};

const AdminOrganizationMasterDetail = ({
  organizations = [],
  selectedOrganization,
  selectedOrganizationId,
  selectedIntroduction,
  onSelectOrganizationId,
  onEditOrganization,
  onEditIntroduction,
  onUpdateOrganization,
  onRefresh,
}) => {
  const theme = useTheme();
  const [orgSearch, setOrgSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState(0);

  const filteredOrganizations = useMemo(() => {
    let list = organizations;
    if (statusFilter !== 'ALL') {
      list = list.filter((o) => String(o.status || '').toUpperCase() === statusFilter);
    }
    const q = orgSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((o) => String(o.name || '').toLowerCase().includes(q));
    }
    return list;
  }, [organizations, orgSearch, statusFilter]);

  useEffect(() => {
    if (filteredOrganizations.length === 0) {
      return;
    }
    const stillSelected = filteredOrganizations.some((o) => o.id === selectedOrganizationId);
    if (!stillSelected) {
      onSelectOrganizationId(filteredOrganizations[0].id);
    }
  }, [filteredOrganizations, selectedOrganizationId, onSelectOrganizationId]);

  const selectedOrg = useMemo(() => {
    if (selectedOrganization) {
      return selectedOrganization;
    }
    if (filteredOrganizations.length === 0) {
      return null;
    }
    const match = filteredOrganizations.find((o) => o.id === selectedOrganizationId);
    if (match) {
      return organizations.find((o) => o.id === selectedOrganizationId) ?? match;
    }
    return organizations.find((o) => o.id === filteredOrganizations[0].id) ?? filteredOrganizations[0];
  }, [selectedOrganization, organizations, filteredOrganizations, selectedOrganizationId]);

  const selectedPrograms = useMemo(
    () => normalizeList(selectedOrg?.programs),
    [selectedOrg?.programs],
  );
  const selectedMajors = useMemo(
    () => normalizeList(selectedOrg?.majors),
    [selectedOrg?.majors],
  );

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Local editable states for config tab
  const [brandState, setBrandState] = useState({
    logoUrl: '',
    faviconUrl: '',
    heroBannerUrl: '',
    themeColors: { primary: '#1976d2', secondary: '#9c27b0', accent: '#ffb300' },
  });
  const [programList, setProgramList] = useState([]);
  const [majorList, setMajorList] = useState([]);
  const [newProgram, setNewProgram] = useState('');
  const [newMajor, setNewMajor] = useState('');

  useEffect(() => {
    if (!selectedOrg) return;
    // init programs / majors
    setProgramList(normalizeList(selectedOrg.programs));
    setMajorList(normalizeList(selectedOrg.majors));

    // init brand/theme from featuresConfig if present
    let cfg = {};
    try {
      cfg = selectedOrg.featuresConfig
        ? (typeof selectedOrg.featuresConfig === 'string' ? JSON.parse(selectedOrg.featuresConfig) : selectedOrg.featuresConfig)
        : {};
    } catch {
      cfg = {};
    }
    const brand = cfg.brand_config || cfg.brandConfig || {};
    const themeColors = brand.theme_colors || brand.themeColors || {};
    setBrandState((s) => ({
      ...s,
      logoUrl: brand.logo_url || brand.logoUrl || s.logoUrl,
      faviconUrl: brand.favicon_url || brand.faviconUrl || s.faviconUrl,
      heroBannerUrl: brand.hero_banner_url || brand.heroBannerUrl || s.heroBannerUrl,
      themeColors: {
        primary: themeColors.primary || s.themeColors.primary,
        secondary: themeColors.secondary || s.themeColors.secondary,
        accent: themeColors.accent || s.themeColors.accent,
      },
    }));
  }, [selectedOrg]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        alignItems: 'stretch',
        gap: 3,
        minHeight: 600,
      }}
    >
      {/* MASTER LIST */}
      <Card
        elevation={0}
        sx={{
          flex: '0 0 350px',
          border: 1,
          borderColor: 'divider',
          borderRadius: 3,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
          <Stack spacing={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Tổ chức ({filteredOrganizations.length})
            </Typography>
            <TextField
              size="small"
              fullWidth
              placeholder="Tìm theo tên..."
              value={orgSearch}
              onChange={(e) => setOrgSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlinedIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              size="small"
              fullWidth
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="ALL">Tất cả trạng thái</MenuItem>
              <MenuItem value="ACTIVE">Đang hoạt động</MenuItem>
              <MenuItem value="INACTIVE">Tạm ngưng</MenuItem>
            </TextField>
          </Stack>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', maxHeight: { lg: 'calc(100vh - 400px)' } }}>
          <List disablePadding>
            {filteredOrganizations.map((org) => {
              const isSelected = org.id === selectedOrganizationId;
              return (
                <ListItemButton
                  key={org.id}
                  selected={isSelected}
                  onClick={() => onSelectOrganizationId(org.id)}
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderLeft: 4,
                    borderColor: isSelected ? 'primary.main' : 'transparent',
                    '&.Mui-selected': {
                      bgcolor: 'primary.lighter',
                      '&:hover': { bgcolor: 'primary.lighter' },
                    },
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
                    <Avatar
                      src={org.logoUrl}
                      sx={{ width: 36, height: 36, border: 1, borderColor: 'divider', bgcolor: 'background.neutral' }}
                    >
                      <BusinessOutlinedIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" noWrap sx={{ fontWeight: isSelected ? 700 : 600 }}>
                        {org.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                        {org.slug}
                      </Typography>
                    </Box>
                    <AdminStatusChip status={org.status} category="organization" size="small" />
                  </Stack>
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      </Card>

      {/* DETAIL VIEW */}
      <Card
        elevation={0}
        sx={{
          flex: 1,
          border: 1,
          borderColor: 'divider',
          borderRadius: 3,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper',
        }}
      >
        {!selectedOrg ? (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
            <BusinessOutlinedIcon sx={{ fontSize: 80, color: 'text.disabled', opacity: 0.5, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" fontWeight={700}>
              Chọn một tổ chức để xem chi tiết
            </Typography>
          </Box>
        ) : (
          <Fade in key={selectedOrg.id}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ px: 3, pt: 3, pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      src={selectedOrg.logoUrl}
                      sx={{ width: 56, height: 56, border: 2, borderColor: 'primary.main', p: 0.5, bgcolor: 'white' }}
                    >
                      <BusinessOutlinedIcon sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 800 }}>{selectedOrg.name}</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>{selectedOrg.slug}</Typography>
                        <AdminStatusChip status={selectedOrg.status} category="organization" />
                      </Stack>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditOutlinedIcon />}
                      onClick={() => onEditOrganization(selectedOrg)}
                      sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
                    >
                      Sửa thông tin
                    </Button>
                    <IconButton size="small" onClick={onRefresh} sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
                      <RefreshOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>

                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  sx={{
                    mt: 3,
                    '& .MuiTab-root': {
                      minHeight: 48,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: 14,
                    },
                  }}
                >
                  <Tab icon={<InfoOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Tổng quan" />
                  <Tab icon={<AutoStoriesOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Giới thiệu" />
                  <Tab icon={<SchoolOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Đào tạo" />
                  <Tab icon={<SettingsOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Cấu hình" />
                </Tabs>
              </Box>

              <Box sx={{ flex: 1, p: 3, overflowY: 'auto', maxHeight: 'calc(100vh - 450px)' }}>
                {activeTab === 0 && (
                  <Stack spacing={3}>
                    <DetailSection title="Thông tin cơ bản">
                      <Grid container spacing={2}>
                        <DetailItem label="ID Hệ thống" value={selectedOrg.id} />
                        <DetailItem label="Slug / Alias" value={selectedOrg.slug} />
                        <DetailItem label="Ngày tạo" value={formatOrgDate(selectedOrg.createdAt)} />
                        <DetailItem label="Cập nhật lần cuối" value={formatOrgDate(selectedOrg.updatedAt)} />
                        <DetailItem label="Logo URL" value={selectedOrg.logoUrl || 'N/A'} isFullWidth />
                      </Grid>
                    </DetailSection>
                  </Stack>
                )}

                {activeTab === 1 && (
                  <Stack spacing={3}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        startIcon={<EditOutlinedIcon />}
                        onClick={() => onEditIntroduction(selectedOrg)}
                        sx={{ textTransform: 'none' }}
                      >
                        Chỉnh sửa giới thiệu
                      </Button>
                    </Box>
                    <DetailSection title="Nội dung giới thiệu">
                      {selectedIntroduction?.bannerUrl && (
                        <Box
                          component="img"
                          src={selectedIntroduction.bannerUrl}
                          sx={{
                            width: '100%',
                            height: 200,
                            objectFit: 'cover',
                            borderRadius: 2,
                            mb: 2,
                            border: 1,
                            borderColor: 'divider',
                          }}
                        />
                      )}
                      <Box 
                        className="rich-text-content"
                        sx={{ 
                          color: 'text.secondary', 
                          lineHeight: 1.6,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          '& img': { maxWidth: '100%', height: 'auto', borderRadius: 1 },
                          '& p': { mb: 1.5 }
                        }}
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedIntroduction?.content || 'Chưa có mô tả chi tiết.') }}
                      />
                    </DetailSection>
                    <Stack spacing={2}>
                      <Box>
                        <Card variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: alpha(theme.palette.info.main, 0.02), border: `1px solid ${alpha(theme.palette.info.main, 0.1)}` }}>
                          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                            <Avatar sx={{ bgcolor: 'info.main', width: 32, height: 32 }}><VisibilityRoundedIcon sx={{ fontSize: 18 }} /></Avatar>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'info.dark' }}>Tầm nhìn</Typography>
                          </Stack>
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, lineHeight: 1.6 }}>{selectedIntroduction?.vision || '—'}</Typography>
                        </Card>
                      </Box>
                      <Box>
                        <Card variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.02), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
                          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}><RocketLaunchRoundedIcon sx={{ fontSize: 18 }} /></Avatar>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.dark' }}>Sứ mạng</Typography>
                          </Stack>
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, lineHeight: 1.6 }}>{selectedIntroduction?.mission || '—'}</Typography>
                        </Card>
                      </Box>
                      <Box>
                        <Card variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: alpha(theme.palette.error.main, 0.02), border: `1px solid ${alpha(theme.palette.error.main, 0.1)}` }}>
                          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                            <Avatar sx={{ bgcolor: 'error.main', width: 32, height: 32 }}><FavoriteRoundedIcon sx={{ fontSize: 18 }} /></Avatar>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'error.dark' }}>Giá trị cốt lõi</Typography>
                          </Stack>
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, lineHeight: 1.6 }}>{selectedIntroduction?.coreValues || '—'}</Typography>
                        </Card>
                      </Box>
                    </Stack>
                  </Stack>
                )}

                {activeTab === 2 && (
                  <Stack spacing={3}>
                    <DetailSection title="Chương trình đào tạo">
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        {selectedPrograms.length > 0 ? (
                          selectedPrograms.map(p => <Paper key={p} variant="outlined" sx={{ px: 1.5, py: 0.5, borderRadius: 1.5, bgcolor: 'background.neutral', fontSize: 13, fontWeight: 600 }}>{p}</Paper>)
                        ) : <Typography variant="body2" color="text.disabled">Chưa cấu hình chương trình</Typography>}
                      </Stack>
                    </DetailSection>
                    <DetailSection title="Các chuyên ngành">
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        {selectedMajors.length > 0 ? (
                          selectedMajors.map(m => <Paper key={m} variant="outlined" sx={{ px: 1.5, py: 0.5, borderRadius: 1.5, bgcolor: 'background.neutral', fontSize: 13, fontWeight: 600 }}>{m}</Paper>)
                        ) : <Typography variant="body2" color="text.disabled">Chưa cấu hình chuyên ngành</Typography>}
                      </Stack>
                    </DetailSection>
                  </Stack>
                )}

                {activeTab === 3 && (
                  <Stack spacing={3}>
                    <DetailSection title="Cấu hình tính năng">
                      <List sx={{ p: 0 }}>
                        {(() => {
                          const config = selectedOrg.featuresConfig
                            ? (typeof selectedOrg.featuresConfig === 'string' ? JSON.parse(selectedOrg.featuresConfig) : selectedOrg.featuresConfig)
                            : { mentorship: true, job: true, fund: true, events: true, forum: true };
                          
                          const featureLabels = {
                            mentorship: 'Tính năng Cố vấn (Mentorship)',
                            job: 'Tính năng Việc làm (Jobs)',
                            fund: 'Tính năng Gây quỹ (Fundraising)',
                            events: 'Tính năng Sự kiện (Events)',
                            forum: 'Tính năng Diễn đàn (Forum)',
                          };

                          const handleToggle = async (key) => {
                            try {
                              await adminOrganizationApi.toggleFeature(selectedOrg.id, key);
                              // refresh parent view
                              onRefresh?.();
                            } catch (err) {
                              console.error('Toggle feature failed', err);
                            }
                          };

                          return Object.keys(featureLabels).map((key) => (
                            <Box key={key} sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              py: 1.5,
                              px: 1,
                              borderBottom: key !== 'forum' ? 1 : 0,
                              borderColor: 'divider'
                            }}>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                  {featureLabels[key]}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Bật hoặc tắt hiển thị {featureLabels[key].toLowerCase()} cho tổ chức này.
                                </Typography>
                              </Box>
                              <Switch
                                checked={config[key] ?? true}
                                onChange={() => handleToggle(key)}
                              />
                            </Box>
                          ));
                        })()}
                      </List>

                      {/* Brand / theme editor */}
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Brand & Theme</Typography>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={6}>
                            <TextField
                              label="Logo URL"
                              size="small"
                              fullWidth
                              value={brandState.logoUrl}
                              onChange={(e) => setBrandState((s) => ({ ...s, logoUrl: e.target.value }))}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              label="Favicon URL"
                              size="small"
                              fullWidth
                              value={brandState.faviconUrl}
                              onChange={(e) => setBrandState((s) => ({ ...s, faviconUrl: e.target.value }))}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              label="Hero banner URL"
                              size="small"
                              fullWidth
                              value={brandState.heroBannerUrl}
                              onChange={(e) => setBrandState((s) => ({ ...s, heroBannerUrl: e.target.value }))}
                            />
                          </Grid>

                          <Grid item xs={12} sm={4}>
                            <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>Màu chính</Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <ColorLensIcon color="action" />
                              <input
                                type="color"
                                value={brandState.themeColors.primary}
                                onChange={(e) => setBrandState((s) => ({ ...s, themeColors: { ...s.themeColors, primary: e.target.value } }))}
                                style={{ width: 48, height: 36, border: 0, background: 'transparent' }}
                              />
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{brandState.themeColors.primary}</Typography>
                            </Stack>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>Màu phụ</Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <input
                                type="color"
                                value={brandState.themeColors.secondary}
                                onChange={(e) => setBrandState((s) => ({ ...s, themeColors: { ...s.themeColors, secondary: e.target.value } }))}
                                style={{ width: 48, height: 36, border: 0, background: 'transparent' }}
                              />
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{brandState.themeColors.secondary}</Typography>
                            </Stack>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>Màu accent</Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <input
                                type="color"
                                value={brandState.themeColors.accent}
                                onChange={(e) => setBrandState((s) => ({ ...s, themeColors: { ...s.themeColors, accent: e.target.value } }))}
                                style={{ width: 48, height: 36, border: 0, background: 'transparent' }}
                              />
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{brandState.themeColors.accent}</Typography>
                            </Stack>
                          </Grid>

                          <Grid item xs={12}>
                            <Button
                              startIcon={<SaveOutlinedIcon />}
                              variant="contained"
                              size="small"
                                onClick={async () => {
                                  try {
                                    let cfg = {};
                                    try {
                                      cfg = selectedOrg.featuresConfig
                                        ? (typeof selectedOrg.featuresConfig === 'string' ? JSON.parse(selectedOrg.featuresConfig) : selectedOrg.featuresConfig)
                                        : {};
                                    } catch { cfg = {}; }
                                    const brand = {
                                      logo_url: brandState.logoUrl,
                                      favicon_url: brandState.faviconUrl,
                                      hero_banner_url: brandState.heroBannerUrl,
                                      theme_colors: { ...brandState.themeColors },
                                    };
                                    const newCfg = { ...cfg, brand_config: brand };
                                    await adminOrganizationApi.updateFeaturesConfig(selectedOrg.id, newCfg);
                                    onRefresh?.();
                                  } catch (err) {
                                    console.error('Save brand/theme failed', err);
                                  }
                                }}
                            >
                              Lưu brand & theme
                            </Button>
                          </Grid>
                        </Grid>
                      </Box>

                      {/* Programs & Majors editable lists */}
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Chương trình & Chuyên ngành</Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>Chương trình</Typography>
                            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1 }}>
                              {programList.map((p) => (
                                <Paper key={p} variant="outlined" sx={{ px: 1, py: 0.5, borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{p}</Typography>
                                  <IconButton size="small" onClick={() => setProgramList(pl => pl.filter(x => x !== p))}><DeleteOutlineIcon fontSize="small" /></IconButton>
                                </Paper>
                              ))}
                            </Stack>
                            <Stack direction="row" spacing={1}>
                              <TextField size="small" placeholder="Thêm chương trình" value={newProgram} onChange={(e) => setNewProgram(e.target.value)} />
                              <Button startIcon={<AddIcon />} size="small" onClick={() => { if (newProgram.trim()) { setProgramList(pl => [...pl, newProgram.trim()]); setNewProgram(''); } }}>Thêm</Button>
                              <Button variant="outlined" size="small" onClick={async () => {
                                try {
                                  const remote = await adminOrganizationApi.getPrograms(selectedOrg.id);
                                  const remoteList = Array.isArray(remote) ? remote : remote || [];
                                  const toAdd = programList.filter(p => !remoteList.includes(p));
                                  const toRemove = remoteList.filter(p => !programList.includes(p));
                                  await Promise.all(toAdd.map(v => adminOrganizationApi.addProgram(selectedOrg.id, v)));
                                  await Promise.all(toRemove.map(v => adminOrganizationApi.removeProgram(selectedOrg.id, v)));
                                  onRefresh?.();
                                } catch (err) {
                                  console.error('Save programs failed', err);
                                }
                              }}>Lưu</Button>
                            </Stack>
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>Chuyên ngành</Typography>
                            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1 }}>
                              {majorList.map((m) => (
                                <Paper key={m} variant="outlined" sx={{ px: 1, py: 0.5, borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{m}</Typography>
                                  <IconButton size="small" onClick={() => setMajorList(ml => ml.filter(x => x !== m))}><DeleteOutlineIcon fontSize="small" /></IconButton>
                                </Paper>
                              ))}
                            </Stack>
                            <Stack direction="row" spacing={1}>
                              <TextField size="small" placeholder="Thêm chuyên ngành" value={newMajor} onChange={(e) => setNewMajor(e.target.value)} />
                              <Button startIcon={<AddIcon />} size="small" onClick={() => { if (newMajor.trim()) { setMajorList(ml => [...ml, newMajor.trim()]); setNewMajor(''); } }}>Thêm</Button>
                              <Button variant="outlined" size="small" onClick={async () => {
                                try {
                                  const remote = await adminOrganizationApi.getMajors(selectedOrg.id);
                                  const remoteList = Array.isArray(remote) ? remote : remote || [];
                                  const toAdd = majorList.filter(p => !remoteList.includes(p));
                                  const toRemove = remoteList.filter(p => !majorList.includes(p));
                                  await Promise.all(toAdd.map(v => adminOrganizationApi.addMajor(selectedOrg.id, v)));
                                  await Promise.all(toRemove.map(v => adminOrganizationApi.removeMajor(selectedOrg.id, v)));
                                  onRefresh?.();
                                } catch (err) {
                                  console.error('Save majors failed', err);
                                }
                              }}>Lưu</Button>
                            </Stack>
                          </Grid>
                        </Grid>
                      </Box>

                      <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.lighter', borderRadius: 2, border: 1, borderColor: 'primary.light', borderStyle: 'dashed' }}>
                        <Typography variant="caption" color="primary.darker" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                          <InfoOutlinedIcon sx={{ fontSize: 14 }} />
                          Lưu ý: Các thay đổi chương trình / chuyên ngành lưu khi bạn nhấn nút "Lưu".
                        </Typography>
                      </Box>
                    </DetailSection>
                  </Stack>
                )}
              </Box>
            </Box>
          </Fade>
        )}
      </Card>
    </Box>
  );
};

const DetailSection = ({ title, children }) => (
  <Box>
    <Typography variant="overline" sx={{ color: 'text.disabled', fontWeight: 800, mb: 1.5, display: 'block' }}>
      {title}
    </Typography>
    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider' }}>
      {children}
    </Paper>
  </Box>
);

const DetailItem = ({ label, value, isFullWidth = false }) => (
  <Grid item xs={12} sm={isFullWidth ? 12 : 6}>
    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.25 }}>
      {value || '—'}
    </Typography>
  </Grid>
);

export default AdminOrganizationMasterDetail;
