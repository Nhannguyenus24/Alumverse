import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
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
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
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

const mockMemberPreview = (org) => {
  const seed = org.id * 7;
  const names = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Minh C', 'Phạm Thu D', 'Hoàng An E'];
  return names.slice(0, 4).map((name, i) => ({
    id: `${org.id}-${i}`,
    name,
    role: i === 0 ? 'Lead' : 'Member',
    joined: `${((seed + i) % 27) + 1}/${((seed + i) % 11) + 1}/2025`,
  }));
};

const mockRecentActivity = (org) => {
  return [
    { id: '1', text: 'Cập nhật mô tả nhóm', when: '2 ngày trước' },
    { id: '2', text: `${org.pendingMembers ?? 0} yêu cầu tham gia đang chờ duyệt`, when: '5 ngày trước' },
    { id: '3', text: 'Sự kiện networking được đăng', when: '1 tuần trước' },
  ];
};

const AdminOrganizationMasterDetail = ({
  organizations = [],
  selectedOrganizationId,
  onSelectOrganizationId,
  onDemoAction,
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

  const selectedOrganization = useMemo(() => {
    if (filteredOrganizations.length === 0) {
      return null;
    }
    const match = filteredOrganizations.find((o) => o.id === selectedOrganizationId);
    if (match) {
      return organizations.find((o) => o.id === selectedOrganizationId) ?? match;
    }
    return organizations.find((o) => o.id === filteredOrganizations[0].id) ?? filteredOrganizations[0];
  }, [organizations, filteredOrganizations, selectedOrganizationId]);

  const membersPreview = selectedOrganization ? mockMemberPreview(selectedOrganization) : [];
  const recentActivity = selectedOrganization ? mockRecentActivity(selectedOrganization) : [];

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
        {!selectedOrganization ? (
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
            <Box key={selectedOrganization.id} sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
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
                      {selectedOrganization.name}
                    </Typography>
                    <AdminStatusChip status={selectedOrganization.status} category="organization" />
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditOutlinedIcon />}
                      onClick={() => onDemoAction?.('edit', selectedOrganization)}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      Chỉnh sửa
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color={selectedOrganization.status === 'ACTIVE' ? 'warning' : 'success'}
                      startIcon={
                        selectedOrganization.status === 'ACTIVE' ? (
                          <BlockOutlinedIcon />
                        ) : (
                          <CheckCircleOutlineIcon />
                        )
                      }
                      onClick={() => onDemoAction?.('toggle', selectedOrganization)}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      {selectedOrganization.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<VisibilityOutlinedIcon />}
                      onClick={() => onDemoAction?.('details', selectedOrganization)}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      Xem đầy đủ
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
                        { label: 'Members', value: selectedOrganization.members ?? 0 },
                        { label: 'Pending members', value: selectedOrganization.pendingMembers ?? 0 },
                        { label: 'Created', value: formatOrgDate(selectedOrganization.createdAt) },
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
                  </Paper>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700, mb: 1 }}>
                    Thành viên (xem nhanh)
                  </Typography>
                  <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    {membersPreview.map((m, idx) => (
                      <Box
                        key={m.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          px: 2,
                          py: 1.25,
                          borderTop: idx === 0 ? 0 : 1,
                          borderColor: 'divider',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                          <Avatar sx={{ width: 30, height: 30, fontSize: 13, bgcolor: 'primary.main' }}>
                            {m.name.charAt(0)}
                          </Avatar>
                          <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                              {m.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {m.role}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {m.joined}
                        </Typography>
                      </Box>
                    ))}
                    <Box sx={{ px: 2, py: 1.25, borderTop: 1, borderColor: 'divider' }}>
                      <Button
                        size="small"
                        onClick={() => onDemoAction?.('details', selectedOrganization)}
                        sx={{ textTransform: 'none', p: 0, minWidth: 0, fontWeight: 700 }}
                      >
                        Xem tất cả thành viên
                      </Button>
                    </Box>
                  </Paper>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700, mb: 1 }}>
                    Hoạt động gần đây
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 0, borderRadius: 2 }}>
                    {recentActivity.map((item, idx) => (
                      <Box
                        key={item.id}
                        sx={{
                          px: 2,
                          py: 1.25,
                          borderTop: idx === 0 ? 0 : 1,
                          borderColor: 'divider',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 2,
                        }}
                      >
                        <Typography variant="body2">{item.text}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                          {item.when}
                        </Typography>
                      </Box>
                    ))}
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
