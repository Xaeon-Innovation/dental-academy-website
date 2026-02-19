# Firebase Admin SDK Setup (Optional - Better Security)

For production, it's recommended to use Firebase Admin SDK for server-side operations as it bypasses security rules and provides better security.

## Setup Steps

### 1. Install Admin SDK

```bash
npm install firebase-admin
```

### 2. Get Service Account Key

**Step-by-step instructions:**

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Sign in with your Google account
   - Select your Firebase project

2. **Navigate to Project Settings**
   - Click the ⚙️ **gear icon** (Settings) in the top left, next to "Project Overview"
   - Select **"Project settings"** from the dropdown menu

3. **Go to Service Accounts tab**
   - In the Project Settings page, click on the **"Service accounts"** tab at the top
   - You'll see a section titled "Firebase Admin SDK"

4. **Generate Private Key**
   - Click the **"Generate new private key"** button
   - A warning dialog will appear - click **"Generate key"** to confirm
   - A JSON file will automatically download (e.g., `your-project-name-firebase-adminsdk-xxxxx.json`)

5. **Save the JSON file securely**
   - ⚠️ **IMPORTANT**: This file contains sensitive credentials - **never commit it to git!**
   - Save it in a secure location (e.g., `web/serviceAccountKey.json` or outside your project folder)
   - Make sure `.gitignore` includes `serviceAccountKey.json` and `*.json` (or be more specific)

6. **Add to `.env.local`**:

**Option A: Direct file path (recommended for local development)**
```env
FIREBASE_SERVICE_ACCOUNT_KEY=./serviceAccountKey.json
# Or use absolute path:
# FIREBASE_SERVICE_ACCOUNT_KEY=C:\Users\YourName\path\to\serviceAccountKey.json
```

**Option B: Base64 encoded (recommended for production/deployment)**
```env
FIREBASE_SERVICE_ACCOUNT_KEY_BASE64=<base64-encoded-json>
```

To encode the JSON file to base64:
- **Windows PowerShell:**
  ```powershell
  [Convert]::ToBase64String([IO.File]::ReadAllBytes("serviceAccountKey.json"))
  ```
- **Linux/Mac:**
  ```bash
  base64 -i serviceAccountKey.json
  ```

### 3. Verify Admin Config

The admin config file already exists at `web/src/lib/firebase/admin.ts`. It will automatically use the service account key from your `.env.local` file.

**The file is already set up!** ✅

If you need to check or modify it, here's what it looks like:

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

### 4. Restart Your Development Server

After adding the service account key to `.env.local`:

```bash
# Stop your current dev server (Ctrl+C)
# Then restart it:
npm run dev
```

The Admin SDK will now be available and disable/enable functionality will work!

### 5. Verify It's Working

1. Go to your admin settings page
2. The yellow warning banner should disappear
3. Try disabling/enabling an admin account - it should work without errors

## Benefits

- ✅ Bypasses security rules (server-side only)
- ✅ Better security (no client-side access)
- ✅ More reliable for server actions
- ✅ Can use Firestore security rules for client-side only

## Troubleshooting

**Error: "Admin SDK required"**
- Make sure you've added the service account key to `.env.local`
- Verify the file path is correct (use relative path from project root or absolute path)
- Restart your development server after adding the environment variable
- Check that the JSON file is valid (open it and verify it's proper JSON)

**Error: "Cannot find module"**
- Make sure the path in `.env.local` is correct
- On Windows, use forward slashes `/` or double backslashes `\\` in the path
- Try using an absolute path instead of a relative path

**Error: "Invalid service account"**
- Make sure you downloaded the correct JSON file from Firebase Console
- Don't modify the JSON file - use it as downloaded
- If you regenerated the key, make sure you're using the latest one

## Security Notes

⚠️ **NEVER commit the service account key to git!**

Make sure your `.gitignore` includes:
```
serviceAccountKey.json
*.json
# Or be more specific:
# serviceAccountKey*.json
```

The service account key has full admin access to your Firebase project. Keep it secure!
