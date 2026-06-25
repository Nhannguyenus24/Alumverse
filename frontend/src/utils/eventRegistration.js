export const getEventRegisteredState = (response) => {
  if (typeof response === "boolean") return response;
  if (!response || typeof response !== "object") return false;

  return Boolean(
    response.isRegistered
      ?? response.registered
      ?? response.hasRegistered
      ?? response.data?.isRegistered
      ?? response.data?.registered
      ?? response.data?.hasRegistered
      ?? response.ticket?.id
      ?? response.ticketId
  );
};
