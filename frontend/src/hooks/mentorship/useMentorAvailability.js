import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getMentorAvailableSlots } from '../../utils/api';

const fetchSlots = async (mentorMemberId) => {
  const res = await getMentorAvailableSlots(mentorMemberId);
  return res?.data?.data ?? [];
};

/**
 * Returns:
 *   slots: raw [{ id, mentorMemberId, startTime, endTime, status }, ...]
 *   availabilityMap: { "YYYY-MM-DD": [{ id, startTime, endTime }, ...] }
 *
 * Slots keep their real start/end times (no rounding to whole hours), so a
 * mentor can offer slots of any duration and the picker renders them faithfully.
 */
export const useMentorAvailability = (mentorMemberId) => {
  const query = useQuery({
    queryKey: ['mentorship', 'mentor', mentorMemberId, 'availability'],
    queryFn: () => fetchSlots(mentorMemberId),
    enabled: Boolean(mentorMemberId),
  });

  const slots = query.data ?? [];

  const availabilityMap = slots.reduce((acc, slot) => {
    const start = dayjs(slot.startTime);
    if (!start.isValid()) return acc;
    const dateKey = start.format('YYYY-MM-DD');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push({ id: slot.id, startTime: slot.startTime, endTime: slot.endTime });
    return acc;
  }, {});

  // Keep each day's slots sorted by start time for stable rendering.
  Object.values(availabilityMap).forEach((daySlots) =>
    daySlots.sort((a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf()),
  );

  return { ...query, slots, availabilityMap };
};
