-- Sample Data for Student Alumni System

-- ============= USERS DATA =============
INSERT INTO "users" ("email", "password_hash", "is_active", "created_at", "updated_at") VALUES
('admin@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', true, NOW(), NOW()),
('john.doe@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', true, NOW() - INTERVAL '90 days', NOW()),
('jane.smith@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', true, NOW() - INTERVAL '60 days', NOW()),
('nguyen.van.a@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', true, NOW() - INTERVAL '45 days', NOW()),
('tran.thi.b@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', true, NOW() - INTERVAL '30 days', NOW()),
('pham.van.c@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', true, NOW() - INTERVAL '20 days', NOW()),
('hoang.thi.d@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', false, NOW() - INTERVAL '10 days', NOW()),
('le.van.e@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', true, NOW() - INTERVAL '5 days', NOW()),
('duong.thi.f@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', true, NOW() - INTERVAL '2 days', NOW()),
('vo.van.g@hcmus.edu.vn', '$2a$10$slYQmyNdGzIn9KqmFEexCeI7w5yO8Z9TK5D8P2L9H5F2X4Q3A1R5S', true, NOW(), NOW());

-- ============= GLOBAL PROFILES DATA =============
INSERT INTO "global_profiles" ("user_id", "full_name", "phone", "avatar_url", "bio", "dob", "gender", "settings") VALUES
(1, 'Admin User', '0901234567', 'https://api.example.com/avatars/admin.jpg', 'System Administrator', '1990-01-15', 'Male', '{"language":"vi","theme":"dark"}'),
(2, 'John Doe', '0912345678', 'https://api.example.com/avatars/john.jpg', 'Software Engineer & Alumni', '1995-05-20', 'Male', '{"language":"en","theme":"light"}'),
(3, 'Jane Smith', '0923456789', 'https://api.example.com/avatars/jane.jpg', 'Product Manager', '1996-08-10', 'Female', '{"language":"en","theme":"light"}'),
(4, 'Nguyễn Văn A', '0934567890', 'https://api.example.com/avatars/nguyena.jpg', 'Student - Computer Science', '2002-03-15', 'Male', '{"language":"vi","theme":"dark"}'),
(5, 'Trần Thị B', '0945678901', 'https://api.example.com/avatars/tranb.jpg', 'Recent Graduate - IT', '2001-07-22', 'Female', '{"language":"vi","theme":"light"}'),
(6, 'Phạm Văn C', '0956789012', 'https://api.example.com/avatars/phamc.jpg', 'Senior Developer at Tech Corp', '1998-11-08', 'Male', '{"language":"vi","theme":"dark"}'),
(7, 'Hoàng Thị D', '0967890123', 'https://api.example.com/avatars/hoangd.jpg', 'Business Analyst', '1999-02-14', 'Female', '{"language":"vi","theme":"light"}'),
(8, 'Lê Văn E', '0978901234', 'https://api.example.com/avatars/lee.jpg', 'Startup Founder', '1997-09-30', 'Male', '{"language":"vi","theme":"dark"}'),
(9, 'Dương Thị F', '0989012345', 'https://api.example.com/avatars/duongf.jpg', 'Data Scientist', '2000-04-17', 'Female', '{"language":"vi","theme":"light"}'),
(10, 'Võ Văn G', '0990123456', 'https://api.example.com/avatars/vog.jpg', 'UX/UI Designer', '1999-12-05', 'Male', '{"language":"vi","theme":"dark"}');

-- ============= GLOBAL IDENTITY VERIFICATIONS DATA =============
INSERT INTO "global_identity_verifications" ("user_id", "citizen_id", "extracted_data", "verified_at", "provider") VALUES
(2, '123456789012', '{"name":"John Doe","dob":"1995-05-20","address":"123 Main St"}', NOW() - INTERVAL '80 days', 'eKYC'),
(3, '223456789013', '{"name":"Jane Smith","dob":"1996-08-10","address":"456 Oak Ave"}', NOW() - INTERVAL '50 days', 'eKYC'),
(4, '323456789014', '{"name":"Nguyễn Văn A","dob":"2002-03-15","address":"789 Pine Rd"}', NOW() - INTERVAL '40 days', 'eKYC'),
(5, '423456789015', '{"name":"Trần Thị B","dob":"2001-07-22","address":"321 Elm St"}', NOW() - INTERVAL '25 days', 'eKYC');

