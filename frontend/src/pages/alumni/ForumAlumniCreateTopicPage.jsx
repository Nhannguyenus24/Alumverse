import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Button,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import Page from '../../components/Page';
import ForumFilterPanel from '../../components/forum/ForumFilterPanel';
import ForumSponsoredCard from '../../components/forum/ForumSponsoredCard';
import { useAuth } from '../../hooks/useAuth';
import { useForumCategories } from '../../hooks/forum/useForumCategories';
import { useCreateForumTopic } from '../../hooks/forum/useCreateForumTopic';
import { useCreateForumPost } from '../../hooks/forum/useCreateForumPost';
import { useNotification } from '../../hooks/useNotification';


const ForumAlumniCreateTopicPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const organizationId = user?.organizationId ?? 1;
  const {
    categories,
    isPending: categoriesPending,
    isError: categoriesIsError,
  } = useForumCategories(organizationId);
  const [subject, setSubject] = useState('');
  const [subSubject, setSubSubject] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const { showSuccess, showError, showWarning } = useNotification();
  const categoriesErrorShownRef = useRef(false);
  const { createTopic, isPending: createTopicPending } = useCreateForumTopic();
  const { createPost } = useCreateForumPost();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (categoriesIsError) {
      if (!categoriesErrorShownRef.current) {
        showError('Không tải được danh sách chủ đề phụ.');
        categoriesErrorShownRef.current = true;
      }
      return;
    }
    categoriesErrorShownRef.current = false;
  }, [categoriesIsError, showError]);

  const filters = useMemo(() => {
    if (!categories?.length) {
      return [{ id: 'all', label: 'Tất cả' }];
    }
    return [
      { id: 'all', label: 'Tất cả' },
      ...categories.map((c) => ({ id: `category-${c.id}`, label: c.name })),
    ];
  }, [categories]);
  const subSubjectOptions = (categories ?? []).map((category) => ({
    value: String(category.id),
    label: category.name,
  }));
  const hasSelectedSubSubject = subSubjectOptions.some((opt) => opt.value === subSubject);
  const selectedSubSubject = hasSelectedSubSubject
    ? subSubject
    : (subSubjectOptions[0]?.value ?? '');
  const selectedSidebarFilterId = filters.some((f) => f.id === `category-${selectedSubSubject}`)
    ? `category-${selectedSubSubject}`
    : 'all';
  const displayName =
    user?.userName?.trim?.() ||
    user?.email?.trim?.() ||
    (user?.id ? `Thành viên #${user.id}` : 'Người dùng');
  const displayRole = user?.role ? String(user.role).toLowerCase() : 'guest';

  const handleFilterChange = useCallback(
    (id) => {
      if (id === 'all') {
        navigate('/forum');
        return;
      }
      if (id?.startsWith('category-')) {
        navigate('/forum', { state: { selectedFilterId: id } });
        return;
      }
    },
    [navigate]
  );

  const handleCancel = () => {
    navigate('/forum/alumni/career');
  };

  const handleSubmit = async () => {
    const trimmedTitle = (title ?? '').trim();
    const trimmedContent = (content ?? '').trim();
    const categoryId = parseInt(selectedSubSubject, 10);
    if (!trimmedTitle) {
      showWarning('Vui lòng nhập tiêu đề chủ đề.');
      return;
    }
    if (!user?.id) {
      showError('Không xác định được người tạo chủ đề.');
      return;
    }
    if (Number.isNaN(categoryId) || categoryId <= 0) {
      showWarning('Vui lòng chọn chủ đề phụ hợp lệ.');
      return;
    }

    const payload = {
      organizationId,
      title: trimmedTitle,
      createdByMemberId: user.id,
      categoryId,
    };

    setIsSubmitting(true);
    let createdTopic = null;
    let openingPostError = null;
    try {
      createdTopic = await createTopic(payload);
      if (!createdTopic?.id) {
        showError('Tạo chủ đề thất bại.');
        return;
      }
      if (trimmedContent) {
        try {
          await createPost({
            topicId: createdTopic.id,
            authorMemberId: user.id,
            content: trimmedContent,
            answerToPostId: null,
          });
        } catch (postErr) {
          openingPostError =
            postErr?.response?.data?.message ??
            postErr?.message ??
            'Không thể đăng nội dung mở đầu.';
        }
      }
      showSuccess('Tạo chủ đề thành công.');
      if (openingPostError) {
        showWarning(`Chủ đề đã tạo nhưng nội dung mở đầu lỗi: ${openingPostError}`);
      }
      navigate(`/forum/alumni/career/${createdTopic.id}`, {
        state: {
          topicTitle: createdTopic.title,
          topicSummary: createdTopic,
          selectedFilterId: `category-${createdTopic.categoryId}`,
          ...(openingPostError ? { openingPostError } : {}),
        },
      });
    } catch (topicErr) {
      const message =
        topicErr?.response?.data?.message ??
        topicErr?.message ??
        'Tạo chủ đề thất bại.';
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page
      title="Tạo chủ đề - Cựu sinh viên"
      meta={<meta name="description" content="Tạo chủ đề mới - Diễn đàn Cựu sinh viên" />}
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          pb: { xs: 4, md: 6 },
          backgroundColor: '#F3F6FB',
          overflowX: 'hidden',
        }}
      >
        <Container maxWidth="xl" sx={{ pt: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3, lg: 6 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'flex-start',
              gap: { xs: 2, md: 3 },
            }}
          >
            <Stack spacing={2} sx={{ width: { xs: '100%', md: 260 }, flexShrink: 0 }}>
              <ForumFilterPanel
                filters={filters}
                selectedId={selectedSidebarFilterId}
                onChange={handleFilterChange}
              />
              <ForumSponsoredCard
                title="Sponsored"
                imageSrc="/forum/metro_station.png"
                imageAlt="HCMC Metro Opening"
                caption="HCMC Metro Opening"
              />
            </Stack>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h4"
                component="h1"
                fontWeight={800}
                color="primary.main"
                sx={{ mb: 2.5, fontSize: { xs: '1.6rem', md: '1.9rem' }, letterSpacing: 1 }}
              >
                TẠO CHỦ ĐỀ MỚI
              </Typography>

              {/* Subject selectors */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 1.5,
                  mb: 2.5,
                }}
              >

                <TextField
                  select
                  fullWidth
                  label="Chủ đề phụ"
                  value={selectedSubSubject}
                  onChange={(e) => setSubSubject(e.target.value)}
                  size="small"
                  disabled={categoriesPending || categoriesIsError || !categories.length}
                >
                  {categoriesPending ? (
                    <MenuItem value="" disabled>
                      Đang tải chủ đề phụ...
                    </MenuItem>
                  ) : categoriesIsError ? (
                    <MenuItem value="" disabled>
                      Không tải được chủ đề phụ
                    </MenuItem>
                  ) : !categories.length ? (
                    <MenuItem value="" disabled>
                      Không có chủ đề phụ
                    </MenuItem>
                  ) : (
                    subSubjectOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))
                  )}
                </TextField>
              </Box>

              {/* Editor card */}
              <Box
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  backgroundColor: '#fff',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: { xs: 'center', md: 'stretch' },
                  }}
                >
                  {/* Avatar column */}
                  <Box
                    sx={{
                      width: { xs: '100%', md: 140 },
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: { xs: 'row', md: 'column' },
                      alignItems: { xs: 'center', md: 'center' },
                      justifyContent: { xs: 'center', md: 'flex-start' },
                      gap: 1,
                      py: { xs: 2, md: 3 },
                      px: { xs: 2, md: 0 },
                      borderRight: { xs: 0, md: 1 },
                      borderBottom: { xs: 1, md: 0 },
                      borderColor: 'divider',
                    }}
                  >
                    <Box
                      sx={{
                        width: { xs: 48, md: 64 },
                        height: { xs: 48, md: 64 },
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <PersonIcon sx={{ fontSize: 34 }} />
                    </Box>
                    <Box sx={{ textAlign: { xs: 'left', md: 'center' } }}>
                      <Typography variant="body2" fontWeight={600}>
                        {displayName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {displayRole}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Title + editor */}
                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Box
                      sx={{
                        px: { xs: 2, md: 2.5 },
                        py: 1.75,
                        borderBottom: 1,
                        borderColor: 'divider',
                      }}
                    >
                      <TextField
                        fullWidth
                        variant="standard"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Tiêu đề chủ đề"
                        InputProps={{
                          disableUnderline: true,
                          sx: {
                            fontSize: { xs: '1.05rem', md: '1.15rem' },
                            fontWeight: 600,
                          },
                        }}
                      />
                    </Box>

                    <Box sx={{ px: { xs: 2, md: 2.5 }, py: 2 }}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={8}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Nội dung mở đầu"
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Actions */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column-reverse', sm: 'row' },
                    justifyContent: 'flex-end',
                    gap: 1,
                    px: { xs: 2, md: 2.5 },
                    py: 1.5,
                    borderTop: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    fullWidth={false}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    Hủy
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={
                      isSubmitting ||
                      createTopicPending ||
                      !user?.id ||
                      !(title ?? '').trim() ||
                      !selectedSubSubject
                    }
                    fullWidth={false}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    {isSubmitting || createTopicPending ? 'Đang tạo...' : 'Tạo chủ đề'}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
      </Container>
    </Page>
  );
};

export default ForumAlumniCreateTopicPage;
