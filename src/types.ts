export interface LearnWorldsConfig {
  schoolDomain: string;
  clientId: string;
  clientSecret: string;
  apiHost: string;
  redirectUri?: string;
  accessToken?: string;
  refreshToken?: string;
  onTokenRefresh?: (tokens: TokenResponse) => void | Promise<void>;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface AuthorizationCodeRequest {
  code: string;
  redirectUri: string;
}

export interface ResourceOwnerPasswordRequest {
  username: string;
  password: string;
  scope?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  status: 'published' | 'draft' | 'archived';
  price?: number;
  currency?: string;
  created_at: string;
  updated_at: string;
  image_url?: string;
  slug?: string;
  category_id?: string;
  instructor_id?: string;
  duration?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  enrolled_users_count?: number;
}

export interface Bundle {
  id: string;
  title: string;
  description?: string;
  status: 'published' | 'draft' | 'archived';
  price?: number;
  currency?: string;
  created_at: string;
  updated_at: string;
  image_url?: string;
  slug?: string;
  course_ids: string[];
  discount_percentage?: number;
}

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: boolean;
  roles: string[];
  tags: string[];
  custom_fields?: Record<string, unknown>;
}

export interface CreateUserRequest {
  email: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  password?: string;
  bio?: string;
  tags?: string[];
  custom_fields?: Record<string, unknown>;
  send_welcome_email?: boolean;
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  username?: string;
  bio?: string;
  custom_fields?: Record<string, unknown>;
  is_active?: boolean;
}

export interface UpdateUserTagsRequest {
  tags: string[];
  action: 'add' | 'remove' | 'replace';
}

export interface EnrollUserRequest {
  user_id: string;
  product_id: string;
  product_type: 'course' | 'bundle';
  enrollment_type?: 'free' | 'paid';
  expires_at?: string;
}

export interface UnenrollUserRequest {
  user_id: string;
  product_id: string;
  product_type: 'course' | 'bundle';
}

export interface Enrollment {
  id: string;
  user_id: string;
  product_id: string;
  product_type: 'course' | 'bundle';
  enrollment_type: 'free' | 'paid';
  status: 'active' | 'inactive' | 'expired';
  enrolled_at: string;
  expires_at?: string;
  progress?: number;
  completion_date?: string;
}

export interface LearnWorldsError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
}