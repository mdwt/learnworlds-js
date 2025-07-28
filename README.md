# LearnWorlds SDK

A TypeScript SDK for integrating with the LearnWorlds API in Node.js backends with full OAuth2 support.

## Installation

```bash
pnpm install
```

## Authentication

The SDK supports OAuth2 authentication with multiple grant types:

### Client Credentials Grant (Server-to-Server)

Best for server-side applications that need to access the API without user context:

```typescript
import { LearnWorldsClient } from 'learnworlds-sdk';

const client = new LearnWorldsClient({
  schoolDomain: 'yourschool',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  apiHost: 'api.yourschool.learnworlds.com', // Your unique API host
});

// Authenticate with client credentials
const tokens = await client.auth.authenticateWithClientCredentials('read_courses');

// Now you can make API calls
const courses = await client.getAllCourses();
```

### Authorization Code Grant (Web Apps)

Best for web applications where users log in through LearnWorlds:

```typescript
import { LearnWorldsClient } from 'learnworlds-sdk';

const client = new LearnWorldsClient({
  schoolDomain: 'yourschool',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  apiHost: 'api.yourschool.learnworlds.com', // Your unique API host
  redirectUri: 'https://yourapp.com/callback',
});

// Step 1: Get authorization URL
const authUrl = client.auth.getAuthorizationUrl('read_user_profile');
// Redirect user to authUrl

// Step 2: After user authorizes, exchange code for token
const tokens = await client.auth.exchangeAuthorizationCode({
  code: 'authorization-code-from-callback',
  redirectUri: 'https://yourapp.com/callback',
});
```

### Resource Owner Password Credentials Grant (Trusted Apps)

Best for trusted applications where you collect username/password directly:

```typescript
const tokens = await client.auth.authenticateWithPassword({
  username: 'user@example.com',
  password: 'user-password',
  scope: 'read_user_profile',
});
```

### Using Existing Tokens

```typescript
const client = new LearnWorldsClient({
  schoolDomain: 'yourschool',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  apiHost: 'api.yourschool.learnworlds.com', // Your unique API host
  accessToken: 'existing-access-token',
  refreshToken: 'existing-refresh-token',
});
```

### Token Management

```typescript
// Get current tokens (for persistence)
const tokens = client.auth.getTokens();

// Set tokens (for session restoration)
client.auth.setTokens({
  accessToken: 'stored-access-token',
  refreshToken: 'stored-refresh-token',
  expiresAt: new Date('2024-12-31T00:00:00Z'),
});

// Check if authenticated
if (client.auth.isAuthenticated()) {
  // Make API calls
}

// Manually refresh token
const newTokens = await client.auth.refreshAccessToken();

// Revoke token
await client.auth.revokeToken();
```

### Automatic Token Refresh

The SDK automatically refreshes expired tokens if a refresh token is available. You can also provide a callback to persist updated tokens:

```typescript
const client = new LearnWorldsClient({
  schoolDomain: 'yourschool',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  apiHost: 'api.yourschool.learnworlds.com', // Your unique API host
  onTokenRefresh: async (tokens) => {
    // Save tokens to database/storage
    await saveTokensToDatabase(tokens);
  },
});
```

## API Usage

Once authenticated, you can use the API methods:

```typescript
// Get all courses
const courses = await client.getAllCourses({ page: 1, per_page: 10 });

// Get all bundles
const bundles = await client.getAllBundles();

// Create a user
const newUser = await client.createUser({
  email: 'user@example.com',
  first_name: 'John',
  last_name: 'Doe',
  tags: ['premium'],
});

// Update a user
const updatedUser = await client.updateUser('user-id', {
  first_name: 'Jane',
  bio: 'Updated bio',
});

// Update user tags
await client.updateUserTags('user-id', {
  tags: ['premium', 'active'],
  action: 'add',
});

// Enroll user to product
const enrollment = await client.enrollUserToProduct({
  user_id: 'user-id',
  product_id: 'course-id',
  product_type: 'course',
  enrollment_type: 'free',
});

// Unenroll user from product
await client.unenrollUserFromProduct({
  user_id: 'user-id',
  product_id: 'course-id',
  product_type: 'course',
});
```

## API Methods

### Courses
- `getAllCourses(params?: PaginationParams): Promise<Course[]>`
- `getCourse(courseId: string): Promise<Course>`

### Bundles
- `getAllBundles(params?: PaginationParams): Promise<Bundle[]>`
- `getBundle(bundleId: string): Promise<Bundle>`

### Users
- `createUser(userData: CreateUserRequest): Promise<User>`
- `updateUser(userId: string, userData: UpdateUserRequest): Promise<User>`
- `updateUserTags(userId: string, tagData: UpdateUserTagsRequest): Promise<User>`
- `getUser(userId: string): Promise<User>`
- `getUserEnrollments(userId: string): Promise<Enrollment[]>`

### Enrollments
- `enrollUserToProduct(enrollmentData: EnrollUserRequest): Promise<Enrollment>`
- `unenrollUserFromProduct(unenrollmentData: UnenrollUserRequest): Promise<void>`

## Error Handling

The SDK throws `LearnWorldsError` instances with detailed error information:

```typescript
try {
  const courses = await client.getAllCourses();
} catch (error) {
  if (error instanceof LearnWorldsError) {
    console.error('Status:', error.status);
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Details:', error.details);
  }
}
```

## Development

```bash
# Install dependencies
pnpm install

# Build the project
pnpm run build

# Run tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Type checking
pnpm run typecheck

# Linting
pnpm run lint
```

## Authentication

The SDK uses Bearer token authentication. You need to provide your LearnWorlds API key when creating a client instance.

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions for all API methods, request/response objects, and error types.

## Important Note on URLs

The LearnWorlds API uses two different base URLs:

- **OAuth2 endpoints** (authorization, token exchange): `https://yourschool.learnworlds.com`
- **API endpoints** (courses, users, etc.): `https://your-unique-api-host/v2`

Each user gets a unique API host from LearnWorlds. You must provide both the `schoolDomain` (for OAuth2) and `apiHost` (for API calls) in the configuration.

### Getting Your API Host

When you request API credentials from LearnWorlds (under Settings → Developers → API), you'll receive:
- Client ID and Client Secret
- Your unique API host URL (e.g., `api.xyz123.learnworlds.com`)

## API Version

This SDK uses LearnWorlds API v2. Version 1 is no longer supported.