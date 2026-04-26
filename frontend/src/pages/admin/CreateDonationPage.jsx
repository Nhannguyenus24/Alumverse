import { useMemo } from 'react';
import { z } from 'zod';
import dayjs from 'dayjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import {
  Autocomplete,
  Box,
  Button,
  Container,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import PublishOutlinedIcon from '@mui/icons-material/PublishOutlined';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Page from '../../components/Page';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';

const mockSupportedBanks = [
  { name: 'Ngân hàng TMCP Công thương Việt Nam', bin: '970415', supported: true },
  { name: 'Ngân hàng TMCP Quân đội', bin: '970422', supported: true },
  { name: 'Ngân hàng TMCP Á Châu', bin: '970416', supported: true },
];

const FUND_RECEIVING_OPTIONS = [
  {
    value: 'fri_001',
    bankName: 'Ngân hàng TMCP Công thương Việt Nam',
    accountNumber: '1029384756',
    binName: '970415',
  },
  {
    value: 'fri_002',
    bankName: 'Ngân hàng TMCP Quân đội',
    accountNumber: '7788991122',
    binName: '970422',
  },
  {
    value: 'fri_003',
    bankName: 'Ngân hàng TMCP Á Châu',
    accountNumber: '2233445566',
    binName: '970416',
  },
];

const createDonationSchema = z
  .object({
    fundName: z.string().trim().min(1, 'Vui lòng nhập tên quỹ quyên góp'),
    organizer: z.string().trim().min(1, 'Vui lòng nhập người tổ chức'),
    status: z.string().min(1, 'Vui lòng chọn trạng thái'),
    fundReceivingInfoId: z.string().min(1, 'Vui lòng chọn tài khoản nhận quỹ'),
    targetAmount: z.coerce
      .number({ message: 'Mục tiêu quyên góp phải là số' })
      .positive('Mục tiêu quyên góp phải lớn hơn 0'),
    reason: z.string().trim().min(1, 'Vui lòng nhập lý do mở quyên góp'),
    startDate: z
      .custom((value) => value === null || dayjs.isDayjs(value), {
        message: 'Vui lòng chọn ngày bắt đầu',
      })
      .refine((value) => value !== null, 'Vui lòng chọn ngày bắt đầu'),
    endDate: z
      .custom((value) => value === null || dayjs.isDayjs(value), {
        message: 'Vui lòng chọn ngày kết thúc',
      })
      .refine((value) => value !== null, 'Vui lòng chọn ngày kết thúc'),
  })
  .superRefine(({ startDate, endDate }, ctx) => {
    if (dayjs.isDayjs(startDate) && dayjs.isDayjs(endDate) && endDate.isBefore(startDate, 'day')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu',
        path: ['endDate'],
      });
    }
  });

const statusOptions = [
  { value: 'important', label: 'Quan trọng' },
  { value: 'remote_area', label: 'Vùng sâu vùng xa' },
];

const defaultValues = {
  fundName: '',
  organizer: '',
  status: '',
  fundReceivingInfoId: '',
  targetAmount: '',
  reason: '',
  startDate: null,
  endDate: null,
};

