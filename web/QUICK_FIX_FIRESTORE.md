# Quick Fix: Firestore Permission Denied Error

## Immediate Solution (5 minutes)

Your Firestore security rules are blocking server-side access. Here's how to fix it:

### Step 1: Open Firebase Console
1. Go to https://console.firebase.google.com/
2. Select your project

### Step 2: Update Security Rules
1. Click **"Firestore Database"** in the left sidebar
2. Click the **"Rules"** tab at the top
3. Replace the existing rules with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Temporary: Allow all reads/writes for development
    // TODO: Restrict these rules for production
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Step 3: Publish Rules
1. Click **"Publish"** button
2. Wait for confirmation

### Step 4: Test
1. Refresh your browser at `/admin/courses`
2. You should now see courses (or empty list if none migrated yet)
3. Go to `/admin/migrate-courses` and click "Run Migration"
4. Courses should now appear!

## Why This Happened

Next.js server actions run on the server, but Firestore security rules default to blocking unauthenticated requests. Since your server actions use the client SDK (not Admin SDK), they need permission in the security rules.

## Next Steps (For Production)

1. **Use Firebase Admin SDK** - See `FIREBASE_ADMIN_SETUP.md`
2. **Restrict Rules** - See `FIRESTORE_SECURITY_RULES.md` for production-ready rules

## Alternative: Use Admin SDK

If you prefer better security, you can use Firebase Admin SDK which bypasses security rules entirely. See `FIREBASE_ADMIN_SETUP.md` for setup instructions.
