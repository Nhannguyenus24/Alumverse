import { useState, useEffect } from 'react';
import { z } from 'zod';
import dayjs from 'dayjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import {
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
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import Page from '../../components/Page';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { fundApi } from '../../api/fundApi';
import useOrganizationStore from '../../stores/organizationStore';

const createDonationSchema = z
  .object({
    fundName: z.string().trim().min(1, 'Vui lòng nhập tên quỹ quyên góp'),
    organizer: z.string().trim().min(1, 'Vui lòng nhập người tổ chức'),
    logoUrl: z
      .string()
      .trim()
      .max(255, 'Logo URL tối đa 255 ký tự')
      .refine((value) => value === '' || z.string().url().safeParse(value).success, 'Logo URL không hợp lệ'),
    statusId: z.coerce.number().int().positive('Vui lòng chọn trạng thái'),
    fundReceivingInfoId: z.coerce.number().int().positive('Vui lòng chọn tài khoản nhận quỹ'),
    targetAmount: z.coerce
      .number({ message: 'Mục tiêu quyên góp phải là số' })
      .positive('Mục tiêu quyên góp phải lớn hơn 0'),
    descriptionShort: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập mô tả ngắn')
      .max(120, 'Mô tả ngắn tối đa 120 ký tự'),
    descriptionFull: z.string().trim().min(1, 'Vui lòng nhập mô tả'),
    startDate: z
      .custom((value) => value === null || dayjs.isDayjs(value), {
        message: 'Vui lòng chọn thời gian bắt đầu',
      })
      .refine((value) => value !== null, 'Vui lòng chọn thời gian bắt đầu'),
    endDate: z
      .custom((value) => value === null || dayjs.isDayjs(value), {
        message: 'Vui lòng chọn thời gian kết thúc',
      })
      .refine((value) => value !== null, 'Vui lòng chọn thời gian kết thúc'),
  })
  .superRefine(({ startDate, endDate }, ctx) => {
    if (!dayjs.isDayjs(startDate) || !dayjs.isDayjs(endDate)) {
      return;
    }

    const nowPlusOneHour = dayjs().add(1, 'hour');
    if (startDate.isBefore(nowPlusOneHour)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Thời gian bắt đầu phải từ hiện tại + 1 giờ',
        path: ['startDate'],
      });
    }

    if (endDate.isBefore(startDate.add(1, 'hour'))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Thời gian kết thúc phải sau thời gian bắt đầu ít nhất 1 giờ',
        path: ['endDate'],
      });
    }
  });

const defaultValues = {
  fundName: '',
  organizer: '',
  logoUrl: '',
  statusId: '',
  fundReceivingInfoId: '',
  targetAmount: '',
  descriptionShort: '',
  descriptionFull: '',
  startDate: null,
  endDate: null,
};

