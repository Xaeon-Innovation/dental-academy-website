# Firestore Security Rules

## Current Issue
Your Firestore security rules are blocking server-side access. Since Next.js server actions run on the server, they need proper permissions.

## Solution Options

### Option 1: Update Firestore Rules (Quick Fix for Development)

Go to Firebase Console → Firestore Database → Rules tab and update your rules to:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all collections for development
    // ⚠️ WARNING: This is NOT secure for production!
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**For Production**, use more restrictive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read access for courses
    match /courses/{courseId} {
      allow read: if true;
      allow write: if false; // Only server-side writes allowed
    }
    
    // Public read access for instructors
    match /instructors/{instructorId} {
      allow read: if true;
      allow write: if false; // Only server-side writes allowed
    }
    
    // Public write for registrations (form submissions)
    match /registrations/{registrationId} {
      allow read: if false; // Only server-side reads
      allow create: if true; // Allow form submissions (authenticated or anonymous)
    }
    
    // Student profiles: each user can read/write only their own document
    match /students/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin-only collections
    match /blog/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    
    match /categories/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    
    match /settings/{document=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

### Option 2: Use Firebase Admin SDK (Recommended for Production)

The Admin SDK bypasses security rules and is designed for server-side operations. See `FIREBASE_ADMIN_SETUP.md` for instructions.

## How to Deploy Rules

1. Copy the rules above
2. Go to [Firebase Console](https://console.firebase.google.com/)
3. Select your project
4. Go to Firestore Database → Rules
5. Paste the rules
6. Click "Publish"

## Testing

After updating rules, test by:
1. Visiting `/admin/courses` - should load courses
2. Visiting `/courses` - should show public courses
3. Running migration at `/admin/migrate-courses` - should create courses