-- ============= ORGANIZATIONS DATA =============
INSERT INTO "organizations" ("name", "slug", "logo_url", "brand_config", "features_config", "created_at") VALUES
('HCMUS - Computer Science', 'cs-hcmus', 'https://api.example.com/logos/cs.png', '{"primary":"#1976d2","secondary":"#dc004e"}', '{"mentorship":true,"job":true,"fund":true,"events":true,"forum":true}', NOW() - INTERVAL '365 days'),
('HCMUS - Information Technology', 'it-hcmus', 'https://api.example.com/logos/it.png', '{"primary":"#388e3c","secondary":"#ff9800"}', '{"mentorship":true,"job":true,"fund":true,"events":true,"forum":true}', NOW() - INTERVAL '360 days'),
('HCMUS - Business Administration', 'ba-hcmus', 'https://api.example.com/logos/ba.png', '{"primary":"#f57c00","secondary":"#512da8"}', '{"mentorship":true,"job":true,"fund":false,"events":true,"forum":true}', NOW() - INTERVAL '350 days'),
('HCMUS - Engineering', 'eng-hcmus', 'https://api.example.com/logos/eng.png', '{"primary":"#c62828","secondary":"#0097a7"}', '{"mentorship":true,"job":true,"fund":true,"events":true,"forum":true}', NOW() - INTERVAL '340 days');

-- ============= ORGANIZATION MEMBERS DATA =============
INSERT INTO "organization_members" ("organization_id", "user_id", "display_name", "org_specific_avatar_url", "verification_level", "is_trusted_verifier", "status", "joined_at") VALUES
-- CS Department Members
(1, 1, 'Admin CS', 'https://api.example.com/avatars/cs_admin.jpg', 3, true, 'Active', NOW() - INTERVAL '365 days'),
(1, 2, 'John Doe', 'https://api.example.com/avatars/john_cs.jpg', 2, true, 'Active', NOW() - INTERVAL '90 days'),
(1, 4, 'Nguyễn Văn A', 'https://api.example.com/avatars/nguyena_cs.jpg', 1, false, 'Active', NOW() - INTERVAL '45 days'),
(1, 6, 'Phạm Văn C', 'https://api.example.com/avatars/phamc_cs.jpg', 2, true, 'Active', NOW() - INTERVAL '200 days'),

-- IT Department Members
(2, 3, 'Jane Smith', 'https://api.example.com/avatars/jane_it.jpg', 2, true, 'Active', NOW() - INTERVAL '60 days'),
(2, 5, 'Trần Thị B', 'https://api.example.com/avatars/tranb_it.jpg', 1, false, 'Active', NOW() - INTERVAL '30 days'),
(2, 8, 'Lê Văn E', 'https://api.example.com/avatars/lee_it.jpg', 2, true, 'Active', NOW() - INTERVAL '180 days'),
(2, 9, 'Dương Thị F', 'https://api.example.com/avatars/duongf_it.jpg', 1, false, 'Active', NOW() - INTERVAL '15 days'),

-- BA Department Members
(3, 7, 'Hoàng Thị D', 'https://api.example.com/avatars/hoangd_ba.jpg', 2, true, 'Active', NOW() - INTERVAL '100 days'),
(3, 10, 'Võ Văn G', 'https://api.example.com/avatars/vog_ba.jpg', 1, false, 'Pending', NOW() - INTERVAL '3 days'),

-- Engineering Department Members
(4, 1, 'Admin Eng', 'https://api.example.com/avatars/eng_admin.jpg', 3, true, 'Active', NOW() - INTERVAL '340 days');

