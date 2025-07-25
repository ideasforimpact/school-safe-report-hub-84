# Dual Session Management Implementation

## Overview
This implementation provides separate session validation for backoffice users (custom JWT) and SSO users (Supabase session management) to prevent session conflicts and expiration issues during SSO login.

## Key Changes

### 1. Session Validation (`src/utils/sessionValidation.ts`)
- **`validateSupabaseSession()`**: Validates SSO users using Supabase's built-in session management
- **`validateBackofficeSession()`**: Validates backoffice users using custom JWT tokens
- **`validateSession()`**: Universal validator that detects user type and applies appropriate validation

### 2. Enhanced Auth Persistence (`src/store/authPersistence.ts`)
- Added `sessionType` field to track whether session is 'backoffice' or 'sso'
- **Backoffice sessions**: Stored in sessionStorage (more secure, shorter-lived)
- **SSO sessions**: Stored in localStorage (better persistence across browser sessions)
- JWT expiration checking only applies to backoffice users

### 3. Session Refresh Hook (`src/hooks/useSessionRefresh.ts`)
- Automatic session validation every 5 minutes
- Uses appropriate validation method based on user type
- Handles session expiration with proper cleanup and navigation

### 4. AuthProvider Updates (`src/contexts/auth/AuthProvider.tsx`)
- Uses universal `validateSession()` during initialization
- Properly marks SSO sessions with correct session type
- Integrated automatic session refresh

### 5. Backoffice Auth (`src/hooks/useBackofficeAuth.ts`)
- Marks backoffice sessions with `sessionType: 'backoffice'`

## How It Works

### For SSO Users:
1. Uses Supabase's built-in session management
2. No custom JWT validation applied
3. Sessions persist in localStorage
4. Validation checks Supabase session expiration

### For Backoffice Users:
1. Uses custom JWT tokens for validation
2. Sessions stored in sessionStorage (more secure)
3. JWT expiration and signature validation applied
4. 24-hour token lifespan

### Universal Validation:
1. Detects user type from persisted auth state
2. Applies appropriate validation method
3. Prevents session conflicts between user types

## Benefits

✅ **Prevents SSO Login Issues**: SSO users no longer have JWT validation interfering with their sessions

✅ **Maintains Security**: Backoffice users still get robust JWT-based validation

✅ **Automatic Session Management**: Background validation prevents unexpected logouts

✅ **Proper Session Refresh**: Uses appropriate refresh mechanism for each user type

✅ **No Session Conflicts**: Clear separation between backoffice and SSO session handling

## Usage

The implementation is automatic - no changes needed in existing components. The system automatically:

1. Detects user type during authentication
2. Applies appropriate session validation
3. Stores sessions in the correct storage location
4. Refreshes sessions using the correct method

This resolves the SSO login flow issues while maintaining security for backoffice users.