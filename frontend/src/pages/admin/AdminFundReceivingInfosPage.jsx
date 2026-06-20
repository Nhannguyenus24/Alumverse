import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';
import { useSnackbar } from 'notistack';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import AdminDataTable from '../../components/admin/AdminDataTable';
import AdminStatusChip from '../../components/admin/AdminStatusChip';
import useAdminFundReceivingInfosData from '../../hooks/admin/useAdminFundReceivingInfosData';
import { fundApi } from '../../utils/api';

const initialForm = {
  accountNumber: '',
  accountName: '',
  bankName: '',
};

const getBankLabel = (bank) => {
  const shortName = bank?.short_name || bank?.shortName;
  const code = bank?.code;
  const name = bank?.name;
  if (shortName && code) return `${shortName} (${code})`;
  return name || code || '-';
};

const AdminFundReceivingInfosPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { setBreadcrumbs } = useOutletContext();
  const [banksPayload, setBanksPayload] = useState({ message: '', banks: [] });
  const [banksLoading, setBanksLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    accounts,
    totalCount,
    loading,
    loadError,
    search,
    setSearch,
    submitSearch,
    searchQuery,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    reload,
  } = useAdminFundReceivingInfosData();

  useEffect(() => {
    setBreadcrumbs?.([
      { label: 'Quyên góp', path: '/admin/fundraising' },
      { label: 'Tài khoản ngân hàng', active: true },
    ]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    const loadBanks = async () => {
      setBanksLoading(true);
      try {
        const data = await fundApi.getSupportedBanks();
        setBanksPayload({
          message: data?.message || 'Chỉ các ngân hàng được hỗ trợ mới có thể dùng cho quyên góp.',
          banks: data?.banks ?? [],
        });
      } catch {
        setBanksPayload({
          message: 'Không thể tải danh sách ngân hàng được hỗ trợ.',
          banks: [],
        });
      } finally {
        setBanksLoading(false);
      }
    };

    loadBanks();
  }, []);

  const bankLabelByCode = useMemo(() => {
    const map = new Map();
    (banksPayload.banks || []).forEach((bank) => {
      if (bank?.code) {
        map.set(bank.code, getBankLabel(bank));
      }
    });
    return map;
  }, [banksPayload.banks]);

  const columns = useMemo(
    () => [
      {
        id: 'bankName',
        label: 'Ngân hàng',
        render: (_, row) => bankLabelByCode.get(row.bankName) || row.bankName || '-',
      },
      { id: 'accountName', label: 'Tên tài khoản' },
      { id: 'accountNumber', label: 'Số tài khoản' },
      {
        id: 'isActive',
        label: 'Trạng thái',
        render: (_, row) => (
          <AdminStatusChip
            label={row.active || row.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
            status={row.active || row.isActive ? 'ACTIVE' : 'INACTIVE'}
          />
        ),
      },
    ],
    [bankLabelByCode],
  );

  const handleOpenCreateDialog = () => {
    setCreateForm(initialForm);
    setCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    if (isSubmitting) return;
    setCreateDialogOpen(false);
  };

  const handleInputChange = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateAccount = async (event) => {
    event.preventDefault();

    const accountNumber = createForm.accountNumber.trim();
    const accountName = createForm.accountName.trim();
    const bankName = createForm.bankName.trim();

    if (accountNumber.length < 3) {
      enqueueSnackbar('Số tài khoản phải có ít nhất 3 ký tự', { variant: 'warning' });
      return;
    }
    if (accountName.length < 3) {
      enqueueSnackbar('Tên tài khoản phải có ít nhất 3 ký tự', { variant: 'warning' });
      return;
    }
    if (!bankName) {
      enqueueSnackbar('Vui lòng chọn ngân hàng', { variant: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      await fundApi.createFundReceivingInfo({
        accountNumber,
        accountName,
        bankName,
      });
      enqueueSnackbar('Đã thêm tài khoản ngân hàng', { variant: 'success' });
      setCreateDialogOpen(false);
      setCreateForm(initialForm);
      reload();
    } catch (error) {
      enqueueSnackbar(
        error?.response?.data?.message || 'Không thể thêm tài khoản ngân hàng',
        { variant: 'error' },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
            Tài khoản ngân hàng
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, fontWeight: 500 }}
          >
            Quản lý tài khoản nhận quỹ dùng cho các chiến dịch gây quỹ.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddOutlinedIcon />}
          onClick={handleOpenCreateDialog}
          disabled={banksLoading || banksPayload.banks.length === 0}
        >
          Thêm tài khoản
        </Button>
      </Stack>

      <Alert
        severity="info"
        icon={<AccountBalanceOutlinedIcon fontSize="inherit" />}
        sx={{ mb: 3, borderRadius: 2 }}
      >
        <Typography variant="body2">{banksPayload.message}</Typography>
        {!banksLoading && banksPayload.banks.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              mt: 1.5,
            }}
          >
            {banksPayload.banks.map((bank) => (
              <Chip
                key={bank.code}
                label={getBankLabel(bank)}
                size="small"
                variant="outlined"
                sx={{
                  bgcolor: 'background.paper',
                  fontWeight: 600,
                }}
              />
            ))}
          </Box>
        )}
      </Alert>

      {loadError && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          Không thể tải danh sách tài khoản ngân hàng.
        </Alert>
      )}

      <AdminDataTable
        columns={columns}
        rows={accounts}
        totalCount={totalCount}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, nextPage) => setPage(nextPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(Number(event.target.value));
          setPage(0);
        }}
        searchValue={search}
        onSearchChange={setSearch}
        onSearchKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            submitSearch();
          }
        }}
        searchPlaceholder="Tìm theo ngân hàng, tên hoặc số tài khoản... (Enter để tìm)"
        emptyMessage={
          loading
            ? 'Đang tải...'
            : searchQuery
              ? 'Không tìm thấy tài khoản phù hợp.'
              : 'Chưa có tài khoản ngân hàng nào.'
        }
      />

      <Dialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={handleCreateAccount}>
          <DialogTitle sx={{ fontWeight: 800 }}>Thêm tài khoản ngân hàng</DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <FormControl fullWidth required>
                <InputLabel id="bank-name-label">Ngân hàng</InputLabel>
                <Select
                  labelId="bank-name-label"
                  label="Ngân hàng"
                  value={createForm.bankName}
                  onChange={(event) => handleInputChange('bankName', event.target.value)}
                  MenuProps={{ disableScrollLock: true }}
                >
                  {banksPayload.banks.map((bank) => (
                    <MenuItem key={bank.code} value={bank.code}>
                      {getBankLabel(bank)}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Chỉ chọn ngân hàng nằm trong danh sách được hỗ trợ.</FormHelperText>
              </FormControl>

              <TextField
                fullWidth
                required
                label="Tên tài khoản"
                placeholder="VD: HCMUS Student Scholarship Fund"
                value={createForm.accountName}
                onChange={(event) => handleInputChange('accountName', event.target.value)}
                inputProps={{ minLength: 3, maxLength: 255 }}
              />

              <TextField
                fullWidth
                required
                label="Số tài khoản"
                placeholder="VD: 1234567890"
                value={createForm.accountNumber}
                onChange={(event) => handleInputChange('accountNumber', event.target.value)}
                inputProps={{ minLength: 3, maxLength: 255 }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={handleCloseCreateDialog} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Thêm tài khoản'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default AdminFundReceivingInfosPage;
