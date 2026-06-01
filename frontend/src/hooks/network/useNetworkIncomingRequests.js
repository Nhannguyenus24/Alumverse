import { useCallback, useMemo, useState } from 'react';

import { CONVERSATION_REQUEST_STATUS } from '../../constants/conversationRequestStatus';
import { MOCK_INCOMING_REQUESTS } from '../../mocks/networkIncomingRequestsMock';

function matchesFullName(fullName, query) {
  if (!query) return true;
  return fullName.toLowerCase().includes(query.toLowerCase());
}

function matchesStatus(status, filters) {
  if (filters.all) return true;
  const selected = filters.status ?? [];
  if (selected.length === 0) return true;
  return selected.includes(status);
}

export function useNetworkIncomingRequests({
  appliedFullName,
  filters,
  page,
  pageSize,
}) {
  const [items, setItems] = useState(MOCK_INCOMING_REQUESTS);

  const filteredItems = useMemo(() => {
    return items
      .filter(
        (item) =>
          matchesFullName(item.fullName, appliedFullName) &&
          matchesStatus(item.status, filters),
      )
      .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
  }, [items, appliedFullName, filters]);

  const totalPage = filteredItems.length > 0 ? Math.ceil(filteredItems.length / pageSize) : 0;

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  const acceptRequest = useCallback((requestId) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === requestId
          ? { ...item, status: CONVERSATION_REQUEST_STATUS.ACCEPTED }
          : item,
      ),
    );
  }, []);

  const rejectRequest = useCallback((requestId) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === requestId
          ? { ...item, status: CONVERSATION_REQUEST_STATUS.REJECTED }
          : item,
      ),
    );
  }, []);

  return {
    items: paginatedItems,
    totalCount: filteredItems.length,
    totalPage,
    acceptRequest,
    rejectRequest,
  };
}
