import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import {
  LearnWorldsConfig,
  LearnWorldsError,
  ApiResponse,
  PaginationParams,
  Course,
  Bundle,
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateUserTagsRequest,
  EnrollUserRequest,
  UnenrollUserRequest,
  Enrollment,
} from './types.js';
import { OAuth2Client } from './oauth.js';

export class LearnWorldsClient {
  private http: AxiosInstance;
  private oauth: OAuth2Client;

  constructor(config: LearnWorldsConfig) {
    this.oauth = new OAuth2Client(config);

    // Use the provided API host (each user gets a unique host from LearnWorlds)
    const baseURL = `https://${config.apiHost}/v2`;

    this.http = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Add request interceptor to inject auth token
    this.http.interceptors.request.use(
      async (config) => {
        try {
          const token = await this.oauth.getAccessToken();
          config.headers.Authorization = `Bearer ${token}`;
        } catch (error) {
          // If no token available, continue without auth header
          // This allows public endpoints to work
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.http.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // If 401 and we have a refresh token, try to refresh
        if (error.response?.status === 401 && !originalRequest._retry && this.oauth.getTokens().refreshToken) {
          originalRequest._retry = true;
          
          try {
            await this.oauth.refreshAccessToken();
            const token = await this.oauth.getAccessToken();
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return this.http(originalRequest);
          } catch (refreshError) {
            // Refresh failed, reject with original error
            return Promise.reject(this.handleError(error));
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Get the OAuth2 client for authentication operations
   */
  get auth(): OAuth2Client {
    return this.oauth;
  }

  private handleError(error: AxiosError): LearnWorldsError {
    const lwError = new Error() as LearnWorldsError;
    lwError.name = 'LearnWorldsError';

    if (error.response) {
      lwError.status = error.response.status;
      lwError.message = (error.response.data as { message?: string })?.message || error.message || 'API Error';
      lwError.details = error.response.data;
      
      switch (error.response.status) {
        case 401:
          lwError.code = 'UNAUTHORIZED';
          lwError.message = 'Invalid API key or authentication failed';
          break;
        case 403:
          lwError.code = 'FORBIDDEN';
          lwError.message = 'Access denied';
          break;
        case 404:
          lwError.code = 'NOT_FOUND';
          lwError.message = 'Resource not found';
          break;
        case 422:
          lwError.code = 'VALIDATION_ERROR';
          lwError.message = 'Validation failed';
          break;
        case 429:
          lwError.code = 'RATE_LIMIT';
          lwError.message = 'Rate limit exceeded';
          break;
        default:
          lwError.code = 'API_ERROR';
      }
    } else if (error.request) {
      lwError.code = 'NETWORK_ERROR';
      lwError.message = 'Network error - unable to reach API';
    } else {
      lwError.code = 'UNKNOWN_ERROR';
      lwError.message = error.message || 'Unknown error occurred';
    }

    return lwError;
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: unknown,
    params?: unknown
  ): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.http.request({
      method,
      url: endpoint,
      data,
      params,
    });

    if (!response.data.success) {
      const error = new Error(response.data.message || 'API request failed') as LearnWorldsError;
      error.code = 'API_ERROR';
      error.details = response.data.errors;
      throw error;
    }

    return response.data.data;
  }

  async getAllCourses(params?: PaginationParams): Promise<Course[]> {
    return this.makeRequest<Course[]>('GET', '/courses', undefined, params);
  }

  async getAllBundles(params?: PaginationParams): Promise<Bundle[]> {
    return this.makeRequest<Bundle[]>('GET', '/bundles', undefined, params);
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    return this.makeRequest<User>('POST', '/users', userData);
  }

  async updateUser(userId: string, userData: UpdateUserRequest): Promise<User> {
    return this.makeRequest<User>('PUT', `/users/${userId}`, userData);
  }

  async updateUserTags(userId: string, tagData: UpdateUserTagsRequest): Promise<User> {
    return this.makeRequest<User>('PATCH', `/users/${userId}/tags`, tagData);
  }

  async enrollUserToProduct(enrollmentData: EnrollUserRequest): Promise<Enrollment> {
    return this.makeRequest<Enrollment>('POST', '/enrollments', enrollmentData);
  }

  async unenrollUserFromProduct(unenrollmentData: UnenrollUserRequest): Promise<void> {
    await this.makeRequest<void>('DELETE', '/enrollments', unenrollmentData);
  }

  async getUser(userId: string): Promise<User> {
    return this.makeRequest<User>('GET', `/users/${userId}`);
  }

  async getCourse(courseId: string): Promise<Course> {
    return this.makeRequest<Course>('GET', `/courses/${courseId}`);
  }

  async getBundle(bundleId: string): Promise<Bundle> {
    return this.makeRequest<Bundle>('GET', `/bundles/${bundleId}`);
  }

  async getUserEnrollments(userId: string): Promise<Enrollment[]> {
    return this.makeRequest<Enrollment[]>('GET', `/users/${userId}/enrollments`);
  }
}