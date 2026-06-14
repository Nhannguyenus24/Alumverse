export const CONVERSATION_REQUEST_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
};

const CONVERSATION_REQUEST_STATUS_MESSAGES = {
  [CONVERSATION_REQUEST_STATUS.PENDING]:
    'Yêu cầu kết nối đang chờ phản hồi.',
  [CONVERSATION_REQUEST_STATUS.ACCEPTED]:
    'Bạn đã được chấp nhận kết nối.',
  [CONVERSATION_REQUEST_STATUS.REJECTED]:
    'Yêu cầu kết nối đã bị từ chối.',
};
