import { User } from '../entities/User';
import { Organization } from '../entities/Organization';
import { OrganizationMember } from '../entities/OrganizationMember';
import { VerificationRequest } from '../entities/VerificationRequest';

/**
 * Data Access Object interface for admin operations
 * Handles user management, organization management, and content moderation
 */
export interface IAdminDAO {
  // User Management
  findAllUsers(
    page: number,
    limit: number,
    filters?: { isActive?: boolean; email?: string },
  ): Promise<{ users: User[]; total: number }>;
  findUserById(userId: number): Promise<User | null>;
  updateUserStatus(userId: number, isActive: boolean): Promise<User>;
  deleteUser(userId: number): Promise<boolean>;

  // Organization Management
  createOrganization(data: Partial<Organization>): Promise<Organization>;
  updateOrganization(
    organizationId: number,
    data: Partial<Organization>,
  ): Promise<Organization>;
  deleteOrganization(organizationId: number): Promise<boolean>;
  findAllOrganizations(
    page: number,
    limit: number,
  ): Promise<{ organizations: Organization[]; total: number }>;
  findOrganizationById(organizationId: number): Promise<Organization | null>;

  // Organization Member Management
  findMembersByOrganization(
    organizationId: number,
    page: number,
    limit: number,
  ): Promise<{ members: OrganizationMember[]; total: number }>;
  updateMemberStatus(
    memberId: number,
    status: string,
  ): Promise<OrganizationMember>;
  updateMemberVerificationLevel(
    memberId: number,
    level: number,
  ): Promise<OrganizationMember>;
  setTrustedVerifier(
    memberId: number,
    isTrusted: boolean,
  ): Promise<OrganizationMember>;
  removeMemberFromOrganization(memberId: number): Promise<boolean>;

  // Verification Request Management
  findPendingVerificationRequests(
    organizationId: number,
    page: number,
    limit: number,
  ): Promise<{ requests: VerificationRequest[]; total: number }>;
  findVerificationRequestById(
    requestId: number,
  ): Promise<VerificationRequest | null>;
  approveVerificationRequest(
    requestId: number,
    reviewerMemberId: number,
    adminNote?: string,
  ): Promise<VerificationRequest>;
  rejectVerificationRequest(
    requestId: number,
    reviewerMemberId: number,
    adminNote: string,
  ): Promise<VerificationRequest>;

  // Content Moderation
  hideContent(
    contentType: 'news' | 'job' | 'event' | 'forum_post',
    contentId: number,
  ): Promise<boolean>;
  unhideContent(
    contentType: 'news' | 'job' | 'event' | 'forum_post',
    contentId: number,
  ): Promise<boolean>;

  // Statistics
  getSystemStatistics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalOrganizations: number;
    pendingVerifications: number;
  }>;
}
