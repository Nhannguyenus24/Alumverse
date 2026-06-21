import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Box, Button, CircularProgress, Container, Paper, Stack, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import WorkIcon from '@mui/icons-material/Work';

import Page from '../../components/Page';

import ForumSponsoredCard from '../../components/forum/ForumSponsoredCard';
import DynamicFilterBar from '../../components/DynamicFilterBar';
import SearchBar from '../../components/SearchBar';
import ArticleCard from '../../components/articles/ArticleCard';
import Sidebar from '../../components/Sidebar';
import AdminConfirmDeleteDialog from '../../components/admin/AdminConfirmDeleteDialog';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useAuth } from '../../hooks/useAuth';
import { usePublishedJobs } from '../../hooks/articles/usePublishedJobs';
import { usePublishedLearning } from '../../hooks/articles/usePublishedLearning';
import { toCardShape } from '../../hooks/articles/toCardShape';
import apiClient from '../../utils/axios';

const SIDEBAR = [
  { id: '/development', label: 'Phát triển', icon: <TrendingUpIcon /> },
  { id: '/development/mentorship', label: 'Cố vấn', icon: <SchoolIcon /> },
  { id: '/development/academics', label: 'Cơ hội học tập', icon: <MenuBookIcon /> },
  { id: '/development/jobs', label: 'Cơ hội việc làm', icon: <WorkIcon /> },
];

const FILTERS = [
  {
    type: 'dropdown',
    key: 'type',
    label: 'Chủ đề',
    multiple: true,
    options: ['Học bổng', 'Trao đổi', 'Nghiên cứu', 'Workshop', 'Khóa học'],
  },
  {
    type: 'dropdown',
    key: 'format',
    label: 'Hình thức',
    options: ['Online', 'Offline', 'Hybrid'],
  },
  {
    type: 'dropdown',
    key: 'location',
    label: 'Địa điểm',
    multiple: true,
    options: ['TP.HCM', 'Trong nước', 'Nước ngoài'],
  },
  {
    type: 'date',
    key: 'date',
    label: 'Hạn chót',
  },
  {
    type: 'dropdown',
    key: 'level',
    label: 'Trình độ',
    multiple: true,
    options: ['Đại học', 'Thạc sĩ', 'Tiến sĩ'],
  },
];

const PreviewSection = ({
  title,
  description,
  isPending,
  errorMessage,
  articles,
  onOpenArticle,
  onSeeMore,
  seeMoreLabel,
  emptyLabel,
  isAdmin = false,
  onEdit,
  onDelete,
}) => (
  <Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
      <Typography variant="h4" fontWeight={700}>
        {title}
      </Typography>

      <Button variant="text" onClick={onSeeMore}>
        {seeMoreLabel}
      </Button>
    </Box>

    <Typography color="text.secondary" mb={3}>
      {description}
    </Typography>

    {isPending && (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    )}

    {!isPending && errorMessage && (
      <Typography color="error">{errorMessage}</Typography>
    )}

    {!isPending && !errorMessage && articles.length === 0 && (
      <Typography color="text.secondary">{emptyLabel}</Typography>
    )}

    {!isPending && !errorMessage && articles.length > 0 && (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          gap: 4,
        }}
      >
        {articles.map((article, i) => {
          const card = toCardShape(article);
          return (
            <Box
              key={article.id ?? i}
              sx={{ cursor: 'pointer' }}
              onClick={() => onOpenArticle(article)}
            >
              <ArticleCard
                article={card}
                isAdmin={isAdmin}
                onEdit={() => onEdit?.(article)}
                onDelete={() => onDelete?.(article)}
              />
            </Box>
          );
        })}
      </Box>
    )}
  </Box>
);