const CreateDonationPage = () => {
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createDonationSchema),
    defaultValues,
    mode: 'onSubmit',
  });

  const selectedReceivingInfoById = useMemo(() => {
    const map = new Map();
    FUND_RECEIVING_OPTIONS.forEach((option) => {
      map.set(option.value, option);
    });
    return map;
  }, []);

  const onSubmit = async (values) => {
    const selectedReceivingInfo = selectedReceivingInfoById.get(values.fundReceivingInfoId);
    const payload = {
      fundName: values.fundName,
      organizer: values.organizer,
      status: values.status,
      fundReceivingInfoId: values.fundReceivingInfoId,
      binName: selectedReceivingInfo?.binName || '',
      accountNumber: selectedReceivingInfo?.accountNumber || '',
      targetAmount: Number(values.targetAmount),
      reason: values.reason,
      startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
      endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
    };

    console.log('Create donation payload:', payload);
    enqueueSnackbar('Dữ liệu biểu mẫu hợp lệ.', { variant: 'success' });
    // TODO: Call API create fundraising post
  };

  return (
    <Page
      title="Tạo bài đăng quyên góp"
      meta={<meta name="description" content="Tạo bài đăng quyên góp" />}
    >
      <Box sx={{ py: 5, backgroundColor: '#f4f6f8', minHeight: '100%' }}>
        <Container maxWidth="lg">
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              p: { xs: 2.5, md: 4 },
              backgroundColor: '#fff',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
            }}
          >
            <Typography variant="h5" component="h1" fontWeight={700} sx={{ mb: 3 }}>
              Tạo bài đăng quyên góp
            </Typography>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <Box
                  sx={{
                    mb: 3.5,
                    p: { xs: 2, md: 3 },
                    borderRadius: 2,
                    backgroundColor: '#e3f2fd',
                  }}
                >
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5 }}>
                    Thông tin quỹ quyên góp
                  </Typography>

                  <TextField
                    fullWidth
                    label="Tên quỹ quyên góp"
                    placeholder="Nhập tên quỹ quyên góp"
                    {...register('fundName')}
                    error={!!errors.fundName}
                    helperText={errors.fundName?.message}
                    sx={{
                      mb: 2.5,
                      '& .MuiInputBase-input': {
                        fontSize: '1.05rem',
                        fontWeight: 600,
                      },
                    }}
                  />

                  <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Người tổ chức"
                        placeholder="Nhập tên người tổ chức"
                        {...register('organizer')}
                        error={!!errors.organizer}
                        helperText={errors.organizer?.message}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControl fullWidth error={!!errors.status}>
                        <InputLabel id="status-label">Trạng thái</InputLabel>
                        <Controller
                          name="status"
                          control={control}
                          render={({ field }) => (
                            <Select
                              {...field}
                              labelId="status-label"
                              label="Trạng thái"
                              MenuProps={{ disableScrollLock: true }}
                            >
                              {statusOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          )}
                        />
                        <FormHelperText>{errors.status?.message}</FormHelperText>
                      </FormControl>
                    </Grid>
                  </Grid>

                  <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
                    <Grid size={12}>
                      <FormControl fullWidth error={!!errors.fundReceivingInfoId}>
                        <InputLabel id="fund-receiving-info-label">Tài khoản nhận quỹ</InputLabel>
                        <Controller
                          name="fundReceivingInfoId"
                          control={control}
                          render={({ field }) => (
                            <Select
                              {...field}
                              labelId="fund-receiving-info-label"
                              label="Tài khoản nhận quỹ"
                              MenuProps={{ disableScrollLock: true }}
                            >
                              {FUND_RECEIVING_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {`${option.bankName} - ${option.accountNumber}`}
                                </MenuItem>
                              ))}
                            </Select>
                          )}
                        />
                        <FormHelperText>{errors.fundReceivingInfoId?.message}</FormHelperText>
                      </FormControl>
                    </Grid>
                  </Grid>

                  <TextField
                    fullWidth
                    label="Mục tiêu quyên góp (VNĐ)"
                    placeholder="Nhập mục tiêu quyên góp"
                    type="number"
                    {...register('targetAmount')}
                    error={!!errors.targetAmount}
                    helperText={errors.targetAmount?.message}
                    sx={{ mb: 2.5 }}
                  />

                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label="Mô tả"
                    placeholder="Nhập mô tả"
                    {...register('reason')}
                    error={!!errors.reason}
                    helperText={errors.reason?.message}
                    sx={{ mb: 2.5 }}
                  />

                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Controller
                        name="startDate"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            label="Ngày bắt đầu"
                            value={field.value}
                            onChange={field.onChange}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                error: !!errors.startDate,
                                helperText: errors.startDate?.message,
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Controller
                        name="endDate"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            label="Ngày kết thúc"
                            value={field.value}
                            onChange={field.onChange}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                error: !!errors.endDate,
                                helperText: errors.endDate?.message,
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
                  <Button
                    variant="outlined"
                    startIcon={<CloseOutlinedIcon />}
                    onClick={() => navigate('/donations')}
                    sx={{ px: 3, textTransform: 'none' }}
                  >
                    Huỷ
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<PublishOutlinedIcon />}
                    disabled={isSubmitting}
                    sx={{ px: 3, textTransform: 'none' }}
                  >
                    Đăng
                  </Button>
                </Stack>
              </Box>
            </LocalizationProvider>
          </Paper>
        </Container>
      </Box>
    </Page>
  );
};

export default CreateDonationPage;
