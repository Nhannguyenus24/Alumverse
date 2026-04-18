const formatDateRange = (start, end) => {
  if (!start) return "";
  const s = new Date(start);
  const sText = s.toLocaleDateString("vi-VN");
  if (!end) return sText;
  const e = new Date(end);
  const eText = e.toLocaleDateString("vi-VN");
  return `${sText} - ${eText}`;
};

export const toEventCardShape = (event) => {
  if (!event) return null;
  const raw = event.content ?? "";
  const plain = typeof raw === "string" ? raw.replace(/<[^>]+>/g, " ").trim() : "";
  const description = plain.length > 180 ? `${plain.slice(0, 180)}…` : plain;

  return {
    id: event.id,
    channel: event.channel ?? "event",
    title: event.title ?? "",
    date: formatDateRange(event.eventDate, event.eventEndDate),
    organizer: event.organizer ?? event.location ?? "",
    participants: event.joinedCount ?? 0,
    interested: event.interestedCount ?? 0,
    description,
    image: event.thumbnailUrl ?? "/placeholder-image.png",
  };
};
