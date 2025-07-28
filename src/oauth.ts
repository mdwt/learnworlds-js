import axios, { AxiosInstance } from 'axios';
import { 
  TokenResponse, 
  AuthorizationCodeRequest, 
  ResourceOwnerPasswordRequest,
  LearnWorldsConfig 
} from './types.js';

export class OAuth2Client {
  private http: AxiosInstance;
  private config: LearnWorldsConfig;
  private accessToken?: string;
  private refreshToken?: string;
  private tokenExpiresAt?: Date;

  constructor(config: LearnWorldsConfig) {
    this.config = config;
    this.accessToken = config.accessToken;
    this.refreshToken = config.refreshToken;

    // OAuth2 endpoints use the school-specific domain (not api.learnworlds.com)
    const baseURL = `https://${config.schoolDomain}.learnworlds.com`;
    
    this.http = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  /**
   * Get the authorization URL for the authorization code grant flow
   */
  getAuthorizationUrl(scope = 'read_user_profile', state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri || '',
      response_type: 'code',
      scope,
    });

    if (state) {
      params.append('state', state);
    }

    return `https://${this.config.schoolDomain}.learnworlds.com/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeAuthorizationCode(request: AuthorizationCodeRequest): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: request.code,
      redirect_uri: request.redirectUri,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    const response = await this.http.post<TokenResponse>('/oauth2/token', params.toString());
    
    await this.handleTokenResponse(response.data);
    return response.data;
  }

  /**
   * Get access token using resource owner password credentials grant
   */
  async authenticateWithPassword(request: ResourceOwnerPasswordRequest): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'password',
      username: request.username,
      password: request.password,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    if (request.scope) {
      params.append('scope', request.scope);
    }

    const response = await this.http.post<TokenResponse>('/oauth2/token', params.toString());
    
    await this.handleTokenResponse(response.data);
    return response.data;
  }

  /**
   * Get access token using client credentials grant
   * This is typically used for server-to-server authentication
   */
  async authenticateWithClientCredentials(scope?: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    if (scope) {
      params.append('scope', scope);
    }

    const response = await this.http.post<TokenResponse>('/oauth2/token', params.toString());
    
    await this.handleTokenResponse(response.data);
    return response.data;
  }

  /**
   * Refresh the access token using the refresh token
   */
  async refreshAccessToken(): Promise<TokenResponse> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    const response = await this.http.post<TokenResponse>('/oauth2/token', params.toString());
    
    await this.handleTokenResponse(response.data);
    return response.data;
  }

  /**
   * Revoke the access token
   */
  async revokeToken(token?: string): Promise<void> {
    const tokenToRevoke = token || this.accessToken;
    
    if (!tokenToRevoke) {
      throw new Error('No token to revoke');
    }

    const params = new URLSearchParams({
      token: tokenToRevoke,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    await this.http.post('/oauth2/revoke', params.toString());
    
    if (!token || token === this.accessToken) {
      this.accessToken = undefined;
      this.tokenExpiresAt = undefined;
    }
  }

  /**
   * Get the current access token, refreshing if necessary
   */
  async getAccessToken(): Promise<string> {
    if (!this.accessToken) {
      throw new Error('No access token available. Please authenticate first.');
    }

    // Check if token is expired or about to expire (5 minutes buffer)
    if (this.tokenExpiresAt && this.refreshToken) {
      const now = new Date();
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
      
      if (now.getTime() >= this.tokenExpiresAt.getTime() - bufferTime) {
        await this.refreshAccessToken();
      }
    }

    return this.accessToken!;
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  /**
   * Set tokens manually (useful for restoring session)
   */
  setTokens(tokens: { accessToken: string; refreshToken?: string; expiresAt?: Date }): void {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    this.tokenExpiresAt = tokens.expiresAt;
  }

  /**
   * Get current tokens (useful for persisting session)
   */
  getTokens(): { accessToken?: string; refreshToken?: string; expiresAt?: Date } {
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      expiresAt: this.tokenExpiresAt,
    };
  }

  private async handleTokenResponse(response: TokenResponse): Promise<void> {
    this.accessToken = response.access_token;
    
    if (response.refresh_token) {
      this.refreshToken = response.refresh_token;
    }

    if (response.expires_in) {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + response.expires_in);
      this.tokenExpiresAt = expiresAt;
    }

    // Call the callback if provided
    if (this.config.onTokenRefresh) {
      await this.config.onTokenRefresh(response);
    }
  }
}