-- Thêm constraint UNIQUE cho student_id. 
-- Do hệ thống có thể có nhiều tổ chức (organizations) nên thiết lập UNIQUE trên cặp (organization_id, student_id) sẽ hợp lý hơn.
-- Nếu student_id là duy nhất trên toàn hệ thống (không phân biệt tổ chức), bạn có thể đổi thành: UNIQUE ("student_id").

ALTER TABLE "organization_members"
ADD CONSTRAINT "uk_organization_members_student_id" UNIQUE ("organization_id", "student_id");
