import { useState, useEffect } from "react";
import {
  Box, Button, Stack, Typography, TextField
} from "@mui/material";

import StarBorderIcon from '@mui/icons-material/StarBorder';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';

import Page from '../../components/Page';
import MentorshipProfileLayout from '../../layouts/MentorshipProfileLayout';
import MentorshipTag from '../../components/mentorship/MentorshipTag';
import { useOrgNavigate } from '../../hooks/useOrgNavigate';

/* ================= DATA ================= */

const TOP_TABS = [
  { label: 'Trang cá nhân', path: '/development/mentorship/profile' },
  { label: 'Dashboard', path: '/development/mentorship/dashboard' },
  { label: 'Lịch cá nhân', path: '/development/mentorship/calendar' },
];

const USER = {
  name: 'Nguyễn Lê Hoàng Dũng',
  role: 'Senior Software Engineer @ Google',
  avatar: 'https://i.pravatar.cc/150?img=3',
  cover: 'https://ethnasia.com/cdn/shop/articles/sean-o-KMn4VEeEPR8-unsplash_edited.jpg?v=1621585619',
};

const STATS = [
  { value: '8', label: 'năm kinh nghiệm' },
  { value: '120+', label: 'mentee' },
  { value: '4.9', label: 'đánh giá' },
  { value: '129', label: 'buổi họp' },
];

/* ================= COMPONENT ================= */

const MentorshipProfileEditPage = () => {
  const navigate = useOrgNavigate();
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(USER.cover); // default

  const handleCoverUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    return () => {
      if (coverPreview && coverPreview.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  const [bio, setBio] = useState(
    "This is a simple bio written in simple words..."
  );

  const [skills, setSkills] = useState([
    'Frontend', 'React', 'System Design'
  ]);

  const [newSkill, setNewSkill] = useState('');

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    if (skills.includes(newSkill)) return;
    setSkills([...skills, newSkill]);
    setNewSkill('');
  };

  const handleDeleteSkill = (skill) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  return (
    <Page title="Chỉnh sửa hồ sơ">
      <MentorshipProfileLayout
        user={USER}
        cover={coverPreview}
        onCoverChange={handleCoverUpload}
        tabs={TOP_TABS}
        onNavigate={navigate}
        mode="edit"
      >
        <Stack spacing={4}>
          {/* HEADER */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h2" fontWeight={800} color="primary.main">
              CHỈNH SỬA TRANG CÁ NHÂN
            </Typography>
          </Box>

          {/* STATS (KEEP SAME) */}
          <Box
            sx={{
              backgroundColor: 'primary.main',
              borderRadius: 2,
              px: { xs: 3, md: 6 },
              py: { xs: 3, md: 4 },
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: '1fr 1fr 1fr 1fr',
              },
              gap: 3,
              textAlign: 'center',
            }}
          >
            {STATS.map((item, i) => (
              <Box key={i}>
                <Typography variant="h2" fontWeight={700} color="common.white">
                  {item.value}
                </Typography>
                <Typography variant="body2" color="common.white">
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* BIO EDIT */}
          <Box>
            <Typography variant="h4" fontWeight={700} color="primary.main" mb={2}>
              Giới thiệu
            </Typography>

            <TextField
              fullWidth
              multiline
              minRows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Nhập mô tả của bạn..."
            />
          </Box>

          {/* INFO & SKILLS */}
          <Box
            sx={{
              display: 'flex',
              gap: { xs: 6, md: 8 },
              flexDirection: { xs: 'column', md: 'row' },
            }}
          >
            {/* LEFT */}
            <Box sx={{ width: { md: 375 } }}>
              <Typography variant="h4" fontWeight={700} color="primary.main" mb={2}>
                Cá nhân
              </Typography>

              <Box sx={{ display: 'grid', gap: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <StarBorderIcon />
                  <Typography>Chất lượng cao</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <DescriptionOutlinedIcon />
                  <Typography>Hệ thống thông tin</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <MenuBookOutlinedIcon />
                  <Typography>Enrolled 2022</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CheckBoxOutlinedIcon />
                  <Typography>Graduated 2026</Typography>
                </Stack>
              </Box>
            </Box>

            {/* RIGHT: SKILLS EDIT */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight={700} color="primary.main" mb={2}>
                Kỹ năng
              </Typography>

              {/* ADD SKILL */}
              <Stack direction="row" spacing={1} mb={2}>
                <TextField
                  size="small"
                  placeholder="Thêm kỹ năng..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                />
                <Button variant="contained" onClick={handleAddSkill}>
                  Thêm
                </Button>
              </Stack>

              {/* SKILL LIST */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {skills.map((tag, idx) => (
                  <MentorshipTag
                    key={idx}
                    label={tag}
                    onDelete={() => handleDeleteSkill(tag)} // 👈 you may need to support this prop
                  />
                ))}
              </Box>
            </Box>
          </Box>

        </Stack>
      </MentorshipProfileLayout>
    </Page>
  );
};

export default MentorshipProfileEditPage;