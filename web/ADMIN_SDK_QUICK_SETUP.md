# Quick Setup: Firebase Admin SDK

## Step 1: Get Service Account Key from Firebase

1. Go to: https://console.firebase.google.com/
2. Select your project
3. Click ⚙️ **Settings** → **Project settings**
4. Click **Service accounts** tab
5. Click **Generate new private key**
6. Click **Generate key** to confirm
7. A JSON file downloads (e.g., `your-project-firebase-adminsdk-xxxxx.json`)

## Step 2: Save the Key File

**Option A: Save in web folder (recommended)**
- Move the downloaded JSON file to: `web/serviceAccountKey.json`
- Or save it anywhere and use the full path

**Option B: Use base64 encoding (for production)**
- Encode the JSON file to base64 (see below)

## Step 3: Add to .env.local

Create or edit `web/.env.local` and add ONE of these:

**Option A: File path (easiest)**
```env
FIREBASE_SERVICE_ACCOUNT_KEY=./serviceAccountKey.json
```

**Option B: Absolute path (Windows)**
```env
FIREBASE_SERVICE_ACCOUNT_KEY=C:\Users\YourName\path\to\serviceAccountKey.json
```

**Option C: Base64 encoded**
```env
FIREBASE_SERVICE_ACCOUNT_KEY_BASE64=<paste-base64-encoded-json-here>
```

To encode to base64 on Windows PowerShell:
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("serviceAccountKey.json"))
```

## Step 4: Restart Dev Server

```bash
# Stop server (Ctrl+C)
# Then restart:
cd web
npm run dev
```

## Verify It's Working

1. Go to Admin Settings page
2. The yellow warning banner should disappear
3. Try disabling/enabling an admin account - it should work!

## Troubleshooting

**Error: "Failed to read service account key file"**
- Check the file path in `.env.local` is correct
- Make sure the file exists at that location
- On Windows, try using forward slashes `/` or double backslashes `\\`

**Error: "Invalid service account key format"**
- Make sure you downloaded the correct file from Firebase Console
- Don't modify the JSON file - use it as downloaded

**Still seeing "Admin SDK required"**
- Make sure you restarted your dev server after adding to `.env.local`
- Check that `.env.local` is in the `web` folder (not root)
- Verify the environment variable name is exactly: `FIREBASE_SERVICE_ACCOUNT_KEY`

## Security ⚠️

**NEVER commit the service account key to git!**
- The `.gitignore` file already excludes `serviceAccountKey*.json`
- Keep your `.env.local` file secret (it's also in `.gitignore`)
