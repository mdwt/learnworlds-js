import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { LearnWorldsClient } from '../client.js';
import type {
  Course,
  Bundle,
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateUserTagsRequest,
  EnrollUserRequest,
  UnenrollUserRequest,
  Enrollment,
} from '../types.js';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

vi.mock('../oauth.js', () => ({
  OAuth2Client: vi.fn().mockImplementation(() => ({
    getAccessToken: vi.fn().mockResolvedValue('test-access-token'),
    getTokens: vi.fn().mockReturnValue({ refreshToken: null }),
    refreshAccessToken: vi.fn(),
    isAuthenticated: vi.fn().mockReturnValue(true),
  })),
}));

describe('LearnWorldsClient', () => {
  let client: LearnWorldsClient;
  let mockAxiosInstance: {
    request: ReturnType<typeof vi.fn>;
    interceptors: {
      request: {
        use: ReturnType<typeof vi.fn>;
      };
      response: {
        use: ReturnType<typeof vi.fn>;
      };
    };
  };

  beforeEach(() => {
    mockAxiosInstance = {
      request: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn(),
        },
        response: {
          use: vi.fn(),
        },
      },
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

    client = new LearnWorldsClient({
      schoolDomain: 'testschool',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      apiHost: 'api.testschool.learnworlds.com',
    });
  });

  describe('constructor', () => {
    it('should create axios instance with correct config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.testschool.learnworlds.com/v2',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
    });
  });

  describe('getAllCourses', () => {
    it('should fetch all courses successfully', async () => {
      const mockCourses: Course[] = [
        {
          id: 'course-1',
          title: 'Test Course',
          status: 'published',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      mockAxiosInstance.request.mockResolvedValue({
        data: {
          success: true,
          data: mockCourses,
        },
      });

      const result = await client.getAllCourses();

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/courses',
        data: undefined,
        params: undefined,
      });
      expect(result).toEqual(mockCourses);
    });

    it('should fetch courses with pagination params', async () => {
      const mockCourses: Course[] = [];
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockCourses },
      });

      await client.getAllCourses({ page: 2, per_page: 10 });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/courses',
        data: undefined,
        params: { page: 2, per_page: 10 },
      });
    });
  });

  describe('getAllBundles', () => {
    it('should fetch all bundles successfully', async () => {
      const mockBundles: Bundle[] = [
        {
          id: 'bundle-1',
          title: 'Test Bundle',
          status: 'published',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          course_ids: ['course-1', 'course-2'],
        },
      ];

      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockBundles },
      });

      const result = await client.getAllBundles();

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/bundles',
        data: undefined,
        params: undefined,
      });
      expect(result).toEqual(mockBundles);
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const createUserData: CreateUserRequest = {
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
      };

      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        is_active: true,
        roles: ['student'],
        tags: [],
      };

      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockUser },
      });

      const result = await client.createUser(createUserData);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/users',
        data: createUserData,
        params: undefined,
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updateData: UpdateUserRequest = {
        first_name: 'Jane',
        last_name: 'Smith',
      };

      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
        is_active: true,
        roles: ['student'],
        tags: [],
      };

      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockUser },
      });

      const result = await client.updateUser('user-1', updateData);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'PUT',
        url: '/users/user-1',
        data: updateData,
        params: undefined,
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateUserTags', () => {
    it('should update user tags successfully', async () => {
      const tagData: UpdateUserTagsRequest = {
        tags: ['premium', 'active'],
        action: 'add',
      };

      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
        is_active: true,
        roles: ['student'],
        tags: ['premium', 'active'],
      };

      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockUser },
      });

      const result = await client.updateUserTags('user-1', tagData);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'PATCH',
        url: '/users/user-1/tags',
        data: tagData,
        params: undefined,
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('enrollUserToProduct', () => {
    it('should enroll user to product successfully', async () => {
      const enrollmentData: EnrollUserRequest = {
        user_id: 'user-1',
        product_id: 'course-1',
        product_type: 'course',
        enrollment_type: 'free',
      };

      const mockEnrollment: Enrollment = {
        id: 'enrollment-1',
        user_id: 'user-1',
        product_id: 'course-1',
        product_type: 'course',
        enrollment_type: 'free',
        status: 'active',
        enrolled_at: '2023-01-01T00:00:00Z',
      };

      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockEnrollment },
      });

      const result = await client.enrollUserToProduct(enrollmentData);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/enrollments',
        data: enrollmentData,
        params: undefined,
      });
      expect(result).toEqual(mockEnrollment);
    });
  });

  describe('unenrollUserFromProduct', () => {
    it('should unenroll user from product successfully', async () => {
      const unenrollmentData: UnenrollUserRequest = {
        user_id: 'user-1',
        product_id: 'course-1',
        product_type: 'course',
      };

      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: undefined },
      });

      await client.unenrollUserFromProduct(unenrollmentData);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'DELETE',
        url: '/enrollments',
        data: unenrollmentData,
        params: undefined,
      });
    });
  });

  describe('error handling', () => {
    it('should handle API response with success: false', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          success: false,
          message: 'API request failed',
          errors: ['Something went wrong'],
        },
      });

      await expect(client.getAllCourses()).rejects.toMatchObject({
        message: 'API request failed',
      });
    });
  });
});