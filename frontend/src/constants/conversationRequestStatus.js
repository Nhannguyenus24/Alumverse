export const CONVERSATION_REQUEST_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
};

const getConversationRequestStatusMessages = (t) => ({
  [CONVERSATION_REQUEST_STATUS.PENDING]:
    t ? t('network:request_pending_desc') : 'Yêu cầu kết nối đang chờ phản hồi.',
  [CONVERSATION_REQUEST_STATUS.ACCEPTED]:
    t ? t('network:request_accepted_desc') : 'Bạn đã được chấp nhận kết nối.',
  [CONVERSATION_REQUEST_STATUS.REJECTED]:
    t ? t('network:request_rejected_desc') : 'Yêu cầu kết nối đã bị từ chối.',
});
