const REPORT_REASONS = [
  { value: 'NO_SHOW', label: 'Đối phương không tham gia / vắng mặt', statuses: ['EXPIRED', 'COMPLETED'] },
  { value: 'LATE_OR_LEFT_EARLY', label: 'Đến trễ nhiều / rời buổi sớm', statuses: ['COMPLETED'] },
  { value: 'INAPPROPRIATE_BEHAVIOR', label: 'Hành vi, ngôn từ không phù hợp / quấy rối', statuses: ['COMPLETED'] },
  { value: 'OFF_TOPIC_UNPROFESSIONAL', label: 'Sai nội dung mentoring / thiếu chuyên nghiệp', statuses: ['COMPLETED'] },
  { value: 'TECHNICAL_ISSUE', label: 'Sự cố kỹ thuật (link lỗi, không vào được)', statuses: ['COMPLETED', 'EXPIRED'] },
  { value: 'OTHER', label: 'Khác (tự nhập mô tả)', statuses: ['COMPLETED', 'EXPIRED'] },
];

export const reasonsForStatus = (status) =>
  REPORT_REASONS.filter((r) => r.statuses.includes(status));
