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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('admin');
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
      { label: t('nav_fundraising'), path: '/admin/donations' },
      { label: t('nav_bank_accounts'), active: true },
    ]);
  }, [setBreadcrumbs, t]);

  useEffect(() => {
    const loadBanks = async () => {
      setBanksLoading(true);
      try {
        const data = await fundApi.getSupportedBanks();
        setBanksPayload({
          message: data?.message || t('fund_bank_supported_message'),
          banks: data?.banks ?? [],
        });
      } catch {
        setBanksPayload({
          message: t('fund_bank_load_error'),
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
        label: t('fund_col_bank'),
        render: (_, row) => bankLabelByCode.get(row.bankName) || row.bankName || '-',
      },
      { id: 'accountName', label: t('fund_col_account_name') },
      { id: 'accountNumber', label: t('fund_col_account_number') },
      {
        id: 'isActive',
        label: t('fund_col_status'),
        render: (_, row) => (
          <AdminStatusChip
            label={row.active || row.isActive ? t('fund_account_active') : t('fund_account_inactive')}
            status={row.active || row.isActive ? 'ACTIVE' : 'INACTIVE'}
          />
        ),
      },
    ],
    [bankLabelByCode, t],
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
      enqueueSnackbar(t('fund_account_number_min_length'), { variant: 'warning' });
      return;
    }
    if (accountName.length < 3) {
      enqueueSnackbar(t('fund_account_name_min_length'), { variant: 'warning' });
      return;
    }
    if (!bankName) {
      enqueueSnackbar(t('fund_select_bank_required'), { variant: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      await fundApi.createFundReceivingInfo({
        accountNumber,
        accountName,
        bankName,
      });
      enqueueSnackbar(t('fund_account_created'), { variant: 'success' });
      setCreateDialogOpen(false);
      setCreateForm(initialForm);
      reload();
    } catch (error) {
      enqueueSnackbar(
        error?.response?.data?.message || t('fund_account_create_failed'),
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
            {t('fund_bank_accounts_title')}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, fontWeight: 500 }}
          >
            {t('fund_bank_accounts_subtitle')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddOutlinedIcon />}
          onClick={handleOpenCreateDialog}
          disabled={banksLoading || banksPayload.banks.length === 0}
        >
          {t('fund_btn_add_account')}
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
          {t('fund_account_list_load_error')}
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
        searchPlaceholder={t('fund_bank_search_placeholder')}
        emptyMessage={
          loading
            ? t('fund_loading')
            : searchQuery
              ? t('fund_account_not_found')
              : t('fund_account_empty')
        }
      />

      <Dialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={handleCreateAccount}>
          <DialogTitle sx={{ fontWeight: 800 }}>{t('fund_add_account_dialog_title')}</DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <FormControl fullWidth required>
                <InputLabel id="bank-name-label">{t('fund_col_bank')}</InputLabel>
                <Select
                  labelId="bank-name-label"
                  label={t('fund_col_bank')}
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
                <FormHelperText>{t('fund_bank_helper_text')}</FormHelperText>
              </FormControl>

              <TextField
                fullWidth
                required
                label={t('fund_col_account_name')}
                placeholder="VD: HCMUS Student Scholarship Fund"
                value={createForm.accountName}
                onChange={(event) => handleInputChange('accountName', event.target.value)}
                inputProps={{ minLength: 3, maxLength: 255 }}
              />

              <TextField
                fullWidth
                required
                label={t('fund_col_account_number')}
                placeholder="VD: 1234567890"
                value={createForm.accountNumber}
                onChange={(event) => handleInputChange('accountNumber', event.target.value)}
                inputProps={{ minLength: 3, maxLength: 255 }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button
              onClick={handleCloseCreateDialog}
              variant="outlined"
              color="secondary"
              disabled={isSubmitting}
            >
              {t('fund_btn_cancel')}
            </Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? t('fund_btn_saving') : t('fund_btn_add_account')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default AdminFundReceivingInfosPage;
