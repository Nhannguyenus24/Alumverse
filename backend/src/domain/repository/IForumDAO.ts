import { ForumTopic } from '../entities/ForumTopic';
import { ForumPost } from '../entities/ForumPost';

/**
 * Data Access Object interface for forum Q&A operations
 */
export interface IForumDAO {
  // Topic Management
  createTopic(topicData: Partial<ForumTopic>): Promise<ForumTopic>;
  updateTopic(
    topicId: number,
    topicData: Partial<ForumTopic>,
  ): Promise<ForumTopic>;
  deleteTopic(topicId: number): Promise<boolean>;
  findTopicById(topicId: number): Promise<ForumTopic | null>;
  findTopicsByOrganization(
    organizationId: number,
    page: number,
    limit: number,
  ): Promise<{ topics: ForumTopic[]; total: number }>;

  // Post Management
  createPost(postData: Partial<ForumPost>): Promise<ForumPost>;
  updatePost(postId: number, postData: Partial<ForumPost>): Promise<ForumPost>;
  deletePost(postId: number): Promise<boolean>;
  findPostById(postId: number): Promise<ForumPost | null>;
  findPostsByTopic(
    topicId: number,
    page: number,
    limit: number,
  ): Promise<{ posts: ForumPost[]; total: number }>;
  findPostsByAuthor(
    authorMemberId: number,
    page: number,
    limit: number,
  ): Promise<{ posts: ForumPost[]; total: number }>;

  // Search & Filter
  searchPosts(
    organizationId: number,
    keyword: string,
    page: number,
    limit: number,
  ): Promise<{ posts: ForumPost[]; total: number }>;
  findRecentPosts(organizationId: number, limit: number): Promise<ForumPost[]>;

  // Statistics
  countPostsByTopic(topicId: number): Promise<number>;
  getTopicStatistics(topicId: number): Promise<{
    totalPosts: number;
    totalAuthors: number;
    lastPostDate: Date | null;
  }>;
}
