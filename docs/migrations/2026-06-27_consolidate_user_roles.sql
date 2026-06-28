-- Consolidate user roles to USER / STAFF / ADMIN.
-- The ALUMNI, GUEST and STUDENT roles are removed; "alumni" status is now
-- expressed through organization_members.verification_level (>= 2).
-- Run once against existing databases. Idempotent.

UPDATE users
SET role = 'USER',
    updated_at = CURRENT_TIMESTAMP
WHERE role IN ('ALUMNI', 'GUEST', 'STUDENT');