-- ============= ROLES DATA =============
INSERT INTO "roles" ("name", "description") VALUES
('Admin', 'System administrator with full permissions'),
('Moderator', 'Can moderate forum and manage events'),
('Mentor', 'Senior member who can mentor others'),
('Alumni', 'Graduated members'),
('Student', 'Current students'),
('Guest', 'Limited access guest account');

-- ============= PERMISSIONS DATA =============
INSERT INTO "permissions" ("slug", "name") VALUES
('manage_users', 'Manage Users'),
('manage_roles', 'Manage Roles'),
('manage_events', 'Manage Events'),
('manage_forum', 'Manage Forum'),
('manage_jobs', 'Manage Jobs'),
('manage_funds', 'Manage Funds'),
('create_news', 'Create News'),
('approve_verification', 'Approve Verification'),
('view_reports', 'View Reports'),
('manage_learning', 'Manage Learning Resources');

-- ============= ROLE PERMISSIONS DATA =============
INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10),
(2, 3), (2, 4), (2, 7), (2, 9),
(3, 3), (3, 7),
(4, 3), (4, 7),
(5, 3), (5, 7);

-- ============= MEMBER ROLES DATA =============
INSERT INTO "member_roles" ("member_id", "role_id", "assigned_at") VALUES
(1, 1, NOW() - INTERVAL '365 days'),
(2, 3, NOW() - INTERVAL '90 days'),
(2, 4, NOW() - INTERVAL '90 days'),
(3, 3, NOW() - INTERVAL '60 days'),
(4, 5, NOW() - INTERVAL '45 days'),
(5, 4, NOW() - INTERVAL '30 days'),
(6, 3, NOW() - INTERVAL '200 days'),
(6, 4, NOW() - INTERVAL '200 days'),
(7, 3, NOW() - INTERVAL '100 days'),
(8, 3, NOW() - INTERVAL '180 days'),
(8, 4, NOW() - INTERVAL '180 days'),
(9, 5, NOW() - INTERVAL '15 days'),
(10, 2, NOW() - INTERVAL '3 days');

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
INSERT INTO "funds" ("organization_id", "manager_member_id", "name", "description", "target_amount", "current_amount", "status") VALUES
(1, 2, 'Student Scholarship Fund 2026', 'Supporting talented students with financial needs', 50000.00, 28500.00, 'Active'),
(1, 6, 'Lab Equipment Fund', 'Upgrading our research laboratory equipment', 100000.00, 45000.00, 'Active'),
(2, 3, 'Alumni Mentorship Fund', 'Funding mentorship programs and workshops', 30000.00, 12000.00, 'Active'),
(3, 7, 'Business Incubation Fund', 'Supporting student-led startup initiatives', 80000.00, 35000.00, 'Active'),
(4, 1, 'Engineering Excellence Fund', 'Supporting engineering projects and competitions', 60000.00, 22500.00, 'Active');

-- ============= FUND RECEIVING INFOS DATA =============
INSERT INTO "fund_receiving_infos" ("fund_id", "type", "account_number", "account_name", "bank_name", "qr_code_url", "is_active") VALUES
(1, 'Bank', '1234567890', 'HCMUS Student Scholarship Fund', 'VietcomBank', 'https://api.example.com/qr/fund1.png', true),
(1, 'Momo', '0912345678', 'HCMUS Fund', NULL, 'https://api.example.com/qr/fund1_momo.png', true),
(2, 'Bank', '0987654321', 'HCMUS Lab Equipment Fund', 'Techcombank', 'https://api.example.com/qr/fund2.png', true),
(3, 'Bank', '1122334455', 'Alumni Mentorship Fund', 'VietcomBank', 'https://api.example.com/qr/fund3.png', true),
(4, 'Bank', '5544332211', 'Business Incubation Fund', 'BIDV', 'https://api.example.com/qr/fund4.png', true),
(5, 'Bank', '9988776655', 'Engineering Excellence Fund', 'Techcombank', 'https://api.example.com/qr/fund5.png', true);

