import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getMentorAvailableSlots } from '../../api/mentorshipApi';

const fetchSlots = async (mentorMemberId) => {
  const res = await getMentorAvailableSlots(mentorMemberId);
  return res?.data?.data ?? [];
};

/**
 * Returns:
 *   slots: raw [{ id, mentorMemberId, startTime, endTime, status }, ...]
 *   availabilityMap: { "YYYY-MM-DD": { [hour]: availabilityId } }
 *
 * Each slot is normalised to a single hour key based on its startTime.
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
    const hour = start.hour();
    if (!acc[dateKey]) acc[dateKey] = {};
    acc[dateKey][hour] = slot.id;
    return acc;
  }, {});

  return { ...query, slots, availabilityMap };
};
