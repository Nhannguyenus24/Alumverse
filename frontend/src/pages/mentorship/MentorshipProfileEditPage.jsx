/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

import Page from '../../components/Page';
import MentorshipProfileLayout from '../../layouts/ProfileLayout';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';
import { useMyMentorProfile } from '../../hooks/mentorship/useMyMentorProfile';
import { useMyExpertise } from '../../hooks/mentorship/useMyExpertise';
import { useUpdateMentorProfile } from '../../hooks/mentorship/useUpdateMentorProfile';
import {
  useAddExpertise,
  useUpdateExpertise,
  useDeleteExpertise,
} from '../../hooks/mentorship/useExpertiseMutations';
import { useUploadImage } from '../../utils/imageUtils';
import { MENTOR_PROFILE_TABS } from '../../constants/mentorshipNav';

const TOP_TABS = MENTOR_PROFILE_TABS;

const DEFAULT_COVER =
  'https://ethnasia.com/cdn/shop/articles/sean-o-KMn4VEeEPR8-unsplash_edited.jpg?v=1621585619';

const STATUS_APPROVED = 'APPROVED';

const EXPERTISE_CATEGORIES = [
  { value: 'CAREER', label: 'Định hướng nghề nghiệp' },
  { value: 'ACADEMIC', label: 'Học tập / Học bổng' },
  { value: 'SOFT_SKILLS', label: 'Kỹ năng mềm' },
  { value: 'GENERAL', label: 'Chung' },
];

const SectionTitle = ({ children, hint }) => (
  <Box>
    <Typography variant="h4" fontWeight={700} color="primary.main">
      {children}
    </Typography>
    {hint && (
      <Typography variant="caption" color="text.secondary">
        {hint}
      </Typography>
    )}
  </Box>
);

