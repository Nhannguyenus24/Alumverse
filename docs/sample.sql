-- Sample Data for Student Alumni System
-- Focused on Organization 1 (CS - HCMUS) with diverse test data

-- ============= USERS DATA =============
-- password to login is Student@2024 for the last 3
INSERT INTO "users" ("email", "password_hash", "user_name", "status", "role", "avatar_url", "created_at", "updated_at") VALUES
('admin@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'admin', 'ACTIVE', 'ADMIN', NULL, NOW(), NOW()),
('john.doe@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'johndoe', 'ACTIVE', 'ALUMNI', NULL, NOW() - INTERVAL '365 days', NOW()),
('jane.smith@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'janesmith', 'ACTIVE', 'ALUMNI', NULL, NOW() - INTERVAL '340 days', NOW()),
('nguyen.van.a@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'nguyenvana', 'ACTIVE', 'STUDENT', NULL, NOW() - INTERVAL '180 days', NOW()),
('tran.thi.b@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'tranthib', 'ACTIVE', 'ALUMNI', NULL, NOW() - INTERVAL '120 days', NOW()),
('pham.van.c@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'phamvanc', 'ACTIVE', 'ALUMNI', NULL, NOW() - INTERVAL '240 days', NOW()),
('hoang.thi.d@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'hoangthid', 'ACTIVE', 'ALUMNI', NULL, NOW() - INTERVAL '100 days', NOW()),
('le.van.e@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'levane', 'ACTIVE', 'ALUMNI', NULL, NOW() - INTERVAL '170 days', NOW()),
('duong.thi.f@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'duongthif', 'ACTIVE', 'STUDENT', NULL, NOW() - INTERVAL '60 days', NOW()),
('vo.van.g@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'vovang', 'ACTIVE', 'ALUMNI', NULL, NOW() - INTERVAL '280 days', NOW()),
('test@hcmus.edu.vn', '$2b$12$ig35cC5G.hFgdmWUzbnv5OiJRpBGrzZmTXhl5L/8Akvmr4.r3Ciwm', 'testuser', 'ACTIVE', 'ADMIN', NULL, NOW(), NOW()),
('bui.van.h@hcmus.edu.vn', '$2b$12$ig35cC5G.hFgdmWUzbnv5OiJRpBGrzZmTXhl5L/8Akvmr4.r3Ciwm', 'buivanh', 'ACTIVE', 'STUDENT', NULL, NOW() - INTERVAL '30 days', NOW()),
('ly.thi.i@hcmus.edu.vn', '$2b$12$ig35cC5G.hFgdmWUzbnv5OiJRpBGrzZmTXhl5L/8Akvmr4.r3Ciwm', 'lythii', 'ACTIVE', 'STUDENT', NULL, NOW() - INTERVAL '25 days', NOW()),
('admin@gmail.com', '$2a$10$XV9KfhWlRF4ypiISf3u1.u1PeEKWw1x.BpzqLaVPM4WA7D9KbcZ7m', 'testadmin', 'ACTIVE', 'ADMIN', NULL, NOW(), NOW()),
('le.thi.h@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'lethih', 'ACTIVE', 'ALUMNI', NULL, NOW() - INTERVAL '150 days', NOW()),
('pham.minh.d@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'phamminhd', 'ACTIVE', 'ALUMNI', NULL, NOW() - INTERVAL '200 days', NOW()),
('nguyen.thi.e@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'nguyenthie', 'ACTIVE', 'STUDENT', NULL, NOW() - INTERVAL '50 days', NOW()),
('tran.van.f@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'tranvanf', 'ACTIVE', 'STUDENT', NULL, NOW() - INTERVAL '35 days', NOW()),
-- Additional CS-focused users for diverse testing
('dao.van.h@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'daovanh', 'ACTIVE', 'STUDENT', NULL, NOW() - INTERVAL '90 days', NOW()),
('mai.thi.k@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'maithik', 'ACTIVE', 'STUDENT', NULL, NOW() - INTERVAL '75 days', NOW()),
('son.van.l@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'sonvanl', 'ACTIVE', 'ALUMNI', NULL, NOW() - INTERVAL '300 days', NOW()),
('yen.thi.m@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'yenthim', 'ACTIVE', 'ALUMNI', NULL, NOW() - INTERVAL '320 days', NOW()),
('thai.van.n@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'thaivann', 'ACTIVE', 'STUDENT', NULL, NOW() - INTERVAL '15 days', NOW()),
('quynh.thi.p@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'quynhthip', 'ACTIVE', 'STUDENT', NULL, NOW() - INTERVAL '10 days', NOW()),
('khai.van.q@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'khaivanq', 'ACTIVE', 'ALUMNI', NULL, NOW() - INTERVAL '250 days', NOW()),
('linh.thi.r@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'linthir', 'ACTIVE', 'ALUMNI', NULL, NOW() - INTERVAL '260 days', NOW());


-- ============= GLOBAL PROFILES DATA =============
INSERT INTO "global_profiles" ("user_id", "full_name", "phone", "bio", "dob", "gender", "settings") VALUES
(1, 'Admin User', '0901234567', 'System Administrator', '1990-01-15', 'Male', '{"language":"vi","theme":"dark"}'),
(2, 'John Doe', '0912345678', 'Senior Software Engineer', '1995-05-20', 'Male', '{"language":"en","theme":"light"}'),
(3, 'Jane Smith', '0923456789', 'Product Manager - Tech Lead', '1996-08-10', 'Female', '{"language":"en","theme":"light"}'),
(4, 'Nguyễn Văn A', '0934567890', 'Student - Year 3 Computer Science', '2002-03-15', 'Male', '{"language":"vi","theme":"dark"}'),
(5, 'Trần Thị B', '0945678901', 'Junior Dev at VNG Corp', '2001-07-22', 'Female', '{"language":"vi","theme":"light"}'),
(6, 'Phạm Văn C', '0956789012', 'Tech Lead - Backend Systems', '1998-11-08', 'Male', '{"language":"vi","theme":"dark"}'),
(7, 'Hoàng Thị D', '0967890123', 'ML Engineer at FPT Software', '1999-02-14', 'Female', '{"language":"vi","theme":"light"}'),
(8, 'Lê Văn E', '0978901234', 'CTO & Co-founder', '1997-09-30', 'Male', '{"language":"vi","theme":"dark"}'),
(9, 'Dương Thị F', '0989012345', 'Student - Year 4 Data Science', '2000-04-17', 'Female', '{"language":"vi","theme":"light"}'),
(10, 'Võ Văn G', '0990123456', 'Senior Backend Engineer', '1999-12-05', 'Male', '{"language":"vi","theme":"dark"}'),
(11, 'Test User', '0900000000', 'Alumni CS K59', '2000-01-01', 'Male', '{"language":"vi","theme":"light"}'),
(12, 'Bùi Văn H', '0901111111', 'Student - Year 1 CS', '2004-06-20', 'Male', '{"language":"vi","theme":"light"}'),
(13, 'Lý Thị I', '0902222222', 'Student - Year 1 CS', '2004-09-12', 'Female', '{"language":"vi","theme":"dark"}'),
(15, 'Lê Thị H', '0903333333', 'Flutter Developer', '1999-04-10', 'Female', '{"language":"vi","theme":"light"}'),
(16, 'Phạm Minh D', '0904444444', 'Cloud Architect at Cloud Tech', '1998-12-25', 'Male', '{"language":"vi","theme":"dark"}'),
(17, 'Nguyễn Thị E', '0905555555', 'Student - Year 3 DS', '2003-01-05', 'Female', '{"language":"vi","theme":"light"}'),
(18, 'Trần Văn F', '0906666666', 'Student - Year 2 AI', '2003-05-15', 'Male', '{"language":"vi","theme":"dark"}'),
(19, 'Đào Văn H', '0907777777', 'Student - Year 2 CS', '2003-12-10', 'Male', '{"language":"vi","theme":"light"}'),
(20, 'Mai Thị K', '0908888888', 'Student - Year 3 CS', '2002-04-22', 'Female', '{"language":"vi","theme":"dark"}'),
(21, 'Sơn Văn L', '0909999999', 'Senior Dev at Lazada', '1997-08-15', 'Male', '{"language":"vi","theme":"light"}'),
(22, 'Yến Thị M', '0910101010', 'Solutions Architect', '1998-03-08', 'Female', '{"language":"vi","theme":"dark"}'),
(23, 'Thái Văn N', '0911121212', 'Student - Year 1 CS', '2004-11-30', 'Male', '{"language":"vi","theme":"light"}'),
(24, 'Quỳnh Thị P', '0912131313', 'Student - Year 2 CS', '2003-07-14', 'Female', '{"language":"vi","theme":"dark"}'),
(25, 'Khải Văn Q', '0913141414', 'Software Architect at Grab', '1996-09-20', 'Male', '{"language":"vi","theme":"light"}'),
(26, 'Linh Thị R', '0914151515', 'Data Engineer at Tiki', '1997-02-11', 'Female', '{"language":"vi","theme":"dark"}');

-- ============= ORGANIZATIONS DATA =============
INSERT INTO "organizations" ("name", "slug", "logo_url", "brand_config", "features_config", "programs", "majors", "created_at") VALUES
('HCMUS - Computer Science', 'cs-hcmus', 'https://api.example.com/logos/cs.png', '{"primary":"#1976d2","secondary":"#dc004e"}', '{"mentorship":true,"job":true,"fund":true,"events":true,"forum":true}', '["Regular","Advanced Program"]', '["Computer Science","Data Science","Artificial Intelligence"]', NOW() - INTERVAL '365 days'),
('HCMUS - Information Technology', 'it-hcmus', 'https://api.example.com/logos/it.png', '{"primary":"#388e3c","secondary":"#ff9800"}', '{"mentorship":true,"job":true,"fund":true,"events":true,"forum":true}', '["Regular","High Quality"]', '["Information Technology","Software Engineering","Information Systems"]', NOW() - INTERVAL '360 days'),
('HCMUS - Business Administration', 'ba-hcmus', 'https://api.example.com/logos/ba.png', '{"primary":"#f57c00","secondary":"#512da8"}', '{"mentorship":true,"job":true,"fund":false,"events":true,"forum":true}', '["Regular"]', '["Business Administration","Marketing","Finance"]', NOW() - INTERVAL '350 days'),
('HCMUS - Engineering', 'eng-hcmus', 'https://api.example.com/logos/eng.png', '{"primary":"#c62828","secondary":"#0097a7"}', '{"mentorship":true,"job":true,"fund":true,"events":true,"forum":true}', '["Regular","International"]', '["Mechanical Engineering","Electrical Engineering","Mechatronics"]', NOW() - INTERVAL '340 days');

-- ============= ORGANIZATION INTRODUCTIONS DATA =============
INSERT INTO "organization_introductions" ("orga_id", "content", "vision", "mission", "core_values", "image_urls", "banner_url", "updated_at") VALUES
(1, 
 'The Computer Science Department at HCMUS is a leading institution dedicated to advancing computer science education, research, and innovation. We prepare students to become proficient software engineers, researchers, and technology leaders.',
 'To be a world-class computer science program recognized for excellence in education and research',
 'To provide comprehensive education in computer science and cultivate innovative problem-solvers',
 'Excellence, Innovation, Integrity, Collaboration, Continuous Learning',
 '["https://api.example.com/intro/cs_1.jpg","https://api.example.com/intro/cs_2.jpg","https://api.example.com/intro/cs_3.jpg"]',
 'https://api.example.com/banners/cs_banner.jpg',
 NOW() - INTERVAL '30 days'),

(2,
 'The Information Technology Department provides comprehensive IT education focused on practical skills and real-world applications. Our programs equip graduates with the expertise needed to thrive in the rapidly evolving technology industry.',
 'To become the leading IT program transforming lives through technology education',
 'To deliver quality IT education that prepares students for successful careers and innovation',
 'Quality, Relevance, Teamwork, Accountability, Customer-focused',
 '["https://api.example.com/intro/it_1.jpg","https://api.example.com/intro/it_2.jpg"]',
 'https://api.example.com/banners/it_banner.jpg',
 NOW() - INTERVAL '28 days'),

(3,
 'The Business Administration Department develops future business leaders with strong analytical, strategic, and managerial skills. We combine theoretical knowledge with practical experience to prepare students for diverse business careers.',
 'To produce ethical and innovative business leaders who drive organizational and societal growth',
 'To provide business education that develops strategic thinkers and ethical leaders',
 'Integrity, Innovation, Responsibility, Excellence, Inclusivity',
 '["https://api.example.com/intro/ba_1.jpg","https://api.example.com/intro/ba_2.jpg"]',
 'https://api.example.com/banners/ba_banner.jpg',
 NOW() - INTERVAL '26 days'),

(4,
 'The Engineering Department is committed to producing skilled engineers who can design and build solutions to real-world problems. Our programs emphasize practical engineering skills, research capabilities, and professional ethics.',
 'To be recognized as a premier engineering program developing innovative solutions',
 'To educate and mentor engineers who contribute to technological advancement',
 'Precision, Innovation, Sustainability, Professionalism, Teamwork',
 '["https://api.example.com/intro/eng_1.jpg","https://api.example.com/intro/eng_2.jpg","https://api.example.com/intro/eng_3.jpg"]',
 'https://api.example.com/banners/eng_banner.jpg',
 NOW() - INTERVAL '25 days');

-- ============= ACADEMIC RECORDS DATA =============
INSERT INTO "academic_records" ("member_id", "student_code", "degree_type", "class_name", "start_year", "graduated_year", "status") VALUES
-- Admin
(1, '12127001', 'Master', 'K55', 2012, 2016, 'GRADUATED'),
-- Senior alumni (2020-2023)
(2, '19127001', 'Bachelor', 'K60', 2019, 2023, 'GRADUATED'),
(6, '18127010', 'Bachelor', 'K59', 2018, 2022, 'GRADUATED'),
(8, '19127088', 'Bachelor', 'K60', 2019, 2023, 'GRADUATED'),
(10, '19127050', 'Bachelor', 'K60', 2019, 2023, 'GRADUATED'),
(15, '19127015', 'Bachelor', 'K60', 2019, 2021, 'GRADUATED'),
(16, '18127020', 'Bachelor', 'K59', 2018, 2020, 'GRADUATED'),
(21, '17127005', 'Bachelor', 'K58', 2017, 2021, 'GRADUATED'),
(25, '16127099', 'Bachelor', 'K57', 2016, 2020, 'GRADUATED'),
-- Recent graduate
(7, '20127078', 'Bachelor', 'K62', 2020, 2024, 'GRADUATED'),
(11, '20127035', 'Bachelor', 'K62', 2020, 2022, 'GRADUATED'),
(22, '20127045', 'Bachelor', 'K62', 2020, 2023, 'GRADUATED'),
(26, '20127089', 'Bachelor', 'K62', 2020, 2023, 'GRADUATED'),
-- Current students (K63, K64, K65)
(4, '21127045', 'Bachelor', 'K63', 2021, NULL, 'STUDYING'),
(9, '22127156', 'Bachelor', 'K64', 2022, NULL, 'STUDYING'),
(12, '23127120', 'Bachelor', 'K65', 2023, NULL, 'STUDYING'),
(17, '21127167', 'Bachelor', 'K63', 2021, NULL, 'STUDYING'),
(18, '22127089', 'Bachelor', 'K64', 2022, NULL, 'STUDYING'),
(19, '22127045', 'Bachelor', 'K64', 2022, NULL, 'STUDYING'),
(20, '21127078', 'Bachelor', 'K63', 2021, NULL, 'STUDYING'),
(23, '23127456', 'Bachelor', 'K65', 2023, NULL, 'STUDYING'),
(24, '22127234', 'Bachelor', 'K64', 2022, NULL, 'STUDYING'),
-- Other org members
(13, '20127030', 'Bachelor', 'K62', 2020, 2023, 'GRADUATED'),
(14, '22127001', 'Bachelor', 'K64', 2022, NULL, 'STUDYING'),
(27, '21127055', 'Bachelor', 'K63', 2021, NULL, 'STUDYING');

-- ============= ORGANIZATION MEMBERS DATA - Organization 1 (CS) FOCUSED =============
INSERT INTO "organization_members" ("organization_id", "user_id", "graduated_year", "graduation_status", "program", "major", "verification_level", "is_trusted_verifier", "status", "created_at", "updated_at") VALUES
-- Admin and experienced mentors
(1, 1, '[2012, 2016]', '["GRADUATED", "GRADUATED"]', '["Regular", "Master"]', '["Computer Science", "Computer Science"]', 3, true, 'ACTIVE', NOW() - INTERVAL '365 days', NOW()),
-- Senior alumni and mentors
(1, 2, '[2023]', '["GRADUATED"]', '["Advanced Program"]', '["Computer Science"]', 2, true, 'ACTIVE', NOW() - INTERVAL '365 days', NOW()),
(1, 6, '[2022]', '["GRADUATED"]', '["Regular"]', '["Computer Science"]', 2, true, 'ACTIVE', NOW() - INTERVAL '300 days', NOW()),
(1, 8, '[2023]', '["GRADUATED"]', '["Regular"]', '["Computer Science"]', 2, true, 'ACTIVE', NOW() - INTERVAL '280 days', NOW()),
(1, 10, '[2021]', '["GRADUATED"]', '["Regular"]', '["Computer Science"]', 2, true, 'ACTIVE', NOW() - INTERVAL '320 days', NOW()),
(1, 15, '[2021]', '["GRADUATED"]', '["Regular"]', '["Computer Science"]', 2, false, 'ACTIVE', NOW() - INTERVAL '250 days', NOW()),
(1, 16, '[2020]', '["GRADUATED"]', '["Advanced Program"]', '["Computer Science"]', 2, true, 'ACTIVE', NOW() - INTERVAL '200 days', NOW()),
(1, 21, '[2019]', '["GRADUATED"]', '["Regular"]', '["Computer Science"]', 2, true, 'ACTIVE', NOW() - INTERVAL '290 days', NOW()),
(1, 25, '[2018]', '["GRADUATED"]', '["Regular"]', '["Computer Science"]', 2, true, 'ACTIVE', NOW() - INTERVAL '310 days', NOW()),
-- Recent graduates
(1, 7, '[2024]', '["GRADUATED"]', '["Regular"]', '["Data Science"]', 2, false, 'ACTIVE', NOW() - INTERVAL '90 days', NOW()),
(1, 11, '[2022]', '["GRADUATED"]', '["Regular"]', '["Computer Science"]', 2, true, 'ACTIVE', NOW() - INTERVAL '180 days', NOW()),
(1, 22, '[2023]', '["GRADUATED"]', '["Advanced Program"]', '["Computer Science"]', 1, false, 'ACTIVE', NOW() - INTERVAL '120 days', NOW()),
(1, 26, '[2023]', '["GRADUATED"]', '["Regular"]', '["Data Science"]', 1, false, 'ACTIVE', NOW() - INTERVAL '110 days', NOW()),
-- Current students with various graduation status
(1, 4, '[]', '["STUDYING"]', '["Regular"]', '["Computer Science"]', 1, false, 'ACTIVE', NOW() - INTERVAL '180 days', NOW()),
(1, 9, '[]', '["STUDYING"]', '["Regular"]', '["Computer Science"]', 1, false, 'ACTIVE', NOW() - INTERVAL '120 days', NOW()),
(1, 12, '[]', '["STUDYING"]', '["Regular"]', '["Computer Science"]', 1, false, 'ACTIVE', NOW() - INTERVAL '30 days', NOW()),
(1, 17, '[]', '["STUDYING"]', '["Regular"]', '["Data Science"]', 1, false, 'ACTIVE', NOW() - INTERVAL '50 days', NOW()),
(1, 18, '[]', '["STUDYING"]', '["Advanced Program"]', '["Artificial Intelligence"]', 1, false, 'ACTIVE', NOW() - INTERVAL '25 days', NOW()),
(1, 19, '[]', '["STUDYING"]', '["Regular"]', '["Computer Science"]', 1, false, 'ACTIVE', NOW() - INTERVAL '90 days', NOW()),
(1, 20, '[]', '["STUDYING"]', '["Regular"]', '["Computer Science"]', 0, false, 'PENDING', NOW() - INTERVAL '45 days', NOW()),
(1, 23, '[]', '["STUDYING"]', '["Regular"]', '["Computer Science"]', 1, false, 'ACTIVE', NOW() - INTERVAL '15 days', NOW()),
(1, 24, '[]', '["STUDYING"]', '["Regular"]', '["Computer Science"]', 1, false, 'ACTIVE', NOW() - INTERVAL '10 days', NOW()),
-- Other org members for testing relationships
(2, 3, '[2023]', '["GRADUATED"]', '["Advanced Program"]', '["Information Technology"]', 2, true, 'ACTIVE', NOW() - INTERVAL '340 days', NOW()),
(2, 5, '[2024]', '["GRADUATED"]', '["Regular"]', '["Information Technology"]', 1, false, 'ACTIVE', NOW() - INTERVAL '120 days', NOW()),
(2, 13, '[]', '["STUDYING"]', '["Regular"]', '["Information Technology"]', 1, false, 'ACTIVE', NOW() - INTERVAL '25 days', NOW()),
(3, 7, '[2024]', '["GRADUATED"]', '["Regular"]', '["Business Administration"]', 2, true, 'ACTIVE', NOW() - INTERVAL '100 days', NOW());

-- ============= EVENTS DATA - Org 1 (CS) FOCUSED =============
INSERT INTO "events" ("organization_id", "creator_member_id", "title", "description", "banner_url", "location", "start_time", "end_time", "registration_start_at", "registration_end_at", "max_capacity", "interested_count", "topic", "is_published", "created_at") VALUES
-- Major CS events
(1, 2, 'CS Alumni Meetup June 2026', 'Annual networking event for CS alumni and current students', 'https://api.example.com/banners/cs_meetup.jpg', 'Ho Chi Minh City Convention Center', NOW() + INTERVAL '35 days', NOW() + INTERVAL '35 days 4 hours', NOW() - INTERVAL '10 days', NOW() + INTERVAL '30 days', 250, 78, 'Networking', true, NOW() - INTERVAL '15 days'),
(1, 6, 'Advanced System Design Workshop', 'Learn scalable architecture patterns from experienced engineers', 'https://api.example.com/banners/system_design.jpg', 'HCMUS Campus - Room 101', NOW() + INTERVAL '12 days', NOW() + INTERVAL '12 days 3 hours', NOW() - INTERVAL '5 days', NOW() + INTERVAL '8 days', 80, 52, 'Technical', true, NOW() - INTERVAL '8 days'),
(1, 16, 'DevOps & Cloud Mastery', 'Docker, Kubernetes, and cloud infrastructure setup', 'https://api.example.com/banners/devops.jpg', 'HCMUS Campus - Room 201', NOW() + INTERVAL '18 days', NOW() + INTERVAL '18 days 4 hours', NOW() - INTERVAL '3 days', NOW() + INTERVAL '14 days', 60, 35, 'Technical', true, NOW() - INTERVAL '5 days'),
(1, 21, 'Microservices Architecture Deep Dive', 'Building large-scale distributed systems', 'https://api.example.com/banners/microservices.jpg', 'Online via Zoom', NOW() + INTERVAL '25 days', NOW() + INTERVAL '25 days 3 hours', NOW() - INTERVAL '7 days', NOW() + INTERVAL '20 days', 120, 64, 'Technical', true, NOW() - INTERVAL '10 days'),
(1, 8, 'Cloud Architecture Patterns', 'AWS/GCP best practices from industry leaders', 'https://api.example.com/banners/cloud.jpg', 'HCMUS Campus - Auditorium', NOW() + INTERVAL '40 days', NOW() + INTERVAL '40 days 5 hours', NOW() - INTERVAL '15 days', NOW() + INTERVAL '35 days', 200, 95, 'Technical', true, NOW() - INTERVAL '18 days'),
(1, 25, 'AI/ML Systems Design', 'Building production-ready AI applications', 'https://api.example.com/banners/ai_systems.jpg', 'Saigon Pearl Building, District 1', NOW() + INTERVAL '50 days', NOW() + INTERVAL '50 days 6 hours', NOW() - INTERVAL '20 days', NOW() + INTERVAL '45 days', 150, 89, 'AI/ML', true, NOW() - INTERVAL '22 days'),
-- Career and soft skills
(1, 2, 'Interview Preparation: Big Tech Edition', 'Ace your interviews at FAANG companies', 'https://api.example.com/banners/interview.jpg', 'HCMUS Campus - Room 105', NOW() + INTERVAL '10 days', NOW() + INTERVAL '10 days 3 hours', NOW() - INTERVAL '4 days', NOW() + INTERVAL '6 days', 60, 48, 'Career', true, NOW() - INTERVAL '6 days'),
(1, 6, 'Leadership Skills for Tech Managers', 'Transition from IC to management roles', 'https://api.example.com/banners/leadership.jpg', 'HCMUS Campus - Hall B', NOW() + INTERVAL '28 days', NOW() + INTERVAL '28 days 4 hours', NOW() - INTERVAL '12 days', NOW() + INTERVAL '23 days', 100, 45, 'Leadership', true, NOW() - INTERVAL '14 days'),
(1, 11, 'Portfolio & CV Workshop for Developers', 'Showcase your projects and skills effectively', 'https://api.example.com/banners/portfolio.jpg', 'HCMUS Campus - Lab 02', NOW() + INTERVAL '8 days', NOW() + INTERVAL '8 days 3 hours', NOW() - INTERVAL '2 days', NOW() + INTERVAL '5 days', 50, 32, 'Career', true, NOW() - INTERVAL '3 days'),
-- Specialized topics
(1, 22, 'React Advanced Patterns & Performance', 'Master React hooks, optimization, and testing', 'https://api.example.com/banners/react.jpg', 'Online via Zoom', NOW() + INTERVAL '15 days', NOW() + INTERVAL '15 days 3 hours', NOW() - INTERVAL '6 days', NOW() + INTERVAL '12 days', 70, 45, 'Technical', true, NOW() - INTERVAL '7 days'),
(1, 26, 'Data Engineering Fundamentals', 'Building data pipelines and ETL processes', 'https://api.example.com/banners/data_eng.jpg', 'HCMUS Campus - Room 301', NOW() + INTERVAL '22 days', NOW() + INTERVAL '22 days 3 hours', NOW() - INTERVAL '8 days', NOW() + INTERVAL '18 days', 80, 38, 'Technical', true, NOW() - INTERVAL '10 days'),
(1, 7, 'Machine Learning for Beginners', 'Introduction to ML and Python data science', 'https://api.example.com/banners/ml_intro.jpg', 'HCMUS Campus - Room 303', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days 3 hours', NOW() - INTERVAL '1 day', NOW() + INTERVAL '2 days', 90, 67, 'Technical', true, NOW() - INTERVAL '2 days'),
-- Social and networking
(1, 4, 'Alumni Coffee Meetup - CS K63', 'Casual networking for recent batch students', 'https://api.example.com/banners/coffee.jpg', 'Highlands Coffee - District 1', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days 2 hours', NOW() - INTERVAL '2 days', NOW() + INTERVAL '4 days', 30, 18, 'Social', true, NOW() - INTERVAL '3 days'),
-- Other org events
(2, 3, 'IT Career Fair 2026', 'Meet top tech companies hiring IT graduates', 'https://api.example.com/banners/career_fair.jpg', 'HCMUS Campus - Main Hall', NOW() + INTERVAL '45 days', NOW() + INTERVAL '45 days 5 hours', NOW() - INTERVAL '20 days', NOW() + INTERVAL '40 days', 200, 120, 'Career', true, NOW() - INTERVAL '18 days'),
(3, 7, 'Business Leadership Summit', 'Success stories from business alumni', 'https://api.example.com/banners/biz_summit.jpg', 'HCMUS Campus - Hall C', NOW() + INTERVAL '32 days', NOW() + INTERVAL '32 days 4 hours', NOW() - INTERVAL '14 days', NOW() + INTERVAL '27 days', 150, 65, 'Leadership', true, NOW() - INTERVAL '16 days');

-- ============= EVENT INTERESTS DATA - Diverse interest patterns =============
INSERT INTO "event_interests" ("event_id", "member_id", "created_at") VALUES
-- CS Alumni Meetup (event 1)
(1, 2, NOW() - INTERVAL '14 days'),
(1, 4, NOW() - INTERVAL '13 days'),
(1, 6, NOW() - INTERVAL '12 days'),
(1, 8, NOW() - INTERVAL '11 days'),
(1, 9, NOW() - INTERVAL '10 days'),
(1, 10, NOW() - INTERVAL '9 days'),
(1, 11, NOW() - INTERVAL '8 days'),
(1, 12, NOW() - INTERVAL '7 days'),
(1, 16, NOW() - INTERVAL '6 days'),
(1, 17, NOW() - INTERVAL '5 days'),
(1, 18, NOW() - INTERVAL '4 days'),
(1, 19, NOW() - INTERVAL '3 days'),
(1, 20, NOW() - INTERVAL '2 days'),
(1, 23, NOW() - INTERVAL '1 day'),
-- System Design Workshop (event 2)
(2, 2, NOW() - INTERVAL '7 days'),
(2, 4, NOW() - INTERVAL '6 days'),
(2, 6, NOW() - INTERVAL '5 days'),
(2, 8, NOW() - INTERVAL '4 days'),
(2, 9, NOW() - INTERVAL '3 days'),
(2, 16, NOW() - INTERVAL '2 days'),
(2, 20, NOW() - INTERVAL '1 day'),
-- DevOps & Cloud (event 3)
(3, 6, NOW() - INTERVAL '4 days'),
(3, 8, NOW() - INTERVAL '3 days'),
(3, 16, NOW() - INTERVAL '2 days'),
(3, 17, NOW() - INTERVAL '1 day'),
-- Microservices (event 4)
(4, 2, NOW() - INTERVAL '6 days'),
(4, 4, NOW() - INTERVAL '5 days'),
(4, 8, NOW() - INTERVAL '4 days'),
(4, 20, NOW() - INTERVAL '3 days'),
(4, 21, NOW() - INTERVAL '2 days'),
-- Cloud Architecture (event 5)
(5, 4, NOW() - INTERVAL '16 days'),
(5, 8, NOW() - INTERVAL '15 days'),
(5, 9, NOW() - INTERVAL '14 days'),
(5, 16, NOW() - INTERVAL '13 days'),
(5, 17, NOW() - INTERVAL '12 days'),
(5, 20, NOW() - INTERVAL '11 days'),
-- AI/ML Systems (event 6)
(6, 9, NOW() - INTERVAL '20 days'),
(6, 12, NOW() - INTERVAL '19 days'),
(6, 17, NOW() - INTERVAL '18 days'),
(6, 18, NOW() - INTERVAL '17 days'),
(6, 25, NOW() - INTERVAL '16 days'),
-- Interview Prep (event 7)
(7, 2, NOW() - INTERVAL '5 days'),
(7, 4, NOW() - INTERVAL '4 days'),
(7, 9, NOW() - INTERVAL '3 days'),
(7, 18, NOW() - INTERVAL '2 days'),
(7, 20, NOW() - INTERVAL '1 day'),
-- Leadership Skills (event 8)
(8, 2, NOW() - INTERVAL '12 days'),
(8, 6, NOW() - INTERVAL '11 days'),
(8, 8, NOW() - INTERVAL '10 days'),
-- Other org events
(14, 3, NOW() - INTERVAL '18 days'),
(14, 5, NOW() - INTERVAL '16 days'),
(15, 7, NOW() - INTERVAL '15 days'),
(15, 10, NOW() - INTERVAL '14 days');

-- ============= EVENT TICKETS DATA - Diverse registration states =============
INSERT INTO "event_tickets" ("event_id", "member_id", "guest_name", "guest_email", "guest_phone", "ticket_code", "status", "registered_at", "checked_in_at") VALUES
-- CS Alumni Meetup (event 1) - Multiple registrations
(1, 2, NULL, NULL, NULL, 'EVT001-CS001', 'REGISTERED', NOW() - INTERVAL '10 days', NULL),
(1, 4, NULL, NULL, NULL, 'EVT001-CS002', 'REGISTERED', NOW() - INTERVAL '8 days', NULL),
(1, 6, NULL, NULL, NULL, 'EVT001-CS003', 'REGISTERED', NOW() - INTERVAL '7 days', NULL),
(1, 8, NULL, NULL, NULL, 'EVT001-CS004', 'REGISTERED', NOW() - INTERVAL '5 days', NULL),
(1, 9, NULL, NULL, NULL, 'EVT001-CS005', 'REGISTERED', NOW() - INTERVAL '4 days', NULL),
(1, 11, NULL, NULL, NULL, 'EVT001-CS006', 'REGISTERED', NOW() - INTERVAL '3 days', NULL),
(1, NULL, 'Nguyễn Minh Hùng', 'minhhung@example.com', '0901234567', 'EVT001-CS007', 'REGISTERED', NOW() - INTERVAL '2 days', NULL),
(1, 12, NULL, NULL, NULL, 'EVT001-CS008', 'REGISTERED', NOW() - INTERVAL '1 day', NULL),
-- System Design Workshop (event 2)
(2, 2, NULL, NULL, NULL, 'EVT002-SD001', 'REGISTERED', NOW() - INTERVAL '6 days', NULL),
(2, 4, NULL, NULL, NULL, 'EVT002-SD002', 'REGISTERED', NOW() - INTERVAL '5 days', NULL),
(2, 6, NULL, NULL, NULL, 'EVT002-SD003', 'REGISTERED', NOW() - INTERVAL '4 days', NULL),
(2, 9, NULL, NULL, NULL, 'EVT002-SD004', 'REGISTERED', NOW() - INTERVAL '3 days', NULL),
(2, 20, NULL, NULL, NULL, 'EVT002-SD005', 'REGISTERED', NOW() - INTERVAL '1 day', NULL),
-- DevOps & Cloud (event 3)
(3, 6, NULL, NULL, NULL, 'EVT003-DO001', 'REGISTERED', NOW() - INTERVAL '3 days', NULL),
(3, 8, NULL, NULL, NULL, 'EVT003-DO002', 'REGISTERED', NOW() - INTERVAL '2 days', NULL),
(3, 16, NULL, NULL, NULL, 'EVT003-DO003', 'REGISTERED', NOW() - INTERVAL '1 day', NULL),
-- Microservices (event 4)
(4, 2, NULL, NULL, NULL, 'EVT004-MS001', 'REGISTERED', NOW() - INTERVAL '5 days', NULL),
(4, 8, NULL, NULL, NULL, 'EVT004-MS002', 'REGISTERED', NOW() - INTERVAL '4 days', NULL),
(4, 20, NULL, NULL, NULL, 'EVT004-MS003', 'REGISTERED', NOW() - INTERVAL '2 days', NULL),
(4, 21, NULL, NULL, NULL, 'EVT004-MS004', 'REGISTERED', NOW() - INTERVAL '1 day', NULL),
-- Interview Prep (event 7)
(7, 2, NULL, NULL, NULL, 'EVT007-IP001', 'REGISTERED', NOW() - INTERVAL '4 days', NULL),
(7, 4, NULL, NULL, NULL, 'EVT007-IP002', 'REGISTERED', NOW() - INTERVAL '3 days', NULL),
(7, 9, NULL, NULL, NULL, 'EVT007-IP003', 'REGISTERED', NOW() - INTERVAL '2 days', NULL),
(7, 20, NULL, NULL, NULL, 'EVT007-IP004', 'REGISTERED', NOW() - INTERVAL '1 day', NULL),
-- Machine Learning (event 11)
(11, 9, NULL, NULL, NULL, 'EVT011-ML001', 'REGISTERED', NOW() - INTERVAL '2 days', NULL),
(11, 12, NULL, NULL, NULL, 'EVT011-ML002', 'REGISTERED', NOW() - INTERVAL '1 day', NULL),
(11, 17, NULL, NULL, NULL, 'EVT011-ML003', 'REGISTERED', NOW(), NULL),
(11, 18, NULL, NULL, NULL, 'EVT011-ML004', 'REGISTERED', NOW(), NULL);

-- ============= MENTOR PROFILES DATA - Org 1 (CS) FOCUSED =============
INSERT INTO "mentor_profiles" ("member_id", "current_job_title", "current_company", "bio", "rating_avg", "total_sessions", "status", "created_at", "updated_at") VALUES
-- Senior mentors from CS
(2, 'Senior Software Engineer', 'Tech Solutions Inc', 'Full-stack expert with 8+ years experience', 4.8, 45, 'APPROVED', NOW() - INTERVAL '300 days', NOW()),
(6, 'Tech Lead', 'Digital Transformation Co', 'System design and architecture specialist', 4.9, 62, 'APPROVED', NOW() - INTERVAL '250 days', NOW()),
(8, 'Solutions Architect', 'Google Vietnam', 'Cloud and distributed systems expert', 4.7, 38, 'APPROVED', NOW() - INTERVAL '220 days', NOW()),
(10, 'Engineering Manager', 'Lazada Tech', 'Backend systems and team leadership', 4.6, 32, 'APPROVED', NOW() - INTERVAL '240 days', NOW()),
(16, 'Cloud Architect', 'Cloud Tech', 'AWS/GCP specialist with DevOps focus', 4.8, 28, 'APPROVED', NOW() - INTERVAL '180 days', NOW()),
(21, 'Software Architect', 'Grab Vietnam', 'Microservices and scalability expert', 4.7, 35, 'APPROVED', NOW() - INTERVAL '200 days', NOW()),
(25, 'Principal Engineer', 'Cinnamon AI', 'AI/ML and system design mentor', 4.9, 41, 'APPROVED', NOW() - INTERVAL '210 days', NOW()),
-- Recently approved mentors
(7, 'ML Engineer', 'FPT Software', 'Machine learning and data engineering', 4.5, 8, 'APPROVED', NOW() - INTERVAL '60 days', NOW()),
(11, 'Backend Developer', 'VNG Corp', 'Backend development and architecture', 4.4, 12, 'APPROVED', NOW() - INTERVAL '90 days', NOW()),
(22, 'Full Stack Developer', 'Tiki.vn', 'React/Node.js full stack development', 4.3, 5, 'APPROVED', NOW() - INTERVAL '50 days', NOW()),
(26, 'Data Engineer', 'Tiki.vn', 'Data pipeline and analytics mentoring', 4.2, 3, 'APPROVED', NOW() - INTERVAL '70 days', NOW()),
-- Pending mentor applications
(15, 'Senior Flutter Developer', 'Tech Startup', 'Mobile development and career guidance', 0, 0, 'PENDING', NOW() - INTERVAL '20 days', NOW()),
(23, 'Junior Developer', 'Small Company', 'Beginner-friendly mentoring', 0, 0, 'DRAFT', NOW() - INTERVAL '5 days', NOW()),
-- Other org mentors
(3, 'Product Manager', 'Innovation Hub', 'Product strategy and management', 4.6, 18, 'APPROVED', NOW() - INTERVAL '55 days', NOW()),
(5, 'Senior AI Engineer', 'AI Research Lab', 'Deep learning and NLP expertise', 4.7, 12, 'APPROVED', NOW() - INTERVAL '120 days', NOW());

-- ============= MENTEE PROFILES DATA - Org 1 (CS) FOCUSED =============
INSERT INTO "mentee_profiles" ("member_id", "mentoring_goal", "major", "academic_year", "interests", "is_active", "created_at", "updated_at") VALUES
-- CS mentees - Active students
(4, 'Chuẩn bị thực tập tại công ty lớn', 'Computer Science', 'Year 3', 'Backend, System Design, Internship', true, NOW() - INTERVAL '180 days', NOW()),
(9, 'Xây dựng portfolio lập trình', 'Computer Science', 'Year 2', 'Web Development, Projects, Career', true, NOW() - INTERVAL '120 days', NOW()),
(12, 'Học sâu về AI/ML và research', 'Computer Science', 'Year 1', 'Machine Learning, Python, Research', true, NOW() - INTERVAL '30 days', NOW()),
(17, 'Phát triển kỹ năng Data Science', 'Data Science', 'Year 3', 'Data Analysis, ML, SQL', true, NOW() - INTERVAL '50 days', NOW()),
(18, 'Tìm hiểu về AI và Computer Vision', 'Computer Science', 'Year 2', 'AI, Deep Learning, OpenCV', true, NOW() - INTERVAL '25 days', NOW()),
(19, 'Chuẩn bị thực tập và tuyển dụng', 'Computer Science', 'Year 2', 'Frontend, React, Career Planning', true, NOW() - INTERVAL '90 days', NOW()),
(20, 'Định hướng sự nghiệp sau tốt nghiệp', 'Computer Science', 'Year 3', 'Backend, Microservices, Leadership', true, NOW() - INTERVAL '45 days', NOW()),
(23, 'Bắt đầu con đường lập trình', 'Computer Science', 'Year 1', 'Fundamentals, Problem Solving, DSA', true, NOW() - INTERVAL '15 days', NOW()),
(24, 'Học lập trình từ các mentor', 'Computer Science', 'Year 2', 'Web Development, Java, Spring Boot', true, NOW() - INTERVAL '10 days', NOW()),
-- Other org mentees
(13, 'Data engineering và cloud technologies', 'Information Technology', 'Year 2', 'Data Engineering, Cloud, Spark', true, NOW() - INTERVAL '25 days', NOW()),
(14, 'Chuẩn bị thực tập', 'Information Technology', 'Year 2', 'Java, Databases, Soft Skills', true, NOW() - INTERVAL '35 days', NOW()),
(27, 'Khám phá ngành IT', 'Information Technology', 'Year 1', 'Fundamentals, Career Path, Internship', true, NOW() - INTERVAL '20 days', NOW());

-- ============= MENTOR EXPERTISE DATA - Org 1 (CS) FOCUSED =============
INSERT INTO "mentor_expertise" ("mentor_member_id", "topic", "years_experience", "description", "category", "tag") VALUES
-- John Doe (Member 2) - Senior Full Stack
(2, 'Full Stack Development', 8, 'React, Node.js, PostgreSQL, MongoDB', 'Technical', 'Fullstack'),
(2, 'System Design', 7, 'Microservices, scalability, distributed systems', 'Technical', 'Architecture'),
(2, 'Software Architecture', 7, 'Thiết kế hệ thống lớn với khả năng mở rộng cao', 'Technical', 'Backend'),
(2, 'Interview Preparation', 8, 'Chuẩn bị phỏng vấn tại các công ty lớn', 'Soft Skills', 'Career'),
(2, 'Career Path', 8, 'Định hướng nghề nghiệp trong ngành Big Tech', 'Soft Skills', 'Career'),
-- Phạm Văn C (Member 6) - Tech Lead
(6, 'Database Design', 10, 'SQL, NoSQL, query optimization, indexing', 'Technical', 'Database'),
(6, 'System Design', 8, 'Thiết kế hệ thống backend phức tạp', 'Technical', 'Architecture'),
(6, 'Performance Optimization', 8, 'Tối ưu hóa performance cho ứng dụng lớn', 'Technical', 'Backend'),
(6, 'Team Leadership', 7, 'Quản lý đội kỹ sư, mentoring', 'Soft Skills', 'Leadership'),
-- Lê Văn E (Member 8) - Solutions Architect
(8, 'Cloud Architecture', 7, 'Google Cloud, AWS, infrastructure design', 'Technical', 'Cloud'),
(8, 'Distributed Systems', 6, 'Kafka, RabbitMQ, event-driven architecture', 'Technical', 'Architecture'),
(8, 'Startup Development', 6, 'Building products from scratch, MVP', 'Entrepreneurship', 'Startup'),
(8, 'Technical Entrepreneurship', 5, 'Product-market fit, tech team building', 'Entrepreneurship', 'Tech'),
-- Võ Văn G (Member 10) - Engineering Manager
(10, 'Backend Systems', 8, 'Java, Spring Boot, PostgreSQL', 'Technical', 'Backend'),
(10, 'Team Management', 7, 'Leading engineering teams, hiring', 'Management', 'Leadership'),
(10, 'Career Development', 7, 'Career progression, technical growth', 'Soft Skills', 'Career'),
-- Phạm Minh D (Member 16) - Cloud Architect
(16, 'DevOps', 6, 'Docker, Kubernetes, CI/CD pipelines', 'Technical', 'DevOps'),
(16, 'Cloud Computing', 6, 'AWS/GCP architecture and best practices', 'Technical', 'Cloud'),
(16, 'Infrastructure as Code', 5, 'Terraform, CloudFormation', 'Technical', 'DevOps'),
-- Hoàng Thị D (Member 7) - ML Engineer
(7, 'Machine Learning', 4, 'TensorFlow, PyTorch, model training', 'Technical', 'AI'),
(7, 'Data Engineering', 3, 'Data pipelines, feature engineering', 'Technical', 'Data'),
(7, 'Python for ML', 4, 'NumPy, Pandas, scikit-learn', 'Technical', 'AI'),
-- Trần Thị B (Member 11) - Backend Developer
(11, 'Backend Development', 5, 'Java Spring Boot, REST APIs', 'Technical', 'Backend'),
(11, 'Database Basics', 4, 'SQL, relational design', 'Technical', 'Database'),
(11, 'Code Review', 4, 'Writing clean, maintainable code', 'Technical', 'Backend'),
-- Sơn Văn L (Member 21) - Software Architect
(21, 'Microservices Architecture', 8, 'Service design, communication patterns', 'Technical', 'Architecture'),
(21, 'System Scalability', 7, 'Designing systems for millions of users', 'Technical', 'Architecture'),
(21, 'Technical Leadership', 7, 'Mentoring, team building', 'Soft Skills', 'Leadership'),
-- Khải Văn Q (Member 25) - Principal Engineer
(25, 'AI Systems Design', 7, 'Large language models, AI infrastructure', 'Technical', 'AI'),
(25, 'System Architecture', 8, 'End-to-end system design', 'Technical', 'Architecture'),
(25, 'Research Mentoring', 6, 'Guiding research projects', 'Research', 'AI'),
-- Yến Thị M (Member 22) - Full Stack
(22, 'React & Frontend', 4, 'React hooks, state management, TypeScript', 'Technical', 'Frontend'),
(22, 'Node.js Backend', 3, 'Express.js, database integration', 'Technical', 'Backend'),
-- Linh Thị R (Member 26) - Data Engineer
(26, 'Data Pipelines', 3, 'Apache Spark, data warehousing', 'Technical', 'Data'),
(26, 'SQL & Analytics', 3, 'Complex queries, analytics optimization', 'Technical', 'Database'),
-- Other org mentors
(3, 'Product Management', 7, 'Product strategy, roadmapping, analytics', 'Management', 'Product'),
(3, 'Product Strategy', 5, 'From idea to execution', 'Management', 'Product'),
(5, 'Deep Learning', 5, 'Neural networks, model optimization', 'Technical', 'AI'),
(5, 'Natural Language Processing', 4, 'NLP techniques and applications', 'Technical', 'AI');

-- ============= MENTOR AVAILABILITIES DATA - Multiple slots per mentor =============
INSERT INTO "mentor_availabilities" ("mentor_member_id", "start_time", "end_time", "status") VALUES
-- John Doe (Member 2) - Multiple weekly slots
(2, NOW() + INTERVAL '1 day 10:00', NOW() + INTERVAL '1 day 11:00', 'AVAILABLE'),
(2, NOW() + INTERVAL '3 days 14:00', NOW() + INTERVAL '3 days 15:00', 'AVAILABLE'),
(2, NOW() + INTERVAL '5 days 16:00', NOW() + INTERVAL '5 days 17:00', 'BOOKED'),
(2, NOW() + INTERVAL '7 days 10:00', NOW() + INTERVAL '7 days 11:00', 'AVAILABLE'),
(2, NOW() + INTERVAL '8 days 14:00', NOW() + INTERVAL '8 days 15:00', 'AVAILABLE'),
-- Phạm Văn C (Member 6) - Database mentor
(6, NOW() + INTERVAL '2 days 11:00', NOW() + INTERVAL '2 days 12:00', 'BOOKED'),
(6, NOW() + INTERVAL '4 days 15:00', NOW() + INTERVAL '4 days 16:00', 'AVAILABLE'),
(6, NOW() + INTERVAL '6 days 10:00', NOW() + INTERVAL '6 days 11:00', 'AVAILABLE'),
-- Lê Văn E (Member 8) - Cloud architect
(8, NOW() + INTERVAL '1 day 13:00', NOW() + INTERVAL '1 day 14:00', 'AVAILABLE'),
(8, NOW() + INTERVAL '3 days 16:00', NOW() + INTERVAL '3 days 17:00', 'AVAILABLE'),
(8, NOW() + INTERVAL '5 days 09:00', NOW() + INTERVAL '5 days 10:00', 'AVAILABLE'),
-- Võ Văn G (Member 10) - Engineering manager
(10, NOW() + INTERVAL '2 days 09:00', NOW() + INTERVAL '2 days 10:00', 'AVAILABLE'),
(10, NOW() + INTERVAL '4 days 14:00', NOW() + INTERVAL '4 days 15:00', 'AVAILABLE'),
(10, NOW() + INTERVAL '6 days 13:00', NOW() + INTERVAL '6 days 14:00', 'BOOKED'),
(10, NOW() + INTERVAL '7 days 15:00', NOW() + INTERVAL '7 days 16:00', 'AVAILABLE'),
-- Phạm Minh D (Member 16) - DevOps mentor
(16, NOW() + INTERVAL '1 day 15:00', NOW() + INTERVAL '1 day 16:00', 'AVAILABLE'),
(16, NOW() + INTERVAL '3 days 11:00', NOW() + INTERVAL '3 days 12:00', 'AVAILABLE'),
(16, NOW() + INTERVAL '5 days 13:00', NOW() + INTERVAL '5 days 14:00', 'AVAILABLE'),
-- Hoàng Thị D (Member 7) - ML engineer
(7, NOW() + INTERVAL '2 days 13:00', NOW() + INTERVAL '2 days 14:00', 'AVAILABLE'),
(7, NOW() + INTERVAL '4 days 10:00', NOW() + INTERVAL '4 days 11:00', 'AVAILABLE'),
(7, NOW() + INTERVAL '6 days 15:00', NOW() + INTERVAL '6 days 16:00', 'AVAILABLE'),
-- Trần Thị B (Member 11) - Backend mentor (new)
(11, NOW() + INTERVAL '1 day 17:00', NOW() + INTERVAL '1 day 18:00', 'AVAILABLE'),
(11, NOW() + INTERVAL '3 days 09:00', NOW() + INTERVAL '3 days 10:00', 'AVAILABLE'),
-- Sơn Văn L (Member 21) - Architect
(21, NOW() + INTERVAL '2 days 14:00', NOW() + INTERVAL '2 days 15:00', 'AVAILABLE'),
(21, NOW() + INTERVAL '5 days 11:00', NOW() + INTERVAL '5 days 12:00', 'AVAILABLE'),
-- Khải Văn Q (Member 25) - Principal engineer
(25, NOW() + INTERVAL '1 day 16:00', NOW() + INTERVAL '1 day 17:00', 'BOOKED'),
(25, NOW() + INTERVAL '4 days 13:00', NOW() + INTERVAL '4 days 14:00', 'AVAILABLE'),
(25, NOW() + INTERVAL '6 days 09:00', NOW() + INTERVAL '6 days 10:00', 'AVAILABLE'),
-- Yến Thị M (Member 22) - Full stack (new)
(22, NOW() + INTERVAL '2 days 17:00', NOW() + INTERVAL '2 days 18:00', 'AVAILABLE'),
(22, NOW() + INTERVAL '4 days 11:00', NOW() + INTERVAL '4 days 12:00', 'AVAILABLE'),
-- Linh Thị R (Member 26) - Data engineer (new)
(26, NOW() + INTERVAL '3 days 13:00', NOW() + INTERVAL '3 days 14:00', 'AVAILABLE'),
(26, NOW() + INTERVAL '5 days 10:00', NOW() + INTERVAL '5 days 11:00', 'AVAILABLE'),
-- Other org mentors
(3, NOW() + INTERVAL '2 days 10:00', NOW() + INTERVAL '2 days 11:00', 'AVAILABLE'),
(3, NOW() + INTERVAL '4 days 14:00', NOW() + INTERVAL '4 days 15:00', 'AVAILABLE'),
(5, NOW() + INTERVAL '1 day 14:00', NOW() + INTERVAL '1 day 15:00', 'AVAILABLE'),
(5, NOW() + INTERVAL '3 days 15:00', NOW() + INTERVAL '3 days 16:00', 'AVAILABLE');

-- ============= MENTORSHIP SESSIONS DATA - Diverse org 1 sessions =============
INSERT INTO "mentorship_sessions" ("availability_id", "mentee_member_id", "status", "booking_note", "meeting_link", "session_type", "introduction", "description", "created_at") VALUES
-- Completed sessions
(1, 4, 'COMPLETED', 'Thảo luận về web development best practices', 'https://zoom.us/j/123456789', 'TECHNICAL', 'Em muốn học về React Hooks.', 'Buổi học về React Hooks cơ bản và nâng cao.', NOW() - INTERVAL '45 days'),
(1, 9, 'COMPLETED', 'Backend system design discussion', 'https://zoom.us/j/987654321', 'TECHNICAL', 'Em muốn tìm hiểu Spring Boot và architecture.', 'Lộ trình học Spring Boot và design patterns.', NOW() - INTERVAL '30 days'),
(2, 12, 'COMPLETED', 'Intro to AI and machine learning', 'https://meet.google.com/abc-defg-hij', 'TECHNICAL', 'Em bắt đầu học AI, cần hướng dẫn.', 'Giới thiệu basic concepts, setup environment.', NOW() - INTERVAL '20 days'),
(3, 17, 'COMPLETED', 'Data science fundamentals', 'https://zoom.us/j/555555555', 'TECHNICAL', 'Python basics cho data science.', 'NumPy, Pandas, data manipulation basics.', NOW() - INTERVAL '15 days'),
(4, 19, 'COMPLETED', 'Frontend development deep dive', 'https://meet.google.com/xyz-qwerty', 'TECHNICAL', 'Em muốn chuyên sâu về React.', 'React advanced patterns và performance optimization.', NOW() - INTERVAL '10 days'),
(5, 20, 'COMPLETED', 'Interview preparation session', 'https://zoom.us/j/444444444', 'CAREER', 'Chuẩn bị phỏng vấn vào FAANG.', 'System design questions và problem solving.', NOW() - INTERVAL '8 days'),
(3, 18, 'COMPLETED', 'CV review and career planning', 'https://zoom.us/j/333333333', 'CAREER', 'Em muốn xin review CV.', 'CV improvement suggestions và career roadmap.', NOW() - INTERVAL '5 days'),
-- Scheduled/Confirmed sessions
(2, 4, 'CONFIRMED', 'First backend mentoring session', 'https://meet.google.com/backend-session', 'TECHNICAL', 'Em muốn học lập trình backend.', 'Bắt đầu từ cơ bản đến advanced concepts.', NOW() - INTERVAL '3 days'),
(3, 9, 'SCHEDULED', 'Advanced system design', 'https://zoom.us/j/222222222', 'TECHNICAL', 'Tiếp tục thảo luận system design.', 'Scalability, caching, databases.', NOW() - INTERVAL '2 days'),
(4, 12, 'CONFIRMED', 'AI/ML project guidance', 'https://meet.google.com/ai-project', 'TECHNICAL', 'Em có dự án ML muốn discuss.', 'Code review và optimization strategies.', NOW() - INTERVAL '1 day'),
(5, 23, 'SCHEDULED', 'Programming fundamentals', 'https://zoom.us/j/111111111', 'TECHNICAL', 'Em mới bắt đầu học lập trình.', 'Data structures, algorithms, problem solving.', NOW()),
-- Pending sessions waiting for mentor response
(6, 17, 'PENDING', 'Em muốn học machine learning operations.', NULL, 'TECHNICAL', 'MLOps mentoring', 'Model deployment, monitoring, versioning.', NOW() - INTERVAL '2 days'),
(7, 20, 'PENDING', 'Xin hỏi về distributed systems.', NULL, 'TECHNICAL', 'Distributed systems deep dive', 'Consensus, replication, fault tolerance.', NOW() - INTERVAL '1 day'),
(8, 24, 'PENDING', 'Em muốn học Java Spring Boot.', NULL, 'TECHNICAL', 'Java backend development', 'Spring Boot, Hibernate, REST APIs.', NOW()),
-- Cancelled/No-show for testing edge cases
(2, 18, 'CANCELLED', 'Mentee cancelled due to conflicting schedule', NULL, 'TECHNICAL', 'Em không thể attend', 'Reschedule needed', NOW() - INTERVAL '7 days');

-- ============= SESSION FEEDBACKS DATA - Diverse ratings =============
INSERT INTO "session_feedbacks" ("session_id", "mentee_member_id", "rating", "comment", "is_public", "created_at") VALUES
-- 5 star feedback
(1, 4, 5, 'John provided excellent guidance on React patterns. Very professional and knowledgeable!', true, NOW() - INTERVAL '44 days'),
(2, 9, 5, 'Excellent system design discussion. John explained complex concepts clearly.', true, NOW() - INTERVAL '29 days'),
(3, 12, 5, 'Great intro to AI/ML. Phạm was patient and thorough. Highly recommend!', true, NOW() - INTERVAL '19 days'),
(4, 17, 5, 'Perfect data science fundamentals session. Will definitely continue mentoring with Phạm.', true, NOW() - INTERVAL '14 days'),
-- 4 star feedback
(5, 19, 4, 'Very helpful React discussion. Could have gone deeper into some topics.', true, NOW() - INTERVAL '9 days'),
(6, 20, 4, 'Good interview prep session. Lots of valuable insights. Thanks Võ Văn!', true, NOW() - INTERVAL '7 days'),
-- 3 star feedback
(7, 18, 3, 'Session was okay. Some useful career advice but could be more structured.', true, NOW() - INTERVAL '4 days');

-- ============= NEWS DATA =============
INSERT INTO "news" ("organization_id", "author_member_id", "title", "slug", "content", "thumbnail_url", "topic", "is_hidden", "published_at") VALUES
(1, 2, 'CS Department Launches New AI Lab', 'cs-new-ai-lab', 'We are excited to announce the opening of our state-of-the-art AI research laboratory...', 'https://api.example.com/news/ai_lab.jpg', 'Research', false, NOW() - INTERVAL '20 days'),
(1, 6, '2026 Scholarship Program Now Open', 'scholarship-program-2026', 'Applications for the 2026 scholarship program are now being accepted. Apply now...', 'https://api.example.com/news/scholarship.jpg', 'Education', false, NOW() - INTERVAL '15 days'),
(2, 3, 'IT Department Achievement: 100 Job Placements', 'it-100-placements', 'Congratulations to our graduates who secured employment...', 'https://api.example.com/news/placements.jpg', 'Career', false, NOW() - INTERVAL '10 days'),
(2, 8, 'Innovation Week 2026 Schedule Released', 'innovation-week-2026', 'Mark your calendars for our annual Innovation Week...', 'https://api.example.com/news/innovation_week.jpg', 'Event', false, NOW() - INTERVAL '7 days'),
(3, 7, 'Alumni Business Forum: Success Stories', 'alumni-business-forum', 'Join us as successful alumni share their entrepreneurial journeys...', 'https://api.example.com/news/forum.jpg', 'Networking', false, NOW() - INTERVAL '5 days'),
(4, 1, 'Engineering Capstone Projects Exhibition', 'capstone-exhibition', 'View the innovative projects created by our engineering students...', 'https://api.example.com/news/capstone.jpg', 'Exhibition', false, NOW() - INTERVAL '3 days'),
(1, 16, 'Cloud Tech Recruitment Day', 'cloud-tech-recruitment', 'Join us for a recruitment day with Cloud Tech...', 'https://api.example.com/news/recruitment.jpg', 'Career', false, NOW() - INTERVAL '2 days');


-- ============= ALUMNI POSTS DATA =============
INSERT INTO "alumni_posts" ("organization_id", "author_member_id", "title", "slug", "content", "thumbnail_url", "topic", "is_hidden", "published_at") VALUES
(1, 2, 'My Journey from Student to Senior Engineer', 'my-journey-student-to-senior', 'Reflecting on 10 years in the industry after graduating from HCMUS...', 'https://api.example.com/posts/journey.jpg', 'Career', false, NOW() - INTERVAL '5 days'),
(1, 6, 'Tips for Navigating the Tech Industry', 'tips-navigating-tech-industry', 'Sharing some lessons learned throughout my career as a developer...', 'https://api.example.com/posts/tips.jpg', 'Advice', false, NOW() - INTERVAL '3 days'),
(2, 3, 'The Importance of Continuous Learning', 'importance-continuous-learning', 'How staying curious helped me grow as a Product Manager...', 'https://api.example.com/posts/learning.jpg', 'Education', false, NOW() - INTERVAL '2 days'),
(1, 15, 'Flutter 4.0: What is new?', 'flutter-4-new', 'Exploring the latest features in Flutter 4.0...', 'https://api.example.com/posts/flutter.jpg', 'Technical', false, NOW() - INTERVAL '1 day');

-- ============= SAVED ITEMS DATA =============
INSERT INTO "saved_items" ("member_id", "item_type", "item_id", "note", "saved_at") VALUES
(4, 'NEWS', 1, 'Interesting AI research opportunity', NOW() - INTERVAL '18 days'),
(4, 'EVENT', 2, 'Want to attend this workshop', NOW() - INTERVAL '3 days'),
(5, 'JOB', 1, 'Perfect job match for my skills', NOW() - INTERVAL '8 days'),
(9, 'NEWS', 2, 'Scholarship opportunity for my next year', NOW() - INTERVAL '12 days'),
(9, 'RESOURCE', 1, 'React course for self-improvement', NOW() - INTERVAL '7 days'),
(10, 'EVENT', 6, 'Interested in business leadership', NOW() - INTERVAL '1 day');

-- ============= ACHIEVEMENTS DATA =============
INSERT INTO "achievements" ("member_id", "title", "description", "image_url", "awarded_date", "topic", "status") VALUES
(2, 'Outstanding Alumni Award 2024', 'Recognized for significant contributions to tech community', 'https://api.example.com/achievements/outstanding.jpg', '2024-06-15', 'Recognition', 'APPROVED'),
(3, 'Mentor of the Year', 'Awarded for exceptional mentoring and guidance', 'https://api.example.com/achievements/mentor.jpg', '2024-05-10', 'Mentorship', 'APPROVED'),
(6, 'Innovation Excellence', 'Developed groundbreaking solutions in system design', 'https://api.example.com/achievements/innovation.jpg', '2024-07-20', 'Innovation', 'APPROVED'),
(4, 'Scholarship Recipient 2025-2026', 'Awarded academic excellence scholarship', 'https://api.example.com/achievements/scholarship.jpg', '2025-08-01', 'Scholarship', 'APPROVED'),
(5, 'Academic Excellence', 'Graduated with high honors', 'https://api.example.com/achievements/honors.jpg', '2024-06-01', 'Academic', 'APPROVED');

-- ============= JOBS DATA =============
INSERT INTO "jobs" ("organization_id", "poster_member_id", "is_referral", "type", "title", "company_name", "location", "salary_range", "description", "how_to_apply", "deadline", "is_active", "created_at") VALUES
(1, 2, false, 'FULL_TIME', 'Junior Software Developer', 'Tech Solutions Inc', 'Ho Chi Minh City', '00-200/month', 'We are looking for talented junior developers to join our team...', 'Send CV to careers@techsolutions.com', '2026-03-31', true, NOW() - INTERVAL '25 days'),
(1, 2, true, 'FULL_TIME', 'Senior Software Engineer', 'Tech Solutions Inc', 'Ho Chi Minh City', '000-000/month', 'Referral opportunity: Senior engineer position with great benefits...', 'Contact John Doe directly', '2026-04-15', true, NOW() - INTERVAL '20 days'),
(2, 3, false, 'INTERNSHIP', 'Product Management Intern', 'Innovation Hub', 'Ho Chi Minh City', '00-00/month', 'Help us shape the future of our products as a PM intern...', 'Apply via LinkedIn or email', '2026-03-15', true, NOW() - INTERVAL '18 days'),
(2, 8, true, 'FULL_TIME', 'CTO/Co-founder', 'TechStart Ventures', 'Ho Chi Minh City', 'Competitive + Equity', 'Building the next unicorn startup. We seek talented tech co-founder...', 'Contact Lê Văn E', '2026-05-31', true, NOW() - INTERVAL '12 days'),
(3, 7, false, 'FULL_TIME', 'Business Development Manager', 'Global Consulting Group', 'Ho Chi Minh City', '500-500/month', 'Lead business growth initiatives for our consulting firm...', 'Send application to hr@globalconsulting.com', '2026-03-30', true, NOW() - INTERVAL '10 days'),
(4, 1, false, 'FULL_TIME', 'Systems Engineer', 'Tech Engineering Corp', 'Hanoi', '200-800/month', 'Join our infrastructure team and build scalable systems...', 'Apply online at careers.techeng.com', '2026-04-10', true, NOW() - INTERVAL '8 days');

-- ============= LEARNING RESOURCES DATA =============
INSERT INTO "learning_resources" ("organization_id", "uploader_member_id", "title", "type", "link_url", "description", "created_at") VALUES
(1, 2, 'Complete React Course 2025', 'COURSE', 'https://udemy.com/complete-react-2025', 'Comprehensive React learning path from basics to advanced', NOW() - INTERVAL '60 days'),
(1, 6, 'Database Design Best Practices', 'EBOOK', 'https://example.com/db-design-ebook.pdf', 'Essential guide to designing scalable databases', NOW() - INTERVAL '50 days'),
(2, 3, 'Product Management Fundamentals', 'COURSE', 'https://coursera.org/product-management', 'Master the fundamentals of modern product management', NOW() - INTERVAL '45 days'),
(2, 8, 'Startup Founder Handbook', 'EBOOK', 'https://example.com/startup-handbook.pdf', 'Complete guide for aspiring entrepreneurs', NOW() - INTERVAL '35 days'),
(3, 7, 'Business Leadership Video Series', 'VIDEO', 'https://youtube.com/playlist?list=PLxxx', 'Learn from successful business leaders', NOW() - INTERVAL '25 days'),
(4, 1, 'Cloud Architecture Masterclass', 'COURSE', 'https://example.com/cloud-masterclass', 'Deep dive into AWS and cloud design patterns', NOW() - INTERVAL '20 days'),
(1, 2, 'Web Development Best Practices 2026', 'VIDEO', 'https://youtube.com/webdev-2026', 'Latest trends and best practices in web development', NOW() - INTERVAL '10 days'),
(2, 9, 'Data Science with Python', 'COURSE', 'https://datacamp.com/python-data-science', 'Learn data science fundamentals using Python', NOW() - INTERVAL '5 days');

-- ============= FUND STATUSES DATA =============
INSERT INTO "fund_statuses" ("name") VALUES
('IMPORTANT'),
('POOR'),
('RURAL_AREAS'),
('ACTIVE'),
('COMPLETED'),
('URGENT'),
('EMERGENCY');

-- ============= FUND RECEIVING INFOS DATA =============
INSERT INTO "fund_receiving_infos" ("account_number", "account_name", "bank_name", "is_active") VALUES
('1234567890', 'HCMUS Student Scholarship Fund', 'MB', true),
('0912345678', 'HCMUS Fund', 'MB', true),
('0917669258', 'HCMUS Lab Equipment Fund', 'MB', true),
('1122334455', 'Alumni Mentorship Fund', 'MB', true),
('5544332211', 'Business Incubation Fund', 'MB', true),
('9988776655', 'Engineering Excellence Fund', 'MB', true),
('123456789', 'HCMUS ALUMNI FUND', 'VCB', true),
('987654321', 'HCMUS CHARITY', 'ICB', true);

-- ============= FUNDS DATA =============
INSERT INTO "funds" ("organization_id", "manager_name", "name", "logo_url", "fund_receiving_info_id", "description_short", "description_full", "target_amount", "current_amount", "time_started", "donor_count", "status_id", "topic", "time_ended") VALUES
(1, 'John Doe', 'Student Scholarship Fund 2026', NULL, 1, 'Supporting talented students with financial needs', 'Supporting talented students with financial needs', 50000.00, 28500.00, '2026-01-15 09:00:00', 3, 2, 'Scholarship', '2026-08-15 17:00:00'),
(1, 'Phạm Văn C', 'Lab Equipment Fund', NULL, 3, 'Upgrading our research laboratory equipment', 'Upgrading our research laboratory equipment', 100000.00, 45000.00, '2025-12-20 10:30:00', 2, 2, 'Education', '2026-10-20 18:00:00'),
(1, 'Jane Smith', 'Alumni Mentorship Fund', NULL, 4, 'Funding mentorship programs and workshops', 'Funding mentorship programs and workshops', 30000.00, 12000.00, '2026-02-10 14:00:00', 2, 2, 'Mentorship', '2026-09-25 16:30:00'),
(1, 'Hoàng Thị D', 'Business Incubation Fund', NULL, 5, 'Supporting student-led startup initiatives', 'Supporting student-led startup initiatives', 80000.00, 35000.00, '2026-03-05 08:45:00', 1, 1, 'Startup', '2026-11-10 20:00:00'),
(1, 'Admin User', 'Engineering Excellence Fund', NULL, 6, 'Supporting engineering projects and competitions', 'Supporting engineering projects and competitions', 60000.00, 22500.00, '2026-02-25 11:15:00', 1, 1, 'Engineering', '2026-10-05 19:15:00'),
(1, 'Admin User', 'Học bổng vượt khó 2026', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d', 7, 'Hỗ trợ sinh viên có hoàn cảnh khó khăn đạt thành tích tốt.', 'Quỹ học bổng được thành lập nhằm tiếp sức cho các bạn sinh viên vượt qua nghịch cảnh để tiếp tục con đường học vấn. Mục tiêu của chúng tôi là trao 50 suất học bổng trong năm học này.', 500000000, 150000000, NOW() - INTERVAL '1 month', 120, 4, 'Social', NOW() + INTERVAL '5 months'),
(2, 'Trần Thị B', 'Xây dựng phòng Lab AI', 'https://images.unsplash.com/photo-1531482615713-2afd69097998', 8, 'Nâng cấp thiết bị nghiên cứu cho phòng thí nghiệm AI.', 'Dự án nhằm trang bị các máy chủ GPU mạnh mẽ phục vụ cho nghiên cứu Trí tuệ Nhân tạo tại Khoa CNTT. Chúng tôi mong muốn tạo điều kiện tốt nhất cho các nhóm nghiên cứu sinh viên.', 1000000000, 450000000, NOW() - INTERVAL '2 months', 85, 6, 'Research', NOW() + INTERVAL '3 months'),
(1, 'Phạm Minh D', 'Cloud Infrastructure Fund', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa', 3, 'Funding for new servers for CS students.', 'Funding for new servers for CS students to support high-performance computing projects.', 500000000, 100000000, NOW() - INTERVAL '1 month', 20, 2, 'Infrastructure', NOW() + INTERVAL '6 months');

-- ============= FUND DONATIONS DATA =============
INSERT INTO "fund_donations" ("fund_id", "donor_member_id", "donor_name", "amount", "address", "phone", "email", "message", "status", "created_at") VALUES
(1, 2, 'John Doe', 5000.00, 'District 1, Ho Chi Minh City', '0911111111', 'john.doe@hcmus.edu.vn', 'Supporting our students', 'SUCCESS', NOW() - INTERVAL '30 days'),
(1, 6, 'Phạm Văn C', 3500.00, 'Binh Thanh, Ho Chi Minh City', '0922222222', 'pham.van.c@hcmus.edu.vn', 'Happy to help talented students', 'SUCCESS', NOW() - INTERVAL '25 days'),
(1, NULL, 'Anonymous Donor', 10000.00, 'District 3, Ho Chi Minh City', '0933333333', 'anonymous@example.com', 'Belief in future generation', 'SUCCESS', NOW() - INTERVAL '20 days'),
(2, 3, 'Jane Smith', 2000.00, 'Thu Duc, Ho Chi Minh City', '0944444444', 'jane.smith@hcmus.edu.vn', 'Upgrading our research capabilities', 'SUCCESS', NOW() - INTERVAL '15 days'),
(2, 8, 'Lê Văn E', 15000.00, 'Go Vap, Ho Chi Minh City', '0955555555', 'le.van.e@hcmus.edu.vn', 'Investing in research excellence', 'SUCCESS', NOW() - INTERVAL '10 days'),
(3, 7, 'Hoàng Thị D', 8000.00, 'District 7, Ho Chi Minh City', '0966666666', 'hoang.thi.d@hcmus.edu.vn', 'Supporting mentorship initiatives', 'SUCCESS', NOW() - INTERVAL '8 days'),
(3, NULL, 'Company Partnership', 4000.00, 'Tan Binh, Ho Chi Minh City', '0977777777', 'partnership@company.com', 'Corporate social responsibility', 'PENDING', NOW() - INTERVAL '2 days'),
(4, 5, 'Trần Thị B', 6000.00, 'District 5, Ho Chi Minh City', '0988888888', 'tran.thi.b@hcmus.edu.vn', 'Supporting entrepreneurs', 'PENDING', NOW() - INTERVAL '5 days'),
(5, 1, 'Admin User', 5500.00, 'District 10, Ho Chi Minh City', '0999999999', 'admin@hcmus.edu.vn', 'Excellence in engineering', 'SUCCESS', NOW() - INTERVAL '3 days'),
(6, 2, 'John Doe', 1000000, 'District 5, HCM', '0901234567', 'john.doe@example.com', 'Chúc các em học tốt!', 'SUCCESS', NOW() - INTERVAL '10 days'),
(6, 3, 'Jane Smith', 500000, 'District 1, HCM', '0911223344', 'jane.smith@example.com', 'Hy vọng giúp ích được phần nào.', 'SUCCESS', NOW() - INTERVAL '5 days'),
(7, 5, 'Trần Thị B', 2000000, 'Thu Duc, HCM', '0933445566', 'tranthib@example.com', 'Ủng hộ phòng Lab phát triển.', 'SUCCESS', NOW() - INTERVAL '2 days'),
(6, NULL, 'Mạnh thường quân', 10000000, NULL, NULL, NULL, 'Gửi tặng các em sinh viên.', 'SUCCESS', NOW() - INTERVAL '1 day');

-- ============= NOTIFICATIONS DATA =============
INSERT INTO "notifications" ("member_id", "title", "message", "is_read", "created_at") VALUES
(4, 'Event Registration Confirmed', 'Your registration for Web Development Workshop has been confirmed', false, NOW() - INTERVAL '2 days'),
(4, 'New Mentorship Session Scheduled', 'You have a new mentorship session scheduled with John Doe', false, NOW() - INTERVAL '1 day'),
(5, 'Job Opportunity Match', 'Found a job that matches your profile: Junior Software Developer', true, NOW() - INTERVAL '5 days'),
(9, 'Scholarship Opportunity', 'You are eligible for the Student Scholarship Fund', false, NOW()),
(10, 'Profile Review Required', 'Please complete your profile to join as an active member', false, NOW() - INTERVAL '3 days'),
(2, 'New Mentee Request', 'Trần Thị B requested a mentorship session', true, NOW() - INTERVAL '4 days'),
(6, 'Event Registration Confirmed', 'Your registration for Database Design Seminar has been confirmed', true, NOW() - INTERVAL '6 days');

-- ============= USER LOGIN HISTORIES DATA =============
INSERT INTO "user_login_histories" ("user_id", "login_at", "login_method", "login_ip", "user_agent") VALUES
(1, NOW() - INTERVAL '1 day', 'PASSWORD', '113.161.12.10', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'),
(2, NOW() - INTERVAL '2 days', 'GOOGLE', '14.177.55.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'),
(4, NOW() - INTERVAL '3 hours', 'PASSWORD', '27.72.88.45', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'),
(9, NOW() - INTERVAL '20 minutes', 'PASSWORD', '171.248.120.33', 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36');

-- ============= USER NOTIFICATION SETTINGS DATA =============
INSERT INTO "user_notification_settings" ("user_id", "email_enabled", "push_enabled", "event_reminder_enabled", "news_enabled", "forum_reply_enabled", "updated_at") VALUES
(1, true, true, true, true, true, NOW() - INTERVAL '2 days'),
(2, true, true, true, true, false, NOW() - INTERVAL '1 day'),
(4, true, false, true, true, true, NOW() - INTERVAL '12 hours'),
(9, false, true, true, false, true, NOW() - INTERVAL '6 hours');

-- ============= CHAT GROUPS DATA =============
INSERT INTO "chat_groups" ("type", "title", "created_by", "created_at", "updated_at") VALUES
('PRIVATE', NULL, 2, NOW() - INTERVAL '12 days', NOW() - INTERVAL '2 days'),
('GROUP', 'CS K60 Mentoring', 6, NOW() - INTERVAL '8 days', NOW() - INTERVAL '1 day'),
('GROUP', 'IT Internship Sharing', 3, NOW() - INTERVAL '6 days', NOW() - INTERVAL '8 hours'),
('PRIVATE', NULL, 11, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 hour'),
('GROUP', 'CS K59 Alumni Connect', 11, NOW() - INTERVAL '4 days', NOW() - INTERVAL '30 minutes'),
('PRIVATE', NULL, 11, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 hours'),
('PRIVATE', NULL, 4, NOW() - INTERVAL '2 days', NOW() - INTERVAL '45 minutes'),
('GROUP', 'CS Backend Study Circle', 11, NOW() - INTERVAL '1 day', NOW() - INTERVAL '15 minutes');

-- ============= CHAT GROUP MEMBERS DATA =============
INSERT INTO "chat_group_members" ("group_id", "member_id", "role", "joined_at") VALUES
(1, 2, 'OWNER', NOW() - INTERVAL '12 days'),
(1, 4, 'MEMBER', NOW() - INTERVAL '12 days'),
(2, 6, 'OWNER', NOW() - INTERVAL '8 days'),
(2, 2, 'ADMIN', NOW() - INTERVAL '8 days'),
(2, 4, 'MEMBER', NOW() - INTERVAL '7 days'),
(2, 9, 'MEMBER', NOW() - INTERVAL '6 days'),
(3, 3, 'OWNER', NOW() - INTERVAL '6 days'),
(3, 5, 'MEMBER', NOW() - INTERVAL '6 days'),
(3, 8, 'MEMBER', NOW() - INTERVAL '5 days'),
(4, 11, 'OWNER', NOW() - INTERVAL '5 days'),
(4, 2, 'MEMBER', NOW() - INTERVAL '5 days'),
(5, 11, 'OWNER', NOW() - INTERVAL '4 days'),
(5, 2, 'ADMIN', NOW() - INTERVAL '4 days'),
(5, 6, 'MEMBER', NOW() - INTERVAL '3 days'),
(5, 4, 'MEMBER', NOW() - INTERVAL '3 days'),
(6, 11, 'OWNER', NOW() - INTERVAL '3 days'),
(6, 6, 'MEMBER', NOW() - INTERVAL '3 days'),
(7, 11, 'MEMBER', NOW() - INTERVAL '2 days'),
(7, 4, 'OWNER', NOW() - INTERVAL '2 days'),
(8, 11, 'OWNER', NOW() - INTERVAL '1 day'),
(8, 6, 'ADMIN', NOW() - INTERVAL '1 day'),
(8, 4, 'MEMBER', NOW() - INTERVAL '20 hours');

-- ============= CHAT MESSAGES DATA =============
INSERT INTO "chat_messages" ("group_id", "sender_member_id", "content", "message_type", "metadata", "created_at", "edited_at", "deleted_at") VALUES
(1, 2, 'Chào em, anh là mentor phụ trách buổi định hướng tuần này.', 'TEXT', '{"lang":"vi"}', NOW() - INTERVAL '11 days', NULL, NULL),
(1, 4, 'Dạ em cảm ơn anh. Em muốn hỏi về roadmap backend ạ.', 'TEXT', '{"lang":"vi"}', NOW() - INTERVAL '11 days', NULL, NULL),
(2, 6, 'Mọi người nhớ chuẩn bị CV trước buổi review tối mai.', 'TEXT', '{"priority":"high"}', NOW() - INTERVAL '2 days', NULL, NULL),
(2, 2, 'Mình đã pin tài liệu mock interview ở đầu nhóm nhé.', 'TEXT', '{"pinned":true}', NOW() - INTERVAL '1 day', NOW() - INTERVAL '20 hours', NULL),
(3, 8, 'Có ai muốn referral vị trí intern frontend không?', 'TEXT', '{"tags":["internship","frontend"]}', NOW() - INTERVAL '10 hours', NULL, NULL),
(4, 11, 'Chào anh John, em là Test User — cựu sinh viên CS K59.', 'TEXT', '{"lang":"vi"}', NOW() - INTERVAL '5 days', NULL, NULL),
(4, 2, 'Chào em! Anh có thể hỗ trợ em về định hướng nghề nghiệp backend.', 'TEXT', '{"lang":"vi"}', NOW() - INTERVAL '4 days 22 hours', NULL, NULL),
(4, 11, 'Dạ cảm ơn anh. Em đang học Spring Boot, muốn hỏi roadmap ạ.', 'TEXT', '{"lang":"vi"}', NOW() - INTERVAL '4 days 20 hours', NULL, NULL),
(4, 2, 'Em nên làm REST + JPA trước, sau đó security và testing.', 'TEXT', '{"lang":"vi"}', NOW() - INTERVAL '4 days 18 hours', NULL, NULL),
(4, 11, 'Vâng em ghi nhận ạ. Anh có tài liệu recommend không?', 'TEXT', '{"lang":"vi"}', NOW() - INTERVAL '1 hour', NULL, NULL),
(5, 11, 'Mọi người ơi, nhóm kết nối cựu sinh viên CS K59 nhé!', 'TEXT', '{"pinned":true}', NOW() - INTERVAL '3 days', NULL, NULL),
(5, 2, 'Hay quá! Mình sẽ share tài liệu phỏng vấn backend.', 'TEXT', NULL, NOW() - INTERVAL '2 days', NULL, NULL),
(5, 6, 'Ai cần review CV thì comment ở đây nhé.', 'TEXT', NULL, NOW() - INTERVAL '30 minutes', NULL, NULL),
(6, 11, 'Anh Phạm ơi, em muốn hỏi về system design cho bài tập cuối kỳ ạ.', 'TEXT', '{"lang":"vi"}', NOW() - INTERVAL '3 days', NULL, NULL),
(6, 6, 'Em gửi diagram hiện tại, anh review giúp nhé.', 'TEXT', '{"lang":"vi"}', NOW() - INTERVAL '2 days 22 hours', NULL, NULL),
(6, 11, 'Dạ em vừa gửi link Figma trong metadata.', 'TEXT', '{"hasAttachment":true}', NOW() - INTERVAL '2 days 20 hours', NULL, NULL),
(6, 6, 'Nhìn chung ổn, nhưng nên tách service auth ra riêng.', 'TEXT', '{"lang":"vi"}', NOW() - INTERVAL '2 days', NULL, NULL),
(6, 11, 'Cảm ơn anh, em sửa lại và báo anh sau nhé!', 'TEXT', '{"lang":"vi"}', NOW() - INTERVAL '2 hours', NULL, NULL),
(7, 4, 'Chào bạn, mình thấy bạn cũng học CS, mình xin lời khuyên về internship được không?', 'TEXT', '{"lang":"vi"}', NOW() - INTERVAL '2 days', NULL, NULL),
(7, 11, 'Chào bạn! Mình tốt nghiệp rồi, cứ hỏi thoải mái nhé.', 'TEXT', '{"lang":"vi"}', NOW() - INTERVAL '1 day 22 hours', NULL, NULL),
(7, 4, 'Mình nên ưu tiên thực tập startup hay công ty lớn ạ?', 'TEXT', '{"lang":"vi"}', NOW() - INTERVAL '1 day 20 hours', NULL, NULL),
(7, 11, 'Tùy mục tiêu: startup học nhanh, big corp CV đẹp hơn.', 'TEXT', '{"lang":"vi"}', NOW() - INTERVAL '1 day', NULL, NULL),
(7, 4, 'Dạ cảm ơn bạn, mình sẽ apply cả hai loại luôn!', 'TEXT', '{"lang":"vi"}', NOW() - INTERVAL '45 minutes', NULL, NULL),
(8, 11, 'Nhóm học backend — tuần này ôn PostgreSQL và indexing nhé.', 'TEXT', '{"topic":"postgresql"}', NOW() - INTERVAL '1 day', NULL, NULL),
(8, 6, 'Mình có slide về EXPLAIN ANALYZE, share vào nhóm nha.', 'TEXT', NULL, NOW() - INTERVAL '18 hours', NULL, NULL),
(8, 4, 'Em đang làm bài lab, mai hỏi thêm ạ!', 'TEXT', NULL, NOW() - INTERVAL '15 minutes', NULL, NULL);


-- ============= FORUM CATEGORIES DATA =============
INSERT INTO "forum_categories" ("parent_id", "organization_id", "name", "description", "created_at", "updated_at") VALUES
(NULL, 1, 'General Discussion', 'General topics and announcements', NOW() - INTERVAL '365 days', NOW()),
(NULL, 1, 'Technical Help', 'Questions and help with programming', NOW() - INTERVAL '365 days', NOW()),
(NULL, 1, 'Job & Career', 'Job opportunities and career advice', NOW() - INTERVAL '365 days', NOW()),
(NULL, 2, 'General Discussion', 'General topics and announcements', NOW() - INTERVAL '360 days', NOW()),
(NULL, 2, 'Technical Help', 'Questions and help with programming', NOW() - INTERVAL '360 days', NOW()),
(1, 1, 'Alumni Stories', 'Share your success stories', NOW() - INTERVAL '360 days', NOW()),
(NULL, 3, 'Business Topics', 'Business and management discussions', NOW() - INTERVAL '350 days', NOW()),
(NULL, 4, 'Engineering Projects', 'Share and discuss engineering projects', NOW() - INTERVAL '340 days', NOW());

-- ============= FORUM TOPICS DATA =============
INSERT INTO "forum_topics" ("organization_id", "title", "created_by_member_id", "category_id", "view_count", "is_locked", "created_at", "updated_at") VALUES
(1, 'Welcome to CS Alumni Network', 2, 1, 156, false, NOW() - INTERVAL '355 days', NOW() - INTERVAL '10 days'),
(1, 'React Hooks vs Class Components - Best Practices', 4, 2, 89, false, NOW() - INTERVAL '45 days', NOW() - INTERVAL '5 days'),
(1, 'Job Search Strategy for New Graduates', 6, 3, 234, false, NOW() - INTERVAL '30 days', NOW() - INTERVAL '2 days'),
(1, 'Database Optimization Techniques', 6, 2, 156, true, NOW() - INTERVAL '25 days', NOW() - INTERVAL '8 days'),
(2, 'Getting Started with Node.js', 5, 5, 78, false, NOW() - INTERVAL '20 days', NOW() - INTERVAL '3 days'),
(1, 'From Startup to IPO - My Journey', 3, 6, 412, false, NOW() - INTERVAL '15 days', NOW() - INTERVAL '1 day'),
(2, 'Microservices Architecture Discussion', 8, 5, 145, false, NOW() - INTERVAL '12 days', NOW() - INTERVAL '4 days'),
(3, 'Leadership Lessons from Successful Entrepreneurs', 7, 7, 93, false, NOW() - INTERVAL '10 days', NOW() - INTERVAL '6 days'),
(4, 'Sustainable Engineering for the Future', 6, 8, 67, false, NOW() - INTERVAL '8 days', NOW() - INTERVAL '3 days'),
(1, 'Best resources to learn Kubernetes?', 16, 2, 45, false, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day'),
(1, 'Anyone working in Japan?', 15, 6, 88, false, NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 days');


-- ============= FORUM POSTS DATA =============
INSERT INTO "forum_posts" ("topic_id", "author_member_id", "content", "answer_to_post_id", "is_hidden", "created_at", "updated_at") VALUES
(1, 2, 'Hi everyone! Excited to be part of this community. I graduated in 2023 and am now working at Tech Solutions Inc. Looking forward to mentoring newcomers!', NULL, false, NOW() - INTERVAL '355 days', NOW() - INTERVAL '355 days'),
(1, 6, 'Welcome John! Great to have experienced alumni like you in the community. Hope to collaborate on mentorship initiatives.', 1, false, NOW() - INTERVAL '354 days', NOW() - INTERVAL '354 days'),
(2, 4, 'What are your thoughts on React Hooks? I find them more intuitive than class components for state management.', NULL, false, NOW() - INTERVAL '44 days', NOW() - INTERVAL '44 days'),
(2, 6, 'Great question! I prefer hooks too. They make code more reusable and easier to test. Here are some best practices...', 3, false, NOW() - INTERVAL '43 days', NOW() - INTERVAL '43 days'),
(3, 6, 'The key to successful job search is networking. Connect with alumni, attend events, and prepare well for interviews.', NULL, false, NOW() - INTERVAL '29 days', NOW() - INTERVAL '29 days'),
(3, 9, 'This is very helpful! I just started my search. Thanks for the tips!', 5, false, NOW() - INTERVAL '27 days', NOW() - INTERVAL '27 days'),
(4, 6, 'Database indexing is crucial. Always analyze your query plans before and after optimization.', NULL, false, NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days'),
(4, 2, 'Totally agree. Also consider table partitioning for very large datasets.', 7, true, NOW() - INTERVAL '23 days', NOW() - INTERVAL '23 days'),
(5, 5, 'Node.js is perfect for I/O-intensive applications. The async/await pattern makes it so much cleaner than callbacks.', NULL, false, NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days'),
(5, 9, 'I am new to Node.js. Any recommended projects for beginners to start with?', 9, false, NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
(6, 3, 'It was an incredible journey! Started with passion, raised funding, built great team, and now ready for the next chapter.', NULL, false, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
(6, 8, 'Inspiring story, Jane! What was your biggest challenge during the startup phase?', 11, false, NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'),
(6, 3, 'Great question! The biggest challenge was finding product-market fit and managing burn rate during early days.', 12, false, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
(7, 8, 'Microservices bring agility but also complexity. Event-driven architecture helps manage inter-service communication.', NULL, false, NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'),
(8, 7, 'Leadership is about empowering your team. Trust your people and give them autonomy to make decisions.', NULL, false, NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'),
(10, 16, 'I highly recommend official K8s documentation and KodeKloud.', NULL, false, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
(11, 15, 'I am currently working in Tokyo as a Mobile Dev. AMA!', NULL, false, NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days');

-- ============= FORUM POST REPORTS DATA =============
INSERT INTO "forum_post_reports" ("post_id", "reporter_member_id", "reason", "description", "status", "reviewed_by_user_id", "review_note", "created_at", "updated_at") VALUES
(8, 4, 'SPAM', 'Post repeats promotional content and is not relevant to the discussion.', 'APPROVED', 1, 'Hidden post and warned author', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
(14, 9, 'OFF_TOPIC', 'Content is not related to the current thread purpose.', 'PENDING', NULL, NULL, NOW() - INTERVAL '8 hours', NOW() - INTERVAL '8 hours'),
(15, 10, 'ABUSIVE_LANGUAGE', 'Potentially aggressive wording found in the comment.', 'REJECTED', 1, 'No violation after review', NOW() - INTERVAL '1 day', NOW() - INTERVAL '20 hours');

-- ============= ADMIN AUDIT LOGS DATA =============
INSERT INTO "admin_audit_logs" ("admin_user_id", "target_user_id", "action", "resource_type", "resource_id", "before_data", "after_data", "metadata", "created_at") VALUES
(1, 2, 'BAN_POST', 'FORUM_POST', '8', '{"isBanned":false}', '{"isBanned":true}', '{"source":"report","reportId":1}', NOW() - INTERVAL '1 day'),
(1, 2, 'UPDATE_POST_VISIBILITY', 'FORUM_POST', '8', '{"isHidden":false}', '{"isHidden":true}', '{"source":"moderation"}', NOW() - INTERVAL '23 hours'),
(1, 6, 'UPDATE_TOPIC_LOCK', 'FORUM_TOPIC', '4', '{"isLocked":false}', '{"isLocked":true}', '{"reason":"stop flame war"}', NOW() - INTERVAL '12 hours'),
(1, 9, 'RESET_PASSWORD', 'USER', '9', NULL, NULL, '{"reason":"support request"}', NOW() - INTERVAL '6 hours');

-- ============= FORUM POST REACTIONS DATA (LIKES/DISLIKES) =============
INSERT INTO "forum_post_reactions" ("post_id", "member_id", "created_at") VALUES
(1, 3, NOW() - INTERVAL '354 days'),
(1, 4, NOW() - INTERVAL '353 days'),
(1, 5, NOW() - INTERVAL '352 days'),
(1, 7, NOW() - INTERVAL '351 days'),
(1, 8, NOW() - INTERVAL '350 days'),
(1, 9, NOW() - INTERVAL '349 days'),
(2, 2, NOW() - INTERVAL '353 days'),
(2, 4, NOW() - INTERVAL '352 days'),
(2, 5, NOW() - INTERVAL '351 days'),
(2, 6, NOW() - INTERVAL '350 days'),
(2, 8, NOW() - INTERVAL '349 days'),
(3, 2, NOW() - INTERVAL '43 days'),
(3, 5, NOW() - INTERVAL '42 days'),
(3, 7, NOW() - INTERVAL '41 days'),
(3, 9, NOW() - INTERVAL '40 days'),
(3, 10, NOW() - INTERVAL '39 days'),
(4, 2, NOW() - INTERVAL '42 days'),
(4, 3, NOW() - INTERVAL '41 days'),
(4, 4, NOW() - INTERVAL '40 days'),
(4, 5, NOW() - INTERVAL '39 days'),
(4, 7, NOW() - INTERVAL '38 days'),
(4, 8, NOW() - INTERVAL '37 days'),
(4, 9, NOW() - INTERVAL '36 days'),
(4, 10, NOW() - INTERVAL '35 days'),
(5, 2, NOW() - INTERVAL '28 days'),
(5, 4, NOW() - INTERVAL '27 days'),
(5, 5, NOW() - INTERVAL '26 days'),
(5, 7, NOW() - INTERVAL '25 days'),
(5, 9, NOW() - INTERVAL '24 days'),
(6, 2, NOW() - INTERVAL '26 days'),
(6, 3, NOW() - INTERVAL '25 days'),
(6, 6, NOW() - INTERVAL '24 days'),
(7, 2, NOW() - INTERVAL '23 days'),
(7, 3, NOW() - INTERVAL '22 days'),
(7, 4, NOW() - INTERVAL '21 days'),
(7, 5, NOW() - INTERVAL '20 days'),
(7, 6, NOW() - INTERVAL '19 days'),
(7, 8, NOW() - INTERVAL '18 days'),
(7, 9, NOW() - INTERVAL '17 days'),
(7, 10, NOW() - INTERVAL '16 days'),
(8, 2, NOW() - INTERVAL '22 days'),
(8, 4, NOW() - INTERVAL '21 days'),
(8, 5, NOW() - INTERVAL '20 days'),
(8, 7, NOW() - INTERVAL '19 days'),
(9, 2, NOW() - INTERVAL '18 days'),
(9, 3, NOW() - INTERVAL '17 days'),
(9, 4, NOW() - INTERVAL '16 days'),
(9, 6, NOW() - INTERVAL '15 days'),
(9, 7, NOW() - INTERVAL '14 days'),
(9, 8, NOW() - INTERVAL '13 days'),
(10, 2, NOW() - INTERVAL '17 days'),
(10, 5, NOW() - INTERVAL '16 days'),
(10, 6, NOW() - INTERVAL '15 days'),
(11, 2, NOW() - INTERVAL '13 days'),
(11, 4, NOW() - INTERVAL '12 days'),
(11, 5, NOW() - INTERVAL '11 days'),
(11, 6, NOW() - INTERVAL '10 days'),
(11, 7, NOW() - INTERVAL '9 days'),
(11, 9, NOW() - INTERVAL '8 days'),
(12, 2, NOW() - INTERVAL '12 days'),
(12, 3, NOW() - INTERVAL '11 days'),
(12, 6, NOW() - INTERVAL '10 days'),
(13, 2, NOW() - INTERVAL '11 days'),
(13, 3, NOW() - INTERVAL '10 days'),
(13, 4, NOW() - INTERVAL '9 days'),
(13, 5, NOW() - INTERVAL '8 days'),
(13, 7, NOW() - INTERVAL '7 days'),
(14, 2, NOW() - INTERVAL '10 days'),
(14, 3, NOW() - INTERVAL '9 days'),
(14, 5, NOW() - INTERVAL '8 days'),
(14, 6, NOW() - INTERVAL '7 days'),
(15, 2, NOW() - INTERVAL '8 days'),
(15, 3, NOW() - INTERVAL '7 days'),
(15, 5, NOW() - INTERVAL '6 days'),
(15, 6, NOW() - INTERVAL '5 days'),
(15, 8, NOW() - INTERVAL '4 days'),
(16, 2, NOW() - INTERVAL '3 days'),
(16, 4, NOW() - INTERVAL '3 days'),
(16, 17, NOW() - INTERVAL '2 days'),
(17, 2, NOW() - INTERVAL '8 days'),
(17, 6, NOW() - INTERVAL '7 days'),
(17, 16, NOW() - INTERVAL '6 days');

-- ============= PEER VERIFICATIONS DATA =============
INSERT INTO "peer_verifications" ("target_member_id", "verifier_member_id", "created_at") VALUES
(2, 4, NOW() - INTERVAL '40 days'),
(2, 6, NOW() - INTERVAL '38 days'),
(3, 5, NOW() - INTERVAL '55 days'),
(3, 8, NOW() - INTERVAL '52 days'),
(5, 4, NOW() - INTERVAL '25 days'),
(6, 2, NOW() - INTERVAL '190 days'),
(4, 6, NOW() - INTERVAL '35 days'),
(5, 9, NOW() - INTERVAL '20 days'),
(8, 3, NOW() - INTERVAL '175 days'),
(8, 6, NOW() - INTERVAL '170 days'),
(10, 7, NOW() - INTERVAL '2 days'),
(15, 2, NOW() - INTERVAL '10 days'),
(15, 6, NOW() - INTERVAL '9 days'),
(16, 11, NOW() - INTERVAL '8 days'),
(16, 2, NOW() - INTERVAL '7 days');

-- ============= VERIFICATION REQUESTS DATA =============
INSERT INTO "verification_requests" ("member_id", "document_url", "document_type", "status", "admin_note", "reviewed_by_member_id", "created_at") VALUES
(4, 'https://api.example.com/documents/student_id_4.pdf', 'STUDENT_ID', 'APPROVED', 'Student ID verified and matches system records', 1, NOW() - INTERVAL '40 days'),
(5, 'https://api.example.com/documents/graduation_cert_5.pdf', 'GRADUATION_CERTIFICATE', 'APPROVED', 'Graduation verified', 1, NOW() - INTERVAL '25 days'),
(9, 'https://api.example.com/documents/student_id_9.pdf', 'STUDENT_ID', 'PENDING', 'Awaiting verification', NULL, NOW() - INTERVAL '3 days'),
(10, 'https://api.example.com/documents/diploma_10.pdf', 'DIPLOMA', 'REJECTED', 'Document quality too low, please resubmit', 1, NOW() - INTERVAL '5 days'),
(17, 'https://api.example.com/documents/student_id_17.pdf', 'STUDENT_ID', 'PENDING', 'Awaiting verification', NULL, NOW() - INTERVAL '2 days'),
(18, 'https://api.example.com/documents/student_id_18.pdf', 'STUDENT_ID', 'PENDING', 'Awaiting verification', NULL, NOW() - INTERVAL '1 day');

-- ============= POLL DATA =============
INSERT INTO "forum_polls" ("topic_id", "organization_id", "created_by_member_id", "title", "description", "allow_multiple_votes", "is_active", "created_at", "updated_at") VALUES
(1, 1, 2, 'Best Programming Language for 2026?', 'Vote for your favorite programming language for upcoming projects', false, true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(2, 1, 3, 'When is the best time for next meetup?', 'Help us schedule the next alumni meetup', false, true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

-- Add options for polls
INSERT INTO "forum_poll_options" ("poll_id", "option_text", "vote_count", "created_at", "updated_at") VALUES
(1, 'Python', 5, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(1, 'JavaScript/TypeScript', 8, NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'),
(1, 'Java', 4, NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'),
(1, 'Go', 3, NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
(1, 'Rust', 6, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day'),
(2, 'Weekend (Saturday or Sunday)', 12, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
(2, 'Weekday Evening (after work)', 8, NOW() - INTERVAL '2 days', NOW()),
(2, 'Weekday Lunch (12-2pm)', 3, NOW() - INTERVAL '2 days', NOW()),
(2, 'No preference', 5, NOW() - INTERVAL '2 days', NOW());

-- Sample poll votes
INSERT INTO "forum_poll_votes" ("poll_id", "poll_option_id", "member_id", "created_at") VALUES
(1, 2, 4, NOW() - INTERVAL '4 days'),
(1, 2, 6, NOW() - INTERVAL '3 days'),
(1, 1, 9, NOW() - INTERVAL '2 days'),
(1, 5, 2, NOW() - INTERVAL '1 day'),
(1, 1, 5, NOW()),
(2, 1, 2, NOW() - INTERVAL '2 days'),
(2, 1, 4, NOW() - INTERVAL '1 day'),
(2, 2, 6, NOW() - INTERVAL '1 day'),
(2, 1, 8, NOW());

-- ============= SCHOOL FEEDBACKS DATA =============
INSERT INTO "school_feedbacks" ("organization_id", "full_name", "phone", "email", "subject", "content", "created_at", "is_read") VALUES
(1, 'Nguyễn Minh Khang', '0908123456', 'khang.nguyen@example.com', 'Góp ý về lịch workshop', 'Mong trường công bố lịch workshop sớm hơn để sinh viên chủ động đăng ký.', NOW() - INTERVAL '4 days', false),
(1, 'Trần Thu Hà', '0912233445', 'ha.tran@example.com', 'Đề xuất cải thiện diễn đàn', 'Nên có bộ lọc theo chuyên ngành để tìm chủ đề nhanh hơn.', NOW() - INTERVAL '2 days', true),
(2, 'Lê Quốc Bảo', '0988776655', 'bao.le@example.com', 'Hỗ trợ thông tin học bổng', 'Mình mong có chuyên mục riêng cập nhật học bổng theo từng học kỳ.', NOW() - INTERVAL '1 day', false),
(1, 'Phạm Tuấn Anh', '0933445566', 'tuananh.pham@example.com', 'Hỏi về quy trình cấp lại bằng', 'Mình làm mất bằng tốt nghiệp, trường cho mình hỏi quy trình cấp lại như thế nào ạ?', NOW() - INTERVAL '3 days', false),
(2, 'Đỗ Thị Lan', '0944556677', 'lan.do@example.com', 'Góp ý về mentor', 'Chất lượng mentor rất tốt, mong có thêm nhiều buổi offline hơn.', NOW() - INTERVAL '5 days', true);
