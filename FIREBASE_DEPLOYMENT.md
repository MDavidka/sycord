# Firebase Deployment Integration

This document explains the Firebase deployment integration implemented in the Sycord admin panel.

## Overview

The Firebase deployment feature allows administrators to deploy the site to Firebase Hosting through a complete OAuth-based workflow. The implementation follows this flow:

1. User clicks "Deploy to Firebase" in the admin panel
2. Redirect to Google OAuth to get authorization code
3. Exchange code for access token + refresh token
4. Check if Firebase app/site exists → create if needed
5. Create hosting version → get upload URL
6. Upload files one by one
7. Finalize version → deployment goes live

## Setup Requirements

### Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Admin Configuration
ADMIN_EMAIL=your-admin-email@example.com  # Email address of the admin user

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000  # or your production URL
```

**Important**: The `ADMIN_EMAIL` environment variable must be set to restrict deployment access to authorized administrators only.

### Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Firebase Hosting API
   - Firebase Management API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `{NEXTAUTH_URL}/api/deploy/firebase/callback`
5. Copy the Client ID and Client Secret to your environment variables

## Usage

### Accessing the Deployment Page

1. Log in as an admin (the email must match the `ADMIN_EMAIL` environment variable)
2. Navigate to Admin Panel → Plugins
3. Click the "Deploy" button in the header
4. You'll be redirected to `/admin/deploy`

### Authentication

1. On the deploy page, click "Authenticate with Google"
2. You'll be redirected to Google OAuth consent screen
3. Grant the required permissions:
   - Cloud Platform access
   - Firebase access
   - Firebase Hosting access
4. After successful authentication, you'll be redirected back to the deploy page

### Deploying to Firebase

1. Enter your Firebase Project ID (required)
2. Enter Site ID (optional - defaults to project ID)
3. Provide files in JSON format:
   ```json
   [
     {
       "path": "index.html",
       "content": "<html><body>Hello World</body></html>"
     },
     {
       "path": "styles/main.css",
       "content": "body { margin: 0; }"
     }
   ]
   ```
4. Click "Deploy to Firebase"
5. Monitor the deployment progress through the following steps:
   - Checking Firebase project
   - Creating hosting version
   - Uploading files
   - Finalizing deployment

### Deployment Status

The deployment page shows:
- Authentication status
- Token expiration (auto-refreshes when needed)
- Recent deployment history
- Real-time deployment progress
- Deployment success/error messages
- Live site URL upon successful deployment

## API Endpoints

### OAuth Flow
- `GET /api/deploy/firebase/oauth` - Initiates Google OAuth flow
- `GET /api/deploy/firebase/callback` - Handles OAuth callback and token exchange

### Deployment Operations
- `POST /api/deploy/firebase/check-app` - Checks/creates Firebase site
- `POST /api/deploy/firebase/create-version` - Creates hosting version
- `POST /api/deploy/firebase/upload` - Uploads files to hosting
- `POST /api/deploy/firebase/finalize` - Finalizes and deploys version

### Status
- `GET /api/deploy/firebase/status` - Gets deployment status and history

## Database Collections

### firebase_deployments
Stores OAuth tokens and credentials:
```javascript
{
  userId: string,           // User email
  accessToken: string,      // Google OAuth access token
  refreshToken: string,     // Google OAuth refresh token
  expiresAt: Date,         // Token expiration time
  createdAt: Date,
  updatedAt: Date
}
```

### deployment_history
Stores deployment records:
```javascript
{
  userId: string,           // User email
  projectId: string,        // Firebase project ID
  siteId: string,          // Firebase site ID
  versionId: string,       // Hosting version ID
  releaseName: string,     // Release name
  deployedAt: Date,
  status: string           // "success" or "error"
}
```

## Security Features

1. **Admin-only access**: Only users with email matching `ADMIN_EMAIL` environment variable can access deployment features
2. **Token refresh**: Automatically refreshes expired OAuth tokens
3. **Secure token storage**: Tokens stored in MongoDB database
4. **OAuth scopes**: Minimal required scopes for Firebase Hosting
5. **Error handling**: Comprehensive error handling and logging
6. **File validation**: Size limits and path sanitization to prevent malicious uploads

## Debugging

All deployment operations include console logging with prefixes:
- `[Firebase OAuth]` - OAuth flow logs
- `[Firebase OAuth Callback]` - Callback handling logs
- `[Firebase Check App]` - App/site checking logs
- `[Firebase Create Version]` - Version creation logs
- `[Firebase Upload]` - File upload logs
- `[Firebase Finalize]` - Deployment finalization logs
- `[Firebase Status]` - Status endpoint logs
- `[Token]` - Token refresh logs

Check server console for detailed deployment progress and error messages.

## Troubleshooting

### "No Firebase credentials found"
- Authenticate with Google first
- Check if tokens are stored in database
- Re-authenticate if needed

### "Failed to create Firebase site"
- Verify Firebase project ID is correct
- Ensure Firebase Hosting API is enabled
- Check OAuth permissions include Firebase scopes

### "Token exchange failed"
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
- Check redirect URI matches OAuth configuration
- Ensure callback URL is accessible

### "Failed to upload files"
- Verify file JSON format is correct
- Check file content is properly encoded
- Ensure files aren't too large

## File Format Example

```json
[
  {
    "path": "index.html",
    "content": "<!DOCTYPE html><html><head><title>My Site</title></head><body><h1>Hello World</h1></body></html>"
  },
  {
    "path": "404.html",
    "content": "<!DOCTYPE html><html><head><title>404</title></head><body><h1>Page Not Found</h1></body></html>"
  },
  {
    "path": "css/style.css",
    "content": "body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }"
  },
  {
    "path": "js/app.js",
    "content": "console.log('App loaded');"
  }
]
```

## Future Enhancements

Potential improvements for the deployment system:
- File upload from local filesystem
- Build integration (automatic build before deploy)
- Multiple environment support (staging, production)
- Rollback functionality
- Deployment preview before going live
- Custom domain configuration
- Analytics integration
