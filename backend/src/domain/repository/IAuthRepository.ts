import { User } from '../entities/User';
import { GlobalProfile } from '../entities/GlobalProfile';
import { GlobalIdentityVerification } from '../entities/GlobalIdentityVerification';

/**
 * Repository interface for authentication and authorization operations
 */
export interface IAuthRepository {
  // User Registration & Login
  createUser(email: string, passwordHash: string): Promise<User>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(userId: number): Promise<User | null>;
  updatePassword(userId: number, newPasswordHash: string): Promise<User>;

  // Profile Management
  createGlobalProfile(
    userId: number,
    profileData: Partial<GlobalProfile>,
  ): Promise<GlobalProfile>;
  findGlobalProfileByUserId(userId: number): Promise<GlobalProfile | null>;
  updateGlobalProfile(
    userId: number,
    profileData: Partial<GlobalProfile>,
  ): Promise<GlobalProfile>;

  // Identity Verification
  createIdentityVerification(
    userId: number,
    verificationData: Partial<GlobalIdentityVerification>,
  ): Promise<GlobalIdentityVerification>;
  findIdentityVerificationByUserId(
    userId: number,
  ): Promise<GlobalIdentityVerification | null>;
  findIdentityVerificationByCitizenId(
    citizenId: string,
  ): Promise<GlobalIdentityVerification | null>;

  // Account Status
  activateUser(userId: number): Promise<User>;
  deactivateUser(userId: number): Promise<User>;

  // Password Reset
  updatePasswordResetToken(
    userId: number,
    token: string,
    expiresAt: Date,
  ): Promise<boolean>;
  findUserByResetToken(token: string): Promise<User | null>;
  clearPasswordResetToken(userId: number): Promise<boolean>;

  // Email Verification
  updateEmailVerificationStatus(
    userId: number,
    isVerified: boolean,
  ): Promise<User>;
}
