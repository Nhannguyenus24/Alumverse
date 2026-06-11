-- Test accounts for full-system UAT (local Docker DB)
--
-- Apply (idempotent mentee block; first CTE batch fails if emails exist):
--   docker exec -i db psql -U user -d db < docs/test-accounts.sql
--
-- Login: https://localhost/cs-hcmus/auth/login  (org slug cs-hcmus, organizationId = 1)
-- Hub:    https://localhost/development/mentorship
--
-- Passwords:
--   Student@2024  -> test.l1, test.alumni, test.mentor, test.mentee
--   Admin2026@    -> test.admin, test.superadmin
--
-- === Mentorship demo matrix ===
-- | Account              | Level | Vai trò demo                                      |
-- |----------------------|-------|---------------------------------------------------|
-- | (guest)              | —     | Landing only, không danh sách mentor              |
-- | test.l1@             | 1     | Xem preview mentor, không đặt lịch                |
-- | test.mentee@         | 2     | Mentee: đặt lịch, lịch hẹn, hủy, feedback, báo cáo |
-- | test.alumni@         | 2     | Mentee “sạch”: chưa mentor — đăng ký mentor mới   |
-- | test.mentor@         | 2     | Mentor APPROVED + slot AVAILABLE (3 khung giờ)    |
-- | test.admin@          | 2     | Duyệt hồ sơ mentor PENDING trong admin            |
--
-- Luồng E2E gợi ý (2 trình duyệt / profile):
--   1. test.mentee@ → /development/mentorship → Test Mentor → Đặt lịch → chọn slot
--   2. test.mentor@ → Lịch hẹn (dashboard) → xác nhận/hủy/hoàn thành phiên
--   3. test.mentee@ → Lịch hẹn của tôi → feedback / báo cáo (nếu đã triển khai)
--   4. test.alumni@ → Đăng ký mentor → test.admin@ duyệt → test.alumni@ quản lý lịch
--
-- Sample data (docs/sample.sql): john.doe@ = mentor L2; mật khẩu hash khác — ưu tiên test.*

WITH new_users AS (
  INSERT INTO users (email, password_hash, user_name, status, role, created_at, updated_at) VALUES
  ('test.l1@hcmus.edu.vn', '$2b$12$ig35cC5G.hFgdmWUzbnv5OiJRpBGrzZmTXhl5L/8Akvmr4.r3Ciwm', 'uat_testlv1', 'ACTIVE', 'ALUMNI', NOW(), NOW()),
  ('test.alumni@hcmus.edu.vn', '$2b$12$ig35cC5G.hFgdmWUzbnv5OiJRpBGrzZmTXhl5L/8Akvmr4.r3Ciwm', 'uat_testalumni', 'ACTIVE', 'ALUMNI', NOW(), NOW()),
  ('test.mentor@hcmus.edu.vn', '$2b$12$ig35cC5G.hFgdmWUzbnv5OiJRpBGrzZmTXhl5L/8Akvmr4.r3Ciwm', 'uat_testmentor', 'ACTIVE', 'ALUMNI', NOW(), NOW()),
  ('test.admin@hcmus.edu.vn', '$2a$10$XV9KfhWlRF4ypiISf3u1.u1PeEKWw1x.BpzqLaVPM4WA7D9KbcZ7m', 'uat_testadmin', 'ACTIVE', 'ADMIN', NOW(), NOW()),
  ('test.superadmin@hcmus.edu.vn', '$2a$10$XV9KfhWlRF4ypiISf3u1.u1PeEKWw1x.BpzqLaVPM4WA7D9KbcZ7m', 'uat_testsuperadmin', 'ACTIVE', 'ADMIN', NOW(), NOW())
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
INSERT INTO users (email, password_hash, user_name, status, role, created_at, updated_at)
SELECT 'test.mentee@hcmus.edu.vn', '$2b$12$ig35cC5G.hFgdmWUzbnv5OiJRpBGrzZmTXhl5L/8Akvmr4.r3Ciwm', 'uat_testmentee', 'ACTIVE', 'STUDENT', NOW(), NOW()
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
