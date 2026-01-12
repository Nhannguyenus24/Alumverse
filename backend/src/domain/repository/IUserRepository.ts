import { GlobalProfile } from '../entities/GlobalProfile';
import { OrganizationMember } from '../entities/OrganizationMember';
import { AcademicRecord } from '../entities/AcademicRecord';
import { Achievement } from '../entities/Achievement';
import { SavedItem } from '../entities/SavedItem';
import { Notification } from '../entities/Notification';
import { PeerVerification } from '../entities/PeerVerification';

/**
 * Repository interface for user-related operations
 * Handles user profiles, achievements, saved items, notifications, etc.
 */
export interface IUserRepository {
  // Profile Management
  findGlobalProfileByUserId(userId: number): Promise<GlobalProfile | null>;
  updateGlobalProfile(
    userId: number,
    profileData: Partial<GlobalProfile>,
  ): Promise<GlobalProfile>;

  // Organization Membership
  joinOrganization(
    userId: number,
    organizationId: number,
    memberData: Partial<OrganizationMember>,
  ): Promise<OrganizationMember>;
  leaveOrganization(memberId: number): Promise<boolean>;
  findMemberByUserAndOrg(
    userId: number,
    organizationId: number,
  ): Promise<OrganizationMember | null>;
  findMemberById(memberId: number): Promise<OrganizationMember | null>;
  findOrganizationsByUser(userId: number): Promise<OrganizationMember[]>;
  updateMemberProfile(
    memberId: number,
    memberData: Partial<OrganizationMember>,
  ): Promise<OrganizationMember>;

  // Academic Record Management
  createAcademicRecord(
    recordData: Partial<AcademicRecord>,
  ): Promise<AcademicRecord>;
  updateAcademicRecord(
    recordId: number,
    recordData: Partial<AcademicRecord>,
  ): Promise<AcademicRecord>;
  deleteAcademicRecord(recordId: number): Promise<boolean>;
  findAcademicRecordsByMember(memberId: number): Promise<AcademicRecord[]>;
  findAcademicRecordById(recordId: number): Promise<AcademicRecord | null>;

  // Achievement Management
  createAchievement(
    achievementData: Partial<Achievement>,
  ): Promise<Achievement>;
  updateAchievement(
    achievementId: number,
    achievementData: Partial<Achievement>,
  ): Promise<Achievement>;
  deleteAchievement(achievementId: number): Promise<boolean>;
  findAchievementsByMember(
    memberId: number,
    page: number,
    limit: number,
    filters?: { status?: string },
  ): Promise<{ achievements: Achievement[]; total: number }>;
  findAchievementById(achievementId: number): Promise<Achievement | null>;
  approveAchievement(achievementId: number): Promise<Achievement>;
  rejectAchievement(achievementId: number): Promise<Achievement>;

  // Saved Items Management
  saveItem(
    memberId: number,
    itemType: string,
    itemId: number,
    note?: string,
  ): Promise<SavedItem>;
  unsaveItem(
    memberId: number,
    itemType: string,
    itemId: number,
  ): Promise<boolean>;
  findSavedItemsByMember(
    memberId: number,
    page: number,
    limit: number,
    filters?: { itemType?: string },
  ): Promise<{ savedItems: SavedItem[]; total: number }>;
  checkItemSaved(
    memberId: number,
    itemType: string,
    itemId: number,
  ): Promise<boolean>;

  // Notification Management
  createNotification(
    notificationData: Partial<Notification>,
  ): Promise<Notification>;
  findNotificationsByMember(
    memberId: number,
    page: number,
    limit: number,
    unreadOnly?: boolean,
  ): Promise<{ notifications: Notification[]; total: number }>;
  markNotificationAsRead(notificationId: number): Promise<Notification>;
  markAllNotificationsAsRead(memberId: number): Promise<boolean>;
  deleteNotification(notificationId: number): Promise<boolean>;
  countUnreadNotifications(memberId: number): Promise<number>;

  // Peer Verification Management
  createPeerVerification(
    targetMemberId: number,
    verifierMemberId: number,
  ): Promise<PeerVerification>;
  findPeerVerificationsByTarget(
    targetMemberId: number,
  ): Promise<PeerVerification[]>;
  findPeerVerificationsByVerifier(
    verifierMemberId: number,
  ): Promise<PeerVerification[]>;
  checkPeerVerificationExists(
    targetMemberId: number,
    verifierMemberId: number,
  ): Promise<boolean>;
  countPeerVerifications(targetMemberId: number): Promise<number>;

  // User Statistics
  getUserStatistics(memberId: number): Promise<{
    totalAchievements: number;
    approvedAchievements: number;
    totalSavedItems: number;
    unreadNotifications: number;
    peerVerifications: number;
  }>;
}
