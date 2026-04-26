import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Fade,
  InputAdornment,
  MenuItem,
  Paper,
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
import AdminStatusChip from './AdminStatusChip';

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
  onSelectOrganizationId,
  onEditOrganization,
  onRefresh,
}) => {
  const [orgSearch, setOrgSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: 2.5,
        minHeight: { xs: 'auto', lg: 520 },
        '@media (max-width:1100px)': {
          flexDirection: 'column',
        },
      }}
    >
      <Card
        elevation={0}
        sx={{
          flex: '0 0 38%',
          maxWidth: '40%',
          minWidth: 280,
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          '@media (max-width:1100px)': {
            flex: '1 1 auto',
            maxWidth: '100%',
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.75,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.neutral',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
            Danh sách tổ chức
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
            label="Lọc theo trạng thái"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="ALL">Tất cả</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="INACTIVE">Inactive</MenuItem>
          </TextField>
        </Box>
        <TableContainer sx={{ flex: 1, maxHeight: { xs: 360, lg: 'calc(100vh - 320px)' } }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrganizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={1}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      Không có tổ chức phù hợp bộ lọc.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrganizations.map((org) => {
                  const isSelected = org.id === selectedOrganizationId;
                  return (
                    <TableRow
                      key={org.id}
                      hover
                      selected={isSelected}
                      onClick={() => onSelectOrganizationId(org.id)}
                      sx={{
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                        '&.Mui-selected': {
                          bgcolor: 'action.selected',
                          '&:hover': { bgcolor: 'action.selected' },
                        },
                        '&:hover': {
                          bgcolor: isSelected ? 'action.selected' : 'action.hover',
                        },
                      }}
                    >
                      <TableCell sx={{ fontWeight: isSelected ? 700 : 600 }}>{org.name}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Card
        elevation={0}
        sx={{
          flex: '1 1 62%',
          minWidth: 0,
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          '@media (max-width:1100px)': {
            flex: '1 1 auto',
          },
        }}
      >
        {!selectedOrg ? (
          <CardContent
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              px: 3,
              textAlign: 'center',
            }}
          >
            <BusinessOutlinedIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600, maxWidth: 400 }}>
              Chọn một tổ chức từ danh sách bên trái để xem chi tiết
            </Typography>
          </CardContent>
        ) : (
          <Fade in timeout={280}>
            <Box key={selectedOrg.id} sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <Box
                sx={{
                  px: 2.5,
                  py: 2.25,
                  borderBottom: 1,
                  borderColor: 'divider',
                  bgcolor: 'background.neutral',
                }}
              >
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flexWrap: 'wrap' }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.25 }}>
                      {selectedOrg.name}
                    </Typography>
                    <AdminStatusChip status={selectedOrg.status} category="organization" />
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditOutlinedIcon />}
                      onClick={() => onEditOrganization?.(selectedOrg)}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      Chỉnh sửa
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<RefreshOutlinedIcon />}
                      onClick={onRefresh}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      Tải lại
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<VisibilityOutlinedIcon />}
                      onClick={() => window.open(`/admin/organizations/${selectedOrg.id}`, '_blank')}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      ID: {selectedOrg.id}
                    </Button>
                  </Box>
                </Box>
              </Box>

              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box>
                  <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700, mb: 1.5 }}>
                    Thông tin cơ bản
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {[
                        { label: 'Slug', value: selectedOrg.slug || '—' },
                        { label: 'Created', value: formatOrgDate(selectedOrg.createdAt) },
                        { label: 'Logo URL', value: selectedOrg.logoUrl || '—' },
                      ].map((row) => (
                        <Box key={row.label} sx={{ flex: '1 1 180px', minWidth: 160 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            {row.label}
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.25 }}>
                            {row.value}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Programs
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedPrograms.length > 0 ? selectedPrograms.join(', ') : 'Chưa cấu hình'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mt: 0.5 }}>
                        Majors
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedMajors.length > 0 ? selectedMajors.join(', ') : 'Chưa cấu hình'}
                      </Typography>
                    </Box>
                  </Paper>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700, mb: 1 }}>
                    Cấu hình dữ liệu
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Features config
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5, wordBreak: 'break-word' }}>
                      {selectedOrg.featuresConfig || 'Chưa có dữ liệu'}
                    </Typography>
                  </Paper>
                </Box>
              </CardContent>
            </Box>
          </Fade>
        )}
      </Card>
    </Box>
  );
};

export default AdminOrganizationMasterDetail;