const DevelopmentPage = () => {
  const navigate = useOrgNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';

  const {
    resources: academics,
    isPending: academicsPending,
    errorMessage: academicsError,
  } = usePublishedLearning(0, 3);

  const {
    jobs,
    isPending: jobsPending,
    errorMessage: jobsError,
  } = usePublishedJobs(0, 3);

  const [filters, setFilters] = useState({ all: true });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openArticle = (article) => {
    if (!article?.id) return;
    navigate(`/article/${article.channel}/${article.id}`);
  };

  const handleEdit = (article) => {
    navigate(`/article/${article.channel}/${article.id}/edit`);
  };

  const handleDelete = (article) => setDeleteTarget(article);

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      const endpoint =
        deleteTarget.channel === 'job'
          ? '/admin/articles/jobs'
          : '/admin/articles/learning-resources';
      await apiClient.delete(`${endpoint}/${deleteTarget.id}`);
      queryClient.invalidateQueries({ queryKey: ['publishedJobs'] });
      queryClient.invalidateQueries({ queryKey: ['publishedLearning'] });
      enqueueSnackbar('Đã xoá thành công.', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Xoá thất bại.', { variant: 'error' });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <Page title="Phát triển">
      <Container maxWidth={false} disableGutters sx={{ pb: 6 }}>
        <Container maxWidth="xl" sx={{ pt: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3, lg: 6 } }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 3 } }}>
            {/* SIDEBAR */}
            <Stack spacing={2} sx={{ width: { xs: '100%', md: 260 } }}>
              <Sidebar items={SIDEBAR} />
              <ForumSponsoredCard
                title="Sponsored"
                imageSrc="/forum/metro_station.png"
                imageAlt="HCMC Metro Opening"
                caption="HCMC Metro Opening"
              />
            </Stack>

            {/* MAIN CONTENT */}
            <Stack
              spacing={5}
              sx={{ flex: 1, minWidth: 0, width: '100%', px: { xs: 1.5, sm: 2, md: 2.75 } }}
            >
              <Stack gap={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography
                    variant="h1"
                    fontWeight={800}
                    color="primary.main"
                    sx={{ fontSize: { xs: '1.8rem', md: '2.3rem' } }}
                  >
                    PHÁT TRIỂN
                  </Typography>
                  {isAdmin && (
                    <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end" useFlexGap>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => navigate('/admin/mentorship')}
                      >
                        Quản lý cố vấn
                      </Button>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => navigate('/admin/article')}
                      >
                        Quản lý cơ hội
                      </Button>
                    </Stack>
                  )}
                </Box>

                <Typography color="text.secondary">
                  Hàng trăm cơ hội phát triển về nhiều lĩnh vực cho sinh viên Khoa Công nghệ Thông tin -
                  Trường Đại học Khoa học tự nhiên, ĐHQG-HCM.
                </Typography>

                <DynamicFilterBar config={FILTERS} value={filters} onChange={setFilters} />

                <SearchBar
                  value={filters.search}
                  onChange={(val) => setFilters((prev) => ({ ...prev, search: val }))}
                />
              </Stack>

              {/* MENTORSHIP SECTION */}
              <Box>
                <Typography variant="h4" fontWeight={700} mb={1}>
                  Cố vấn
                </Typography>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    bgcolor: 'primary.light',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h3" mb={1}>
                      Chương trình Cố vấn - Mentorship Program
                    </Typography>
                    <Typography variant="body1">
                      Chương trình cố vấn hoàn toàn mới dành cho các bạn Sinh viên muốn tìm các anh chị Cựu
                      sinh viên để hỗ trợ mình trong học tập và trong công việc. Kết nối 1:1 cùng các tiền bối
                      trong ngành!
                    </Typography>
                  </Box>

                  <Button variant="contained" onClick={() => navigate('/development/mentorship')}>
                    Tìm cố vấn ngay
                  </Button>
                </Paper>
              </Box>

              {/* ACADEMICS SECTION */}
              <PreviewSection
                title="Cơ hội học tập"
                description="Cơ hội Cử nhân, Thạc sĩ, Tiến sĩ trong nước và ngoại quốc."
                isPending={academicsPending}
                errorMessage={academicsError}
                articles={academics.slice(0, 3)}
                onOpenArticle={openArticle}
                onSeeMore={() => navigate('/development/academics')}
                seeMoreLabel="Xem tất cả"
                emptyLabel="Chưa có cơ hội học tập nào."
                isAdmin={isAdmin}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />

              {/* JOBS SECTION */}
              <PreviewSection
                title="Cơ hội việc làm"
                description="Những việc làm từ nhiều công ty và tập đoàn hàng đầu vẫn đang chào đón các bạn!"
                isPending={jobsPending}
                errorMessage={jobsError}
                articles={jobs.slice(0, 3)}
                onOpenArticle={openArticle}
                onSeeMore={() => navigate('/development/jobs')}
                seeMoreLabel="Xem tất cả"
                emptyLabel="Chưa có cơ hội việc làm nào."
                isAdmin={isAdmin}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </Stack>
          </Box>
        </Container>
      </Container>

      <AdminConfirmDeleteDialog
        open={!!deleteTarget}
        title="Xoá bài viết"
        description={`Bạn có chắc muốn xoá "${deleteTarget?.title}"? Hành động này không thể hoàn tác.`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />
    </Page>
  );
};

export default DevelopmentPage;