-- ============= FUND DONATIONS DATA =============
INSERT INTO "fund_donations" ("fund_id", "donor_member_id", "donor_name", "amount", "message", "proof_image_url", "status", "created_at") VALUES
(1, 2, NULL, 5000.00, 'Supporting our students', 'https://api.example.com/proofs/donation1.jpg', 'Approved', NOW() - INTERVAL '30 days'),
(1, 6, NULL, 3500.00, 'Happy to help talented students', 'https://api.example.com/proofs/donation2.jpg', 'Approved', NOW() - INTERVAL '25 days'),
(1, NULL, 'Anonymous Donor', 10000.00, 'Belief in future generation', 'https://api.example.com/proofs/donation3.jpg', 'Approved', NOW() - INTERVAL '20 days'),
(2, 3, NULL, 2000.00, 'Upgrading our research capabilities', 'https://api.example.com/proofs/donation4.jpg', 'Approved', NOW() - INTERVAL '15 days'),
(2, 8, NULL, 15000.00, 'Investing in research excellence', 'https://api.example.com/proofs/donation5.jpg', 'Approved', NOW() - INTERVAL '10 days'),
(3, 7, NULL, 8000.00, 'Supporting mentorship initiatives', 'https://api.example.com/proofs/donation6.jpg', 'Approved', NOW() - INTERVAL '8 days'),
(3, NULL, 'Company Partnership', 4000.00, 'Corporate social responsibility', 'https://api.example.com/proofs/donation7.jpg', 'Pending', NOW() - INTERVAL '2 days'),
(4, 5, NULL, 6000.00, 'Supporting entrepreneurs', 'https://api.example.com/proofs/donation8.jpg', 'Approved', NOW() - INTERVAL '5 days'),
(5, 1, NULL, 5500.00, 'Excellence in engineering', 'https://api.example.com/proofs/donation9.jpg', 'Approved', NOW() - INTERVAL '3 days');

-- ============= FUND EXPENSES DATA =============
INSERT INTO "fund_expenses" ("fund_id", "title", "amount", "expense_date", "proof_document_url", "created_at") VALUES
(1, 'Q4 2025 Scholarships Awarded', 8000.00, '2025-12-20', 'https://api.example.com/expenses/scholarship_q4.pdf', NOW() - INTERVAL '25 days'),
(1, 'Q1 2026 Scholarships Awarded', 5000.00, '2026-01-20', 'https://api.example.com/expenses/scholarship_q1.pdf', NOW() - INTERVAL '8 days'),
(2, 'New Server Purchase', 20000.00, '2025-12-15', 'https://api.example.com/expenses/server_receipt.pdf', NOW() - INTERVAL '30 days'),
(2, 'Software Licenses', 5000.00, '2026-01-10', 'https://api.example.com/expenses/licenses.pdf', NOW() - INTERVAL '15 days'),
(3, 'Mentorship Workshop Series', 3000.00, '2026-01-15', 'https://api.example.com/expenses/workshop.pdf', NOW() - INTERVAL '10 days'),
(4, 'Startup Bootcamp Sponsorship', 10000.00, '2025-11-20', 'https://api.example.com/expenses/bootcamp.pdf', NOW() - INTERVAL '60 days'),
(5, 'Engineering Competition Prizes', 8000.00, '2025-12-10', 'https://api.example.com/expenses/competition.pdf', NOW() - INTERVAL '35 days');