const parseExtended = (raw) => {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const emptyExperience = () => ({ company: '', title: '', from: '', to: '', description: '' });
const emptyEducation = () => ({ school: '', degree: '', from: '', to: '' });

const MentorshipProfileEditPage = () => {
  const navigate = useOrgNavigate();

  const profileQuery = useMyMentorProfile();
  const expertiseQuery = useMyExpertise();
  const { updateProfile, isPending: saving, errorMessage } = useUpdateMentorProfile();
  const addExpertise = useAddExpertise();
  const updateExpertise = useUpdateExpertise();
  const deleteExpertise = useDeleteExpertise();
  const { uploadFile, isPending: uploadingCover } = useUploadImage();

  const [coverPreview, setCoverPreview] = useState(DEFAULT_COVER);
  const [coverFile, setCoverFile] = useState(null);
  const [currentJobTitle, setCurrentJobTitle] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [bio, setBio] = useState('');
  const [defaultMeetingLink, setDefaultMeetingLink] = useState('');
  const [experiences, setExperiences] = useState([]);
  const [educations, setEducations] = useState([]);
  const [success, setSuccess] = useState(false);

  const [editingExpertiseId, setEditingExpertiseId] = useState(null);
  const [draftExpertise, setDraftExpertise] = useState({
    topic: '',
    category: 'GENERAL',
    description: '',
    tag: '',
  });

  useEffect(() => {
    const p = profileQuery.data;
    if (p) {
      setCurrentJobTitle(p.currentJobTitle ?? '');
      setCurrentCompany(p.currentCompany ?? '');
      setBio(p.bio ?? '');
      setDefaultMeetingLink(p.defaultMeetingLink ?? '');
      if (p.coverUrl) setCoverPreview(p.coverUrl);
      const ext = parseExtended(p.extendedProfile);
      setExperiences(Array.isArray(ext.experiences) ? ext.experiences : []);
      setEducations(Array.isArray(ext.educations) ? ext.educations : []);
    }
  }, [profileQuery.data]);

  useEffect(() => {
    const url = coverPreview;
    return () => {
      if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
    };
  }, [coverPreview]);

  const expertise = useMemo(() => expertiseQuery.data ?? [], [expertiseQuery.data]);

  const handleCoverUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSuccess(false);
    try {
      let uploadedCoverUrl;
      if (coverFile) {
        uploadedCoverUrl = await uploadFile(coverFile);
      }
      const previousExt = parseExtended(profileQuery.data?.extendedProfile);
      const nextExt = { ...previousExt, experiences, educations };
      await updateProfile({
        currentJobTitle: currentJobTitle.trim(),
        currentCompany: currentCompany.trim(),
        bio: bio.trim(),
        coverUrl: uploadedCoverUrl ?? undefined,
        defaultMeetingLink: defaultMeetingLink.trim() || undefined,
        extendedProfile: JSON.stringify(nextExt),
      });
      setSuccess(true);
      setTimeout(() => navigate('/development/mentorship/profile'), 800);
    } catch {
      /* surfaced via errorMessage */
    }
  };

  const addExperienceRow = () => setExperiences((list) => [...list, emptyExperience()]);
  const updateExperienceRow = (idx, field, value) =>
    setExperiences((list) => list.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));
  const removeExperienceRow = (idx) =>
    setExperiences((list) => list.filter((_, i) => i !== idx));

  const addEducationRow = () => setEducations((list) => [...list, emptyEducation()]);
  const updateEducationRow = (idx, field, value) =>
    setEducations((list) => list.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));
  const removeEducationRow = (idx) => setEducations((list) => list.filter((_, i) => i !== idx));

  const startEditExpertise = (item) => {
    setEditingExpertiseId(item.id);
    setDraftExpertise({
      topic: item.topic ?? '',
      category: item.category ?? 'GENERAL',
      description: item.description ?? '',
      tag: item.tag ?? '',
    });
  };

  const cancelEditExpertise = () => {
    setEditingExpertiseId(null);
    setDraftExpertise({ topic: '', category: 'GENERAL', description: '', tag: '' });
  };

  const saveExpertiseEdit = async () => {
    if (!editingExpertiseId || !draftExpertise.topic.trim()) return;
    await updateExpertise.submit({
      id: editingExpertiseId,
      payload: {
        topic: draftExpertise.topic.trim(),
        category: draftExpertise.category,
        description: draftExpertise.description.trim() || undefined,
        tag: draftExpertise.tag.trim() || undefined,
      },
    });
    cancelEditExpertise();
  };

  const addExpertiseNew = async () => {
    if (!draftExpertise.topic.trim()) return;
    await addExpertise.submit({
      topic: draftExpertise.topic.trim(),
      category: draftExpertise.category,
      description: draftExpertise.description.trim() || undefined,
      tag: draftExpertise.tag.trim() || undefined,
      yearsExperience: 0,
    });
    setDraftExpertise({ topic: '', category: 'GENERAL', description: '', tag: '' });
  };

  if (profileQuery.isLoading) {
    return (
      <Page title="Chỉnh sửa hồ sơ">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Page>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <Page title="Chỉnh sửa hồ sơ">
        <Box sx={{ maxWidth: 720, mx: 'auto', py: 6, px: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Bạn chưa có hồ sơ cố vấn. Hãy đăng ký trước khi chỉnh sửa.
          </Alert>
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => navigate('/development/mentorship')}>
              Về trang Cố vấn
            </Button>
            <Button variant="contained" onClick={() => navigate('/development/mentorship/signup')}>
              Trở thành cố vấn
            </Button>
          </Stack>
        </Box>
      </Page>
    );
  }

  const profile = profileQuery.data;

  if (profile.status !== STATUS_APPROVED) {
    return (
      <Page title="Chỉnh sửa hồ sơ">
        <Box sx={{ maxWidth: 720, mx: 'auto', py: 6, px: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography fontWeight={700} mb={0.5}>
              Chỉ mentor đã được duyệt mới có thể chỉnh sửa hồ sơ
            </Typography>
            <Typography variant="body2">
              Trạng thái hiện tại: <strong>{profile.status}</strong>. Sử dụng luồng đăng ký để cập
              nhật hồ sơ.
            </Typography>
          </Alert>
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={() => navigate('/development/mentorship/profile')}>
              Về trang cá nhân
            </Button>
            <Button variant="contained" onClick={() => navigate('/development/mentorship/signup')}>
              Mở lại luồng đăng ký
            </Button>
          </Stack>
        </Box>
      </Page>
    );
  }

  const user = {
    name: profile.fullName ?? `Mentor #${profile.memberId}`,
    role: [profile.currentJobTitle, profile.currentCompany]
      .filter(Boolean)
      .join(' @ ') || 'Cố vấn',
    avatar: profile.avatarUrl ?? '',
    cover: coverPreview,
  };

  return (
    <Page title="Chỉnh sửa hồ sơ">
      <MentorshipProfileLayout
        user={user}
        cover={coverPreview}
        onCoverChange={handleCoverUpload}
        tabs={TOP_TABS}
        onNavigate={navigate}
        mode="mentorEdit"
      >
        <Stack spacing={4}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={2}
          >
            <Typography variant="h2" fontWeight={800} color="primary.main">
              CHỈNH SỬA TRANG CÁ NHÂN
            </Typography>
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate('/development/mentorship/profile')}
                disabled={saving}
              >
                Huỷ
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving || uploadingCover}
              >
                {saving || uploadingCover ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </Stack>
          </Box>

          {success && (
            <Alert severity="success">Đã lưu hồ sơ. Đang chuyển về trang cá nhân...</Alert>
          )}
          {errorMessage && !success && <Alert severity="error">{errorMessage}</Alert>}

          {/* ===== SECTION 1: PUBLIC PROFILE ===== */}
          <SectionTitle hint="Thông tin mentee nhìn thấy">
            Hồ sơ công khai
          </SectionTitle>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                label="Chức danh"
                value={currentJobTitle}
                onChange={(e) => setCurrentJobTitle(e.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label="Công ty"
                value={currentCompany}
                onChange={(e) => setCurrentCompany(e.target.value)}
                fullWidth
                size="small"
              />
            </Stack>
            <TextField
              label="Giới thiệu (bio)"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              multiline
              minRows={3}
              fullWidth
              placeholder="Mô tả ngắn về bạn để mentee hiểu hơn..."
            />
          </Stack>

          {/* ===== SECTION 2: EXPERIENCE & EDUCATION ===== */}
          <SectionTitle hint="Phần này hiển thị công khai trên trang profile">
            Kinh nghiệm & Học vấn
          </SectionTitle>
          <Stack spacing={2}>
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography fontWeight={700}>Kinh nghiệm làm việc</Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={addExperienceRow}>
                  Thêm
                </Button>
              </Stack>
              {experiences.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Chưa có kinh nghiệm nào.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {experiences.map((exp, idx) => (
                    <Box
                      key={idx}
                      sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                    >
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={1}>
                        <TextField
                          label="Chức danh"
                          value={exp.title ?? ''}
                          onChange={(e) => updateExperienceRow(idx, 'title', e.target.value)}
                          size="small"
                          fullWidth
                        />
                        <TextField
                          label="Công ty"
                          value={exp.company ?? ''}
                          onChange={(e) => updateExperienceRow(idx, 'company', e.target.value)}
                          size="small"
                          fullWidth
                        />
                      </Stack>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={1}>
                        <TextField
                          label="Từ"
                          value={exp.from ?? ''}
                          onChange={(e) => updateExperienceRow(idx, 'from', e.target.value)}
                          size="small"
                          fullWidth
                          placeholder="2022"
                        />
                        <TextField
                          label="Đến"
                          value={exp.to ?? ''}
                          onChange={(e) => updateExperienceRow(idx, 'to', e.target.value)}
                          size="small"
                          fullWidth
                          placeholder="Hiện tại"
                        />
                        <IconButton
                          color="error"
                          onClick={() => removeExperienceRow(idx)}
                          aria-label="remove experience"
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Stack>
                      <TextField
                        label="Mô tả"
                        value={exp.description ?? ''}
                        onChange={(e) => updateExperienceRow(idx, 'description', e.target.value)}
                        size="small"
                        fullWidth
                        multiline
                        minRows={2}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>

            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography fontWeight={700}>Học vấn</Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={addEducationRow}>
                  Thêm
                </Button>
              </Stack>
              {educations.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Chưa có học vấn nào.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {educations.map((edu, idx) => (
                    <Box
                      key={idx}
                      sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                    >
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={1}>
                        <TextField
                          label="Trường"
                          value={edu.school ?? ''}
                          onChange={(e) => updateEducationRow(idx, 'school', e.target.value)}
                          size="small"
                          fullWidth
                        />
                        <TextField
                          label="Bằng cấp / chuyên ngành"
                          value={edu.degree ?? ''}
                          onChange={(e) => updateEducationRow(idx, 'degree', e.target.value)}
                          size="small"
                          fullWidth
                        />
                      </Stack>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
                        <TextField
                          label="Từ"
                          value={edu.from ?? ''}
                          onChange={(e) => updateEducationRow(idx, 'from', e.target.value)}
                          size="small"
                          fullWidth
                          placeholder="2018"
                        />
                        <TextField
                          label="Đến"
                          value={edu.to ?? ''}
                          onChange={(e) => updateEducationRow(idx, 'to', e.target.value)}
                          size="small"
                          fullWidth
                          placeholder="2022"
                        />
                        <IconButton
                          color="error"
                          onClick={() => removeEducationRow(idx)}
                          aria-label="remove education"
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Stack>

          {/* ===== SECTION 3: EXPERTISE (CRUD) ===== */}
          <SectionTitle hint="Mentee dùng các chủ đề này để tìm mentor phù hợp">
            Nội dung chia sẻ
          </SectionTitle>
          {(addExpertise.errorMessage || updateExpertise.errorMessage || deleteExpertise.errorMessage) && (
            <Alert severity="error">
              {addExpertise.errorMessage || updateExpertise.errorMessage || deleteExpertise.errorMessage}
            </Alert>
          )}
          <Stack spacing={1.5}>
            {expertise.map((item) => {
              const isEditing = editingExpertiseId === item.id;
              if (isEditing) {
                return (
                  <Box
                    key={item.id}
                    sx={{ p: 2, border: '1px solid', borderColor: 'primary.main', borderRadius: 1 }}
                  >
                    <Stack spacing={1.2}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <TextField
                          label="Chủ đề"
                          value={draftExpertise.topic}
                          onChange={(e) =>
                            setDraftExpertise((d) => ({ ...d, topic: e.target.value }))
                          }
                          size="small"
                          fullWidth
                        />
                        <TextField
                          label="Lĩnh vực"
                          value={draftExpertise.category}
                          onChange={(e) =>
                            setDraftExpertise((d) => ({ ...d, category: e.target.value }))
                          }
                          select
                          size="small"
                          fullWidth
                        >
                          {EXPERTISE_CATEGORIES.map((c) => (
                            <MenuItem key={c.value} value={c.value}>
                              {c.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Stack>
                      <TextField
                        label="Mô tả"
                        value={draftExpertise.description}
                        onChange={(e) =>
                          setDraftExpertise((d) => ({ ...d, description: e.target.value }))
                        }
                        size="small"
                        fullWidth
                        multiline
                        minRows={2}
                      />
                      <TextField
                        label="Tag (tuỳ chọn)"
                        value={draftExpertise.tag}
                        onChange={(e) =>
                          setDraftExpertise((d) => ({ ...d, tag: e.target.value }))
                        }
                        size="small"
                        fullWidth
                      />
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          startIcon={<CloseIcon />}
                          onClick={cancelEditExpertise}
                        >
                          Huỷ
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<CheckIcon />}
                          disabled={updateExpertise.isPending || !draftExpertise.topic.trim()}
                          onClick={saveExpertiseEdit}
                        >
                          Lưu
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                );
              }
              return (
                <Box
                  key={item.id}
                  sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <Typography fontWeight={700}>{item.topic}</Typography>
                        <Chip
                          label={
                            EXPERTISE_CATEGORIES.find((c) => c.value === item.category)?.label ??
                            item.category ??
                            'Chung'
                          }
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Stack>
                      {item.description && (
                        <Typography variant="body2" color="text.secondary">
                          {item.description}
                        </Typography>
                      )}
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton
                        size="small"
                        onClick={() => startEditExpertise(item)}
                        aria-label="edit expertise"
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={deleteExpertise.isPending}
                        onClick={() => deleteExpertise.submit(item.id)}
                        aria-label="delete expertise"
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Box>
              );
            })}

            {/* Add new expertise row */}
            {editingExpertiseId === null && (
              <Box
                sx={{
                  p: 2,
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'background.default',
                }}
              >
                <Typography fontWeight={700} mb={1}>
                  Thêm nội dung mới
                </Typography>
                <Stack spacing={1.2}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      label="Chủ đề"
                      value={draftExpertise.topic}
                      onChange={(e) =>
                        setDraftExpertise((d) => ({ ...d, topic: e.target.value }))
                      }
                      size="small"
                      fullWidth
                    />
                    <TextField
                      label="Lĩnh vực"
                      value={draftExpertise.category}
                      onChange={(e) =>
                        setDraftExpertise((d) => ({ ...d, category: e.target.value }))
                      }
                      select
                      size="small"
                      fullWidth
                    >
                      {EXPERTISE_CATEGORIES.map((c) => (
                        <MenuItem key={c.value} value={c.value}>
                          {c.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Stack>
                  <TextField
                    label="Mô tả"
                    value={draftExpertise.description}
                    onChange={(e) =>
                      setDraftExpertise((d) => ({ ...d, description: e.target.value }))
                    }
                    size="small"
                    fullWidth
                    multiline
                    minRows={2}
                  />
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<AddIcon />}
                      disabled={addExpertise.isPending || !draftExpertise.topic.trim()}
                      onClick={addExpertiseNew}
                    >
                      Thêm
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            )}
          </Stack>

          {/* ===== SECTION 4: PRIVATE INFO ===== */}
          <SectionTitle hint="Chỉ bạn nhìn thấy. Mentee chỉ thấy sau khi đặt lịch thành công.">
            Thông tin riêng tư
          </SectionTitle>
          <Stack spacing={2}>
            <TextField
              label="Link cuộc họp mặc định"
              value={defaultMeetingLink}
              onChange={(e) => setDefaultMeetingLink(e.target.value)}
              size="small"
              fullWidth
              placeholder="VD: https://meet.google.com/abc-defg-hij"
              helperText="Mentee chỉ thấy link sau khi bạn duyệt yêu cầu đặt lịch."
            />
          </Stack>
        </Stack>
      </MentorshipProfileLayout>
    </Page>
  );
};

export default MentorshipProfileEditPage;
