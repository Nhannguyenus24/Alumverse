-- Sample Data for Student Alumni System

-- ============= USERS DATA =============
-- password to login is Student@2024 for the last 3
INSERT INTO "users" ("email", "password_hash", "status", "role", "avatar_url", "created_at", "updated_at") VALUES
('admin@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'ACTIVE', 'ADMIN', NULL, NOW(), NOW()),
('john.doe@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'ACTIVE', 'USER', NULL, NOW() - INTERVAL '90 days', NOW()),
('jane.smith@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'ACTIVE', 'USER', NULL, NOW() - INTERVAL '60 days', NOW()),
('nguyen.van.a@hcmus.edu.vn', '$2b$12$ig35cC5G.hFgdmWUzbnv5OiJRpBGrzZmTXhl5L/8Akvmr4.r3Ciwm', 'ACTIVE', 'USER', NULL, NOW() - INTERVAL '45 days', NOW()),
('tran.thi.b@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'ACTIVE', 'USER', NULL, NOW() - INTERVAL '30 days', NOW()),
('pham.van.c@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'ACTIVE', 'USER', NULL, NOW() - INTERVAL '20 days', NOW()),
('hoang.thi.d@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'ACTIVE', 'USER', NULL, NOW() - INTERVAL '10 days', NOW()),
('le.van.e@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'ACTIVE', 'USER', NULL, NOW() - INTERVAL '5 days', NOW()),
('duong.thi.f@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'ACTIVE', 'USER', NULL, NOW() - INTERVAL '2 days', NOW()),
('vo.van.g@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'ACTIVE', 'USER', NULL, NOW(), NOW()),
('test@hcmus.edu.vn', '$2b$12$ig35cC5G.hFgdmWUzbnv5OiJRpBGrzZmTXhl5L/8Akvmr4.r3Ciwm', 'ACTIVE', 'ADMIN', NULL, NOW(), NOW()),
('bui.van.h@hcmus.edu.vn', '$2b$12$ig35cC5G.hFgdmWUzbnv5OiJRpBGrzZmTXhl5L/8Akvmr4.r3Ciwm', 'ACTIVE', 'USER', NULL, NOW(), NOW()),
('ly.thi.i@hcmus.edu.vn', '$2b$12$ig35cC5G.hFgdmWUzbnv5OiJRpBGrzZmTXhl5L/8Akvmr4.r3Ciwm', 'ACTIVE', 'USER', NULL, NOW(), NOW()),
('admin@gmail.com', '$2a$10$XV9KfhWlRF4ypiISf3u1.u1PeEKWw1x.BpzqLaVPM4WA7D9KbcZ7m', 'ACTIVE', 'ADMIN', NULL, NOW(), NOW());


-- ============= ORGANIZATIONS DATA =============
INSERT INTO "organizations" ("name", "slug", "logo_url", "brand_config", "features_config", "programs", "majors", "created_at") VALUES
('HCMUS - Computer Science', 'cs-hcmus', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRQjONr5O3z_VgQu22nI4zN71cq3w4HWm-wmw&s', '{"primary":"#1976d2","secondary":"#dc004e"}', '{"mentorship":true,"job":true,"fund":true,"events":true,"forum":true}', '["Regular","Advanced Program"]', '["Computer Science","Data Science","Artificial Intelligence"]', NOW() - INTERVAL '365 days'),
('HCMUS - Information Technology', 'it-hcmus', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTI2RGrI-0nhe_jVirrC2Y2x8vkJs1woD1HDw&s', '{"primary":"#388e3c","secondary":"#ff9800"}', '{"mentorship":true,"job":true,"fund":true,"events":true,"forum":true}', '["Regular","High Quality"]', '["Information Technology","Software Engineering","Information Systems"]', NOW() - INTERVAL '360 days'),
('HCMUS - Bio Technology', 'bt-hcmus', 'https://fbb.hcmus.edu.vn/vnt_upload/images/10_2025/logo_share.jpg', '{"primary":"#f57c00","secondary":"#512da8"}', '{"mentorship":true,"job":true,"fund":false,"events":true,"forum":true}', '["Regular"]', '["Bio Technology","Biomedical Engineering"]', NOW() - INTERVAL '350 days'),
('HCMUS - Engineering', 'eng-hcmus', 'https://yt3.googleusercontent.com/DW3Qx-OjYREf8PYgQ6UmE4mUMW4eVIxBUsS9SGszPzlxWZOI2FOGAdcHLsngL2rdB0YWxDMfew=s900-c-k-c0x00ffffff-no-rj', '{"primary":"#c62828","secondary":"#0097a7"}', '{"mentorship":true,"job":true,"fund":true,"events":true,"forum":true}', '["Regular","International"]', '["Electrical Engineering","Telecommunications Engineering"]', NOW() - INTERVAL '340 days');

-- ============= ORGANIZATION INTRODUCTIONS DATA =============
INSERT INTO "organization_introductions" ("orga_id", "content", "vision", "mission", "core_values", "image_urls", "banner_url", "leaders", "team_members", "leaders_content", "team_members_content", "updated_at") VALUES
(1, 
 'The Computer Science Department at HCMUS is a leading institution dedicated to advancing computer science education, research, and innovation. We prepare students to become proficient software engineers, researchers, and technology leaders.',
 'To be a world-class computer science program recognized for excellence in education and research',
 'To provide comprehensive education in computer science and cultivate innovative problem-solvers',
 'Excellence, Innovation, Integrity, Collaboration, Continuous Learning',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRQjONr5O3z_VgQu22nI4zN71cq3w4HWm-wmw&s',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRQjONr5O3z_VgQu22nI4zN71cq3w4HWm-wmw&s',
 '[{"name": "Prof. Nguyen Van A", "positions": "Head of CS Department", "email": "nva@hcmus.edu.vn", "image": "https://assets.acegalaxy.co/resources/category/lobby_icon_favorite_small.png", "content": "Leading the department towards excellence in AI and Software Engineering."}, {"name": "Assoc. Prof. Tran Thi B", "positions": "Deputy Head", "email": "ttb@hcmus.edu.vn", "image": "https://assets.acegalaxy.co/resources/category/lobby_icon_favorite_small.png", "content": "Specializing in Data Science and Big Data analytics."}]',
 '[{"name": "Dr. Le Van C", "positions": "Senior Lecturer", "email": "lvc@hcmus.edu.vn", "image": "https://assets.acegalaxy.co/resources/category/lobby_icon_favorite_small.png", "content": "Researcher in Computer Vision."}, {"name": "Ms. Pham Thi D", "positions": "Program Coordinator", "email": "ptd@hcmus.edu.vn", "image": "https://assets.acegalaxy.co/resources/category/lobby_icon_favorite_small.png", "content": "Ensuring the best learning experience for students."}]',
 'Our leadership team consists of seasoned educators and researchers dedicated to academic growth.',
 'Our faculty members are experts in their fields, bringing industry experience to the classroom.',
 NOW() - INTERVAL '30 days'),

(2,
 'The Information Technology Department provides comprehensive IT education focused on practical skills and real-world applications. Our programs equip graduates with the expertise needed to thrive in the rapidly evolving technology industry.',
 'To become the leading IT program transforming lives through technology education',
 'To deliver quality IT education that prepares students for successful careers and innovation',
 'Quality, Relevance, Teamwork, Accountability, Customer-focused',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTI2RGrI-0nhe_jVirrC2Y2x8vkJs1woD1HDw&s',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTI2RGrI-0nhe_jVirrC2Y2x8vkJs1woD1HDw&s',
 '[{"name": "Dr. Hoang Van E", "positions": "IT Director", "email": "hve@it.hcmus.edu.vn", "image": "https://assets.acegalaxy.co/resources/category/lobby_icon_favorite_small.png", "content": "Expert in Cybersecurity and Network Infrastructure."}]',
 '[{"name": "Mr. Vu Van F", "positions": "Technical Lead", "email": "vvf@it.hcmus.edu.vn", "image": "https://assets.acegalaxy.co/resources/category/lobby_icon_favorite_small.png", "content": "Cloud Computing enthusiast."}]',
 'Passionate leaders driving digital transformation in education.',
 'A dedicated team of IT professionals and technical instructors.',
 NOW() - INTERVAL '28 days'),

(3,
 'The Business Administration Department develops future business leaders with strong analytical, strategic, and managerial skills. We combine theoretical knowledge with practical experience to prepare students for diverse business careers.',
 'To produce ethical and innovative business leaders who drive organizational and societal growth',
 'To provide business education that develops strategic thinkers and ethical leaders',
 'Integrity, Innovation, Responsibility, Excellence, Inclusivity',
 'https://fbb.hcmus.edu.vn/vnt_upload/images/10_2025/logo_share.jpg',
 'https://fbb.hcmus.edu.vn/vnt_upload/images/10_2025/logo_share.jpg',
 '[{"name": "Mrs. Dang Thi G", "positions": "Dean of BA", "email": "dtg@ba.hcmus.edu.vn", "image": "https://assets.acegalaxy.co/resources/category/lobby_icon_favorite_small.png", "content": "Expert in Marketing Strategy and Consumer Behavior."}]',
 '[{"name": "Mr. Phan Van H", "positions": "Assistant Professor", "email": "pvh@ba.hcmus.edu.vn", "image": "https://assets.acegalaxy.co/resources/category/lobby_icon_favorite_small.png", "content": "Specializing in Financial Management."}]',
 'Visionary leaders shaping the future of global business.',
 'Experienced professionals with deep insights into market dynamics.',
 NOW() - INTERVAL '26 days'),

(4,
 'The Engineering Department is committed to producing skilled engineers who can design and build solutions to real-world problems. Our programs emphasize practical engineering skills, research capabilities, and professional ethics.',
 'To be recognized as a premier engineering program developing innovative solutions',
 'To educate and mentor engineers who contribute to technological advancement',
 'Precision, Innovation, Sustainability, Professionalism, Teamwork',
 'https://yt3.googleusercontent.com/DW3Qx-OjYREf8PYgQ6UmE4mUMW4eVIxBUsS9SGszPzlxWZOI2FOGAdcHLsngL2rdB0YWxDMfew=s900-c-k-c0x00ffffff-no-rj',
 'https://yt3.googleusercontent.com/DW3Qx-OjYREf8PYgQ6UmE4mUMW4eVIxBUsS9SGszPzlxWZOI2FOGAdcHLsngL2rdB0YWxDMfew=s900-c-k-c0x00ffffff-no-rj',
 '[{"name": "Prof. Bui Van I", "positions": "Engineering Dean", "email": "bvi@eng.hcmus.edu.vn", "image": "https://assets.acegalaxy.co/resources/category/lobby_icon_favorite_small.png", "content": "Leader in Sustainable Energy Research."}]',
 '[{"name": "Dr. Ly Van J", "positions": "Lab Manager", "email": "lvj@eng.hcmus.edu.vn", "image": "https://assets.acegalaxy.co/resources/category/lobby_icon_favorite_small.png", "content": "Managing advanced robotics laboratories."}]',
 'Leading innovation in mechanical and electrical engineering.',
 'Talented engineers dedicated to solving complex technical challenges.',
 NOW() - INTERVAL '25 days');

-- ============= ORGANIZATION MEMBERS DATA =============
INSERT INTO "organization_members" ("organization_id", "user_id", "student_id", "started_year", "graduated_year", "graduation_status", "program", "major", "faculty", "department", "verification_level", "is_trusted_verifier", "status", "created_at", "updated_at") VALUES
(1, 1, 'admin', '[2008, 2014]', '[2012, 2016]', '["GRADUATED", "GRADUATED"]', '["Regular", "Master"]', '["Computer Science", "Computer Science"]', '["Faculty of Information Technology", "Faculty of Information Technology"]', '["Computer Science", "Computer Science"]', 3, true, 'ACTIVE', NOW() - INTERVAL '365 days', NOW()),
(1, 2, 'johndoe', '[2019]', '[2023]', '["GRADUATED"]', '["Advanced Program"]', '["Computer Science"]', '["Faculty of Information Technology"]', '["Computer Science"]', 2, true, 'ACTIVE', NOW() - INTERVAL '90 days', NOW()),
(1, 4, 'nguyenvana', '[2022]', '[]', '["STUDYING"]', '["Regular"]', '["Computer Science"]', '["Faculty of Information Technology"]', '["Computer Science"]', 1, false, 'ACTIVE', NOW() - INTERVAL '45 days', NOW()),
(1, 6, 'phamvanc', '[2018, 2023]', '[2022, 2024]', '["GRADUATED", "STUDYING"]', '["Regular", "Part-time"]', '["Computer Science", "Data Science"]', '["Faculty of Information Technology", "Faculty of Information Technology"]', '["Computer Science", "Computer Science"]', 2, true, 'ACTIVE', NOW() - INTERVAL '200 days', NOW()),
(1, 11, 'testuser', '[2018]', '[2022]', '["GRADUATED"]', '["Regular"]', '["Computer Science"]', '["Faculty of Information Technology"]', '["Computer Science"]', 2, true, 'ACTIVE', NOW() - INTERVAL '200 days', NOW()),
(2, 3, 'janesmith', '[2019]', '[2023]', '["GRADUATED"]', '["Advanced Program"]', '["Information Technology"]', '["Faculty of Information Technology"]', '["Information Technology"]', 2, true, 'ACTIVE', NOW() - INTERVAL '60 days', NOW()),
(2, 5, 'tranthib', '[2020, 2025]', '[2024, 2026]', '["GRADUATED", "STUDYING"]', '["Regular", "Exchange"]', '["Information Technology", "Data Engineering"]', '["Faculty of Information Technology", "Faculty of Information Technology"]', '["Information Technology", "Information Technology"]', 1, false, 'ACTIVE', NOW() - INTERVAL '30 days', NOW()),
(2, 8, 'levane', '[2019]', '[2023]', '["GRADUATED"]', '["Regular"]', '["Information Technology"]', '["Faculty of Information Technology"]', '["Information Technology"]', 2, true, 'ACTIVE', NOW() - INTERVAL '180 days', NOW()),
(2, 9, 'duongthif', '[2023]', '[]', '["STUDYING"]', '["Regular"]', '["Information Technology"]', '["Faculty of Information Technology"]', '["Information Technology"]', 1, false, 'ACTIVE', NOW() - INTERVAL '15 days', NOW()),
(3, 7, 'hoangthid', '[2019]', '[2023]', '["GRADUATED"]', '["Regular"]', '["Business Administration"]', '["Faculty of Mathematics & Computer Science"]', '["Mathematics"]', 2, true, 'ACTIVE', NOW() - INTERVAL '100 days', NOW()),
(3, 10, 'vovang', '[2021]', '[]', '["STUDYING"]', '["Regular"]', '["Business Administration"]', '["Faculty of Mathematics & Computer Science"]', '["Mathematics"]', 1, false, 'PENDING', NOW() - INTERVAL '3 days', NOW()),
(1, 12, 'buivanh', '[2024]', '[]', '["STUDYING"]', '["Regular"]', '["Computer Science"]', '["Faculty of Information Technology"]', '["Computer Science"]', 1, false, 'ACTIVE', NOW(), NOW()),
(2, 13, 'lythii', '[2024]', '[]', '["STUDYING"]', '["Regular"]', '["Information Technology"]', '["Faculty of Information Technology"]', '["Information Technology"]', 1, false, 'ACTIVE', NOW(), NOW());
-- ============= EVENTS DATA =============
INSERT INTO "events" ("organization_id", "creator_member_id", "title", "description", "banner_url", "location", "start_time", "end_time", "registration_start_at", "registration_end_at", "max_capacity", "interested_count", "topic", "is_published", "created_at") VALUES
(1, 2, 'CS Alumni Meetup 2026', 'Annual gathering for CS alumni and current students', 'https://image.plo.vn/w1000/Uploaded/2026/kwvobciv/2026_05_31/hcmus-alumni-league-1-4794-6538.jpg.webp', 'Ho Chi Minh City Convention Center', NOW() + INTERVAL '30 days', NOW() + INTERVAL '30 days 4 hours', NOW(), NOW() + INTERVAL '25 days', 200, 45, 'Networking', true, NOW() - INTERVAL '10 days'),
(1, 2, 'Web Development Workshop', 'Learn modern web development with React and Node.js', 'https://phys.hcmus.edu.vn/uploads/khoa-vat-ly/TUI_LA_NGU/TH%C3%94NG_TIN_KHOA_H%E1%BB%8CC/0.jpg', 'HCMUS Campus - Room 101', NOW() + INTERVAL '15 days', NOW() + INTERVAL '15 days 3 hours', NOW(), NOW() + INTERVAL '12 days', 50, 28, 'Technical', true, NOW() - INTERVAL '5 days'),
(1, 6, 'Database Design Seminar', 'Advanced database design patterns and optimization', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBd17h1ehE0aAY69lAFBq1jDuLSoSWRH949w&s', 'Online via Zoom', NOW() + INTERVAL '20 days', NOW() + INTERVAL '20 days 2 hours', NOW(), NOW() + INTERVAL '18 days', 100, 15, 'Databases', true, NOW() - INTERVAL '3 days'),
(2, 3, 'IT Internship Fair', 'Connect with top tech companies', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRoyM2Ge8o8zmxpU2coR7N10KwU2tf_5Jg9UA&s', 'HCMUS Campus - Auditorium', NOW() + INTERVAL '45 days', NOW() + INTERVAL '45 days 5 hours', NOW(), NOW() + INTERVAL '40 days', 150, 67, 'Career', true, NOW() - INTERVAL '8 days'),
(2, 8, 'AI & Machine Learning Summit', 'Explore the future of AI technology', 'https://fis.hcmus.edu.vn/wp-content/uploads/2024/06/Banner-Event-Face-1330x700.png', 'Saigon Pearl Building, District 1', NOW() + INTERVAL '60 days', NOW() + INTERVAL '60 days 6 hours', NOW(), NOW() + INTERVAL '50 days', 300, 89, 'AI/ML', true, NOW() - INTERVAL '15 days'),
(3, 7, 'Business Leadership Workshop', 'Develop your leadership skills', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6vBgxN4pE47eoL5kXe2LsCMiEGx9zjtaFgA&s', 'HCMUS Campus - Hall A', NOW() + INTERVAL '25 days', NOW() + INTERVAL '25 days 3 hours', NOW(), NOW() + INTERVAL '20 days', 80, 32, 'Leadership', true, NOW() - INTERVAL '6 days'),
(4, 1, 'Engineering Excellence Conference', 'Latest innovations in engineering', 'https://www.fit.hcmus.edu.vn/media/news/photos/Talk-show-The-Era-of-Generative-AI-and-Its-Impact-2.png', 'Ho Chi Minh City', NOW() + INTERVAL '50 days', NOW() + INTERVAL '50 days 8 hours', NOW(), NOW() + INTERVAL '45 days', 250, 56, 'Engineering', true, NOW() - INTERVAL '12 days');

-- ============= EVENT INTERESTS DATA =============
INSERT INTO "event_interests" ("event_id", "member_id", "created_at") VALUES
(1, 2, NOW() - INTERVAL '9 days'),
(1, 4, NOW() - INTERVAL '8 days'),
(1, 6, NOW() - INTERVAL '7 days'),
(2, 4, NOW() - INTERVAL '4 days'),
(2, 9, NOW() - INTERVAL '3 days'),
(3, 6, NOW() - INTERVAL '2 days'),
(3, 2, NOW() - INTERVAL '1 day'),
(4, 3, NOW() - INTERVAL '7 days'),
(4, 5, NOW() - INTERVAL '6 days'),
(4, 8, NOW() - INTERVAL '5 days'),
(5, 8, NOW() - INTERVAL '14 days'),
(5, 9, NOW() - INTERVAL '10 days'),
(6, 7, NOW() - INTERVAL '5 days'),
(6, 10, NOW() - INTERVAL '2 days'),
(7, 6, NOW() - INTERVAL '11 days');

-- ============= EVENT TICKETS DATA =============
INSERT INTO "event_tickets" ("event_id", "member_id", "guest_name", "guest_email", "guest_phone", "ticket_code", "status", "registered_at", "checked_in_at") VALUES
(1, 2, NULL, NULL, NULL, 'EVT001-2026-001', 'CHECKED_IN', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day'),
(1, 4, NULL, NULL, NULL, 'EVT001-2026-002', 'REGISTERED', NOW() - INTERVAL '4 days', NULL),
(1, NULL, 'Mr. Hoang Tran', 'hoang.tran@example.com', '0912345678', 'EVT001-2026-003', 'REGISTERED', NOW() - INTERVAL '3 days', NULL),
(2, 4, NULL, NULL, NULL, 'EVT002-2026-001', 'REGISTERED', NOW() - INTERVAL '2 days', NULL),
(2, 9, NULL, NULL, NULL, 'EVT002-2026-002', 'REGISTERED', NOW() - INTERVAL '1 day', NULL),
(3, 6, NULL, NULL, NULL, 'EVT003-2026-001', 'REGISTERED', NOW(), NULL),
(4, 3, NULL, NULL, NULL, 'EVT004-2026-001', 'REGISTERED', NOW() - INTERVAL '6 days', NULL),
(4, 5, NULL, NULL, NULL, 'EVT004-2026-002', 'REGISTERED', NOW() - INTERVAL '5 days', NULL),
(4, 8, NULL, NULL, NULL, 'EVT004-2026-003', 'CHECKED_IN', NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days'),
(5, 8, NULL, NULL, NULL, 'EVT005-2026-001', 'REGISTERED', NOW() - INTERVAL '13 days', NULL),
(6, 7, NULL, NULL, NULL, 'EVT006-2026-001', 'REGISTERED', NOW() - INTERVAL '4 days', NULL);

-- ============= MENTOR PROFILES DATA =============
INSERT INTO "mentor_profiles" ("member_id", "current_job_title", "current_company", "bio", "rating_avg", "total_sessions", "status", "created_at", "updated_at") VALUES
(2, 'Senior Software Engineer', 'Tech Solutions Inc', 'Experienced in full-stack development', 4.8, 25, 'APPROVED', NOW() - INTERVAL '85 days', NOW()),
(3, 'Product Manager', 'Innovation Hub', 'Passionate about product strategy', 4.6, 18, 'APPROVED', NOW() - INTERVAL '55 days', NOW()),
(6, 'Tech Lead', 'Digital Transformation Co', 'Expert in system design', 4.9, 32, 'APPROVED', NOW() - INTERVAL '195 days', NOW()),
(7, 'Business Consultant', 'Global Consulting Group', 'Strategy and operations specialist', 4.7, 22, 'APPROVED', NOW() - INTERVAL '95 days', NOW()),
(8, 'Startup Founder & CTO', 'TechStart Ventures', 'Entrepreneurship and innovation mentor', 4.5, 15, 'APPROVED', NOW() - INTERVAL '175 days', NOW()),
(5, 'Senior AI Engineer', 'AI Research Lab', 'Deep learning and NLP expert', 4.7, 12, 'APPROVED', NOW() - INTERVAL '120 days', NOW());

-- ============= MENTEE PROFILES DATA =============
INSERT INTO "mentee_profiles" ("member_id", "mentoring_goal", "major", "academic_year", "interests", "is_active", "created_at", "updated_at") VALUES
(4, 'Tìm hiểu định hướng nghề nghiệp sau khi tốt nghiệp.', 'Computer Science', 'Year 3', 'Backend, System Design, Career', true, NOW() - INTERVAL '40 days', NOW()),
(9, 'Học cách viết CV và phỏng vấn intern.', 'Information Technology', 'Year 2', 'Internship, Soft Skills, Career', true, NOW() - INTERVAL '20 days', NOW()),
(10, 'Tìm mentor để định hướng startup mảng giáo dục.', 'Business Administration', 'Year 4', 'Entrepreneurship, Product Strategy', true, NOW() - INTERVAL '5 days', NOW()),
(12, 'Học sâu hơn về AI/ML và lộ trình nghiên cứu.', 'Computer Science', 'Year 1', 'AI, Research, Career', true, NOW() - INTERVAL '1 days', NOW()),
(13, 'Trao đổi về data engineering thực tế trong doanh nghiệp.', 'Information Technology', 'Year 2', 'Data Engineering, Cloud, Career', true, NOW() - INTERVAL '1 days', NOW());

-- ============= MENTOR EXPERTISE DATA =============
INSERT INTO "mentor_expertise" ("mentor_member_id", "topic", "years_experience", "description", "category", "tag") VALUES
(2, 'Full Stack Development', 6, 'React, Node.js, PostgreSQL, MongoDB', 'Technical', 'Fullstack'),
(2, 'System Design', 5, 'Microservices, scalability, architecture', 'Technical', 'Architecture'),
(2, 'Software Architecture', 5, 'Hướng dẫn thiết kế hệ thống có khả năng mở rộng cao.', 'Technical', 'Backend'),
(2, 'Career Path', 6, 'Định hướng lộ trình phát triển sự nghiệp trong ngành Big Tech.', 'Soft Skills', 'Career'),
(3, 'Product Management', 7, 'Product strategy, roadmapping, analytics', 'Management', 'Product'),
(3, 'User Research', 4, 'UX research, customer interviews', 'Research', 'UX'),
(3, 'Product Strategy', 4, 'Lên kế hoạch phát triển sản phẩm từ ý tưởng đến thực thi.', 'Management', 'Product'),
(6, 'Database Design', 8, 'SQL, NoSQL, query optimization', 'Technical', 'Database'),
(6, 'Cloud Architecture', 5, 'AWS, Docker, Kubernetes', 'Technical', 'Cloud'),
(7, 'Business Strategy', 10, 'Market analysis, financial planning', 'Management', 'Strategy'),
(7, 'Leadership', 8, 'Team management, organizational development', 'Soft Skills', 'Leadership'),
(8, 'Startup Development', 6, 'Lean methodology, MVP, fundraising', 'Entrepreneurship', 'Startup'),
(8, 'Technical Entrepreneurship', 5, 'Product-market fit, scaling', 'Entrepreneurship', 'Tech'),
(5, 'Deep Learning', 3, 'Các kỹ thuật xây dựng và tối ưu mô hình mạng nơ-ron.', 'Technical', 'AI');

INSERT INTO "mentor_availabilities" ("mentor_member_id", "start_time", "end_time", "status") VALUES
(2, NOW() + INTERVAL '5 days 10:00', NOW() + INTERVAL '5 days 11:30', 'AVAILABLE'),
(2, NOW() + INTERVAL '7 days 14:00', NOW() + INTERVAL '7 days 16:00', 'AVAILABLE'),
(2, NOW() + INTERVAL '10 days 16:00', NOW() + INTERVAL '10 days 17:00', 'BOOKED'),
(2, NOW() + INTERVAL '1 day 10 hours', NOW() + INTERVAL '1 day 10 hours 30 minutes', 'AVAILABLE'),
(2, NOW() + INTERVAL '2 days 14 hours', NOW() + INTERVAL '2 days 15 hours', 'AVAILABLE'),
(3, NOW() + INTERVAL '4 days 09:00', NOW() + INTERVAL '4 days 10:30', 'AVAILABLE'),
(3, NOW() + INTERVAL '6 days 13:00', NOW() + INTERVAL '6 days 14:00', 'AVAILABLE'),
(3, NOW() + INTERVAL '1 day 9 hours', NOW() + INTERVAL '1 day 10 hours', 'AVAILABLE'),
(6, NOW() + INTERVAL '3 days 11:00', NOW() + INTERVAL '3 days 12:00', 'BOOKED'),
(6, NOW() + INTERVAL '8 days 15:00', NOW() + INTERVAL '8 days 16:30', 'AVAILABLE'),
(7, NOW() + INTERVAL '5 days 13:00', NOW() + INTERVAL '5 days 14:00', 'AVAILABLE'),
(8, NOW() + INTERVAL '6 days 10:00', NOW() + INTERVAL '6 days 12:00', 'AVAILABLE'),
(5, NOW() + INTERVAL '3 days 19 hours', NOW() + INTERVAL '3 days 20 hours', 'AVAILABLE');

-- ============= MENTORSHIP SESSIONS DATA =============
INSERT INTO "mentorship_sessions" ("availability_id", "mentee_member_id", "status", "booking_note", "meeting_link", "session_type", "introduction", "description", "cancel_reason", "proposed_start_time", "proposed_end_time", "mentor_joined_at", "mentee_joined_at", "started_at", "ended_at", "created_at") VALUES
(3, 4, 'COMPLETED', 'Discussed web development best practices', 'https://zoom.us/j/123456789', 'ACADEMIC', 'Em muốn học về React Hooks.', 'Buổi học về các React Hooks cơ bản và nâng cao.', NULL, NULL, NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '1 hour', NOW() - INTERVAL '5 days'),
(3, 9, 'CONFIRMED', 'First mentoring session', 'https://zoom.us/j/987654321', 'ACADEMIC', 'Em muốn hỏi về Spring Boot.', 'Lộ trình học Spring Boot cho người mới bắt đầu.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '2 days'),
(6, 5, 'COMPLETED', 'Career guidance and job search strategy', 'https://meet.google.com/abc-defg-hij', 'CAREER', 'Định hướng sự nghiệp.', 'Cách viết CV và chuẩn bị phỏng vấn.', NULL, NULL, NULL, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days' + INTERVAL '1 hour', NOW() - INTERVAL '10 days'),
(1, 4, 'CONFIRMED', 'Em muốn hỏi về cách chuẩn bị CV ứng tuyển vào Google.', 'https://meet.google.com/abc-defg-hij', 'CAREER', 'Phỏng vấn Big Tech.', 'Chia sẻ kinh nghiệm phỏng vấn tại các công ty lớn.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '1 day'),
(13, 12, 'RESCHEDULE_PROPOSED', 'Chào chị, em muốn tìm hiểu thêm về quy trình làm sản phẩm tại VNG.', NULL, 'CAREER', 'Quy trình Product.', 'Tìm hiểu về văn hóa và quy trình làm việc tại VNG.', 'Cố vấn đề nghị dời buổi hẹn: Trùng lịch công tác, mong em thông cảm.', NOW() + INTERVAL '9 days 10:00', NOW() + INTERVAL '9 days 11:00', NULL, NULL, NULL, NULL, NOW()),
-- No-show buổi đã qua giờ mà không ai tham gia -> EXPIRED (test luồng báo cáo no-show)
(2, 5, 'EXPIRED', 'Buổi không ai tham gia', 'https://zoom.us/j/555000111', 'CAREER', 'Hỏi về lộ trình DevOps.', 'Tư vấn lộ trình học DevOps.', NULL, NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '3 days' + INTERVAL '1 hour', NOW() - INTERVAL '3 days');

-- ============= SESSION FEEDBACKS DATA =============
INSERT INTO "session_feedbacks" ("session_id", "mentee_member_id", "rating", "comment", "is_public", "created_at") VALUES
(1, 4, 5, 'John provided excellent guidance on React patterns. Highly recommend!', true, NOW() - INTERVAL '4 days'),
(3, 5, 5, 'Phạm gave me very useful advice for my job search. Very professional!', true, NOW() - INTERVAL '9 days');

-- ============= NEWS DATA =============
INSERT INTO "news" ("organization_id", "author_member_id", "title", "slug", "content", "thumbnail_url", "topic", "url", "is_hidden", "published_at") VALUES
(1, 2, 'CS Department Launches New AI Lab', 'cs-new-ai-lab', 'We are excited to announce the opening of our state-of-the-art AI research laboratory...', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS24kgEq5wHfl-4ZcfnJY4tfX9NOmujDFB4Fg&s', 'Research', 'https://congdankhuyenhoc.vn/du-kien-hoc-phi-truong-dai-hoc-khoa-hoc-tu-nhien-cao-nhat-70-trieu-dong-nam-hoc-179260314162819629.htm', false, NOW() - INTERVAL '20 days'),
(1, 6, '2026 Scholarship Program Now Open', 'scholarship-program-2026', 'Applications for the 2026 scholarship program are now being accepted. Apply now...', 'https://vcdn1-vnexpress.vnecdn.net/2023/08/22/KHTN-Co-so-2-650x450-3610-1692695643.jpg?w=680&h=0&q=100&dpr=2&fit=crop&s=ANftZJMSwfYCuhcx6cmUEg', 'Education', 'https://hcmus.edu.vn/thong-bao-ket-qua-chinh-thuc-hoc-bong-khuyen-khich-hoc-tap-hk1-2025-2026-chuong-trinh-chuan/', false, NOW() - INTERVAL '15 days'),
(2, 3, 'Job Fair HCMUS x TMA solutions', 'job-fair-tma-solution-hcmus', 'Congratulations to the collaboration of HCMUS and TMA solutions...', 'https://www.tma.vn/images/news/news_thumbnailURL_20260420162625.548.webp', 'Career', 'https://www.tma.vn/tin-tuc/tma-x-fithcmus-job-fair-2026-cung-tma-cham-den-co-hoi-nghe-nghiep-it-toan-cau', false, NOW() - INTERVAL '10 days'),
(2, 8, 'After gradution studying', 'after-graduation-studying', 'We will discuss about the learning after graduation of HCMUS...', 'https://www.fit.hcmus.edu.vn/vn/media/news/photos/2024-1.png', 'Event', 'https://www.fit.hcmus.edu.vn/tin-tuc/d/thong-bao-tuyen-sinh-sau-dai-hoc-nam-2024-dot-1', false, NOW() - INTERVAL '7 days'),
(3, 7, 'Alumni Gathering', 'alumni-gathering', 'Join us as successful alumni share their entrepreneurial journeys...', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVDxl_QbeewSw_VrLx45fpc6NT7yD7mrue6w&s', 'Networking', 'https://alumni.hcmus.edu.vn/', false, NOW() - INTERVAL '5 days'),
(4, 1, 'Engineering Capstone Projects Exhibition', 'capstone-exhibition', 'View the innovative projects created by our engineering students...', 'https://www.fit.hcmus.edu.vn/vn/media/news/photos/IMG_4313.jpg', 'Exhibition', 'https://www.fit.hcmus.edu.vn/vn/Default.aspx?tabid=292&id=16040', false, NOW() - INTERVAL '3 days');

-- ============= ALUMNI POSTS DATA =============
INSERT INTO "alumni_posts" ("organization_id", "author_member_id", "title", "slug", "content", "thumbnail_url", "topic", "url", "is_hidden", "published_at") VALUES
(1, 2, 'Young researcher come back to HCMUS', 'researcher-come-back', 'VNU350 helps Vietnamese researcher to come back to country and contribute...', 'https://vnuhcm.edu.vn/cms/wp-content/uploads/2026/06/Anh-2-1.webp', 'Career', 'https://hcmus.edu.vn/nha-khoa-hoc-tre-tro-ve-tu-chuong-trinh-vnu350-ky-vong-xay-dung-cac-nhom-nghien-cuu-manh-ve-toi-uu-hoa-va-tri-tue-nhan-tao/', false, NOW() - INTERVAL '5 days'),
(1, 6, 'PhD Tran Triet and his great story', 'phd-tran-triet', 'Phd Tran Triet shares his story about Tram Chim...', 'https://hcmus.edu.vn/wp-content/uploads/2026/05/wm_8_anh2_tie1babfnsc4a9tre1baa7ntrie1babft.jpg', 'Advice', 'https://hcmus.edu.vn/ts-tran-triet-nguoi-thuoc-tung-nhip-tho-cua-tram-chim/', false, NOW() - INTERVAL '3 days'),
(2, 3, 'The Importance of Continuous Learning', 'student-who-receive-scholarship-from-us-university', 'Being a PhD student with scholarship at top university of the US...', 'https://hcmus.edu.vn/wp-content/uploads/2026/05/Bui-Tran-Quang-Khai-1778421670-2576-1778424109.webp', 'Education', 'https://hcmus.edu.vn/nam-sinh-22-tuoi-gianh-hoc-bong-tien-si-dai-hoc-top-7-my/', false, NOW() - INTERVAL '2 days');

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
(2, 'Outstanding Alumni Award 2024', 'Recognized for significant contributions to tech community', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqJXIpVayGqnAm1jkUo7_glqDRpIyh00vQiA&s', '2024-06-15', 'Recognition', 'APPROVED'),
(3, 'Mentor of the Year', 'Awarded for exceptional mentoring and guidance', 'https://i1-vnexpress.vnecdn.net/2024/10/24/toannguyenpsu1-1729703456-3400-1729724941.jpg?w=0&h=0&q=100&dpr=2&fit=crop&s=B2MrtA3UCmSziTVs3oZXgg', '2024-05-10', 'Mentorship', 'APPROVED'),
(6, 'Innovation Excellence', 'Developed groundbreaking solutions in system design', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRoY7pa3erL0sdHd2YquXirKDtIN9v0Sk-oTA&s', '2024-07-20', 'Innovation', 'APPROVED'),
(4, 'Scholarship Recipient 2025-2026', 'Awarded academic excellence scholarship', 'https://fetel.hcmus.edu.vn/wp-content/uploads/2023/03/337297879_1303160897209185_5759549372357719210_n.jpg', '2025-08-01', 'Scholarship', 'APPROVED'),
(5, 'Academic Excellence', 'Graduated with high honors', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQvMzXOsHh2yEBrUiormLXf7HjHOJEeNWw18A&s', '2024-06-01', 'Academic', 'APPROVED');

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
(1, 2, 'Complete React Course 2025', 'COURSE', 'https://www.udemy.com/course/the-ultimate-react-course/', 'Comprehensive React learning path from basics to advanced', NOW() - INTERVAL '60 days'),
(1, 6, 'Database Design Best Practices', 'EBOOK', 'https://resources.saylor.org/wwwresources/archived/site/wp-content/uploads/2014/12/CS403-1.10-Database-Design-2nd-Edition-CCBY.pdf', 'Essential guide to designing scalable databases', NOW() - INTERVAL '50 days'),
(2, 3, 'Product Management Fundamentals', 'COURSE', 'https://www.udemy.com/course/product-management-fundamentals-a-beginners-guide/', 'Master the fundamentals of modern product management', NOW() - INTERVAL '45 days'),
(2, 8, 'Startup Founder Handbook', 'EBOOK', 'https://www.amazon.com/Startup-Handbook-Founders-Building-Business/dp/1662954646', 'Complete guide for aspiring entrepreneurs', NOW() - INTERVAL '35 days'),
(3, 7, 'Business Leadership Video Series', 'VIDEO', 'https://www.youtube.com/watch?v=v15QaU6bHZw', 'Learn from successful business leaders', NOW() - INTERVAL '25 days'),
(4, 1, 'Cloud Architecture Masterclass', 'COURSE', 'https://www.udemy.com/course/the-complete-cloud-computing-software-architecture-patterns/', 'Deep dive into AWS and cloud design patterns', NOW() - INTERVAL '20 days'),
(1, 2, 'Web Development Best Practices 2026', 'VIDEO', 'https://www.youtube.com/watch?v=vbFn0C-pvis', 'Latest trends and best practices in web development', NOW() - INTERVAL '10 days'),
(2, 9, 'Data Science with Python', 'COURSE', 'https://www.udemy.com/course/python-for-data-science-and-machine-learning-bootcamp/', 'Learn data science fundamentals using Python', NOW() - INTERVAL '5 days');

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
INSERT INTO "funds" ("organization_id", "manager_name", "name", "logo_url", "fund_receiving_info_id", "description_short", "description_full", "target_amount", "current_amount", "time_started", "donor_count", "topic", "time_ended", "manager_email", "created_at", "updated_at") VALUES
(1, 'John Doe', 'Student Scholarship Fund 2026', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNOruzVwqdOL5x15VrzgsWIqMdH4XlTYLk1A&s', 1, 'Supporting talented students with financial needs', 'Supporting talented students with financial needs', 50000.00, 28500.00, '2026-01-15 09:00:00', 3, 'Scholarship', '2026-08-15 17:00:00', 'john.doe@hcmus.edu.vn', NOW(), NOW()),
(1, 'Phạm Văn C', 'Lab Equipment Fund', 'https://media-cdn-v2.laodong.vn/storage/newsportal/2021/8/4/938086/Hoc-Bong-01.jpg', 3, 'Upgrading our research laboratory equipment', 'Upgrading our research laboratory equipment', 100000.00, 45000.00, '2025-12-20 10:30:00', 2, 'Education', '2026-10-20 18:00:00', 'pham.van.c@hcmus.edu.vn', NOW(), NOW()),
(1, 'Jane Smith', 'Alumni Mentorship Fund', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrSFBCRWjf9_3ZIFkYeFOyJlQlvyaChmZc5Q&s', 4, 'Funding mentorship programs and workshops', 'Funding mentorship programs and workshops', 30000.00, 12000.00, '2026-02-10 14:00:00', 2, 'Mentorship', '2026-09-25 16:30:00', 'jane.smith@hcmus.edu.vn', NOW(), NOW()),
(1, 'Hoàng Thị D', 'Business Incubation Fund', 'https://media-cdn-v2.laodong.vn/storage/newsportal/2025/5/30/1515470/Hoc-Bong-02.JPG', 5, 'Supporting student-led startup initiatives', 'Supporting student-led startup initiatives', 80000.00, 35000.00, '2026-03-05 08:45:00', 1, 'Startup', '2026-11-10 20:00:00', 'hoang.thi.d@hcmus.edu.vn', NOW(), NOW()),
(1, 'Admin User', 'Engineering Excellence Fund', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfmjav140codqz0a5sjbb3BYxtE9drszrtyw&s', 6, 'Supporting engineering projects and competitions', 'Supporting engineering projects and competitions', 60000.00, 22500.00, '2026-02-25 11:15:00', 1, 'Engineering', '2026-10-05 19:15:00', 'admin@hcmus.edu.vn', NOW(), NOW()),
(1, 'Admin User', 'Học bổng vượt khó 2026', 'https://media-cdn-v2.laodong.vn/storage/newsportal/2023/12/6/1276364/Hoc-Bong-1-Min.jpg', 7, 'Hỗ trợ sinh viên có hoàn cảnh khó khăn đạt thành tích tốt.', 'Quỹ học bổng được thành lập nhằm tiếp sức cho các bạn sinh viên vượt qua nghịch cảnh để tiếp tục con đường học vấn. Mục tiêu của chúng tôi là trao 50 suất học bổng trong năm học này.', 500000000, 150000000, NOW() - INTERVAL '1 month', 120, 'Social', NOW() + INTERVAL '5 months', 'admin@hcmus.edu.vn', NOW(), NOW()),
(2, 'Trần Thị B', 'Xây dựng phòng Lab AI', 'https://cdn-i2.congthuong.vn/resize/th/stores/news_dataimages/2025/042025/05/13/thumbnail/b1620250405135112.jpg?rt=20250405135220', 8, 'Nâng cấp thiết bị nghiên cứu cho phòng thí nghiệm AI.', 'Dự án nhằm trang bị các máy chủ GPU mạnh mẽ phục vụ cho nghiên cứu Trí tuệ Nhân tạo tại Khoa CNTT. Chúng tôi mong muốn tạo điều kiện tốt nhất cho các nhóm nghiên cứu sinh viên.', 1000000000, 450000000, NOW() - INTERVAL '2 months', 85, 'Research', NOW() + INTERVAL '3 months', 'tran.thi.b@hcmus.edu.vn', NOW(), NOW());

-- ============= FUND DONATIONS DATA =============
INSERT INTO "fund_donations" ("fund_id", "donor_member_id", "donor_name", "amount", "address", "phone", "email", "message", "status", "created_at") VALUES
(1, 2, 'John Doe', 5000.00, 'District 1, Ho Chi Minh City', '0911111111', 'john.doe@hcmus.edu.vn', 'Supporting our students', 'SUCCESS', NOW() - INTERVAL '30 days'),
(1, 6, 'Phạm Văn C', 3500.00, 'Binh Thanh, Ho Chi Minh City', '0922222222', 'pham.van.c@hcmus.edu.vn', 'Happy to help talented students', 'SUCCESS', NOW() - INTERVAL '25 days'),
(1, NULL, '(Nhà hảo tâm)', 10000.00, 'District 3, Ho Chi Minh City', '0933333333', 'anonymous@example.com', 'Belief in future generation', 'SUCCESS', NOW() - INTERVAL '20 days'),
(2, 3, 'Jane Smith', 2000.00, 'Thu Duc, Ho Chi Minh City', '0944444444', 'jane.smith@hcmus.edu.vn', 'Upgrading our research capabilities', 'SUCCESS', NOW() - INTERVAL '15 days'),
(2, 8, 'Lê Văn E', 15000.00, 'Go Vap, Ho Chi Minh City', '0955555555', 'le.van.e@hcmus.edu.vn', 'Investing in research excellence', 'SUCCESS', NOW() - INTERVAL '10 days'),
(3, 7, 'Hoàng Thị D', 8000.00, 'District 7, Ho Chi Minh City', '0966666666', 'hoang.thi.d@hcmus.edu.vn', 'Supporting mentorship initiatives', 'SUCCESS', NOW() - INTERVAL '8 days'),
(3, NULL, 'Company Partnership', 4000.00, 'Tan Binh, Ho Chi Minh City', '0977777777', 'partnership@company.com', 'Corporate social responsibility', 'PENDING', NOW() - INTERVAL '2 days'),
(4, 5, 'Trần Thị B', 6000.00, 'District 5, Ho Chi Minh City', '0988888888', 'tran.thi.b@hcmus.edu.vn', 'Supporting entrepreneurs', 'PENDING', NOW() - INTERVAL '5 days'),
(5, 1, 'Admin User', 5500.00, 'District 10, Ho Chi Minh City', '0999999999', 'admin@hcmus.edu.vn', 'Excellence in engineering', 'SUCCESS', NOW() - INTERVAL '3 days'),
(6, 2, 'John Doe', 1000000, 'District 5, HCM', '0901234567', 'john.doe@example.com', 'Chúc các em học tốt!', 'SUCCESS', NOW() - INTERVAL '10 days'),
(6, 3, 'Jane Smith', 500000, 'District 1, HCM', '0911223344', 'jane.smith@example.com', 'Hy vọng giúp ích được phần nào.', 'SUCCESS', NOW() - INTERVAL '5 days'),
(7, 5, 'Trần Thị B', 2000000, 'Thu Duc, HCM', '0933445566', 'tranthib@example.com', 'Ủng hộ phòng Lab phát triển.', 'SUCCESS', NOW() - INTERVAL '2 days'),
(6, NULL, '(Nhà hảo tâm)', 10000000, NULL, NULL, NULL, 'Gửi tặng các em sinh viên.', 'SUCCESS', NOW() - INTERVAL '1 day');

-- ============= NOTIFICATIONS DATA =============
INSERT INTO "notifications" ("member_id", "title", "message", "is_read", "link", "created_at") VALUES
(4, 'Event Registration Confirmed', 'Your registration for Web Development Workshop has been confirmed', false, '/events/1', NOW() - INTERVAL '2 days'),
(4, 'New Mentorship Session Scheduled', 'You have a new mentorship session scheduled with John Doe', false, '/mentorship', NOW() - INTERVAL '1 day'),
(5, 'Job Opportunity Match', 'Found a job that matches your profile: Junior Software Developer', true, '/jobs/1', NOW() - INTERVAL '5 days'),
(9, 'Scholarship Opportunity', 'You are eligible for the Student Scholarship Fund', false, '/fundraising', NOW()),
(10, 'Profile Review Required', 'Please complete your profile to join as an active member', false, '/profile', NOW() - INTERVAL '3 days'),
(2, 'New Mentee Request', 'Trần Thị B requested a mentorship session', true, '/mentorship', NOW() - INTERVAL '4 days'),
(6, 'Event Registration Confirmed', 'Your registration for Database Design Seminar has been confirmed', true, '/events/2', NOW() - INTERVAL '6 days');

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
(2, 2, 'MEMBER', NOW() - INTERVAL '8 days'),
(2, 4, 'MEMBER', NOW() - INTERVAL '7 days'),
(2, 9, 'MEMBER', NOW() - INTERVAL '6 days'),
(3, 3, 'OWNER', NOW() - INTERVAL '6 days'),
(3, 5, 'MEMBER', NOW() - INTERVAL '6 days'),
(3, 8, 'MEMBER', NOW() - INTERVAL '5 days'),
(4, 11, 'OWNER', NOW() - INTERVAL '5 days'),
(4, 2, 'MEMBER', NOW() - INTERVAL '5 days'),
(5, 11, 'OWNER', NOW() - INTERVAL '4 days'),
(5, 2, 'MEMBER', NOW() - INTERVAL '4 days'),
(5, 6, 'MEMBER', NOW() - INTERVAL '3 days'),
(5, 4, 'MEMBER', NOW() - INTERVAL '3 days'),
(6, 11, 'OWNER', NOW() - INTERVAL '3 days'),
(6, 6, 'MEMBER', NOW() - INTERVAL '3 days'),
(7, 11, 'MEMBER', NOW() - INTERVAL '2 days'),
(7, 4, 'OWNER', NOW() - INTERVAL '2 days'),
(8, 11, 'OWNER', NOW() - INTERVAL '1 day'),
(8, 6, 'MEMBER', NOW() - INTERVAL '1 day'),
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

-- ============= CHAT CONVERSATION REQUESTS DATA =============
-- Seed cho 4 private chat group đã có tin nhắn; status ACCEPTED, cooldown_until NULL
INSERT INTO "chat_conversation_requests" ("member_low_id", "member_high_id", "requester_member_id", "target_member_id", "chat_group_id", "last_request_message_id", "cooldown_until", "status", "created_at", "updated_at") VALUES
(2, 4, 2, 4, 1, 1, NULL, 'ACCEPTED', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
(2, 11, 11, 2, 4, 6, NULL, 'ACCEPTED', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(6, 11, 11, 6, 6, 14, NULL, 'ACCEPTED', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
(4, 11, 4, 11, 7, 19, NULL, 'ACCEPTED', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

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
(4, 'Sustainable Engineering for the Future', 6, 8, 67, false, NOW() - INTERVAL '8 days', NOW() - INTERVAL '3 days');

-- ============= FORUM POSTS DATA =============
INSERT INTO "forum_posts" ("topic_id", "author_member_id", "content", "answer_to_post_id", "ai_tag", "is_hidden", "created_at", "updated_at") VALUES
(1, 2, 'Hi everyone! Excited to be part of this community. I graduated in 2023 and am now working at Tech Solutions Inc. Looking forward to mentoring newcomers!', NULL, 'VERIFIED', false, NOW() - INTERVAL '355 days', NOW() - INTERVAL '355 days'),
(1, 6, 'Welcome John! Great to have experienced alumni like you in the community. Hope to collaborate on mentorship initiatives.', 1, 'VERIFIED', false, NOW() - INTERVAL '354 days', NOW() - INTERVAL '354 days'),
(2, 4, 'What are your thoughts on React Hooks? I find them more intuitive than class components for state management.', NULL, 'VERIFIED', false, NOW() - INTERVAL '44 days', NOW() - INTERVAL '44 days'),
(2, 6, 'Great question! I prefer hooks too. They make code more reusable and easier to test. Here are some best practices...', 3, 'VERIFIED', false, NOW() - INTERVAL '43 days', NOW() - INTERVAL '43 days'),
(3, 6, 'The key to successful job search is networking. Connect with alumni, attend events, and prepare well for interviews.', NULL, 'VERIFIED', false, NOW() - INTERVAL '29 days', NOW() - INTERVAL '29 days'),
(3, 9, 'This is very helpful! I just started my search. Thanks for the tips!', 5, 'VERIFIED', false, NOW() - INTERVAL '27 days', NOW() - INTERVAL '27 days'),
(4, 6, 'Database indexing is crucial. Always analyze your query plans before and after optimization.', NULL, 'VERIFIED', false, NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days'),
(4, 2, 'Totally agree. Also consider table partitioning for very large datasets.', 7, 'VIOLATED', true, NOW() - INTERVAL '23 days', NOW() - INTERVAL '23 days'),
(5, 5, 'Node.js is perfect for I/O-intensive applications. The async/await pattern makes it so much cleaner than callbacks.', NULL, 'VERIFIED', false, NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days'),
(5, 9, 'I am new to Node.js. Any recommended projects for beginners to start with?', 9, 'UNVERIFIED', false, NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
(6, 3, 'It was an incredible journey! Started with passion, raised funding, built great team, and now ready for the next chapter.', NULL, 'VERIFIED', false, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
(6, 8, 'Inspiring story, Jane! What was your biggest challenge during the startup phase?', 11, 'VERIFIED', false, NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'),
(6, 3, 'Great question! The biggest challenge was finding product-market fit and managing burn rate during early days.', 12, 'VERIFIED', false, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
(7, 8, 'Microservices bring agility but also complexity. Event-driven architecture helps manage inter-service communication.', NULL, 'VERIFIED', false, NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'),
(8, 7, 'Leadership is about empowering your team. Trust your people and give them autonomy to make decisions.', NULL, 'VERIFIED', false, NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days');

-- ============= FORUM POST REPORTS DATA =============
INSERT INTO "forum_post_reports" ("post_id", "reporter_member_id", "reason", "status", "reviewed_by_user_id", "review_note", "created_at", "updated_at") VALUES
(8, 4, 'SPAM', 'APPROVED', 1, 'Hidden post and warned author', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
(14, 9, 'OFF_TOPIC', 'PENDING', NULL, NULL, NOW() - INTERVAL '8 hours', NOW() - INTERVAL '8 hours'),
(15, 10, 'ABUSIVE_LANGUAGE', 'REJECTED', 1, 'No violation after review', NOW() - INTERVAL '1 day', NOW() - INTERVAL '20 hours');

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
(15, 8, NOW() - INTERVAL '4 days');

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
(10, 7, NOW() - INTERVAL '2 days');

-- ============= VERIFICATION REQUESTS DATA =============
INSERT INTO "verification_requests" ("member_id", "document_url", "document_type", "ai_summary", "status", "admin_note", "reviewed_by_member_id", "created_at") VALUES
(4, 'https://assets.acegalaxy.co/resources/category/lobby_icon_favorite_small.png', 'STUDENT_ID', 'Student ID card for member 4', 'APPROVED', 'Student ID verified and matches system records', 1, NOW() - INTERVAL '40 days'),
(5, 'https://assets.acegalaxy.co/resources/category/lobby_icon_favorite_small.png', 'GRADUATION_CERTIFICATE', 'Bachelor graduation certificate', 'APPROVED', 'Graduation verified', 1, NOW() - INTERVAL '25 days'),
(9, 'https://assets.acegalaxy.co/resources/category/lobby_icon_favorite_small.png', 'STUDENT_ID', 'Student ID for AI verification', 'PENDING', 'Awaiting verification', NULL, NOW() - INTERVAL '3 days'),
(10, 'https://assets.acegalaxy.co/resources/category/lobby_icon_favorite_small.png', 'DIPLOMA', 'Diploma document scan', 'REJECTED', 'Document quality too low, please resubmit', 1, NOW() - INTERVAL '5 days');

-- ============= SCHOOL FEEDBACKS DATA =============
INSERT INTO "school_feedbacks" ("organization_id", "full_name", "phone", "email", "subject", "ai_summary", "content", "created_at", "is_read") VALUES
(1, 'Nguyễn Minh Khang', '0908123456', 'khang.nguyen@example.com', 'Góp ý về lịch workshop', 'Student suggests earlier announcement of workshop schedules.', 'Mong trường công bố lịch workshop sớm hơn để sinh viên chủ động đăng ký.', NOW() - INTERVAL '4 days', false),
(1, 'Trần Thu Hà', '0912233445', 'ha.tran@example.com', 'Đề xuất cải thiện diễn đàn', 'User recommends adding department filters to the forum.', 'Nên có bộ lọc theo chuyên ngành để tìm chủ đề nhanh hơn.', NOW() - INTERVAL '2 days', true),
(2, 'Lê Quốc Bảo', '0988776655', 'bao.le@example.com', 'Hỗ trợ thông tin học bổng', 'Request for a dedicated scholarship information section.', 'Mình mong có chuyên mục riêng cập nhật học bổng theo từng học kỳ.', NOW() - INTERVAL '1 day', false),
(1, 'Phạm Tuấn Anh', '0933445566', 'tuananh.pham@example.com', 'Hỏi về quy trình cấp lại bằng', 'Inquiry regarding the process for reissuing a lost diploma.', 'Mình làm mất bằng tốt nghiệp, trường cho mình hỏi quy trình cấp lại như thế nào ạ?', NOW() - INTERVAL '3 days', false),
(2, 'Đỗ Thị Lan', '0944556677', 'lan.do@example.com', 'Góp ý về mentor', 'Positive feedback on mentor quality with a request for offline sessions.', 'Chất lượng mentor rất tốt, mong có thêm nhiều buổi offline hơn.', NOW() - INTERVAL '5 days', true);

-- ============= FORUM TOPIC SUBSCRIPTIONS DATA =============
INSERT INTO "forum_topic_subscriptions" ("topic_id", "member_id", "last_read_at", "created_at") VALUES
(1, 4, NOW() - INTERVAL '10 days', NOW() - INTERVAL '30 days'),
(1, 6, NOW() - INTERVAL '5 days', NOW() - INTERVAL '30 days'),
(2, 6, NOW() - INTERVAL '1 day', NOW() - INTERVAL '40 days'),
(3, 4, NOW() - INTERVAL '2 days', NOW() - INTERVAL '25 days'),
(5, 9, NOW() - INTERVAL '3 days', NOW() - INTERVAL '15 days'),
(6, 2, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '10 days'),
(6, 6, NOW() - INTERVAL '2 days', NOW() - INTERVAL '12 days');


-- ============= ADDED FORUM DATA FOR ORG 1 =============
INSERT INTO "forum_categories" ("parent_id", "organization_id", "name", "description", "created_at", "updated_at") VALUES
(NULL, 1, 'CS Category 1', 'Description for CS Category 1', NOW() - INTERVAL '61 days', NOW()),
(NULL, 1, 'CS Category 2', 'Description for CS Category 2', NOW() - INTERVAL '28 days', NOW()),
(NULL, 1, 'CS Category 3', 'Description for CS Category 3', NOW() - INTERVAL '61 days', NOW()),
(NULL, 1, 'CS Category 4', 'Description for CS Category 4', NOW() - INTERVAL '67 days', NOW()),
(NULL, 1, 'CS Category 5', 'Description for CS Category 5', NOW() - INTERVAL '63 days', NOW()),
(3, 1, 'CS Category 6', 'Description for CS Category 6', NOW() - INTERVAL '73 days', NOW()),
(1, 1, 'CS Category 7', 'Description for CS Category 7', NOW() - INTERVAL '34 days', NOW()),
(1, 1, 'CS Category 8', 'Description for CS Category 8', NOW() - INTERVAL '94 days', NOW()),
(12, 1, 'CS Category 9', 'Description for CS Category 9', NOW() - INTERVAL '39 days', NOW()),
(9, 1, 'CS Category 10', 'Description for CS Category 10', NOW() - INTERVAL '62 days', NOW()),
(1, 1, 'CS Category 11', 'Description for CS Category 11', NOW() - INTERVAL '39 days', NOW()),
(2, 1, 'CS Category 12', 'Description for CS Category 12', NOW() - INTERVAL '85 days', NOW()),
(9, 1, 'CS Category 13', 'Description for CS Category 13', NOW() - INTERVAL '48 days', NOW()),
(1, 1, 'CS Category 14', 'Description for CS Category 14', NOW() - INTERVAL '25 days', NOW()),
(1, 1, 'CS Category 15', 'Description for CS Category 15', NOW() - INTERVAL '17 days', NOW()),
(11, 1, 'CS Category 16', 'Description for CS Category 16', NOW() - INTERVAL '10 days', NOW()),
(3, 1, 'CS Category 17', 'Description for CS Category 17', NOW() - INTERVAL '37 days', NOW()),
(10, 1, 'CS Category 18', 'Description for CS Category 18', NOW() - INTERVAL '21 days', NOW()),
(10, 1, 'CS Category 19', 'Description for CS Category 19', NOW() - INTERVAL '79 days', NOW()),
(1, 1, 'CS Category 20', 'Description for CS Category 20', NOW() - INTERVAL '95 days', NOW());

INSERT INTO "forum_topics" ("organization_id", "title", "created_by_member_id", "category_id", "view_count", "is_locked", "created_at", "updated_at") VALUES
(1, 'CS Topic 1 on interesting subjects', 12, 6, 382, false, NOW() - INTERVAL '32 days', NOW()),
(1, 'CS Topic 2 on interesting subjects', 2, 14, 204, false, NOW() - INTERVAL '8 days', NOW()),
(1, 'CS Topic 3 on interesting subjects', 1, 1, 315, false, NOW() - INTERVAL '22 days', NOW()),
(1, 'CS Topic 4 on interesting subjects', 1, 9, 308, false, NOW() - INTERVAL '36 days', NOW()),
(1, 'CS Topic 5 on interesting subjects', 12, 24, 253, false, NOW() - INTERVAL '22 days', NOW()),
(1, 'CS Topic 6 on interesting subjects', 11, 17, 161, false, NOW() - INTERVAL '9 days', NOW()),
(1, 'CS Topic 7 on interesting subjects', 6, 25, 290, false, NOW() - INTERVAL '34 days', NOW()),
(1, 'CS Topic 8 on interesting subjects', 12, 2, 343, false, NOW() - INTERVAL '38 days', NOW()),
(1, 'CS Topic 9 on interesting subjects', 2, 3, 81, false, NOW() - INTERVAL '21 days', NOW()),
(1, 'CS Topic 10 on interesting subjects', 6, 16, 103, false, NOW() - INTERVAL '16 days', NOW()),
(1, 'CS Topic 11 on interesting subjects', 12, 3, 82, false, NOW() - INTERVAL '15 days', NOW()),
(1, 'CS Topic 12 on interesting subjects', 1, 1, 280, false, NOW() - INTERVAL '6 days', NOW()),
(1, 'CS Topic 13 on interesting subjects', 2, 13, 318, false, NOW() - INTERVAL '9 days', NOW()),
(1, 'CS Topic 14 on interesting subjects', 12, 17, 293, false, NOW() - INTERVAL '27 days', NOW()),
(1, 'CS Topic 15 on interesting subjects', 1, 9, 271, false, NOW() - INTERVAL '19 days', NOW()),
(1, 'CS Topic 16 on interesting subjects', 1, 14, 442, false, NOW() - INTERVAL '34 days', NOW()),
(1, 'CS Topic 17 on interesting subjects', 12, 6, 165, false, NOW() - INTERVAL '22 days', NOW()),
(1, 'CS Topic 18 on interesting subjects', 12, 15, 481, false, NOW() - INTERVAL '19 days', NOW()),
(1, 'CS Topic 19 on interesting subjects', 11, 2, 184, false, NOW() - INTERVAL '6 days', NOW()),
(1, 'CS Topic 20 on interesting subjects', 1, 9, 448, false, NOW() - INTERVAL '19 days', NOW()),
(1, 'CS Topic 21 on interesting subjects', 6, 3, 325, false, NOW() - INTERVAL '5 days', NOW()),
(1, 'CS Topic 22 on interesting subjects', 4, 22, 326, false, NOW() - INTERVAL '20 days', NOW()),
(1, 'CS Topic 23 on interesting subjects', 12, 11, 392, false, NOW() - INTERVAL '35 days', NOW()),
(1, 'CS Topic 24 on interesting subjects', 1, 19, 479, false, NOW() - INTERVAL '43 days', NOW()),
(1, 'CS Topic 25 on interesting subjects', 11, 10, 418, false, NOW() - INTERVAL '31 days', NOW()),
(1, 'CS Topic 26 on interesting subjects', 6, 3, 487, false, NOW() - INTERVAL '23 days', NOW()),
(1, 'CS Topic 27 on interesting subjects', 6, 20, 144, false, NOW() - INTERVAL '32 days', NOW()),
(1, 'CS Topic 28 on interesting subjects', 2, 1, 383, false, NOW() - INTERVAL '19 days', NOW()),
(1, 'CS Topic 29 on interesting subjects', 11, 23, 150, false, NOW() - INTERVAL '12 days', NOW()),
(1, 'CS Topic 30 on interesting subjects', 11, 20, 489, false, NOW() - INTERVAL '11 days', NOW()),
(1, 'CS Topic 31 on interesting subjects', 1, 22, 230, false, NOW() - INTERVAL '7 days', NOW()),
(1, 'CS Topic 32 on interesting subjects', 1, 10, 70, false, NOW() - INTERVAL '33 days', NOW()),
(1, 'CS Topic 33 on interesting subjects', 11, 3, 218, false, NOW() - INTERVAL '6 days', NOW()),
(1, 'CS Topic 34 on interesting subjects', 6, 22, 49, false, NOW() - INTERVAL '49 days', NOW()),
(1, 'CS Topic 35 on interesting subjects', 1, 24, 397, false, NOW() - INTERVAL '8 days', NOW());

INSERT INTO "forum_posts" ("topic_id", "author_member_id", "content", "answer_to_post_id", "ai_tag", "is_hidden", "created_at", "updated_at") VALUES
(38, 12, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '4 days', NOW()),
(27, 11, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '4 days', NOW()),
(13, 1, 'This is an interesting perspective on topic 13. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '7 days', NOW()),
(22, 11, 'Does anyone have more resources on this? I would love to read more.', NULL, 'VERIFIED', false, NOW() - INTERVAL '3 days', NOW()),
(43, 4, 'This is an interesting perspective on topic 43. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '10 days', NOW()),
(36, 4, 'Does anyone have more resources on this? I would love to read more.', NULL, 'VERIFIED', false, NOW() - INTERVAL '3 days', NOW()),
(37, 4, 'Does anyone have more resources on this? I would love to read more.', NULL, 'VERIFIED', false, NOW() - INTERVAL '1 days', NOW()),
(25, 2, 'Does anyone have more resources on this? I would love to read more.', NULL, 'VERIFIED', false, NOW() - INTERVAL '6 days', NOW()),
(40, 6, 'This is an interesting perspective on topic 40. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '5 days', NOW()),
(25, 1, 'I totally agree with the points made in this thread. Good job everyone!', 23, 'VERIFIED', false, NOW() - INTERVAL '6 days', NOW()),
(23, 6, 'This is an interesting perspective on topic 23. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '4 days', NOW()),
(15, 12, 'This is an interesting perspective on topic 15. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '3 days', NOW()),
(17, 1, 'This is an interesting perspective on topic 17. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '1 days', NOW()),
(21, 4, 'Does anyone have more resources on this? I would love to read more.', NULL, 'VERIFIED', false, NOW() - INTERVAL '7 days', NOW()),
(31, 2, 'This is an interesting perspective on topic 31. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '3 days', NOW()),
(12, 2, 'This is an interesting perspective on topic 12. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '10 days', NOW()),
(33, 11, 'This is an interesting perspective on topic 33. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '7 days', NOW()),
(20, 12, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '7 days', NOW()),
(14, 1, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '3 days', NOW()),
(42, 12, 'This is an interesting perspective on topic 42. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '7 days', NOW()),
(37, 1, 'This is an interesting perspective on topic 37. I think we should consider...', 22, 'VERIFIED', false, NOW() - INTERVAL '3 days', NOW()),
(38, 1, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '2 days', NOW()),
(33, 1, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '1 days', NOW()),
(31, 2, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '10 days', NOW()),
(33, 12, 'Does anyone have more resources on this? I would love to read more.', 32, 'VERIFIED', false, NOW() - INTERVAL '5 days', NOW()),
(31, 12, 'I totally agree with the points made in this thread. Good job everyone!', 30, 'VERIFIED', false, NOW() - INTERVAL '7 days', NOW()),
(31, 4, 'Does anyone have more resources on this? I would love to read more.', 39, 'VERIFIED', false, NOW() - INTERVAL '4 days', NOW()),
(36, 6, 'This is an interesting perspective on topic 36. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '8 days', NOW()),
(13, 1, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '10 days', NOW()),
(30, 11, 'Does anyone have more resources on this? I would love to read more.', NULL, 'VERIFIED', false, NOW() - INTERVAL '3 days', NOW()),
(10, 2, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '1 days', NOW()),
(15, 12, 'Does anyone have more resources on this? I would love to read more.', 27, 'VERIFIED', false, NOW() - INTERVAL '10 days', NOW()),
(22, 1, 'This is an interesting perspective on topic 22. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '3 days', NOW()),
(19, 4, 'Does anyone have more resources on this? I would love to read more.', NULL, 'VERIFIED', false, NOW() - INTERVAL '6 days', NOW()),
(23, 6, 'This is an interesting perspective on topic 23. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '5 days', NOW()),
(18, 11, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '6 days', NOW()),
(13, 1, 'This is an interesting perspective on topic 13. I think we should consider...', 44, 'VERIFIED', false, NOW() - INTERVAL '7 days', NOW()),
(34, 4, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '2 days', NOW()),
(32, 4, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '7 days', NOW()),
(37, 2, 'Does anyone have more resources on this? I would love to read more.', NULL, 'VERIFIED', false, NOW() - INTERVAL '4 days', NOW()),
(23, 2, 'I totally agree with the points made in this thread. Good job everyone!', 26, 'VERIFIED', false, NOW() - INTERVAL '2 days', NOW()),
(44, 1, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '8 days', NOW()),
(40, 12, 'This is an interesting perspective on topic 40. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '5 days', NOW()),
(35, 4, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '5 days', NOW()),
(38, 1, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '3 days', NOW()),
(24, 2, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '4 days', NOW()),
(27, 4, 'This is an interesting perspective on topic 27. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '3 days', NOW()),
(12, 4, 'This is an interesting perspective on topic 12. I think we should consider...', 31, 'VERIFIED', false, NOW() - INTERVAL '10 days', NOW()),
(30, 4, 'This is an interesting perspective on topic 30. I think we should consider...', 45, 'VERIFIED', false, NOW() - INTERVAL '7 days', NOW()),
(41, 11, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '8 days', NOW()),
(42, 4, 'Does anyone have more resources on this? I would love to read more.', NULL, 'VERIFIED', false, NOW() - INTERVAL '7 days', NOW()),
(22, 11, 'I totally agree with the points made in this thread. Good job everyone!', 48, 'VERIFIED', false, NOW() - INTERVAL '6 days', NOW()),
(42, 1, 'Does anyone have more resources on this? I would love to read more.', NULL, 'VERIFIED', false, NOW() - INTERVAL '2 days', NOW()),
(15, 2, 'Does anyone have more resources on this? I would love to read more.', NULL, 'VERIFIED', false, NOW() - INTERVAL '4 days', NOW()),
(36, 1, 'This is an interesting perspective on topic 36. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '4 days', NOW()),
(40, 12, 'This is an interesting perspective on topic 40. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '6 days', NOW()),
(40, 1, 'This is an interesting perspective on topic 40. I think we should consider...', 71, 'VERIFIED', false, NOW() - INTERVAL '5 days', NOW()),
(12, 4, 'This is an interesting perspective on topic 12. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '6 days', NOW()),
(11, 6, 'Does anyone have more resources on this? I would love to read more.', NULL, 'VERIFIED', false, NOW() - INTERVAL '6 days', NOW()),
(15, 1, 'This is an interesting perspective on topic 15. I think we should consider...', 69, 'VERIFIED', false, NOW() - INTERVAL '8 days', NOW()),
(38, 12, 'Does anyone have more resources on this? I would love to read more.', 16, 'VERIFIED', false, NOW() - INTERVAL '10 days', NOW()),
(10, 1, 'This is an interesting perspective on topic 10. I think we should consider...', 46, 'VERIFIED', false, NOW() - INTERVAL '5 days', NOW()),
(12, 1, 'Does anyone have more resources on this? I would love to read more.', NULL, 'VERIFIED', false, NOW() - INTERVAL '7 days', NOW()),
(18, 4, 'Does anyone have more resources on this? I would love to read more.', 51, 'VERIFIED', false, NOW() - INTERVAL '8 days', NOW()),
(20, 12, 'Does anyone have more resources on this? I would love to read more.', 33, 'VERIFIED', false, NOW() - INTERVAL '6 days', NOW()),
(16, 2, 'Does anyone have more resources on this? I would love to read more.', NULL, 'VERIFIED', false, NOW() - INTERVAL '7 days', NOW()),
(28, 6, 'This is an interesting perspective on topic 28. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '3 days', NOW()),
(12, 2, 'Does anyone have more resources on this? I would love to read more.', NULL, 'VERIFIED', false, NOW() - INTERVAL '8 days', NOW()),
(42, 11, 'Does anyone have more resources on this? I would love to read more.', 68, 'VERIFIED', false, NOW() - INTERVAL '10 days', NOW()),
(12, 2, 'This is an interesting perspective on topic 12. I think we should consider...', 73, 'VERIFIED', false, NOW() - INTERVAL '6 days', NOW()),
(22, 6, 'I totally agree with the points made in this thread. Good job everyone!', 19, 'VERIFIED', false, NOW() - INTERVAL '6 days', NOW()),
(26, 1, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '7 days', NOW()),
(36, 11, 'This is an interesting perspective on topic 36. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '10 days', NOW()),
(32, 6, 'This is an interesting perspective on topic 32. I think we should consider...', 54, 'VERIFIED', false, NOW() - INTERVAL '1 days', NOW()),
(10, 12, 'This is an interesting perspective on topic 10. I think we should consider...', 46, 'VERIFIED', false, NOW() - INTERVAL '6 days', NOW()),
(26, 11, 'This is an interesting perspective on topic 26. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '3 days', NOW()),
(15, 12, 'This is an interesting perspective on topic 15. I think we should consider...', 47, 'VERIFIED', false, NOW() - INTERVAL '2 days', NOW()),
(31, 1, 'I totally agree with the points made in this thread. Good job everyone!', 41, 'VERIFIED', false, NOW() - INTERVAL '8 days', NOW()),
(26, 11, 'I totally agree with the points made in this thread. Good job everyone!', 91, 'VERIFIED', false, NOW() - INTERVAL '9 days', NOW()),
(10, 12, 'I totally agree with the points made in this thread. Good job everyone!', 46, 'VERIFIED', false, NOW() - INTERVAL '5 days', NOW()),
(25, 12, 'This is an interesting perspective on topic 25. I think we should consider...', 23, 'VERIFIED', false, NOW() - INTERVAL '9 days', NOW()),
(36, 2, 'This is an interesting perspective on topic 36. I think we should consider...', 88, 'VERIFIED', false, NOW() - INTERVAL '9 days', NOW()),
(19, 12, 'This is an interesting perspective on topic 19. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '3 days', NOW()),
(20, 6, 'This is an interesting perspective on topic 20. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '10 days', NOW()),
(11, 12, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '7 days', NOW()),
(38, 2, 'This is an interesting perspective on topic 38. I think we should consider...', 37, 'VERIFIED', false, NOW() - INTERVAL '9 days', NOW()),
(34, 1, 'Does anyone have more resources on this? I would love to read more.', 53, 'VERIFIED', false, NOW() - INTERVAL '1 days', NOW()),
(32, 4, 'This is an interesting perspective on topic 32. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '7 days', NOW()),
(16, 11, 'This is an interesting perspective on topic 16. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '3 days', NOW()),
(41, 12, 'This is an interesting perspective on topic 41. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '4 days', NOW()),
(33, 11, 'This is an interesting perspective on topic 33. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '9 days', NOW()),
(34, 2, 'This is an interesting perspective on topic 34. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '7 days', NOW()),
(19, 1, 'Does anyone have more resources on this? I would love to read more.', NULL, 'VERIFIED', false, NOW() - INTERVAL '6 days', NOW()),
(20, 1, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '8 days', NOW()),
(39, 2, 'Does anyone have more resources on this? I would love to read more.', NULL, 'VERIFIED', false, NOW() - INTERVAL '6 days', NOW()),
(20, 4, 'This is an interesting perspective on topic 20. I think we should consider...', 33, 'VERIFIED', false, NOW() - INTERVAL '10 days', NOW()),
(12, 6, 'This is an interesting perspective on topic 12. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '3 days', NOW()),
(41, 2, 'I totally agree with the points made in this thread. Good job everyone!', 105, 'VERIFIED', false, NOW() - INTERVAL '1 days', NOW()),
(26, 2, 'Does anyone have more resources on this? I would love to read more.', 87, 'VERIFIED', false, NOW() - INTERVAL '2 days', NOW()),
(23, 4, 'I totally agree with the points made in this thread. Good job everyone!', 26, 'VERIFIED', false, NOW() - INTERVAL '7 days', NOW()),
(22, 12, 'This is an interesting perspective on topic 22. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '8 days', NOW()),
(34, 4, 'This is an interesting perspective on topic 34. I think we should consider...', 107, 'VERIFIED', false, NOW() - INTERVAL '10 days', NOW()),
(15, 11, 'This is an interesting perspective on topic 15. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '9 days', NOW()),
(44, 6, 'This is an interesting perspective on topic 44. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '1 days', NOW()),
(38, 1, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '7 days', NOW()),
(38, 2, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '5 days', NOW()),
(43, 12, 'I totally agree with the points made in this thread. Good job everyone!', 20, 'VERIFIED', false, NOW() - INTERVAL '2 days', NOW()),
(33, 4, 'This is an interesting perspective on topic 33. I think we should consider...', 38, 'VERIFIED', false, NOW() - INTERVAL '10 days', NOW()),
(24, 11, 'Does anyone have more resources on this? I would love to read more.', NULL, 'VERIFIED', false, NOW() - INTERVAL '3 days', NOW()),
(17, 12, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '10 days', NOW()),
(17, 1, 'This is an interesting perspective on topic 17. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '5 days', NOW()),
(25, 6, 'Does anyone have more resources on this? I would love to read more.', 96, 'VERIFIED', false, NOW() - INTERVAL '3 days', NOW()),
(22, 6, 'Does anyone have more resources on this? I would love to read more.', NULL, 'VERIFIED', false, NOW() - INTERVAL '2 days', NOW()),
(39, 2, 'This is an interesting perspective on topic 39. I think we should consider...', 110, 'VERIFIED', false, NOW() - INTERVAL '3 days', NOW()),
(23, 2, 'This is an interesting perspective on topic 23. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '2 days', NOW()),
(10, 11, 'Does anyone have more resources on this? I would love to read more.', NULL, 'VERIFIED', false, NOW() - INTERVAL '1 days', NOW()),
(15, 1, 'This is an interesting perspective on topic 15. I think we should consider...', 92, 'VERIFIED', false, NOW() - INTERVAL '2 days', NOW()),
(16, 11, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '3 days', NOW()),
(25, 1, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '1 days', NOW()),
(15, 1, 'This is an interesting perspective on topic 15. I think we should consider...', 118, 'VERIFIED', false, NOW() - INTERVAL '8 days', NOW()),
(39, 12, 'This is an interesting perspective on topic 39. I think we should consider...', 110, 'VERIFIED', false, NOW() - INTERVAL '9 days', NOW()),
(14, 2, 'This is an interesting perspective on topic 14. I think we should consider...', 34, 'VERIFIED', false, NOW() - INTERVAL '3 days', NOW()),
(30, 2, 'Does anyone have more resources on this? I would love to read more.', 45, 'VERIFIED', false, NOW() - INTERVAL '2 days', NOW()),
(31, 2, 'This is an interesting perspective on topic 31. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '10 days', NOW()),
(20, 1, 'This is an interesting perspective on topic 20. I think we should consider...', 99, 'VERIFIED', false, NOW() - INTERVAL '2 days', NOW()),
(38, 12, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '6 days', NOW()),
(43, 11, 'Does anyone have more resources on this? I would love to read more.', NULL, 'VERIFIED', false, NOW() - INTERVAL '9 days', NOW()),
(20, 2, 'This is an interesting perspective on topic 20. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '4 days', NOW()),
(10, 2, 'This is an interesting perspective on topic 10. I think we should consider...', 95, 'VERIFIED', false, NOW() - INTERVAL '4 days', NOW()),
(40, 1, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '5 days', NOW()),
(13, 12, 'This is an interesting perspective on topic 13. I think we should consider...', 52, 'VERIFIED', false, NOW() - INTERVAL '10 days', NOW()),
(34, 2, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '7 days', NOW()),
(44, 2, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '8 days', NOW()),
(23, 2, 'Does anyone have more resources on this? I would love to read more.', NULL, 'VERIFIED', false, NOW() - INTERVAL '9 days', NOW()),
(24, 12, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '4 days', NOW()),
(13, 11, 'I totally agree with the points made in this thread. Good job everyone!', 52, 'VERIFIED', false, NOW() - INTERVAL '1 days', NOW()),
(17, 4, 'I totally agree with the points made in this thread. Good job everyone!', 126, 'VERIFIED', false, NOW() - INTERVAL '5 days', NOW()),
(10, 11, 'This is an interesting perspective on topic 10. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '6 days', NOW()),
(18, 1, 'Does anyone have more resources on this? I would love to read more.', 79, 'VERIFIED', false, NOW() - INTERVAL '10 days', NOW()),
(43, 11, 'Does anyone have more resources on this? I would love to read more.', NULL, 'VERIFIED', false, NOW() - INTERVAL '6 days', NOW()),
(17, 1, 'Does anyone have more resources on this? I would love to read more.', 126, 'VERIFIED', false, NOW() - INTERVAL '2 days', NOW()),
(10, 11, 'This is an interesting perspective on topic 10. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '6 days', NOW()),
(33, 6, 'This is an interesting perspective on topic 33. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '6 days', NOW()),
(24, 1, 'Does anyone have more resources on this? I would love to read more.', NULL, 'VERIFIED', false, NOW() - INTERVAL '5 days', NOW()),
(10, 2, 'This is an interesting perspective on topic 10. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '2 days', NOW()),
(14, 4, 'I totally agree with the points made in this thread. Good job everyone!', NULL, 'VERIFIED', false, NOW() - INTERVAL '7 days', NOW()),
(28, 6, 'This is an interesting perspective on topic 28. I think we should consider...', NULL, 'VERIFIED', false, NOW() - INTERVAL '3 days', NOW()),
(39, 12, 'I totally agree with the points made in this thread. Good job everyone!', 129, 'VERIFIED', false, NOW() - INTERVAL '6 days', NOW()),
(18, 2, 'I totally agree with the points made in this thread. Good job everyone!', 154, 'VERIFIED', false, NOW() - INTERVAL '2 days', NOW()),
(10, 2, 'Does anyone have more resources on this? I would love to read more.', 90, 'VERIFIED', false, NOW() - INTERVAL '5 days', NOW());

WITH new_users AS (
  INSERT INTO users (email, password_hash, status, role, created_at, updated_at) VALUES
  ('test.l1@hcmus.edu.vn', '$2b$12$ig35cC5G.hFgdmWUzbnv5OiJRpBGrzZmTXhl5L/8Akvmr4.r3Ciwm', 'ACTIVE', 'USER', NOW(), NOW()),
  ('test.alumni@hcmus.edu.vn', '$2b$12$ig35cC5G.hFgdmWUzbnv5OiJRpBGrzZmTXhl5L/8Akvmr4.r3Ciwm', 'ACTIVE', 'USER', NOW(), NOW()),
  ('test.mentor@hcmus.edu.vn', '$2b$12$ig35cC5G.hFgdmWUzbnv5OiJRpBGrzZmTXhl5L/8Akvmr4.r3Ciwm', 'ACTIVE', 'USER', NOW(), NOW()),
  ('test.admin@hcmus.edu.vn', '$2a$10$XV9KfhWlRF4ypiISf3u1.u1PeEKWw1x.BpzqLaVPM4WA7D9KbcZ7m', 'ACTIVE', 'ADMIN', NOW(), NOW()),
  ('test.superadmin@hcmus.edu.vn', '$2a$10$XV9KfhWlRF4ypiISf3u1.u1PeEKWw1x.BpzqLaVPM4WA7D9KbcZ7m', 'ACTIVE', 'ADMIN', NOW(), NOW())
  RETURNING id, email
),
profiles AS (
  INSERT INTO global_profiles (user_id, full_name, phone, bio, dob, gender, settings)
  SELECT id,
    CASE email
      WHEN 'test.l1@hcmus.edu.vn' THEN 'Test Level 1'
      WHEN 'test.alumni@hcmus.edu.vn' THEN 'Test Alumni L2'
      WHEN 'test.mentor@hcmus.edu.vn' THEN 'Test Mentor'
      WHEN 'test.admin@hcmus.edu.vn' THEN 'Test Org Admin'
      WHEN 'test.superadmin@hcmus.edu.vn' THEN 'Test Super Admin'
    END,
    CASE email
      WHEN 'test.l1@hcmus.edu.vn' THEN '0901000001'
      WHEN 'test.alumni@hcmus.edu.vn' THEN '0901000002'
      WHEN 'test.mentor@hcmus.edu.vn' THEN '0901000003'
      WHEN 'test.admin@hcmus.edu.vn' THEN '0901000004'
      WHEN 'test.superadmin@hcmus.edu.vn' THEN '0901000005'
    END,
    CASE email
      WHEN 'test.l1@hcmus.edu.vn' THEN 'Đã xác minh OTP email, chưa đạt Alumni (level 2)'
      WHEN 'test.alumni@hcmus.edu.vn' THEN 'Alumni đã xác minh cấp 2, chưa đăng ký mentor'
      WHEN 'test.mentor@hcmus.edu.vn' THEN 'Alumni mentor đã được duyệt'
      WHEN 'test.admin@hcmus.edu.vn' THEN 'Quản trị viên tổ chức CS-HCMUS'
      WHEN 'test.superadmin@hcmus.edu.vn' THEN 'Quản trị viên cấp cao (trusted verifier)'
    END,
    CASE email
      WHEN 'test.l1@hcmus.edu.vn' THEN DATE '2002-01-10'
      WHEN 'test.alumni@hcmus.edu.vn' THEN DATE '1998-06-15'
      WHEN 'test.mentor@hcmus.edu.vn' THEN DATE '1996-03-20'
      WHEN 'test.admin@hcmus.edu.vn' THEN DATE '1990-08-01'
      WHEN 'test.superadmin@hcmus.edu.vn' THEN DATE '1988-12-12'
    END,
    CASE email
      WHEN 'test.l1@hcmus.edu.vn' THEN 'Female'
      WHEN 'test.alumni@hcmus.edu.vn' THEN 'Male'
      WHEN 'test.mentor@hcmus.edu.vn' THEN 'Male'
      WHEN 'test.admin@hcmus.edu.vn' THEN 'Female'
      WHEN 'test.superadmin@hcmus.edu.vn' THEN 'Male'
    END,
    '{"language":"vi","theme":"light"}'::json
  FROM new_users
  RETURNING user_id
),
members AS (
  INSERT INTO organization_members (
    organization_id, user_id, graduated_year, graduation_status, program, major,
    verification_level, is_trusted_verifier, status, created_at, updated_at
  )
  SELECT 1, id,
    CASE email
      WHEN 'test.l1@hcmus.edu.vn' THEN '[]'::jsonb
      WHEN 'test.alumni@hcmus.edu.vn' THEN '[2024]'::jsonb
      WHEN 'test.mentor@hcmus.edu.vn' THEN '[2020]'::jsonb
      WHEN 'test.admin@hcmus.edu.vn' THEN '[2015]'::jsonb
      WHEN 'test.superadmin@hcmus.edu.vn' THEN '[2010]'::jsonb
    END,
    CASE email
      WHEN 'test.l1@hcmus.edu.vn' THEN '["STUDYING"]'::jsonb
      ELSE '["GRADUATED"]'::jsonb
    END,
    CASE email
      WHEN 'test.l1@hcmus.edu.vn' THEN '["Regular"]'::jsonb
      WHEN 'test.mentor@hcmus.edu.vn' THEN '["Advanced Program"]'::jsonb
      ELSE '["Regular"]'::jsonb
    END,
    '["Computer Science"]'::jsonb,
    CASE email
      WHEN 'test.l1@hcmus.edu.vn' THEN 1
      WHEN 'test.alumni@hcmus.edu.vn' THEN 2
      WHEN 'test.mentor@hcmus.edu.vn' THEN 2
      WHEN 'test.admin@hcmus.edu.vn' THEN 2
      WHEN 'test.superadmin@hcmus.edu.vn' THEN 3
    END,
    email = 'test.superadmin@hcmus.edu.vn',
    'ACTIVE',
    NOW(),
    NOW()
  FROM new_users
  RETURNING user_id
),
mentor AS (
  INSERT INTO mentor_profiles (
    member_id, current_job_title, current_company, bio, rating_avg, total_sessions,
    status, created_at, updated_at
  )
  SELECT id,
    'Senior Software Engineer',
    'Alumnverse Tech',
    'Mentor test — hướng dẫn career path và system design.',
    4.9,
    10,
    'APPROVED',
    NOW() - INTERVAL '30 days',
    NOW()
  FROM new_users
  WHERE email = 'test.mentor@hcmus.edu.vn'
  RETURNING member_id
)
INSERT INTO mentor_expertise (mentor_member_id, topic, years_experience, description, category, tag)
SELECT member_id, v.topic, v.years_experience, v.description, v.category, v.tag
FROM mentor
CROSS JOIN (VALUES
  ('Career Development', 5, 'Định hướng nghề nghiệp cho sinh viên và cựu sinh viên CS.', 'Soft Skills', 'Career'),
  ('System Design', 4, 'Thiết kế hệ thống phân tán và backend scale.', 'Technical', 'Architecture')
) AS v(topic, years_experience, description, category, tag);

INSERT INTO mentor_availabilities (mentor_member_id, start_time, end_time, status)
SELECT u.id, slot.start_time, slot.end_time, 'AVAILABLE'
FROM users u
CROSS JOIN (VALUES
  (NOW() + INTERVAL '3 days 10 hours', NOW() + INTERVAL '3 days 11 hours'),
  (NOW() + INTERVAL '5 days 14 hours', NOW() + INTERVAL '5 days 15 hours')
) AS slot(start_time, end_time)
WHERE u.email = 'test.mentor@hcmus.edu.vn';

-- Mentee-only test account (level 1 + active mentee profile, no mentor profile)
INSERT INTO users (email, password_hash, status, role, created_at, updated_at)
SELECT 'test.mentee@hcmus.edu.vn', '$2b$12$ig35cC5G.hFgdmWUzbnv5OiJRpBGrzZmTXhl5L/8Akvmr4.r3Ciwm', 'ACTIVE', 'USER', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'test.mentee@hcmus.edu.vn');

INSERT INTO global_profiles (user_id, full_name, phone, bio, dob, gender, settings)
SELECT u.id, 'Test Mentee', '0901000006', 'Sinh viên có hồ sơ Mentee — test đặt lịch cố vấn', DATE '2003-05-15', 'Female', '{"language":"vi","theme":"light"}'::json
FROM users u WHERE u.email = 'test.mentee@hcmus.edu.vn'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO organization_members (
  organization_id, user_id, graduated_year, graduation_status, program, major,
  verification_level, is_trusted_verifier, status, created_at, updated_at
)
SELECT 1, u.id, '[]'::jsonb, '["STUDYING"]'::jsonb, '["Regular"]'::jsonb, '["Computer Science"]'::jsonb,
  2, false, 'ACTIVE', NOW(), NOW()
FROM users u WHERE u.email = 'test.mentee@hcmus.edu.vn'
ON CONFLICT (user_id) DO UPDATE SET verification_level = 2, updated_at = NOW();

INSERT INTO mentee_profiles (member_id, mentoring_goal, major, academic_year, interests, is_active, created_at, updated_at)
SELECT u.id,
  'Tìm mentor hỗ trợ định hướng nghề nghiệp và kỹ năng phỏng vấn.',
  'Computer Science', 'Year 3', 'Career, Backend, Internship', true, NOW() - INTERVAL '7 days', NOW()
FROM users u WHERE u.email = 'test.mentee@hcmus.edu.vn'
ON CONFLICT (member_id) DO UPDATE SET is_active = true, updated_at = NOW();