const CreateDonationPage = () => {
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const organizationId = useOrganizationStore((state) => state.organization?.id ?? null);
  const [statusOptions, setStatusOptions] = useState([]);
  const [receivingOptions, setReceivingOptions] = useState([]);

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

  useEffect(() => {
    let mounted = true;

    const loadOptions = async () => {
      try {
        const [statuses, receivingInfos] = await Promise.all([
          fundApi.getFundStatuses(),
          fundApi.getActiveFundReceivingInfos(),
        ]);

        if (!mounted) {
          return;
        }

        setStatusOptions(statuses ?? []);
        setReceivingOptions(receivingInfos ?? []);
      } catch (error) {
        enqueueSnackbar(error?.response?.data?.message || 'Không tải được dữ liệu biểu mẫu', {
          variant: 'error',
        });
      }
    };

    loadOptions();

    return () => {
      mounted = false;
    };
  }, [enqueueSnackbar]);

  const onSubmit = async (values) => {
    if (!organizationId) {
      enqueueSnackbar('Không tìm thấy tổ chức để tạo quỹ', { variant: 'error' });
      return;
    }

    const payload = {
      name: values.fundName,
      managerName: values.organizer,
      logoUrl: values.logoUrl?.trim() || null,
      status_id: Number(values.statusId),
      fundReceivingInfoId: Number(values.fundReceivingInfoId),
      targetAmount: Number(values.targetAmount),
      description_short: values.descriptionShort,
      description_full: values.descriptionFull,
      organizationId: Number(organizationId),
      timeStarted: values.startDate ? values.startDate.format('YYYY-MM-DDTHH:mm:ss') : null,
      timeEnded: values.endDate ? values.endDate.format('YYYY-MM-DDTHH:mm:ss') : null,
    };

    await fundApi.createFund(payload);
    enqueueSnackbar('Tạo quỹ quyên góp thành công.', { variant: 'success' });
    navigate('/donations');
  };

  return (
    <Page
      title="Tạo bài đăng quyên góp"
      meta={<meta name="description" content="Tạo bài đăng quyên góp" />}
    >
      <Box sx={{ py: 5, backgroundColor: '#f4f6f8', minHeight: '100%' }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 1.5 }}>
            <Button
              variant="contained"
              onClick={() => navigate('/donations')}
              sx={{ borderRadius: 999, px: 2.2, textTransform: 'none', fontWeight: 700 }}
            >
              Quay lại donation page
            </Button>
          </Box>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              p: { xs: 2.5, md: 4 },
              backgroundColor: '#fff',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
            }}
          >
            <Typography variant="h1" component="h1" fontWeight={700} sx={{ mb: 3 }}>
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
                      <TextField
                        fullWidth
                        label="Logo URL"
                        placeholder="https://example.com/logo.png"
                        {...register('logoUrl')}
                        error={!!errors.logoUrl}
                        helperText={errors.logoUrl?.message}
                      />
                    </Grid>
                  </Grid>

                  <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControl fullWidth error={!!errors.statusId}>
                        <InputLabel id="status-label">Trạng thái</InputLabel>
                        <Controller
                          name="statusId"
                          control={control}
                          render={({ field }) => (
                            <Select
                              {...field}
                              onChange={(event) => field.onChange(Number(event.target.value))}
                              labelId="status-label"
                              label="Trạng thái"
                              MenuProps={{ disableScrollLock: true }}
                            >
                              {statusOptions.map((option) => (
                                <MenuItem key={option.id} value={option.id}>
                                  {option.name}
                                </MenuItem>
                              ))}
                            </Select>
                          )}
                        />
                        <FormHelperText>{errors.statusId?.message}</FormHelperText>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControl fullWidth error={!!errors.fundReceivingInfoId}>
                        <InputLabel id="fund-receiving-info-label">Tài khoản nhận quỹ</InputLabel>
                        <Controller
                          name="fundReceivingInfoId"
                          control={control}
                          render={({ field }) => (
                            <Select
                              {...field}
                              onChange={(event) => field.onChange(Number(event.target.value))}
                              labelId="fund-receiving-info-label"
                              label="Tài khoản nhận quỹ"
                              MenuProps={{ disableScrollLock: true }}
                            >
                              {receivingOptions.map((option) => (
                                <MenuItem key={option.id} value={option.id}>
                                  {`${option.bankName} - ${option.accountName} - ${option.accountNumber}`}
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
                    label="Số tiền mục tiêu để quyên góp (VNĐ)"
                    placeholder="Nhập số tiền mục tiêu"
                    type="number"
                    {...register('targetAmount')}
                    error={!!errors.targetAmount}
                    helperText={errors.targetAmount?.message}
                    sx={{ mb: 2.5 }}
                  />

                  <TextField
                    fullWidth
                    label="Mô tả ngắn (tối đa 120 ký tự)"
                    placeholder="Nhập mô tả ngắn"
                    {...register('descriptionShort')}
                    inputProps={{ maxLength: 120 }}
                    error={!!errors.descriptionShort}
                    helperText={errors.descriptionShort?.message}
                    sx={{ mb: 2.5 }}
                  />

                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label="Mô tả"
                    placeholder="Nhập mô tả"
                    {...register('descriptionFull')}
                    error={!!errors.descriptionFull}
                    helperText={errors.descriptionFull?.message}
                    sx={{ mb: 2.5 }}
                  />

                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Controller
                        name="startDate"
                        control={control}
                        render={({ field }) => (
                          <DateTimePicker
                            label="Thời gian bắt đầu"
                            value={field.value}
                            onChange={field.onChange}
                            views={['year', 'month', 'day', 'hours', 'minutes', 'seconds']}
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
                          <DateTimePicker
                            label="Thời gian kết thúc"
                            value={field.value}
                            onChange={field.onChange}
                            views={['year', 'month', 'day', 'hours', 'minutes', 'seconds']}
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
