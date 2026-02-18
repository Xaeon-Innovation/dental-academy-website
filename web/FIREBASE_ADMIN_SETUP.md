# Firebase Admin SDK Setup (Optional - Better Security)

For production, it's recommended to use Firebase Admin SDK for server-side operations as it bypasses security rules and provides better security.

## Setup Steps

### 1. Install Admin SDK

```bash
npm install firebase-admin
```

### 2. Get Service Account Key

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save the JSON file securely (don't commit to git!)
4. Add to `.env.local`:

```env
FIREBASE_SERVICE_ACCOUNT_KEY=/path/to/serviceAccountKey.json
# OR base64 encoded:
FIREBASE_SERVICE_ACCOUNT_KEY_BASE64=<base64-encoded-json>
```

### 3. Create Admin Config

Create `web/src/lib/firebase/admin.ts`:

```typescript
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp(): App {
  const apps = getApps();
  if (apps.length > 0) return apps[0];

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? require(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : JSON.parse(
        Buffer.from(
          process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 || "",
          "base64"
        ).toString()
      );

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

export const adminApp = getAdminApp();
export const adminDb = getFirestore(adminApp);
```

### 4. Update Server Actions

Update `web/src/lib/actions/course.ts` to use Admin SDK:

```typescript
import { adminDb } from "@/lib/firebase/admin";
// Replace `db` with `adminDb` in all operations
```

## Benefits

- ✅ Bypasses security rules (server-side only)
- ✅ Better security (no client-side access)
- ✅ More reliable for server actions
- ✅ Can use Firestore security rules for client-side only

## Note

For now, updating Firestore security rules (Option 1) is the quickest solution. You can migrate to Admin SDK later for production.
