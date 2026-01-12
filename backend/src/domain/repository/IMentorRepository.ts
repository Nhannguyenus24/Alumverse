import { MentorProfile } from '../entities/MentorProfile';
import { MentorExpertise } from '../entities/MentorExpertise';
import { MentorAvailability } from '../entities/MentorAvailability';
import { MentorshipSession } from '../entities/MentorshipSession';
import { SessionFeedback } from '../entities/SessionFeedback';

/**
 * Repository interface for mentorship operations
 */
export interface IMentorRepository {
  // Mentor Profile Management
  createMentorProfile(
    profileData: Partial<MentorProfile>,
  ): Promise<MentorProfile>;
  updateMentorProfile(
    memberId: number,
    profileData: Partial<MentorProfile>,
  ): Promise<MentorProfile>;
  findMentorProfileByMemberId(memberId: number): Promise<MentorProfile | null>;
  findAllMentorProfiles(
    organizationId: number,
    page: number,
    limit: number,
    filters?: { isApproved?: boolean },
  ): Promise<{ mentors: MentorProfile[]; total: number }>;
  approveMentorProfile(memberId: number): Promise<MentorProfile>;
  updateMentorRating(
    memberId: number,
    newAvgRating: number,
    totalSessions: number,
  ): Promise<MentorProfile>;

  // Mentor Expertise Management
  createExpertise(
    expertiseData: Partial<MentorExpertise>,
  ): Promise<MentorExpertise>;
  updateExpertise(
    expertiseId: number,
    expertiseData: Partial<MentorExpertise>,
  ): Promise<MentorExpertise>;
  deleteExpertise(expertiseId: number): Promise<boolean>;
  findExpertiseByMentor(mentorMemberId: number): Promise<MentorExpertise[]>;
  searchMentorsByExpertise(
    topic: string,
    page: number,
    limit: number,
  ): Promise<{ mentors: MentorProfile[]; total: number }>;

  // Availability Management
  createAvailability(
    availabilityData: Partial<MentorAvailability>,
  ): Promise<MentorAvailability>;
  updateAvailability(
    availabilityId: number,
    availabilityData: Partial<MentorAvailability>,
  ): Promise<MentorAvailability>;
  deleteAvailability(availabilityId: number): Promise<boolean>;
  findAvailabilityById(
    availabilityId: number,
  ): Promise<MentorAvailability | null>;
  findAvailabilitiesByMentor(
    mentorMemberId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<MentorAvailability[]>;
  findAvailableSlots(
    mentorMemberId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<MentorAvailability[]>;
  updateAvailabilityStatus(
    availabilityId: number,
    status: string,
  ): Promise<MentorAvailability>;

  // Session Management
  createSession(
    sessionData: Partial<MentorshipSession>,
  ): Promise<MentorshipSession>;
  updateSession(
    sessionId: number,
    sessionData: Partial<MentorshipSession>,
  ): Promise<MentorshipSession>;
  cancelSession(sessionId: number): Promise<MentorshipSession>;
  completeSession(sessionId: number): Promise<MentorshipSession>;
  findSessionById(sessionId: number): Promise<MentorshipSession | null>;
  findSessionsByMentor(
    mentorMemberId: number,
    page: number,
    limit: number,
  ): Promise<{ sessions: MentorshipSession[]; total: number }>;
  findSessionsByMentee(
    menteeMemberId: number,
    page: number,
    limit: number,
  ): Promise<{ sessions: MentorshipSession[]; total: number }>;
  findUpcomingSessions(memberId: number): Promise<MentorshipSession[]>;

  // Feedback Management
  createFeedback(
    feedbackData: Partial<SessionFeedback>,
  ): Promise<SessionFeedback>;
  updateFeedback(
    feedbackId: number,
    feedbackData: Partial<SessionFeedback>,
  ): Promise<SessionFeedback>;
  findFeedbackBySession(sessionId: number): Promise<SessionFeedback | null>;
  findFeedbacksByMentor(
    mentorMemberId: number,
    page: number,
    limit: number,
    publicOnly?: boolean,
  ): Promise<{ feedbacks: SessionFeedback[]; total: number }>;

  // Statistics
  getMentorStatistics(mentorMemberId: number): Promise<{
    totalSessions: number;
    completedSessions: number;
    averageRating: number;
    totalFeedbacks: number;
  }>;
}