-- ============= NOTIFICATIONS DATA =============
INSERT INTO "notifications" ("member_id", "title", "message", "target_url", "is_read", "created_at") VALUES
(4, 'Event Registration Confirmed', 'Your registration for Web Development Workshop has been confirmed', '/events/2', false, NOW() - INTERVAL '2 days'),
(4, 'New Mentorship Session Scheduled', 'You have a new mentorship session scheduled with John Doe', '/mentorship/sessions/1', false, NOW() - INTERVAL '1 day'),
(5, 'Job Opportunity Match', 'Found a job that matches your profile: Junior Software Developer', '/jobs/1', true, NOW() - INTERVAL '5 days'),
(9, 'Scholarship Opportunity', 'You are eligible for the Student Scholarship Fund', '/funds/1', false, NOW()),
(10, 'Profile Review Required', 'Please complete your profile to join as an active member', '/profile', false, NOW() - INTERVAL '3 days'),
(2, 'New Mentee Request', 'Trần Thị B requested a mentorship session', '/mentorship/requests', true, NOW() - INTERVAL '4 days'),
(6, 'Event Registration Confirmed', 'Your registration for Database Design Seminar has been confirmed', '/events/3', true, NOW() - INTERVAL '6 days');

-- ============= FORUM CATEGORIES DATA =============
INSERT INTO "forum_categories" ("organization_id", "name", "description", "created_at", "updated_at") VALUES
(1, 'General Discussion', 'General topics and announcements', NOW() - INTERVAL '365 days', NOW()),
(1, 'Technical Help', 'Questions and help with programming', NOW() - INTERVAL '365 days', NOW()),
(1, 'Job & Career', 'Job opportunities and career advice', NOW() - INTERVAL '365 days', NOW()),
(2, 'General Discussion', 'General topics and announcements', NOW() - INTERVAL '360 days', NOW()),
(2, 'Technical Help', 'Questions and help with programming', NOW() - INTERVAL '360 days', NOW()),
(2, 'Alumni Stories', 'Share your success stories', NOW() - INTERVAL '360 days', NOW()),
(3, 'Business Topics', 'Business and management discussions', NOW() - INTERVAL '350 days', NOW()),
(4, 'Engineering Projects', 'Share and discuss engineering projects', NOW() - INTERVAL '340 days', NOW());

-- ============= FORUM TOPICS DATA =============
INSERT INTO "forum_topics" ("organization_id", "category_id", "created_by_member_id", "title", "description", "view_count", "created_at", "updated_at") VALUES
(1, 1, 2, 'Welcome to CS Alumni Network', 'This is our official CS alumni community. Feel free to introduce yourself!', 156, NOW() - INTERVAL '355 days', NOW() - INTERVAL '10 days'),
(1, 2, 4, 'React Hooks vs Class Components - Best Practices', 'Discussion about modern React patterns and best practices', 89, NOW() - INTERVAL '45 days', NOW() - INTERVAL '5 days'),
(1, 3, 6, 'Job Search Strategy for New Graduates', 'Tips and tricks for landing your first job in tech', 234, NOW() - INTERVAL '30 days', NOW() - INTERVAL '2 days'),
(1, 2, 6, 'Database Optimization Techniques', 'Share your database optimization experiences', 156, NOW() - INTERVAL '25 days', NOW() - INTERVAL '8 days'),
(2, 2, 5, 'Getting Started with Node.js', 'Beginner-friendly discussion on Node.js development', 78, NOW() - INTERVAL '20 days', NOW() - INTERVAL '3 days'),
(2, 6, 3, 'From Startup to IPO - My Journey', 'Jane shares her entrepreneurial journey and lessons learned', 412, NOW() - INTERVAL '15 days', NOW() - INTERVAL '1 day'),
(2, 5, 8, 'Microservices Architecture Discussion', 'Advanced topics on building scalable microservices', 145, NOW() - INTERVAL '12 days', NOW() - INTERVAL '4 days'),
(3, 7, 7, 'Leadership Lessons from Successful Entrepreneurs', 'Learning from business leaders', 93, NOW() - INTERVAL '10 days', NOW() - INTERVAL '6 days'),
(4, 8, 6, 'Sustainable Engineering for the Future', 'Discussing eco-friendly engineering solutions', 67, NOW() - INTERVAL '8 days', NOW() - INTERVAL '3 days');

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
