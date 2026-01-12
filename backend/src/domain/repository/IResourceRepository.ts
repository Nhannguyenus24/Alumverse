import { LearningResource } from '../entities/LearningResource';
import { Job } from '../entities/Job';

/**
 * Repository interface for learning resources and job posting operations
 */
export interface IResourceRepository {
  // Learning Resource Management
  createLearningResource(
    resourceData: Partial<LearningResource>,
  ): Promise<LearningResource>;
  updateLearningResource(
    resourceId: number,
    resourceData: Partial<LearningResource>,
  ): Promise<LearningResource>;
  deleteLearningResource(resourceId: number): Promise<boolean>;
  findLearningResourceById(
    resourceId: number,
  ): Promise<LearningResource | null>;
  findLearningResourcesByOrganization(
    organizationId: number,
    page: number,
    limit: number,
    filters?: { type?: string },
  ): Promise<{ resources: LearningResource[]; total: number }>;
  findLearningResourcesByUploader(
    uploaderMemberId: number,
    page: number,
    limit: number,
  ): Promise<{ resources: LearningResource[]; total: number }>;
  searchLearningResources(
    organizationId: number,
    keyword: string,
    page: number,
    limit: number,
  ): Promise<{ resources: LearningResource[]; total: number }>;

  // Job Management
  createJob(jobData: Partial<Job>): Promise<Job>;
  updateJob(jobId: number, jobData: Partial<Job>): Promise<Job>;
  deleteJob(jobId: number): Promise<boolean>;
  findJobById(jobId: number): Promise<Job | null>;
  findJobsByOrganization(
    organizationId: number,
    page: number,
    limit: number,
    filters?: { type?: string; isActive?: boolean; isReferral?: boolean },
  ): Promise<{ jobs: Job[]; total: number }>;
  findJobsByPoster(
    posterMemberId: number,
    page: number,
    limit: number,
  ): Promise<{ jobs: Job[]; total: number }>;
  searchJobs(
    organizationId: number,
    keyword: string,
    page: number,
    limit: number,
  ): Promise<{ jobs: Job[]; total: number }>;
  findActiveJobs(
    organizationId: number,
    page: number,
    limit: number,
  ): Promise<{ jobs: Job[]; total: number }>;
  activateJob(jobId: number): Promise<Job>;
  deactivateJob(jobId: number): Promise<Job>;
  findJobsByDeadline(
    organizationId: number,
    beforeDate: Date,
    page: number,
    limit: number,
  ): Promise<{ jobs: Job[]; total: number }>;

  // Statistics
  getResourceStatistics(organizationId: number): Promise<{
    totalResources: number;
    resourcesByType: { type: string; count: number }[];
  }>;

  getJobStatistics(organizationId: number): Promise<{
    totalJobs: number;
    activeJobs: number;
    referralJobs: number;
    jobsByType: { type: string; count: number }[];
  }>;
}
