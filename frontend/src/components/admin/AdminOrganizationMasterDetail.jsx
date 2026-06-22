import {
  Alert,
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
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import DOMPurify from 'dompurify';
import AdminStatusChip from './AdminStatusChip';
import SearchBar from '../SearchBar';
import { useState, useMemo, useEffect } from 'react';
import { useTheme } from '@mui/material';
import { adminOrganizationApi } from '../../utils/api';
import { useSnackbar } from 'notistack';
import AdminManualMemberDialog from './AdminManualMemberDialog';
import { fileToBase64 } from '../../utils/imageUtils';
import { createBrandColor, DEFAULT_BRAND_COLORS, normalizeHexColor } from '../../theme/palette';

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
  onDeleteOrganization,
  onRefresh,
  onRefreshIntroduction,
  onPromoteOrganization,
}) => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
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

  const programs = useMemo(
    () => normalizeList(selectedOrg?.programs),
    [selectedOrg?.programs],
  );
  
  const majors = useMemo(
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
    themeColors: { ...DEFAULT_BRAND_COLORS },
  });
  const [identityState, setIdentityState] = useState({
    siteTitle: '',
    tagline: '',
    description: '',
  });
  const [privacyState, setPrivacyState] = useState({
    visibilityMode: 'PUBLIC',
  });

  const [programList, setProgramList] = useState([]);
  const [majorList, setMajorList] = useState([]);
  const [newProgram, setNewProgram] = useState('');
  const [newMajor, setNewMajor] = useState('');

  const [personnelDialog, setPersonnelDialog] = useState({
    open: false,
    type: 'leaders', // 'leaders' or 'teamMembers'
    member: null,
    index: -1,
  });

  const handleOpenPersonnelDialog = (type, member = null, index = -1) => {
    setPersonnelDialog({ open: true, type, member, index });
  };

  const handleClosePersonnelDialog = () => {
    setPersonnelDialog({ open: false, type: 'leaders', member: null, index: -1 });
  };

  const handleUpdatePersonnel = async (memberData) => {
    if (!selectedOrg) return;

    const { type, index } = personnelDialog;
    const currentIntro = selectedIntroduction || {};
    const currentList = [...(currentIntro[type] || [])];

    if (index >= 0) {
      currentList[index] = memberData;
    } else {
      currentList.push(memberData);
    }

    const payload = {
      content: currentIntro.content || '',
      vision: currentIntro.vision || '',
      mission: currentIntro.mission || '',
      coreValues: currentIntro.coreValues || '',
      bannerUrl: currentIntro.bannerUrl || '',
      images: currentIntro.imageUrls || [],
      leaders: type === 'leaders' ? currentList : (currentIntro.leaders || []),
      teamMembers: type === 'teamMembers' ? currentList : (currentIntro.teamMembers || []),
      leadersContent: currentIntro.leadersContent || '',
      teamMembersContent: currentIntro.teamMembersContent || '',
    };

    try {
      await adminOrganizationApi.upsertIntroduction(selectedOrg.id, payload);
      enqueueSnackbar('Đã cập nhật nhân sự', { variant: 'success' });
      onRefreshIntroduction?.();
    } catch (_) {
      enqueueSnackbar('Không thể cập nhật nhân sự', { variant: 'error' });
    }
  };

  const handleDeletePersonnel = async (type, index) => {
    if (!selectedOrg || !selectedIntroduction) return;
    if (!window.confirm('Xóa nhân sự này khỏi danh sách?')) return;

    const currentList = [...(selectedIntroduction[type] || [])].filter((_, i) => i !== index);

    const payload = {
      content: selectedIntroduction.content || '',
      vision: selectedIntroduction.vision || '',
      mission: selectedIntroduction.mission || '',
      coreValues: selectedIntroduction.coreValues || '',
      bannerUrl: selectedIntroduction.bannerUrl || '',
      images: selectedIntroduction.imageUrls || [],
      leaders: type === 'leaders' ? currentList : (selectedIntroduction.leaders || []),
      teamMembers: type === 'teamMembers' ? currentList : (selectedIntroduction.teamMembers || []),
      leadersContent: selectedIntroduction.leadersContent || '',
      teamMembersContent: selectedIntroduction.teamMembersContent || '',
    };

    try {
      await adminOrganizationApi.upsertIntroduction(selectedOrg.id, payload);
      enqueueSnackbar('Đã xóa nhân sự', { variant: 'success' });
      onRefreshIntroduction?.();
    } catch (_) {
      enqueueSnackbar('Không thể xóa nhân sự', { variant: 'error' });
    }
  };

  useEffect(() => {
    if (!selectedOrg) return;
    const timer = setTimeout(() => {
      // init programs / majors
      setProgramList(normalizeList(selectedOrg.programs));
      setMajorList(normalizeList(selectedOrg.majors));

      // init config from featuresConfig
      let cfg = {};
      try {
        cfg = selectedOrg.featuresConfig
          ? (typeof selectedOrg.featuresConfig === 'string' ? JSON.parse(selectedOrg.featuresConfig) : selectedOrg.featuresConfig)
          : {};
      } catch { cfg = {}; }

      const brand = cfg.brand_config || cfg.brandConfig || {};
      const themeColors = brand.theme_colors || brand.themeColors || {};
      setBrandState({
        logoUrl: brand.logo_url || brand.logoUrl || selectedOrg.logoUrl || '',
        faviconUrl: brand.favicon_url || brand.faviconUrl || '',
        heroBannerUrl: brand.hero_banner_url || brand.heroBannerUrl || '',
        themeColors: {
          primary: normalizeHexColor(themeColors.primary, DEFAULT_BRAND_COLORS.primary),
          secondary: normalizeHexColor(themeColors.secondary, DEFAULT_BRAND_COLORS.secondary),
          accent: normalizeHexColor(themeColors.accent, DEFAULT_BRAND_COLORS.accent),
        },
      });

      const identity = cfg.site_identity || cfg.siteIdentity || {};
      const intro = identity.introduction || {};
      setIdentityState({
        siteTitle: identity.site_title || identity.siteTitle || '',
        tagline: intro.tagline || '',
        description: intro.description || '',
      });

      const privacy = cfg.privacy_settings || cfg.privacySettings || {};
      setPrivacyState({
        visibilityMode: privacy.visibility_mode || privacy.visibilityMode || 'PUBLIC',
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedOrg]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        alignItems: 'stretch',
        gap: 3,
        minHeight: 0,
        height: { xs: 'none', lg: '88vh' },
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
          minWidth: 0,
          maxHeight: { lg: '88vh' }
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Stack spacing={2}>
            <Typography variant="h5" sx={{ color: 'primary.main' }}>
              Tổ chức ({filteredOrganizations.length})
            </Typography>
            <SearchBar
              value={orgSearch}
              onChange={setOrgSearch}
              placeholder="Tìm theo tên..."
              size="small"
              fullWidth
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

        <Box sx={{ flex: 1, overflowY: 'auto' }}>
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
                      bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.16 : 0.1),
                      '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.22 : 0.14),
                      },
                    },
                    '&:hover': {
                      bgcolor: 'action.hover',
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
          overflow: 'hidden',
          minHeight: 0,
          minWidth: 0,
          maxHeight: { lg: '88vh' },
        }}
      >
        {!selectedOrg ? (
          <Box sx={{ minHeight: 0, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
            <BusinessOutlinedIcon sx={{ fontSize: 80, color: 'text.disabled', opacity: 0.5, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" fontWeight={700}>
              Chọn một tổ chức để xem chi tiết
            </Typography>
          </Box>
        ) : (
          <Fade in key={selectedOrg.id}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
              <Box sx={{ px: 3, pt: 3, pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      src={selectedOrg.logoUrl}
                      sx={{ width: 56, height: 56, border: 2, borderColor: 'primary.main', p: 0.5, bgcolor: 'background.paper' }}
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
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                  >
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditOutlinedIcon />}
                      onClick={() => onEditOrganization(selectedOrg)}
                    >
                      Sửa thông tin
                    </Button>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => onDeleteOrganization(selectedOrg.id)} 
                      sx={{ border: 1, borderColor: 'error.lighter', borderRadius: 1.5 }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={onRefresh} sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
                      <RefreshOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>

                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
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
                  <Tab icon={<PeopleOutlineIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Nhân sự" />
                </Tabs>
              </Box>

              <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
                {activeTab === 0 && (
                  <Stack spacing={3}>
                    <DetailSection title="Thông tin cơ bản">
                      <Grid container spacing={2}>
                        <DetailItem label="ID Hệ thống" value={selectedOrg.id} />
                        <DetailItem label="Slug / Alias" value={selectedOrg.slug} />
                        <DetailItem label="Ngày tạo" value={formatOrgDate(selectedOrg.createdAt)} />
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
                        variant="outlined"
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
                        <Card variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: alpha(theme.palette.success.main, 0.02), border: `1px solid ${alpha(theme.palette.success.main, 0.1)}` }}>
                          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                            <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}><VisibilityRoundedIcon sx={{ fontSize: 18 }} /></Avatar>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'success.main' }}>Tầm nhìn</Typography>
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

                    {/* Leaders Section */}
                    {selectedIntroduction?.leaders?.length > 0 && (
                      <DetailSection title="Ban lãnh đạo">
                        {selectedIntroduction.leadersContent && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                            {selectedIntroduction.leadersContent}
                          </Typography>
                        )}
                        <Grid container spacing={2}>
                          {selectedIntroduction.leaders.map((leader, idx) => (
                            <Grid item xs={12} sm={6} key={idx}>
                              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Avatar src={leader.image} sx={{ width: 48, height: 48 }} />
                                <Box>
                                  <Typography variant="subtitle2" fontWeight={700}>{leader.name}</Typography>
                                  <Typography variant="caption" color="primary.main" fontWeight={600}>{leader.positions}</Typography>
                                </Box>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      </DetailSection>
                    )}

                    {/* Team Members Section */}
                    {selectedIntroduction?.teamMembers?.length > 0 && (
                      <DetailSection title="Đội ngũ tiêu biểu">
                        {selectedIntroduction.teamMembersContent && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                            {selectedIntroduction.teamMembersContent}
                          </Typography>
                        )}
                        <Grid container spacing={2}>
                          {selectedIntroduction.teamMembers.map((member, idx) => (
                            <Grid item xs={12} sm={6} key={idx}>
                              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Avatar src={member.image} sx={{ width: 40, height: 40 }} />
                                <Box>
                                  <Typography variant="subtitle2" fontWeight={700}>{member.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">{member.positions}</Typography>
                                </Box>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      </DetailSection>
                    )}
                  </Stack>
                )}

                {activeTab === 2 && (
                  <Stack spacing={3}>
                    <DetailSection title="Chương trình đào tạo">
                                              <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Chương trình</Typography>
                            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1 }}>
                              {programList.map((p) => (
                                <Paper key={p} variant="outlined" sx={{ px: 1, py: 0.5, borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{p}</Typography>
                                  <IconButton size="small" onClick={() => setProgramList(pl => pl.filter(x => x !== p))}><DeleteOutlineIcon fontSize="small" /></IconButton>
                                </Paper>
                              ))}
                            </Stack>
                            <Stack
                              direction={{ xs: 'column', sm: 'row' }}
                              spacing={1}
                            >
                              <TextField size="small" placeholder="Thêm chương trình" value={newProgram} onChange={(e) => setNewProgram(e.target.value)} />
                              <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={() => { if (newProgram.trim()) { setProgramList(pl => [...pl, newProgram.trim()]); setNewProgram(''); } }}>Thêm</Button>
                              <Button startIcon={<SaveOutlinedIcon />} variant="contained" size="small" onClick={async () => {
                                try {
                                  const remote = await adminOrganizationApi.getPrograms(selectedOrg.id);
                                  const remoteList = Array.isArray(remote) ? remote : [];
                                  const toAdd = programList.filter(p => !remoteList.includes(p));
                                  const toRemove = remoteList.filter(p => !programList.includes(p));
                                  await Promise.all(toAdd.map(v => adminOrganizationApi.addProgram(selectedOrg.id, v)));
                                  await Promise.all(toRemove.map(v => adminOrganizationApi.removeProgram(selectedOrg.id, v)));
                                  enqueueSnackbar('Đã lưu danh sách chương trình', { variant: 'success' });
                                  onRefresh?.();
                                } catch (_) {
                                  enqueueSnackbar('Lưu chương trình thất bại', { variant: 'error' });
                                }
                              }}>Lưu</Button>
                            </Stack>
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Chuyên ngành</Typography>
                            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1 }}>
                              {majorList.map((m) => (
                                <Paper key={m} variant="outlined" sx={{ px: 1, py: 0.5, borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{m}</Typography>
                                  <IconButton size="small" onClick={() => setMajorList(ml => ml.filter(x => x !== m))}><DeleteOutlineIcon fontSize="small" /></IconButton>
                                </Paper>
                              ))}
                            </Stack>
                            <Stack
                              direction={{ xs: 'column', sm: 'row' }}
                              spacing={1}
                            >
                              <TextField size="small" placeholder="Thêm chuyên ngành" value={newMajor} onChange={(e) => setNewMajor(e.target.value)} />
                              <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={() => { if (newMajor.trim()) { setMajorList(ml => [...ml, newMajor.trim()]); setNewMajor(''); } }}>Thêm</Button>
                              <Button startIcon={<SaveOutlinedIcon />} variant="contained" size="small" onClick={async () => {
                                try {
                                  const remote = await adminOrganizationApi.getMajors(selectedOrg.id);
                                  const remoteList = Array.isArray(remote) ? remote : [];
                                  const toAdd = majorList.filter(p => !remoteList.includes(p));
                                  const toRemove = remoteList.filter(p => !majorList.includes(p));
                                  await Promise.all(toAdd.map(v => adminOrganizationApi.addMajor(selectedOrg.id, v)));
                                  await Promise.all(toRemove.map(v => adminOrganizationApi.removeMajor(selectedOrg.id, v)));
                                  enqueueSnackbar('Đã lưu danh sách chuyên ngành', { variant: 'success' });
                                  onRefresh?.();
                                } catch (_) {
                                  enqueueSnackbar('Lưu chuyên ngành thất bại', { variant: 'error' });
                                }
                              }}>Lưu</Button>
                            </Stack>
                          </Grid>
                        </Grid>
                    </DetailSection>

                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        bgcolor: (theme) => alpha(theme.palette.info.main, theme.palette.mode === 'dark' ? 0.12 : 0.08),
                        borderRadius: 2,
                        border: 1,
                        borderColor: (theme) => alpha(theme.palette.info.main, theme.palette.mode === 'dark' ? 0.28 : 0.2),
                        borderStyle: 'dashed',
                      }}
                    >
                      <Typography variant="caption" color="info.main" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                        <InfoOutlinedIcon sx={{ fontSize: 14 }} />
                        Lưu ý: Các thay đổi chương trình & chuyên ngành lưu khi bạn nhấn nút "Lưu".
                      </Typography>
                    </Box>
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
                              enqueueSnackbar(`Đã cập nhật tính năng "${featureLabels[key]}"`, { variant: 'success' });
                              onRefresh?.();
                            } catch (_) {
                              enqueueSnackbar('Không thể cập nhật tính năng', { variant: 'error' });
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
                                checked={config?.features_config?.[key]?.enabled ?? true}
                                onChange={() => handleToggle(key)}
                              />
                            </Box>
                          ));
                        })()}
                      </List>
                     </DetailSection>

                      {/* Brand / theme editor */}
                      <DetailSection title="Cấu hình giao diện">
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                            Màu sắc
                          </Typography>

                          <Stack spacing={1.5}>
                            <ColorBlock
                              label="Màu chính"
                              value={brandState.themeColors.primary}
                              fallback={DEFAULT_BRAND_COLORS.primary}
                              onChange={(v) =>
                                setBrandState((s) => ({
                                  ...s,
                                  themeColors: { ...s.themeColors, primary: v },
                                }))
                              }
                            />

                            <ColorBlock
                              label="Màu phụ"
                              value={brandState.themeColors.secondary}
                              fallback={DEFAULT_BRAND_COLORS.secondary}
                              onChange={(v) =>
                                setBrandState((s) => ({
                                  ...s,
                                  themeColors: { ...s.themeColors, secondary: v },
                                }))
                              }
                            />

                            <ColorBlock
                              label="Màu accent"
                              value={brandState.themeColors.accent}
                              fallback={DEFAULT_BRAND_COLORS.accent}
                              onChange={(v) =>
                                setBrandState((s) => ({
                                  ...s,
                                  themeColors: { ...s.themeColors, accent: v },
                                }))
                              }
                            />
                          </Stack>
                        </Box>

                        <Box sx={{ mt: 3 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                            Hình ảnh
                          </Typography>

                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: { xs: '1fr', md: '168px minmax(0, 1fr)' },
                              gridTemplateRows: { md: '168px auto 168px auto' },
                              columnGap: 2,
                              rowGap: 1.5,
                              alignItems: 'stretch',
                            }}
                          >
                            <ImagePreviewBox
                              label="Logo"
                              src={brandState.logoUrl}
                              sx={{ gridColumn: { md: 1 }, gridRow: { md: 1 } }}
                            />
                            <UploadImageButton
                              label="Logo"
                              onUpload={(base64) => setBrandState(s => ({ ...s, logoUrl: base64 }))}
                              sx={{ gridColumn: { md: 1 }, gridRow: { md: 2 } }}
                            />
                            <ImagePreviewBox
                              label="Favicon"
                              src={brandState.faviconUrl}
                              sx={{ gridColumn: { md: 1 }, gridRow: { md: 3 } }}
                            />
                            <UploadImageButton
                              label="Favicon"
                              onUpload={(base64) => setBrandState(s => ({ ...s, faviconUrl: base64 }))}
                              sx={{ gridColumn: { md: 1 }, gridRow: { md: 4 } }}
                            />
                            <HeroBannerPreview
                              src={brandState.heroBannerUrl}
                              sx={{ gridColumn: { md: 2 }, gridRow: { md: '1 / 4' } }}
                            />
                            <UploadImageButton
                              label="Hero Banner"
                              onUpload={(base64) => setBrandState(s => ({ ...s, heroBannerUrl: base64 }))}
                              sx={{ gridColumn: { md: 2 }, gridRow: { md: 4 } }}
                            />
                          </Box>
                        </Box>

                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
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
                                    theme_colors: {
                                      primary: normalizeHexColor(brandState.themeColors.primary, DEFAULT_BRAND_COLORS.primary),
                                      secondary: normalizeHexColor(brandState.themeColors.secondary, DEFAULT_BRAND_COLORS.secondary),
                                      accent: normalizeHexColor(brandState.themeColors.accent, DEFAULT_BRAND_COLORS.accent),
                                    },
                                  };
                                  const newCfg = { ...cfg, brand_config: brand };
                                  await adminOrganizationApi.updateFeaturesConfig(selectedOrg.id, newCfg);
                                  onPromoteOrganization?.(selectedOrg.id);
                                  enqueueSnackbar('Đã lưu cấu hình giao diện', { variant: 'success' });
                                  onRefresh?.();
                                } catch (_) {
                                  enqueueSnackbar('Lưu thất bại', { variant: 'error' });
                                }
                              }}
                          >
                            Lưu giao diện
                          </Button>
                        </Box>
                      </DetailSection>
                  </Stack>
                )}

                {activeTab === 4 && (
                  <Stack spacing={3}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="overline" sx={{ color: 'text.disabled', fontWeight: 800 }}>
                        Quản lý nhân sự (Thêm thủ công)
                      </Typography>
                    </Box>

                    {/* Section: Leaders */}
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight={800}>Ban lãnh đạo</Typography>
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => handleOpenPersonnelDialog('leaders')}
                        >
                          Thêm lãnh đạo
                        </Button>
                      </Stack>
                      {!selectedIntroduction?.leaders?.length ? (
                        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', mb: 2 }}>Chưa có thông tin ban lãnh đạo.</Typography>
                      ) : (
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell sx={{ fontWeight: 700 }}>Họ tên</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Chức vụ</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Thao tác</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {selectedIntroduction.leaders.map((leader, idx) => (
                                <TableRow key={idx} sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}>
                                  <TableCell>
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                      <Avatar src={leader.image} sx={{ width: 32, height: 32 }} />
                                      <Typography variant="subtitle2" fontWeight={700}>{leader.name}</Typography>
                                    </Stack>
                                  </TableCell>
                                  <TableCell sx={{ fontSize: 13 }}>{leader.positions}</TableCell>
                                  <TableCell sx={{ fontSize: 13 }}>{leader.email}</TableCell>
                                  <TableCell align="right">
                                    <IconButton size="small" onClick={() => handleOpenPersonnelDialog('leaders', leader, idx)}>
                                      <EditOutlinedIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" color="error" onClick={() => handleDeletePersonnel('leaders', idx)}>
                                      <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Box>

                    <Divider />

                    {/* Section: Team Members */}
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight={800}>Đội ngũ nhân sự tiêu biểu</Typography>
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => handleOpenPersonnelDialog('teamMembers')}
                        >
                          Thêm thành viên
                        </Button>
                      </Stack>
                      {!selectedIntroduction?.teamMembers?.length ? (
                        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>Chưa có thông tin đội ngũ nhân sự.</Typography>
                      ) : (
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell sx={{ fontWeight: 700 }}>Họ tên</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Chức vụ</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Thao tác</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {selectedIntroduction.teamMembers.map((m, idx) => (
                                <TableRow key={idx} sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}>
                                  <TableCell>
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                      <Avatar src={m.image} sx={{ width: 32, height: 32 }} />
                                      <Typography variant="subtitle2" fontWeight={700}>{m.name}</Typography>
                                    </Stack>
                                  </TableCell>
                                  <TableCell sx={{ fontSize: 13 }}>{m.positions}</TableCell>
                                  <TableCell sx={{ fontSize: 13 }}>{m.email}</TableCell>
                                  <TableCell align="right">
                                    <IconButton size="small" onClick={() => handleOpenPersonnelDialog('teamMembers', m, idx)}>
                                      <EditOutlinedIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" color="error" onClick={() => handleDeletePersonnel('teamMembers', idx)}>
                                      <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Box>
                  </Stack>
                )}
              </Box>

              <AdminManualMemberDialog
                open={personnelDialog.open}
                onClose={handleClosePersonnelDialog}
                member={personnelDialog.member}
                onConfirm={handleUpdatePersonnel}
                title={personnelDialog.type === 'leaders' ? "Thông tin Lãnh đạo" : "Thông tin Nhân sự"}
              />
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

const getContrastRatio = (colorA, colorB) => {
  const luminance = (hex) => {
    const normalized = normalizeHexColor(hex, '#000000').slice(1);
    const channels = [0, 2, 4].map((start) => parseInt(normalized.slice(start, start + 2), 16) / 255);
    const [r, g, b] = channels.map((channel) => (
      channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    ));

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = luminance(colorA);
  const l2 = luminance(colorB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
};

const formatContrast = (value) => `${value.toFixed(2)}:1`;

const ColorBlock = ({ label, value, fallback, onChange }) => {
  const normalizedValue = normalizeHexColor(value, fallback);
  const color = createBrandColor(normalizedValue, fallback);
  const textOnWhiteContrast = getContrastRatio(color.main, '#FFFFFF');
  const hasLowTextContrast = textOnWhiteContrast < 4.5;

  return (
    <Box
      sx={{
        py: 1.25,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: 1.25,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:last-of-type': { borderBottom: 0 },
      }}
    >
      <Box
        sx={{
          width: { sm: 178 },
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          component="label"
          sx={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            bgcolor: normalizedValue,
            boxShadow: (theme) => `inset 0 0 0 1px ${theme.palette.divider}`,
            cursor: 'pointer',
            overflow: 'hidden',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <input
            type="color"
            value={normalizedValue}
            onChange={(e) => onChange(e.target.value)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
            }}
          />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            {label}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
            {normalizedValue.toUpperCase()}
          </Typography>
        </Box>
      </Box>

        <Box
          sx={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1.5,
            minWidth: 0,
          }}
      >
        <Box
          sx={{
            width: { xs: '100%', sm: 120 },
            height: 44,
            borderRadius: 1,
            bgcolor: color.main,
            color: color.contrastText,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: 18,
            boxShadow: (theme) => `inset 0 0 0 1px ${theme.palette.divider}`,
            flexShrink: 0,
          }}
        >
          Aa
        </Box>

        <Box sx={{ minHeight: 42, display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
          {hasLowTextContrast ? (
            <Alert
              severity="warning"
              sx={{
                width: '100%',
                py: 0,
                px: 1,
                alignItems: 'center',
                '& .MuiAlert-message': { py: 0.5 },
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Màu này có thể bị mờ khi dùng làm chữ trên nền trắng
                {' '}
                ({formatContrast(textOnWhiteContrast)}, nên đạt từ 4.5:1).
              </Typography>
            </Alert>
          ) : (
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Độ rõ ổn khi dùng màu này làm chữ trên nền trắng.
            </Typography>
          )}
        </Box>
      </Box>

    </Box>
  );
};

const ImagePreviewBox = ({ label, src, sx }) => (
  <Box
    sx={{
      aspectRatio: '1 / 1',
      width: '100%',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1.5,
      bgcolor: 'background.default',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      ...sx,
    }}
  >
    {src ? (
      <Box
        component="img"
        src={src}
        alt={label}
        sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 1 }}
      />
    ) : (
      <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
    )}
  </Box>
);

const HeroBannerPreview = ({ src, sx }) => (
  <Box
    sx={{
      width: '100%',
      minHeight: { xs: 180, md: 0 },
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1.5,
      overflow: 'hidden',
      bgcolor: 'background.default',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...sx,
    }}
  >
    {src ? (
      <Box
        component="img"
        src={src}
        alt="Hero Banner"
        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    ) : (
      <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700 }}>
        Khu vực preview Hero Banner
      </Typography>
    )}
  </Box>
);

const UploadImageButton = ({ label, onUpload, sx }) => (
  <Button
    component="label"
    variant="outlined"
    size="small"
    startIcon={<CloudUploadIcon />}
    fullWidth
    sx={{ textTransform: 'none', alignSelf: 'stretch', ...sx }}
  >
    {label}
    <input type="file" hidden accept="image/*" onChange={async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        onUpload(await fileToBase64(file));
      }
    }} />
  </Button>
);

export default AdminOrganizationMasterDetail;
