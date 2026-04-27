-- Sample Data for Student Alumni System

-- ============= USERS DATA =============
-- password to login is Student@2024 for the last 3
INSERT INTO "users" ("email", "password_hash", "user_name", "status", "role", "avatar_url", "created_at", "updated_at") VALUES
('admin@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'admin', 'ACTIVE', 'ADMIN', 'https://api.example.com/avatars/admin.jpg', NOW(), NOW()),
('john.doe@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'johndoe', 'ACTIVE', 'ALUMNI', 'https://api.example.com/avatars/john.jpg', NOW() - INTERVAL '90 days', NOW()),
('jane.smith@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'janesmith', 'ACTIVE', 'ALUMNI', 'https://api.example.com/avatars/jane.jpg', NOW() - INTERVAL '60 days', NOW()),
('nguyen.van.a@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'nguyenvana', 'ACTIVE', 'STUDENT', 'https://api.example.com/avatars/nguyena.jpg', NOW() - INTERVAL '45 days', NOW()),
('tran.thi.b@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'tranthib', 'ACTIVE', 'ALUMNI', 'https://api.example.com/avatars/tranb.jpg', NOW() - INTERVAL '30 days', NOW()),
('pham.van.c@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'phamvanc', 'ACTIVE', 'ALUMNI', 'https://api.example.com/avatars/phamc.jpg', NOW() - INTERVAL '20 days', NOW()),
('hoang.thi.d@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'hoangthid', 'ACTIVE', 'ALUMNI', 'https://api.example.com/avatars/hoangd.jpg', NOW() - INTERVAL '10 days', NOW()),
('le.van.e@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'levane', 'ACTIVE', 'ALUMNI', 'https://api.example.com/avatars/lee.jpg', NOW() - INTERVAL '5 days', NOW()),
('duong.thi.f@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'duongthif', 'ACTIVE', 'STUDENT', 'https://api.example.com/avatars/duongf.jpg', NOW() - INTERVAL '2 days', NOW()),
('vo.van.g@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', 'vovang', 'ACTIVE', 'ALUMNI', 'https://api.example.com/avatars/vog.jpg', NOW(), NOW()),
('test@hcmus.edu.vn', '$2b$12$ig35cC5G.hFgdmWUzbnv5OiJRpBGrzZmTXhl5L/8Akvmr4.r3Ciwm', 'testuser', 'ACTIVE', 'ADMIN', 'https://api.example.com/avatars/test.jpg', NOW(), NOW()),
('bui.van.h@hcmus.edu.vn', '$2b$12$ig35cC5G.hFgdmWUzbnv5OiJRpBGrzZmTXhl5L/8Akvmr4.r3Ciwm', 'buivanh', 'ACTIVE', 'STUDENT', 'https://api.example.com/avatars/buih.jpg', NOW(), NOW()),
('ly.thi.i@hcmus.edu.vn', '$2b$12$ig35cC5G.hFgdmWUzbnv5OiJRpBGrzZmTXhl5L/8Akvmr4.r3Ciwm', 'lythii', 'ACTIVE', 'STUDENT', 'https://api.example.com/avatars/lyi.jpg', NOW(), NOW());

-- ============= GLOBAL PROFILES DATA =============
INSERT INTO "global_profiles" ("user_id", "full_name", "phone", "bio", "dob", "gender", "settings") VALUES
(1, 'Admin User', '0901234567', 'System Administrator', '1990-01-15', 'Male', '{"language":"vi","theme":"dark"}'),
(2, 'John Doe', '0912345678', 'Software Engineer & Alumni', '1995-05-20', 'Male', '{"language":"en","theme":"light"}'),
(3, 'Jane Smith', '0923456789', 'Product Manager', '1996-08-10', 'Female', '{"language":"en","theme":"light"}'),
(4, 'Nguyễn Văn A', '0934567890', 'Student - Computer Science', '2002-03-15', 'Male', '{"language":"vi","theme":"dark"}'),
(5, 'Trần Thị B', '0945678901', 'Recent Graduate - IT', '2001-07-22', 'Female', '{"language":"vi","theme":"light"}'),
(6, 'Phạm Văn C', '0956789012', 'Senior Developer at Tech Corp', '1998-11-08', 'Male', '{"language":"vi","theme":"dark"}'),
(7, 'Hoàng Thị D', '0967890123', 'Business Analyst', '1999-02-14', 'Female', '{"language":"vi","theme":"light"}'),
(8, 'Lê Văn E', '0978901234', 'Startup Founder', '1997-09-30', 'Male', '{"language":"vi","theme":"dark"}'),
(9, 'Dương Thị F', '0989012345', 'Data Scientist', '2000-04-17', 'Female', '{"language":"vi","theme":"light"}'),
(10, 'Võ Văn G', '0990123456', 'UX/UI Designer', '1999-12-05', 'Male', '{"language":"vi","theme":"dark"}'),
(11, 'Test User', '0900000000', 'Test Account', '2000-01-01', 'Male', '{"language":"vi","theme":"light"}'),
(12, 'Bùi Văn H', '0901111111', 'Student - Computer Science', '2001-06-20', 'Male', '{"language":"vi","theme":"light"}'),
(13, 'Lý Thị I', '0902222222', 'Student - Information Technology', '2002-09-12', 'Female', '{"language":"vi","theme":"dark"}');

-- ============= GLOBAL IDENTITY VERIFICATIONS DATA =============
INSERT INTO "global_identity_verifications" ("user_id", "citizen_id", "extracted_data", "verified_at", "provider") VALUES
(2, '123456789012', '{"name":"John Doe","dob":"1995-05-20","address":"123 Main St"}', NOW() - INTERVAL '80 days', 'eKYC'),
(3, '223456789013', '{"name":"Jane Smith","dob":"1996-08-10","address":"456 Oak Ave"}', NOW() - INTERVAL '50 days', 'eKYC'),
(4, '323456789014', '{"name":"Nguyễn Văn A","dob":"2002-03-15","address":"789 Pine Rd"}', NOW() - INTERVAL '40 days', 'eKYC'),
(5, '423456789015', '{"name":"Trần Thị B","dob":"2001-07-22","address":"321 Elm St"}', NOW() - INTERVAL '25 days', 'eKYC');

-- ============= ORGANIZATIONS DATA =============
INSERT INTO "organizations" ("name", "slug", "logo_url", "brand_config", "features_config", "programs", "majors", "created_at") VALUES
('HCMUS - Computer Science', 'cs-hcmus', 'https://api.example.com/logos/cs.png', '{"primary":"#1976d2","secondary":"#dc004e"}', '{"mentorship":true,"job":true,"fund":true,"events":true,"forum":true}', '["Regular","Advanced Program"]', '["Computer Science","Data Science","Artificial Intelligence"]', NOW() - INTERVAL '365 days'),
('HCMUS - Information Technology', 'it-hcmus', 'https://api.example.com/logos/it.png', '{"primary":"#388e3c","secondary":"#ff9800"}', '{"mentorship":true,"job":true,"fund":true,"events":true,"forum":true}', '["Regular","High Quality"]', '["Information Technology","Software Engineering","Information Systems"]', NOW() - INTERVAL '360 days'),
('HCMUS - Business Administration', 'ba-hcmus', 'https://api.example.com/logos/ba.png', '{"primary":"#f57c00","secondary":"#512da8"}', '{"mentorship":true,"job":true,"fund":false,"events":true,"forum":true}', '["Regular"]', '["Business Administration","Marketing","Finance"]', NOW() - INTERVAL '350 days'),
('HCMUS - Engineering', 'eng-hcmus', 'https://api.example.com/logos/eng.png', '{"primary":"#c62828","secondary":"#0097a7"}', '{"mentorship":true,"job":true,"fund":true,"events":true,"forum":true}', '["Regular","International"]', '["Mechanical Engineering","Electrical Engineering","Mechatronics"]', NOW() - INTERVAL '340 days');

-- ============= ORGANIZATION MEMBERS DATA =============
INSERT INTO "organization_members" ("organization_id", "user_id", "graduated_year", "graduation_status", "program", "major", "verification_level", "is_trusted_verifier", "status", "created_at", "updated_at") VALUES
-- CS Department Members
(1, 1, 2012, 'Graduated', 'Regular', 'Computer Science', 3, true, 'active', NOW() - INTERVAL '365 days', NOW()),
(1, 2, 2023, 'Graduated', 'Advanced Program', 'Computer Science', 2, true, 'active', NOW() - INTERVAL '90 days', NOW()),
(1, 4, NULL, 'Studying', 'Regular', 'Computer Science', 1, false, 'active', NOW() - INTERVAL '45 days', NOW()),
(1, 6, 2022, 'Graduated', 'Regular', 'Computer Science', 2, true, 'active', NOW() - INTERVAL '200 days', NOW()),
(1, 11, 2022, 'Graduated', 'Regular', 'Computer Science', 2, true, 'active', NOW() - INTERVAL '200 days', NOW()),

-- IT Department Members
(2, 3, 2023, 'Graduated', 'Advanced Program', 'Information Technology', 2, true, 'active', NOW() - INTERVAL '60 days', NOW()),
(2, 5, 2024, 'Graduated', 'Regular', 'Information Technology', 1, false, 'active', NOW() - INTERVAL '30 days', NOW()),
(2, 8, 2023, 'Graduated', 'Regular', 'Information Technology', 2, true, 'active', NOW() - INTERVAL '180 days', NOW()),
(2, 9, NULL, 'Studying', 'Regular', 'Information Technology', 1, false, 'active', NOW() - INTERVAL '15 days', NOW()),

-- BA Department Members
(3, 7, 2023, 'Graduated', 'Regular', 'Business Administration', 2, true, 'active', NOW() - INTERVAL '100 days', NOW()),
(3, 10, NULL, 'Studying', 'Regular', 'Business Administration', 1, false, 'pending', NOW() - INTERVAL '3 days', NOW());



-- ============= ACADEMIC RECORDS DATA =============
INSERT INTO "academic_records" ("member_id", "student_code", "degree_type", "class_name", "start_year", "graduated_year", "status") VALUES
(2, '19127001', 'Bachelor', 'K60', 2019, 2023, 'Graduated'),
(3, '19127002', 'Bachelor', 'K60', 2019, 2023, 'Graduated'),
(4, '21127045', 'Bachelor', 'K63', 2021, NULL, 'Studying'),
(5, '20127078', 'Bachelor', 'K62', 2020, 2024, 'Graduated'),
(6, '18127010', 'Bachelor', 'K59', 2018, 2022, 'Graduated'),
(7, '19227015', 'Bachelor', 'K60', 2019, 2023, 'Graduated'),
(8, '19127088', 'Bachelor', 'K60', 2019, 2023, 'Graduated'),
(9, '22127156', 'Bachelor', 'K64', 2022, NULL, 'Studying');

-- ============= EVENTS DATA =============
INSERT INTO "events" ("organization_id", "creator_member_id", "title", "description", "banner_url", "location", "start_time", "end_time", "registration_start_at", "registration_end_at", "max_capacity", "interested_count", "is_published", "created_at") VALUES
(1, 2, 'CS Alumni Meetup 2026', 'Annual gathering for CS alumni and current students', 'https://api.example.com/banners/cs_meetup.jpg', 'Ho Chi Minh City Convention Center', NOW() + INTERVAL '30 days', NOW() + INTERVAL '30 days 4 hours', NOW(), NOW() + INTERVAL '25 days', 200, 45, true, NOW() - INTERVAL '10 days'),
(1, 2, 'Web Development Workshop', 'Learn modern web development with React and Node.js', 'https://api.example.com/banners/web_workshop.jpg', 'HCMUS Campus - Room 101', NOW() + INTERVAL '15 days', NOW() + INTERVAL '15 days 3 hours', NOW(), NOW() + INTERVAL '12 days', 50, 28, true, NOW() - INTERVAL '5 days'),
(1, 6, 'Database Design Seminar', 'Advanced database design patterns and optimization', 'https://api.example.com/banners/db_seminar.jpg', 'Online via Zoom', NOW() + INTERVAL '20 days', NOW() + INTERVAL '20 days 2 hours', NOW(), NOW() + INTERVAL '18 days', 100, 15, true, NOW() - INTERVAL '3 days'),
(2, 3, 'IT Internship Fair', 'Connect with top tech companies', 'https://api.example.com/banners/internship_fair.jpg', 'HCMUS Campus - Auditorium', NOW() + INTERVAL '45 days', NOW() + INTERVAL '45 days 5 hours', NOW(), NOW() + INTERVAL '40 days', 150, 67, true, NOW() - INTERVAL '8 days'),
(2, 8, 'AI & Machine Learning Summit', 'Explore the future of AI technology', 'https://api.example.com/banners/ai_summit.jpg', 'Saigon Pearl Building, District 1', NOW() + INTERVAL '60 days', NOW() + INTERVAL '60 days 6 hours', NOW(), NOW() + INTERVAL '50 days', 300, 89, true, NOW() - INTERVAL '15 days'),
(3, 7, 'Business Leadership Workshop', 'Develop your leadership skills', 'https://api.example.com/banners/leadership.jpg', 'HCMUS Campus - Hall A', NOW() + INTERVAL '25 days', NOW() + INTERVAL '25 days 3 hours', NOW(), NOW() + INTERVAL '20 days', 80, 32, true, NOW() - INTERVAL '6 days'),
(4, 1, 'Engineering Excellence Conference', 'Latest innovations in engineering', 'https://api.example.com/banners/eng_conf.jpg', 'Ho Chi Minh City', NOW() + INTERVAL '50 days', NOW() + INTERVAL '50 days 8 hours', NOW(), NOW() + INTERVAL '45 days', 250, 56, true, NOW() - INTERVAL '12 days');

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
(1, 2, NULL, NULL, NULL, 'EVT001-2026-001', 'Checked_in', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day'),
(1, 4, NULL, NULL, NULL, 'EVT001-2026-002', 'Registered', NOW() - INTERVAL '4 days', NULL),
(1, NULL, 'Mr. Hoang Tran', 'hoang.tran@example.com', '0912345678', 'EVT001-2026-003', 'Registered', NOW() - INTERVAL '3 days', NULL),
(2, 4, NULL, NULL, NULL, 'EVT002-2026-001', 'Registered', NOW() - INTERVAL '2 days', NULL),
(2, 9, NULL, NULL, NULL, 'EVT002-2026-002', 'Registered', NOW() - INTERVAL '1 day', NULL),
(3, 6, NULL, NULL, NULL, 'EVT003-2026-001', 'Registered', NOW(), NULL),
(4, 3, NULL, NULL, NULL, 'EVT004-2026-001', 'Registered', NOW() - INTERVAL '6 days', NULL),
(4, 5, NULL, NULL, NULL, 'EVT004-2026-002', 'Registered', NOW() - INTERVAL '5 days', NULL),
(4, 8, NULL, NULL, NULL, 'EVT004-2026-003', 'Checked_in', NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days'),
(5, 8, NULL, NULL, NULL, 'EVT005-2026-001', 'Registered', NOW() - INTERVAL '13 days', NULL),
(6, 7, NULL, NULL, NULL, 'EVT006-2026-001', 'Registered', NOW() - INTERVAL '4 days', NULL);

-- ============= MENTOR PROFILES DATA =============
INSERT INTO "mentor_profiles" ("member_id", "current_job_title", "current_company", "bio", "rating_avg", "total_sessions", "is_approved", "created_at") VALUES
(2, 'Senior Software Engineer', 'Tech Solutions Inc', 'Experienced in full-stack development', 4.8, 25, true, NOW() - INTERVAL '85 days'),
(3, 'Product Manager', 'Innovation Hub', 'Passionate about product strategy', 4.6, 18, true, NOW() - INTERVAL '55 days'),
(6, 'Tech Lead', 'Digital Transformation Co', 'Expert in system design', 4.9, 32, true, NOW() - INTERVAL '195 days'),
(7, 'Business Consultant', 'Global Consulting Group', 'Strategy and operations specialist', 4.7, 22, true, NOW() - INTERVAL '95 days'),
(8, 'Startup Founder & CTO', 'TechStart Ventures', 'Entrepreneurship and innovation mentor', 4.5, 15, true, NOW() - INTERVAL '175 days');

-- ============= MENTOR EXPERTISE DATA =============
INSERT INTO "mentor_expertise" ("mentor_member_id", "topic", "years_experience", "description") VALUES
(2, 'Full Stack Development', 6, 'React, Node.js, PostgreSQL, MongoDB'),
(2, 'System Design', 5, 'Microservices, scalability, architecture'),
(3, 'Product Management', 7, 'Product strategy, roadmapping, analytics'),
(3, 'User Research', 4, 'UX research, customer interviews'),
(6, 'Database Design', 8, 'SQL, NoSQL, query optimization'),
(6, 'Cloud Architecture', 5, 'AWS, Docker, Kubernetes'),
(7, 'Business Strategy', 10, 'Market analysis, financial planning'),
(7, 'Leadership', 8, 'Team management, organizational development'),
(8, 'Startup Development', 6, 'Lean methodology, MVP, fundraising'),
(8, 'Technical Entrepreneurship', 5, 'Product-market fit, scaling');

-- ============= MENTOR AVAILABILITIES DATA =============
INSERT INTO "mentor_availabilities" ("mentor_member_id", "start_time", "end_time", "status") VALUES
(2, NOW() + INTERVAL '5 days 10:00', NOW() + INTERVAL '5 days 11:00', 'Available'),
(2, NOW() + INTERVAL '7 days 14:00', NOW() + INTERVAL '7 days 15:00', 'Available'),
(2, NOW() + INTERVAL '10 days 16:00', NOW() + INTERVAL '10 days 17:00', 'Booked'),
(3, NOW() + INTERVAL '4 days 09:00', NOW() + INTERVAL '4 days 10:00', 'Available'),
(3, NOW() + INTERVAL '6 days 13:00', NOW() + INTERVAL '6 days 14:00', 'Available'),
(6, NOW() + INTERVAL '3 days 11:00', NOW() + INTERVAL '3 days 12:00', 'Booked'),
(6, NOW() + INTERVAL '8 days 15:00', NOW() + INTERVAL '8 days 16:00', 'Available'),
(7, NOW() + INTERVAL '5 days 13:00', NOW() + INTERVAL '5 days 14:00', 'Available'),
(8, NOW() + INTERVAL '6 days 10:00', NOW() + INTERVAL '6 days 11:00', 'Available');

-- ============= MENTORSHIP SESSIONS DATA =============
INSERT INTO "mentorship_sessions" ("availability_id", "mentee_member_id", "status", "booking_note", "meeting_link", "created_at") VALUES
(3, 4, 'Completed', 'Discussed web development best practices', 'https://zoom.us/j/123456789', NOW() - INTERVAL '5 days'),
(3, 9, 'Scheduled', 'First mentoring session', 'https://zoom.us/j/987654321', NOW() - INTERVAL '2 days'),
(6, 5, 'Completed', 'Career guidance and job search strategy', 'https://meet.google.com/abc-defg-hij', NOW() - INTERVAL '10 days');

-- ============= SESSION FEEDBACKS DATA =============
INSERT INTO "session_feedbacks" ("session_id", "mentee_member_id", "rating", "comment", "is_public", "created_at") VALUES
(1, 4, 5, 'John provided excellent guidance on React patterns. Highly recommend!', true, NOW() - INTERVAL '4 days'),
(3, 5, 5, 'Phạm gave me very useful advice for my job search. Very professional!', true, NOW() - INTERVAL '9 days');

-- ============= NEWS DATA =============
INSERT INTO "news" ("organization_id", "author_member_id", "title", "slug", "content", "thumbnail_url", "is_hidden", "published_at") VALUES
(1, 2, 'CS Department Launches New AI Lab', 'cs-new-ai-lab', 'We are excited to announce the opening of our state-of-the-art AI research laboratory...', 'https://api.example.com/news/ai_lab.jpg', false, NOW() - INTERVAL '20 days'),
(1, 6, '2026 Scholarship Program Now Open', 'scholarship-program-2026', 'Applications for the 2026 scholarship program are now being accepted. Apply now...', 'https://api.example.com/news/scholarship.jpg', false, NOW() - INTERVAL '15 days'),
(2, 3, 'IT Department Achievement: 100 Job Placements', 'it-100-placements', 'Congratulations to our graduates who secured employment...', 'https://api.example.com/news/placements.jpg', false, NOW() - INTERVAL '10 days'),
(2, 8, 'Innovation Week 2026 Schedule Released', 'innovation-week-2026', 'Mark your calendars for our annual Innovation Week...', 'https://api.example.com/news/innovation_week.jpg', false, NOW() - INTERVAL '7 days'),
(3, 7, 'Alumni Business Forum: Success Stories', 'alumni-business-forum', 'Join us as successful alumni share their entrepreneurial journeys...', 'https://api.example.com/news/forum.jpg', false, NOW() - INTERVAL '5 days'),
(4, 1, 'Engineering Capstone Projects Exhibition', 'capstone-exhibition', 'View the innovative projects created by our engineering students...', 'https://api.example.com/news/capstone.jpg', false, NOW() - INTERVAL '3 days');

-- ============= SAVED ITEMS DATA =============
INSERT INTO "saved_items" ("member_id", "item_type", "item_id", "note", "saved_at") VALUES
(4, 'news', 1, 'Interesting AI research opportunity', NOW() - INTERVAL '18 days'),
(4, 'event', 2, 'Want to attend this workshop', NOW() - INTERVAL '3 days'),
(5, 'job', 1, 'Perfect job match for my skills', NOW() - INTERVAL '8 days'),
(9, 'news', 2, 'Scholarship opportunity for my next year', NOW() - INTERVAL '12 days'),
(9, 'learning', 1, 'React course for self-improvement', NOW() - INTERVAL '7 days'),
(10, 'event', 6, 'Interested in business leadership', NOW() - INTERVAL '1 day');

-- ============= ACHIEVEMENTS DATA =============
INSERT INTO "achievements" ("member_id", "title", "description", "image_url", "awarded_date", "status") VALUES
(2, 'Outstanding Alumni Award 2024', 'Recognized for significant contributions to tech community', 'https://api.example.com/achievements/outstanding.jpg', '2024-06-15', 'Approved'),
(3, 'Mentor of the Year', 'Awarded for exceptional mentoring and guidance', 'https://api.example.com/achievements/mentor.jpg', '2024-05-10', 'Approved'),
(6, 'Innovation Excellence', 'Developed groundbreaking solutions in system design', 'https://api.example.com/achievements/innovation.jpg', '2024-07-20', 'Approved'),
(4, 'Scholarship Recipient 2025-2026', 'Awarded academic excellence scholarship', 'https://api.example.com/achievements/scholarship.jpg', '2025-08-01', 'Approved'),
(5, 'Academic Excellence', 'Graduated with high honors', 'https://api.example.com/achievements/honors.jpg', '2024-06-01', 'Approved');

-- ============= JOBS DATA =============
INSERT INTO "jobs" ("organization_id", "poster_member_id", "is_referral", "type", "title", "company_name", "location", "salary_range", "description", "how_to_apply", "deadline", "is_active", "created_at") VALUES
(1, 2, false, 'Full-time', 'Junior Software Developer', 'Tech Solutions Inc', 'Ho Chi Minh City', '$800-$1200/month', 'We are looking for talented junior developers to join our team...', 'Send CV to careers@techsolutions.com', '2026-03-31', true, NOW() - INTERVAL '25 days'),
(1, 2, true, 'Full-time', 'Senior Software Engineer', 'Tech Solutions Inc', 'Ho Chi Minh City', '$2000-$3000/month', 'Referral opportunity: Senior engineer position with great benefits...', 'Contact John Doe directly', '2026-04-15', true, NOW() - INTERVAL '20 days'),
(2, 3, false, 'Internship', 'Product Management Intern', 'Innovation Hub', 'Ho Chi Minh City', '$400-$600/month', 'Help us shape the future of our products as a PM intern...', 'Apply via LinkedIn or email', '2026-03-15', true, NOW() - INTERVAL '18 days'),
(2, 8, true, 'Full-time', 'CTO/Co-founder', 'TechStart Ventures', 'Ho Chi Minh City', 'Competitive + Equity', 'Building the next unicorn startup. We seek talented tech co-founder...', 'Contact Lê Văn E', '2026-05-31', true, NOW() - INTERVAL '12 days'),
(3, 7, false, 'Full-time', 'Business Development Manager', 'Global Consulting Group', 'Ho Chi Minh City', '$1500-$2500/month', 'Lead business growth initiatives for our consulting firm...', 'Send application to hr@globalconsulting.com', '2026-03-30', true, NOW() - INTERVAL '10 days'),
(4, 1, false, 'Full-time', 'Systems Engineer', 'Tech Engineering Corp', 'Hanoi', '$1200-$1800/month', 'Join our infrastructure team and build scalable systems...', 'Apply online at careers.techeng.com', '2026-04-10', true, NOW() - INTERVAL '8 days');

-- ============= LEARNING RESOURCES DATA =============
INSERT INTO "learning_resources" ("organization_id", "uploader_member_id", "title", "type", "link_url", "description", "created_at") VALUES
(1, 2, 'Complete React Course 2025', 'Course', 'https://udemy.com/complete-react-2025', 'Comprehensive React learning path from basics to advanced', NOW() - INTERVAL '60 days'),
(1, 6, 'Database Design Best Practices', 'Ebook', 'https://example.com/db-design-ebook.pdf', 'Essential guide to designing scalable databases', NOW() - INTERVAL '50 days'),
(2, 3, 'Product Management Fundamentals', 'Course', 'https://coursera.org/product-management', 'Master the fundamentals of modern product management', NOW() - INTERVAL '45 days'),
(2, 8, 'Startup Founder Handbook', 'Ebook', 'https://example.com/startup-handbook.pdf', 'Complete guide for aspiring entrepreneurs', NOW() - INTERVAL '35 days'),
(3, 7, 'Business Leadership Video Series', 'Video', 'https://youtube.com/playlist?list=PLxxx', 'Learn from successful business leaders', NOW() - INTERVAL '25 days'),
(4, 1, 'Cloud Architecture Masterclass', 'Course', 'https://example.com/cloud-masterclass', 'Deep dive into AWS and cloud design patterns', NOW() - INTERVAL '20 days'),
(1, 2, 'Web Development Best Practices 2026', 'Video', 'https://youtube.com/webdev-2026', 'Latest trends and best practices in web development', NOW() - INTERVAL '10 days'),
(2, 9, 'Data Science with Python', 'Course', 'https://datacamp.com/python-data-science', 'Learn data science fundamentals using Python', NOW() - INTERVAL '5 days');

-- ============= FUNDS DATA =============
-- ============= FUND STATUSES DATA =============
INSERT INTO "fund_statuses" ("name") VALUES
('IMPORTANT'),
('POOR'),
('RURAL_AREAS');

-- ============= FUND RECEIVING INFOS DATA =============
INSERT INTO "fund_receiving_infos" ("account_number", "account_name", "bank_name", "is_active") VALUES
('1234567890', 'HCMUS Student Scholarship Fund', 'MB', true),
('0912345678', 'HCMUS Fund', 'MB', true),
('0917669258', 'HCMUS Lab Equipment Fund', 'MB', true),
('1122334455', 'Alumni Mentorship Fund', 'MB', true),
('5544332211', 'Business Incubation Fund', 'MB', true),
('9988776655', 'Engineering Excellence Fund', 'MB', true);

-- ============= FUNDS DATA =============
INSERT INTO "funds" ("organization_id", "manager_name", "name", "fund_receiving_info_id", "description_short", "description_full", "target_amount", "current_amount", "time_started", "donor_count", "status_id", "time_ended") VALUES
(1, 'John Doe', 'Student Scholarship Fund 2026', 1, 'Supporting talented students with financial needs', 'Supporting talented students with financial needs', 50000.00, 28500.00, '2026-01-15 09:00:00', 3, 2, '2026-08-15 17:00:00'),
(1, 'Phạm Văn C', 'Lab Equipment Fund', 3, 'Upgrading our research laboratory equipment', 'Upgrading our research laboratory equipment', 100000.00, 45000.00, '2025-12-20 10:30:00', 2, 2, '2026-10-20 18:00:00'),
(1, 'Jane Smith', 'Alumni Mentorship Fund', 4, 'Funding mentorship programs and workshops', 'Funding mentorship programs and workshops', 30000.00, 12000.00, '2026-02-10 14:00:00', 2, 2, '2026-09-25 16:30:00'),
(1, 'Hoàng Thị D', 'Business Incubation Fund', 5, 'Supporting student-led startup initiatives', 'Supporting student-led startup initiatives', 80000.00, 35000.00, '2026-03-05 08:45:00', 1, 1, '2026-11-10 20:00:00'),
(1, 'Admin User', 'Engineering Excellence Fund', 6, 'Supporting engineering projects and competitions', 'Supporting engineering projects and competitions', 60000.00, 22500.00, '2026-02-25 11:15:00', 1, 1, '2026-10-05 19:15:00');

-- ============= FUND DONATIONS DATA =============
INSERT INTO "fund_donations" ("fund_id", "donor_member_id", "donor_name", "amount", "address", "phone", "email", "message", "status", "created_at") VALUES
(1, 2, NULL, 5000.00, 'District 1, Ho Chi Minh City', '0911111111', 'john.doe@hcmus.edu.vn', 'Supporting our students', 'SUCCESS', NOW() - INTERVAL '30 days'),
(1, 6, NULL, 3500.00, 'Binh Thanh, Ho Chi Minh City', '0922222222', 'pham.van.c@hcmus.edu.vn', 'Happy to help talented students', 'SUCCESS', NOW() - INTERVAL '25 days'),
(1, NULL, 'Anonymous Donor', 10000.00, 'District 3, Ho Chi Minh City', '0933333333', 'anonymous@example.com', 'Belief in future generation', 'SUCCESS', NOW() - INTERVAL '20 days'),
(2, 3, NULL, 2000.00, 'Thu Duc, Ho Chi Minh City', '0944444444', 'jane.smith@hcmus.edu.vn', 'Upgrading our research capabilities', 'SUCCESS', NOW() - INTERVAL '15 days'),
(2, 8, NULL, 15000.00, 'Go Vap, Ho Chi Minh City', '0955555555', 'le.van.e@hcmus.edu.vn', 'Investing in research excellence', 'SUCCESS', NOW() - INTERVAL '10 days'),
(3, 7, NULL, 8000.00, 'District 7, Ho Chi Minh City', '0966666666', 'hoang.thi.d@hcmus.edu.vn', 'Supporting mentorship initiatives', 'SUCCESS', NOW() - INTERVAL '8 days'),
(3, NULL, 'Company Partnership', 4000.00, 'Tan Binh, Ho Chi Minh City', '0977777777', 'partnership@company.com', 'Corporate social responsibility', 'PENDING', NOW() - INTERVAL '2 days'),
(4, 5, NULL, 6000.00, 'District 5, Ho Chi Minh City', '0988888888', 'tran.thi.b@hcmus.edu.vn', 'Supporting entrepreneurs', 'PENDING', NOW() - INTERVAL '5 days'),
(5, 1, NULL, 5500.00, 'District 10, Ho Chi Minh City', '0999999999', 'admin@hcmus.edu.vn', 'Excellence in engineering', 'SUCCESS', NOW() - INTERVAL '3 days');

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
('GROUP', 'IT Internship Sharing', 3, NOW() - INTERVAL '6 days', NOW() - INTERVAL '8 hours');

-- ============= CHAT GROUP MEMBERS DATA =============
INSERT INTO "chat_group_members" ("group_id", "member_id", "role", "joined_at") VALUES
(1, 2, 'owner', NOW() - INTERVAL '12 days'),
(1, 4, 'member', NOW() - INTERVAL '12 days'),
(2, 6, 'owner', NOW() - INTERVAL '8 days'),
(2, 2, 'admin', NOW() - INTERVAL '8 days'),
(2, 4, 'member', NOW() - INTERVAL '7 days'),
(2, 9, 'member', NOW() - INTERVAL '6 days'),
(3, 3, 'owner', NOW() - INTERVAL '6 days'),
(3, 5, 'member', NOW() - INTERVAL '6 days'),
(3, 8, 'member', NOW() - INTERVAL '5 days');

-- ============= CHAT MESSAGES DATA =============
INSERT INTO "chat_messages" ("group_id", "sender_member_id", "content", "message_type", "metadata", "created_at", "edited_at", "deleted_at") VALUES
(1, 2, 'Chào em, anh là mentor phụ trách buổi định hướng tuần này.', 'TEXT', '{"lang":"vi"}', NOW() - INTERVAL '11 days', NULL, NULL),
(1, 4, 'Dạ em cảm ơn anh. Em muốn hỏi về roadmap backend ạ.', 'TEXT', '{"lang":"vi"}', NOW() - INTERVAL '11 days', NULL, NULL),
(2, 6, 'Mọi người nhớ chuẩn bị CV trước buổi review tối mai.', 'TEXT', '{"priority":"high"}', NOW() - INTERVAL '2 days', NULL, NULL),
(2, 2, 'Mình đã pin tài liệu mock interview ở đầu nhóm nhé.', 'TEXT', '{"pinned":true}', NOW() - INTERVAL '1 day', NOW() - INTERVAL '20 hours', NULL),
(3, 8, 'Có ai muốn referral vị trí intern frontend không?', 'TEXT', '{"tags":["internship","frontend"]}', NOW() - INTERVAL '10 hours', NULL, NULL);

-- ============= FORUM CATEGORIES DATA =============
INSERT INTO "forum_categories" ("parent_id", "organization_id", "name", "description", "created_at", "updated_at") VALUES
(NULL, 1, 'General Discussion', 'General topics and announcements', NOW() - INTERVAL '365 days', NOW()),
(NULL, 1, 'Technical Help', 'Questions and help with programming', NOW() - INTERVAL '365 days', NOW()),
(NULL, 1, 'Job & Career', 'Job opportunities and career advice', NOW() - INTERVAL '365 days', NOW()),
(NULL, 2, 'General Discussion', 'General topics and announcements', NOW() - INTERVAL '360 days', NOW()),
(NULL, 2, 'Technical Help', 'Questions and help with programming', NOW() - INTERVAL '360 days', NOW()),
(NULL, 2, 'Alumni Stories', 'Share your success stories', NOW() - INTERVAL '360 days', NOW()),
(NULL, 3, 'Business Topics', 'Business and management discussions', NOW() - INTERVAL '350 days', NOW()),
(NULL, 4, 'Engineering Projects', 'Share and discuss engineering projects', NOW() - INTERVAL '340 days', NOW());

-- ============= FORUM TOPICS DATA =============
INSERT INTO "forum_topics" ("organization_id", "title", "created_by_member_id", "category_id", "view_count", "created_at", "updated_at") VALUES
(1, 'Welcome to CS Alumni Network', 2, 1, 156, NOW() - INTERVAL '355 days', NOW() - INTERVAL '10 days'),
(1, 'React Hooks vs Class Components - Best Practices', 4, 2, 89, NOW() - INTERVAL '45 days', NOW() - INTERVAL '5 days'),
(1, 'Job Search Strategy for New Graduates', 6, 3, 234, NOW() - INTERVAL '30 days', NOW() - INTERVAL '2 days'),
(1, 'Database Optimization Techniques', 6, 2, 156, NOW() - INTERVAL '25 days', NOW() - INTERVAL '8 days'),
(2, 'Getting Started with Node.js', 5, 5, 78, NOW() - INTERVAL '20 days', NOW() - INTERVAL '3 days'),
(2, 'From Startup to IPO - My Journey', 3, 6, 412, NOW() - INTERVAL '15 days', NOW() - INTERVAL '1 day'),
(2, 'Microservices Architecture Discussion', 8, 5, 145, NOW() - INTERVAL '12 days', NOW() - INTERVAL '4 days'),
(3, 'Leadership Lessons from Successful Entrepreneurs', 7, 7, 93, NOW() - INTERVAL '10 days', NOW() - INTERVAL '6 days'),
(4, 'Sustainable Engineering for the Future', 6, 8, 67, NOW() - INTERVAL '8 days', NOW() - INTERVAL '3 days');

-- ============= FORUM POSTS DATA =============
INSERT INTO "forum_posts" ("topic_id", "author_member_id", "content", "answer_to_post_id", "created_at", "updated_at") VALUES
(1, 2, 'Hi everyone! Excited to be part of this community. I graduated in 2023 and am now working at Tech Solutions Inc. Looking forward to mentoring newcomers!', NULL, NOW() - INTERVAL '355 days', NOW() - INTERVAL '355 days'),
(1, 6, 'Welcome John! Great to have experienced alumni like you in the community. Hope to collaborate on mentorship initiatives.', 1, NOW() - INTERVAL '354 days', NOW() - INTERVAL '354 days'),
(2, 4, 'What are your thoughts on React Hooks? I find them more intuitive than class components for state management.', NULL, NOW() - INTERVAL '44 days', NOW() - INTERVAL '44 days'),
(2, 6, 'Great question! I prefer hooks too. They make code more reusable and easier to test. Here are some best practices...', 3, NOW() - INTERVAL '43 days', NOW() - INTERVAL '43 days'),
(3, 6, 'The key to successful job search is networking. Connect with alumni, attend events, and prepare well for interviews.', NULL, NOW() - INTERVAL '29 days', NOW() - INTERVAL '29 days'),
(3, 9, 'This is very helpful! I just started my search. Thanks for the tips!', 5, NOW() - INTERVAL '27 days', NOW() - INTERVAL '27 days'),
(4, 6, 'Database indexing is crucial. Always analyze your query plans before and after optimization.', NULL, NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days'),
(4, 2, 'Totally agree. Also consider table partitioning for very large datasets.', 7, NOW() - INTERVAL '23 days', NOW() - INTERVAL '23 days'),
(5, 5, 'Node.js is perfect for I/O-intensive applications. The async/await pattern makes it so much cleaner than callbacks.', NULL, NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days'),
(5, 9, 'I am new to Node.js. Any recommended projects for beginners to start with?', 9, NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
(6, 3, 'It was an incredible journey! Started with passion, raised funding, built great team, and now ready for the next chapter.', NULL, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
(6, 8, 'Inspiring story, Jane! What was your biggest challenge during the startup phase?', 11, NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'),
(6, 3, 'Great question! The biggest challenge was finding product-market fit and managing burn rate during early days.', 12, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
(7, 8, 'Microservices bring agility but also complexity. Event-driven architecture helps manage inter-service communication.', NULL, NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'),
(8, 7, 'Leadership is about empowering your team. Trust your people and give them autonomy to make decisions.', NULL, NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days');

-- ============= FORUM POST REACTIONS DATA (LIKES/DISLIKES) =============
INSERT INTO "forum_post_reactions" ("post_id", "member_id", "created_at") VALUES
-- Post 1 (John's welcome post) - Positive reception
(1, 3, NOW() - INTERVAL '354 days'),
(1, 4, NOW() - INTERVAL '353 days'),
(1, 5, NOW() - INTERVAL '352 days'),
(1, 7, NOW() - INTERVAL '351 days'),
(1, 8, NOW() - INTERVAL '350 days'),
(1, 9, NOW() - INTERVAL '349 days'),

-- Post 2 (Jane's response) - Very positive
(2, 2, NOW() - INTERVAL '353 days'),
(2, 4, NOW() - INTERVAL '352 days'),
(2, 5, NOW() - INTERVAL '351 days'),
(2, 6, NOW() - INTERVAL '350 days'),
(2, 8, NOW() - INTERVAL '349 days'),

-- Post 3 (React Hooks question) - Good discussion
(3, 2, NOW() - INTERVAL '43 days'),
(3, 5, NOW() - INTERVAL '42 days'),
(3, 7, NOW() - INTERVAL '41 days'),
(3, 9, NOW() - INTERVAL '40 days'),
(3, 10, NOW() - INTERVAL '39 days'),

-- Post 4 (React Hooks answer) - Very helpful
(4, 2, NOW() - INTERVAL '42 days'),
(4, 3, NOW() - INTERVAL '41 days'),
(4, 4, NOW() - INTERVAL '40 days'),
(4, 5, NOW() - INTERVAL '39 days'),
(4, 7, NOW() - INTERVAL '38 days'),
(4, 8, NOW() - INTERVAL '37 days'),
(4, 9, NOW() - INTERVAL '36 days'),
(4, 10, NOW() - INTERVAL '35 days'),

-- Post 5 (Job search tips) - Useful content
(5, 2, NOW() - INTERVAL '28 days'),
(5, 4, NOW() - INTERVAL '27 days'),
(5, 5, NOW() - INTERVAL '26 days'),
(5, 7, NOW() - INTERVAL '25 days'),
(5, 9, NOW() - INTERVAL '24 days'),

-- Post 6 (Job search thanks) - Grateful response
(6, 2, NOW() - INTERVAL '26 days'),
(6, 3, NOW() - INTERVAL '25 days'),
(6, 6, NOW() - INTERVAL '24 days'),

-- Post 7 (Database indexing) - Technical excellence
(7, 2, NOW() - INTERVAL '23 days'),
(7, 3, NOW() - INTERVAL '22 days'),
(7, 4, NOW() - INTERVAL '21 days'),
(7, 5, NOW() - INTERVAL '20 days'),
(7, 6, NOW() - INTERVAL '19 days'),
(7, 8, NOW() - INTERVAL '18 days'),
(7, 9, NOW() - INTERVAL '17 days'),
(7, 10, NOW() - INTERVAL '16 days'),

-- Post 8 (Database partitioning) - Valuable addition
(8, 2, NOW() - INTERVAL '22 days'),
(8, 4, NOW() - INTERVAL '21 days'),
(8, 5, NOW() - INTERVAL '20 days'),
(8, 7, NOW() - INTERVAL '19 days'),

-- Post 9 (Node.js benefits) - Great insights
(9, 2, NOW() - INTERVAL '18 days'),
(9, 3, NOW() - INTERVAL '17 days'),
(9, 4, NOW() - INTERVAL '16 days'),
(9, 6, NOW() - INTERVAL '15 days'),
(9, 7, NOW() - INTERVAL '14 days'),
(9, 8, NOW() - INTERVAL '13 days'),

-- Post 10 (Node.js beginner question)
(10, 2, NOW() - INTERVAL '17 days'),
(10, 5, NOW() - INTERVAL '16 days'),
(10, 6, NOW() - INTERVAL '15 days'),

-- Post 11 (Startup journey story) - Inspiring
(11, 2, NOW() - INTERVAL '13 days'),
(11, 4, NOW() - INTERVAL '12 days'),
(11, 5, NOW() - INTERVAL '11 days'),
(11, 6, NOW() - INTERVAL '10 days'),
(11, 7, NOW() - INTERVAL '9 days'),
(11, 9, NOW() - INTERVAL '8 days'),

-- Post 12 (Follow-up question on startup)
(12, 2, NOW() - INTERVAL '12 days'),
(12, 3, NOW() - INTERVAL '11 days'),
(12, 6, NOW() - INTERVAL '10 days'),

-- Post 13 (Startup challenges answer) - Valuable insights
(13, 2, NOW() - INTERVAL '11 days'),
(13, 3, NOW() - INTERVAL '10 days'),
(13, 4, NOW() - INTERVAL '9 days'),
(13, 5, NOW() - INTERVAL '8 days'),
(13, 7, NOW() - INTERVAL '7 days'),

-- Post 14 (Microservices architecture) - Technical discussion
(14, 2, NOW() - INTERVAL '10 days'),
(14, 3, NOW() - INTERVAL '9 days'),
(14, 5, NOW() - INTERVAL '8 days'),
(14, 6, NOW() - INTERVAL '7 days'),

-- Post 15 (Leadership wisdom) - Inspiring
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
(6, 2, NOW() - INTERVAL '190 days');

-- ============= VERIFICATION REQUESTS DATA =============
INSERT INTO "verification_requests" ("member_id", "document_url", "document_type", "status", "admin_note", "reviewed_by_member_id", "created_at") VALUES
(4, 'https://api.example.com/documents/student_id_4.pdf', 'Student ID', 'Approved', 'Student ID verified and matches system records', 1, NOW() - INTERVAL '40 days'),
(5, 'https://api.example.com/documents/graduation_cert_5.pdf', 'Graduation Certificate', 'Approved', 'Graduation verified', 1, NOW() - INTERVAL '25 days'),
(9, 'https://api.example.com/documents/student_id_9.pdf', 'Student ID', 'Pending', 'Awaiting verification', NULL, NOW() - INTERVAL '3 days'),
(10, 'https://api.example.com/documents/diploma_10.pdf', 'Diploma', 'Rejected', 'Document quality too low, please resubmit', 1, NOW() - INTERVAL '5 days');

-- ============= PEER VERIFICATIONS - Additional DATA =============
INSERT INTO "peer_verifications" ("target_member_id", "verifier_member_id", "created_at") VALUES
(4, 6, NOW() - INTERVAL '35 days'),
(5, 9, NOW() - INTERVAL '20 days'),
(8, 3, NOW() - INTERVAL '175 days'),
(8, 6, NOW() - INTERVAL '170 days'),
(10, 7, NOW() - INTERVAL '2 days');

-- ============= POLL DATA =============
-- Sample Poll 1: Topic selection poll
INSERT INTO "forum_polls" ("topic_id", "organization_id", "created_by_member_id", "title", "description", "allow_multiple_votes", "is_active", "created_at", "updated_at") VALUES
(1, 1, 2, 'Best Programming Language for 2026?', 'Vote for your favorite programming language for upcoming projects', false, true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');

-- Add options for poll 1
INSERT INTO "forum_poll_options" ("poll_id", "option_text", "vote_count", "created_at", "updated_at") VALUES
(1, 'Python', 5, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(1, 'JavaScript/TypeScript', 8, NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'),
(1, 'Java', 4, NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'),
(1, 'Go', 3, NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
(1, 'Rust', 6, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day');

-- Sample poll votes (member 4, 6, 9, 2, 5 voting)
INSERT INTO "forum_poll_votes" ("poll_id", "poll_option_id", "member_id", "created_at") VALUES
(1, 2, 4, NOW() - INTERVAL '4 days'),
(1, 2, 6, NOW() - INTERVAL '3 days'),
(1, 1, 9, NOW() - INTERVAL '2 days'),
(1, 5, 2, NOW() - INTERVAL '1 day'),
(1, 1, 5, NOW());

-- Sample Poll 2: When should we have the next meetup?
INSERT INTO "forum_polls" ("topic_id", "organization_id", "created_by_member_id", "title", "description", "allow_multiple_votes", "is_active", "created_at", "updated_at") VALUES
(2, 1, 3, 'When is the best time for next meetup?', 'Help us schedule the next alumni meetup', false, true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

-- Add options for poll 2
INSERT INTO "forum_poll_options" ("poll_id", "option_text", "vote_count", "created_at", "updated_at") VALUES
(2, 'Weekend (Saturday or Sunday)', 12, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
(2, 'Weekday Evening (after work)', 8, NOW() - INTERVAL '2 days', NOW()),
(2, 'Weekday Lunch (12-2pm)', 3, NOW() - INTERVAL '2 days', NOW()),
(2, 'No preference', 5, NOW() - INTERVAL '2 days', NOW());

-- Sample poll votes
INSERT INTO "forum_poll_votes" ("poll_id", "poll_option_id", "member_id", "created_at") VALUES
(2, 1, 2, NOW() - INTERVAL '2 days'),
(2, 1, 4, NOW() - INTERVAL '1 day'),
(2, 2, 6, NOW() - INTERVAL '1 day'),
(2, 1, 8, NOW());
