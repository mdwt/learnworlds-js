import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { OAuth2Client } from '../oauth.js';
import type { TokenResponse, LearnWorldsConfig } from '../types.js';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('OAuth2Client', () => {
  let oauth: OAuth2Client;
  let mockAxiosInstance: any;
  const mockConfig: LearnWorldsConfig = {
    schoolDomain: 'testschool',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    apiHost: 'api.testschool.learnworlds.com',
    redirectUri: 'https://app.com/callback',
  };

  beforeEach(() => {
    mockAxiosInstance = {
      post: vi.fn(),
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    oauth = new OAuth2Client(mockConfig);
  });

  describe('getAuthorizationUrl', () => {
    it('should generate correct authorization URL', () => {
      const url = oauth.getAuthorizationUrl('read_user_profile', 'test-state');
      
      expect(url).toContain('https://testschool.learnworlds.com/oauth2/authorize');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('redirect_uri=https%3A%2F%2Fapp.com%2Fcallback');
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=read_user_profile');
      expect(url).toContain('state=test-state');
    });
  });

  describe('exchangeAuthorizationCode', () => {
    it('should exchange code for tokens', async () => {
      const mockTokenResponse: TokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'test-refresh-token',
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockTokenResponse });

      const result = await oauth.exchangeAuthorizationCode({
        code: 'test-code',
        redirectUri: 'https://app.com/callback',
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/oauth2/token',
        expect.stringContaining('grant_type=authorization_code')
      );
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/oauth2/token',
        expect.stringContaining('code=test-code')
      );
      expect(result).toEqual(mockTokenResponse);
      expect(oauth.isAuthenticated()).toBe(true);
    });
  });

  describe('authenticateWithPassword', () => {
    it('should authenticate with username and password', async () => {
      const mockTokenResponse: TokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'test-refresh-token',
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockTokenResponse });

      const result = await oauth.authenticateWithPassword({
        username: 'test@example.com',
        password: 'test-password',
        scope: 'read_user_profile',
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/oauth2/token',
        expect.stringContaining('grant_type=password')
      );
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/oauth2/token',
        expect.stringContaining('username=test%40example.com')
      );
      expect(result).toEqual(mockTokenResponse);
      expect(oauth.isAuthenticated()).toBe(true);
    });
  });

  describe('authenticateWithClientCredentials', () => {
    it('should authenticate with client credentials', async () => {
      const mockTokenResponse: TokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockTokenResponse });

      const result = await oauth.authenticateWithClientCredentials('read_courses');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/oauth2/token',
        expect.stringContaining('grant_type=client_credentials')
      );
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/oauth2/token',
        expect.stringContaining('client_id=test-client-id')
      );
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/oauth2/token',
        expect.stringContaining('client_secret=test-client-secret')
      );
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/oauth2/token',
        expect.stringContaining('scope=read_courses')
      );
      expect(result).toEqual(mockTokenResponse);
      expect(oauth.isAuthenticated()).toBe(true);
    });

    it('should authenticate without scope', async () => {
      const mockTokenResponse: TokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockTokenResponse });

      const result = await oauth.authenticateWithClientCredentials();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/oauth2/token',
        expect.not.stringContaining('scope=')
      );
      expect(result).toEqual(mockTokenResponse);
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token', async () => {
      // First set up initial tokens
      oauth.setTokens({
        accessToken: 'old-token',
        refreshToken: 'test-refresh-token',
      });

      const mockTokenResponse: TokenResponse = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockTokenResponse });

      const result = await oauth.refreshAccessToken();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/oauth2/token',
        expect.stringContaining('grant_type=refresh_token')
      );
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/oauth2/token',
        expect.stringContaining('refresh_token=test-refresh-token')
      );
      expect(result).toEqual(mockTokenResponse);

      const tokens = oauth.getTokens();
      expect(tokens.accessToken).toBe('new-access-token');
    });

    it('should throw error if no refresh token', async () => {
      await expect(oauth.refreshAccessToken()).rejects.toThrow('No refresh token available');
    });
  });

  describe('getAccessToken', () => {
    it('should return access token if valid', async () => {
      oauth.setTokens({
        accessToken: 'test-token',
        expiresAt: new Date(Date.now() + 10000), // Future
      });

      const token = await oauth.getAccessToken();
      expect(token).toBe('test-token');
    });

    it('should refresh token if expired', async () => {
      oauth.setTokens({
        accessToken: 'old-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() - 1000), // Past
      });

      const mockTokenResponse: TokenResponse = {
        access_token: 'new-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockTokenResponse });

      const token = await oauth.getAccessToken();
      expect(token).toBe('new-token');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/oauth2/token',
        expect.stringContaining('grant_type=refresh_token')
      );
    });

    it('should throw error if no access token', async () => {
      await expect(oauth.getAccessToken()).rejects.toThrow('No access token available');
    });
  });

  describe('revokeToken', () => {
    it('should revoke access token', async () => {
      oauth.setTokens({ accessToken: 'test-token' });
      mockAxiosInstance.post.mockResolvedValue({});

      await oauth.revokeToken();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/oauth2/revoke',
        expect.stringContaining('token=test-token')
      );
      expect(oauth.isAuthenticated()).toBe(false);
    });

    it('should revoke specific token', async () => {
      oauth.setTokens({ accessToken: 'test-token' });
      mockAxiosInstance.post.mockResolvedValue({});

      await oauth.revokeToken('other-token');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/oauth2/revoke',
        expect.stringContaining('token=other-token')
      );
      expect(oauth.isAuthenticated()).toBe(true); // Original token still valid
    });
  });

  describe('token callback', () => {
    it('should call onTokenRefresh callback', async () => {
      const onTokenRefresh = vi.fn();
      const configWithCallback: LearnWorldsConfig = {
        ...mockConfig,
        onTokenRefresh,
      };

      oauth = new OAuth2Client(configWithCallback);
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      const mockTokenResponse: TokenResponse = {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockTokenResponse });

      await oauth.authenticateWithPassword({
        username: 'test@example.com',
        password: 'password',
      });

      expect(onTokenRefresh).toHaveBeenCalledWith(mockTokenResponse);
    });
  });
});