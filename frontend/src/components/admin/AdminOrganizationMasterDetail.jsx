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
import AdminStatusChip from './AdminStatusChip';
import { useState, useMemo, useEffect } from 'react';
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
  onRefresh,
}) => {
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
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary', lineHeight: 1.6 }}>
                        {selectedIntroduction?.content || 'Chưa có mô tả chi tiết.'}
                      </Typography>
                    </DetailSection>
                    <Grid container spacing={2.5}>
                      <Grid item xs={12} md={4}>
                        <DetailSection title="Tầm nhìn">
                          <Typography variant="body2">{selectedIntroduction?.vision || '—'}</Typography>
                        </DetailSection>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <DetailSection title="Sứ mạng">
                          <Typography variant="body2">{selectedIntroduction?.mission || '—'}</Typography>
                        </DetailSection>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <DetailSection title="Giá trị cốt lõi">
                          <Typography variant="body2">{selectedIntroduction?.coreValues || '—'}</Typography>
                        </DetailSection>
                      </Grid>
                    </Grid>
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
                    <DetailSection title="Cấu hình hệ thống (JSON)">
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: 'grey.900',
                          color: 'common.white',
                          fontFamily: 'monospace',
                          fontSize: 12,
                          overflowX: 'auto',
                        }}
                      >
                        <pre style={{ margin: 0 }}>
                          {selectedOrg.featuresConfig
                            ? JSON.stringify(JSON.parse(selectedOrg.featuresConfig), null, 2)
                            : '// Sử dụng cấu hình mặc định'}
                        </pre>
                      </Paper>
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
