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
import { IMAGE_ACCEPT, useUploadImage, validateImageFile } from '../../utils/imageUtils';
import { createBrandColor, DEFAULT_BRAND_COLORS, normalizeHexColor } from '../../theme/palette';
import { useTranslation } from 'react-i18next';
import { normalizeRichTextHtml } from '../../utils/stringUtils';

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
  staffView = false,
}) => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation(['admin', 'common']);
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
      enqueueSnackbar(t('admin:update_personnel_success'), { variant: 'success' });
      onRefreshIntroduction?.();
    } catch (_) {
      enqueueSnackbar(t('admin:update_personnel_error'), { variant: 'error' });
    }
  };

  const handleDeletePersonnel = async (type, index) => {
    if (!selectedOrg || !selectedIntroduction) return;
    if (!window.confirm(t('admin:confirm_delete_personnel'))) return;

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
      enqueueSnackbar(t('admin:org_personnel_deleted'), { variant: 'success' });
      onRefreshIntroduction?.();
    } catch (_) {
      enqueueSnackbar(t('admin:org_personnel_delete_failed'), { variant: 'error' });
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
              {t('admin:org_list_title', { count: filteredOrganizations.length })}
            </Typography>
            {!staffView && (
              <>
                <SearchBar
                  value={orgSearch}
                  onChange={setOrgSearch}
                  placeholder={t('admin:org_search_placeholder')}
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
                  <MenuItem value="ALL">{t('admin:filter_status_all')}</MenuItem>
                  <MenuItem value="ACTIVE">{t('admin:filter_status_active')}</MenuItem>
                  <MenuItem value="INACTIVE">{t('admin:filter_status_inactive')}</MenuItem>
                </TextField>
              </>
            )}
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
                  onClick={() => {
                    if (!staffView) {
                      onSelectOrganizationId(org.id);
                    }
                  }}
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
                      slotProps={{ img: { style: { objectFit: 'contain', width: '100%', height: '100%', padding: '2px' } } }}
                      sx={{ width: 36, height: 36, border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
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
              {t('admin:org_select_prompt')}
            </Typography>
          </Box>
        ) : (
          <Fade in key={selectedOrg.id}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
              <Box sx={{ px: 3, pt: 3, pb: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 1.5, sm: 2 }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
                  <Stack direction="row" spacing={{ xs: 1.5, sm: 2 }} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        maxHeight: { xs: 40, sm: 48, md: 52 },
                        maxWidth: { xs: 72, sm: 88, md: 100 },
                        minWidth: 32,
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      {selectedOrg.logoUrl ? (
                        <Box
                          component="img"
                          src={selectedOrg.logoUrl}
                          alt={selectedOrg.name}
                          sx={{
                            maxHeight: '100%',
                            maxWidth: '100%',
                            width: 'auto',
                            height: 'auto',
                            objectFit: 'contain',
                          }}
                        />
                      ) : (
                        <BusinessOutlinedIcon sx={{ fontSize: { xs: 24, sm: 32 }, color: 'text.secondary' }} />
                      )}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="h5"
                        sx={{
                          fontSize: { xs: '1.15rem', sm: '1.35rem', md: '1.5rem' },
                          fontWeight: 800,
                          lineHeight: 1.25,
                          mb: 0.5,
                        }}
                      >
                        {selectedOrg.name}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>{selectedOrg.slug}</Typography>
                        <AdminStatusChip status={selectedOrg.status} category="organization" />
                      </Stack>
                    </Box>
                  </Stack>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                    sx={{ alignSelf: { xs: 'flex-start', md: 'center' }, flexShrink: 0, mt: { xs: 1, md: 0 } }}
                  >
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditOutlinedIcon />}
                      onClick={() => onEditOrganization(selectedOrg)}
                      sx={{ minHeight: 36, whiteSpace: 'nowrap' }}
                    >
                      {t('admin:org_edit_info_btn')}
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<VisibilityOutlinedIcon />}
                      onClick={() => window.open(`/${selectedOrg.slug}`, '_blank', 'noopener,noreferrer')}
                      disabled={!selectedOrg.slug}
                      sx={{ minHeight: 36, whiteSpace: 'nowrap' }}
                    >
                      {t('admin:org_open_site_btn')}
                    </Button>
                    {!staffView && (
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => onDeleteOrganization(selectedOrg.id)} 
                        sx={{ border: 1, borderColor: 'error.lighter', borderRadius: 1.5, width: 36, height: 36, flexShrink: 0 }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton size="small" onClick={onRefresh} sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, width: 36, height: 36, flexShrink: 0 }}>
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
                  <Tab icon={<InfoOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={t('admin:org_tab_overview')} />
                  <Tab icon={<AutoStoriesOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={t('admin:org_tab_introduction')} />
                  <Tab icon={<SchoolOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={t('admin:org_tab_training')} />
                  <Tab icon={<SettingsOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={t('admin:org_tab_config')} />
                  <Tab icon={<PeopleOutlineIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={t('admin:org_tab_personnel')} />
                </Tabs>
              </Box>

              <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
                {activeTab === 0 && (
                  <Stack spacing={3}>
                    <DetailSection title={t('admin:org_section_basic_info')}>
                      <Grid container spacing={2}>
                        <DetailItem label={t('admin:org_field_system_id')} value={selectedOrg.id} />
                        <DetailItem label="Slug / Alias" value={selectedOrg.slug} />
                        <DetailItem label={t('admin:org_field_created_at')} value={formatOrgDate(selectedOrg.createdAt)} />
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
                        {t('admin:org_edit_intro')}
                      </Button>
                    </Box>
                    <DetailSection title={t('admin:org_intro_content')}>
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
                          overflowWrap: 'break-word',
                          wordBreak: 'break-word',
                          '& img, & img.rich-content-image, & img.ql-content-image': {
                            display: 'block',
                            maxWidth: 'min(100%, 520px) !important',
                            width: 'auto !important',
                            height: 'auto !important',
                            maxHeight: '560px !important',
                            objectFit: 'contain',
                            mx: 'auto',
                            my: 1.5,
                            borderRadius: 2,
                          },
                          '& p': { mb: 1.5, textAlign: 'justify', minHeight: '1.25em' },
                          '& .ql-size-small': { fontSize: '0.85em' },
                          '& .ql-size-large': { fontSize: '1.25em' },
                          '& .ql-size-huge': { fontSize: '1.6em' },
                          '& .ql-align-left, & [style*="text-align: left" i]': { textAlign: 'left !important' },
                          '& .ql-align-center, & [style*="text-align: center" i]': { textAlign: 'center !important' },
                          '& .ql-align-right, & [style*="text-align: right" i]': { textAlign: 'right !important' },
                          '& .ql-align-justify, & [style*="text-align: justify" i]': { textAlign: 'justify !important' },
                        }}
                        dangerouslySetInnerHTML={{ __html: normalizeRichTextHtml(selectedIntroduction?.content || t('admin:org_no_description')) }}
                      />
                    </DetailSection>
                    <Stack spacing={2}>
                      <Box>
                        <Card variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: alpha(theme.palette.success.main, 0.02), border: `1px solid ${alpha(theme.palette.success.main, 0.1)}` }}>
                          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                            <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}><VisibilityRoundedIcon sx={{ fontSize: 18 }} /></Avatar>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'success.main' }}>{t('admin:org_vision')}</Typography>
                          </Stack>
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, lineHeight: 1.6 }}>{selectedIntroduction?.vision || '—'}</Typography>
                        </Card>
                      </Box>
                      <Box>
                        <Card variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.02), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
                          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}><RocketLaunchRoundedIcon sx={{ fontSize: 18 }} /></Avatar>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.dark' }}>{t('admin:org_mission')}</Typography>
                          </Stack>
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, lineHeight: 1.6 }}>{selectedIntroduction?.mission || '—'}</Typography>
                        </Card>
                      </Box>
                      <Box>
                        <Card variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: alpha(theme.palette.error.main, 0.02), border: `1px solid ${alpha(theme.palette.error.main, 0.1)}` }}>
                          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                            <Avatar sx={{ bgcolor: 'error.main', width: 32, height: 32 }}><FavoriteRoundedIcon sx={{ fontSize: 18 }} /></Avatar>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'error.dark' }}>{t('admin:org_core_values')}</Typography>
                          </Stack>
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, lineHeight: 1.6 }}>{selectedIntroduction?.coreValues || '—'}</Typography>
                        </Card>
                      </Box>
                    </Stack>

                    {/* Leaders Section */}
                    {selectedIntroduction?.leaders?.length > 0 && (
                      <DetailSection title={t('admin:org_leadership')}>
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
                      <DetailSection title={t('admin:org_featured_team')}>
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
                    <DetailSection title={t('admin:org_training_programs')}>
                                              <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>{t('admin:org_programs')}</Typography>
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
                              <TextField size="small" placeholder={t('admin:org_add_program')} value={newProgram} onChange={(e) => setNewProgram(e.target.value)} />
                              <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={() => { if (newProgram.trim()) { setProgramList(pl => [...pl, newProgram.trim()]); setNewProgram(''); } }}>{t('admin:add')}</Button>
                              <Button startIcon={<SaveOutlinedIcon />} variant="contained" size="small" onClick={async () => {
                                try {
                                  const remote = await adminOrganizationApi.getPrograms(selectedOrg.id);
                                  const remoteList = Array.isArray(remote) ? remote : [];
                                  const toAdd = programList.filter(p => !remoteList.includes(p));
                                  const toRemove = remoteList.filter(p => !programList.includes(p));
                                  await Promise.all(toAdd.map(v => adminOrganizationApi.addProgram(selectedOrg.id, v)));
                                  await Promise.all(toRemove.map(v => adminOrganizationApi.removeProgram(selectedOrg.id, v)));
                                  enqueueSnackbar(t('admin:org_programs_saved'), { variant: 'success' });
                                  onRefresh?.();
                                } catch (_) {
                                  enqueueSnackbar(t('admin:org_programs_save_failed'), { variant: 'error' });
                                }
                              }}>{t('admin:save')}</Button>
                            </Stack>
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>{t('admin:org_majors')}</Typography>
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
                              <TextField size="small" placeholder={t('admin:org_add_major')} value={newMajor} onChange={(e) => setNewMajor(e.target.value)} />
                              <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={() => { if (newMajor.trim()) { setMajorList(ml => [...ml, newMajor.trim()]); setNewMajor(''); } }}>{t('admin:add')}</Button>
                              <Button startIcon={<SaveOutlinedIcon />} variant="contained" size="small" onClick={async () => {
                                try {
                                  const remote = await adminOrganizationApi.getMajors(selectedOrg.id);
                                  const remoteList = Array.isArray(remote) ? remote : [];
                                  const toAdd = majorList.filter(p => !remoteList.includes(p));
                                  const toRemove = remoteList.filter(p => !majorList.includes(p));
                                  await Promise.all(toAdd.map(v => adminOrganizationApi.addMajor(selectedOrg.id, v)));
                                  await Promise.all(toRemove.map(v => adminOrganizationApi.removeMajor(selectedOrg.id, v)));
                                  enqueueSnackbar(t('admin:org_majors_saved'), { variant: 'success' });
                                  onRefresh?.();
                                } catch (_) {
                                  enqueueSnackbar(t('admin:org_majors_save_failed'), { variant: 'error' });
                                }
                              }}>{t('admin:save')}</Button>
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
                        {t('admin:org_training_save_note')}
                      </Typography>
                    </Box>
                  </Stack>
                )}

                {activeTab === 3 && (
                  <Stack spacing={3}>
                    <DetailSection title={t('admin:org_feature_config')}>
                      <List sx={{ p: 0 }}>
                        {(() => {
                          const config = selectedOrg.featuresConfig
                            ? (typeof selectedOrg.featuresConfig === 'string' ? JSON.parse(selectedOrg.featuresConfig) : selectedOrg.featuresConfig)
                            : { mentorship: true, job: true, fund: true, events: true, forum: true };

                          const featureLabels = {
                            mentorship: t('admin:org_feat_mentorship'),
                            job: t('admin:org_feat_jobs'),
                            fund: t('admin:org_feat_fundraising'),
                            events: t('admin:org_feat_events'),
                            forum: t('admin:org_feat_forum'),
                            fitbot: t('admin:org_feat_fitbot'),
                          };
                          const featureKeys = Object.keys(featureLabels);

                          const handleToggle = async (key) => {
                            try {
                              await adminOrganizationApi.toggleFeature(selectedOrg.id, key);
                              enqueueSnackbar(t('admin:org_feature_updated', { name: featureLabels[key] }), { variant: 'success' });
                              onRefresh?.();
                            } catch (_) {
                              enqueueSnackbar(t('admin:org_feature_update_failed'), { variant: 'error' });
                            }
                          };

                          return featureKeys.map((key, idx) => (
                            <Box key={key} sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              py: 1.5,
                              px: 1,
                              borderBottom: idx !== featureKeys.length - 1 ? 1 : 0,
                              borderColor: 'divider'
                            }}>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                  {featureLabels[key]}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {t('admin:org_feature_toggle_desc', { feature: featureLabels[key].toLowerCase() })}
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
                      <DetailSection title={t('admin:org_ui_config')}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                            {t('admin:org_colors')}
                          </Typography>

                          <Stack spacing={1.5}>
                            <ColorBlock
                              label={t('admin:org_color_primary')}
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
                              label={t('admin:org_color_secondary')}
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
                              label={t('admin:org_color_accent')}
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
                            {t('admin:org_images')}
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
                                  enqueueSnackbar(t('admin:org_ui_saved'), { variant: 'success' });
                                  onRefresh?.();
                                } catch (_) {
                                  enqueueSnackbar(t('admin:save_failed'), { variant: 'error' });
                                }
                              }}
                          >
                            {t('admin:org_save_ui')}
                          </Button>
                        </Box>
                      </DetailSection>
                  </Stack>
                )}

                {activeTab === 4 && (
                  <Stack spacing={3}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="overline" sx={{ color: 'text.disabled', fontWeight: 800 }}>
                        {t('admin:org_manage_personnel')}
                      </Typography>
                    </Box>

                    {/* Section: Leaders */}
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight={800}>{t('admin:org_leaders')}</Typography>
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => handleOpenPersonnelDialog('leaders')}
                        >
                          {t('admin:org_add_leader')}
                        </Button>
                      </Stack>
                      {!selectedIntroduction?.leaders?.length ? (
                        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', mb: 2 }}>{t('admin:org_no_leaders')}</Typography>
                      ) : (
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell sx={{ fontWeight: 700 }}>{t('admin:full_name')}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{t('admin:position')}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>{t('admin:actions')}</TableCell>
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
                        <Typography variant="subtitle1" fontWeight={800}>{t('admin:org_featured_staff')}</Typography>
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => handleOpenPersonnelDialog('teamMembers')}
                        >
                          {t('admin:org_add_member')}
                        </Button>
                      </Stack>
                      {!selectedIntroduction?.teamMembers?.length ? (
                        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>{t('admin:org_no_staff')}</Typography>
                      ) : (
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell sx={{ fontWeight: 700 }}>{t('admin:full_name')}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{t('admin:position')}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>{t('admin:actions')}</TableCell>
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
                title={personnelDialog.type === 'leaders' ? t('admin:org_leader_info') : t('admin:org_staff_info')}
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
  const { t } = useTranslation(['admin']);
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
                {t('admin:org_color_low_contrast')}
                {' '}
                {t('admin:org_color_contrast_note', { ratio: formatContrast(textOnWhiteContrast) })}
              </Typography>
            </Alert>
          ) : (
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {t('admin:org_color_good_contrast')}
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

const HeroBannerPreview = ({ src, sx }) => {
  const { t } = useTranslation(['admin']);
  return (
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
          {t('admin:org_hero_preview')}
        </Typography>
      )}
    </Box>
  );
};

// Uploads the picked image through the image service and passes the hosted URL
// (never a base64 data URL) up to the caller, so brand assets stored in the DB
// only hold links.
const UploadImageButton = ({ label, onUpload, sx }) => {
  const { t } = useTranslation(['common']);
  const { enqueueSnackbar } = useSnackbar();
  const { uploadFile, isPending } = useUploadImage();

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const validation = validateImageFile(file, t);
    if (!validation.valid) {
      enqueueSnackbar(validation.message, { variant: 'error' });
      return;
    }

    try {
      const url = await uploadFile(file);
      if (!url) throw new Error('empty_url');
      onUpload(url);
    } catch (error) {
      enqueueSnackbar(
        error?.response?.data?.message ?? t('common:image_upload_error'),
        { variant: 'error' },
      );
    }
  };

  return (
    <Button
      component="label"
      variant="outlined"
      size="small"
      startIcon={<CloudUploadIcon />}
      fullWidth
      disabled={isPending}
      sx={{ textTransform: 'none', alignSelf: 'stretch', ...sx }}
    >
      {label}
      <input type="file" hidden accept={IMAGE_ACCEPT} onChange={handleChange} />
    </Button>
  );
};

export default AdminOrganizationMasterDetail;
