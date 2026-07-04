-- 2026-07-04: Multi-organization membership support for verification tables
--
-- Mục tiêu:
--   1. Thêm cột organization_id cho peer_verifications và verification_requests
--      để mỗi bản ghi xác thực gắn với đúng một tổ chức.
--   2. Một user giờ có thể là thành viên của nhiều tổ chức, nên bỏ ràng buộc
--      UNIQUE trên organization_members.user_id. Từ nay việc tra cứu thành viên
--      phải dựa trên cặp (organization_id, user_id).
--
-- LƯU Ý: Bỏ UNIQUE(user_id) đòi hỏi phải drop tất cả foreign key đang tham chiếu
--        tới organization_members(user_id) (dùng CASCADE). Tính toàn vẹn tham chiếu
--        cho các cột *_member_id từ nay được đảm bảo ở tầng ứng dụng. Ràng buộc
--        UNIQUE(organization_id, user_id) được thêm vào để một user chỉ xuất hiện
--        một lần trong mỗi tổ chức (và để ON CONFLICT upsert tiếp tục hoạt động).

BEGIN;

-- 1. Thêm cột organization_id
ALTER TABLE "peer_verifications"    ADD COLUMN IF NOT EXISTS "organization_id" integer;
ALTER TABLE "verification_requests" ADD COLUMN IF NOT EXISTS "organization_id" integer;

-- 2. Backfill organization_id từ organization_members (user_id lúc này vẫn còn UNIQUE)
UPDATE "peer_verifications" pv
SET "organization_id" = om."organization_id"
FROM "organization_members" om
WHERE pv."target_member_id" = om."user_id"
  AND pv."organization_id" IS NULL;

UPDATE "verification_requests" vr
SET "organization_id" = om."organization_id"
FROM "organization_members" om
WHERE vr."member_id" = om."user_id"
  AND vr."organization_id" IS NULL;

-- 3. Bỏ ràng buộc UNIQUE trên organization_members.user_id.
--    CASCADE sẽ đồng thời drop mọi foreign key tham chiếu tới cột này.
ALTER TABLE "organization_members"
    DROP CONSTRAINT IF EXISTS "organization_members_user_id_key" CASCADE;

-- 4. Đảm bảo mỗi user chỉ có một bản ghi thành viên trong mỗi tổ chức.
--    Ràng buộc này cũng là conflict target cho các câu lệnh ON CONFLICT upsert.
ALTER TABLE "organization_members"
    ADD CONSTRAINT "uk_organization_members_org_user" UNIQUE ("organization_id", "user_id");

-- 5. Thêm foreign key cho các cột organization_id mới
ALTER TABLE "peer_verifications"
    ADD CONSTRAINT "fk_peer_verifications_organization"
    FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id");

ALTER TABLE "verification_requests"
    ADD CONSTRAINT "fk_verification_requests_organization"
    FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id");

-- 6. Tính duy nhất của peer verification giờ được tính theo từng tổ chức
DROP INDEX IF EXISTS "peer_verifications_target_member_id_verifier_member_id_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "uk_peer_verifications_org_target_verifier"
    ON "peer_verifications" ("organization_id", "target_member_id", "verifier_member_id");

-- 7. Index hỗ trợ truy vấn theo tổ chức
CREATE INDEX IF NOT EXISTS "idx_verification_requests_org"
    ON "verification_requests" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_peer_verifications_org"
    ON "peer_verifications" ("organization_id");

COMMIT;
