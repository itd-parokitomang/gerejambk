# Setup Guide - Paroki Tomang App

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Setup](#firebase-setup)
3. [Expo/React Native Setup](#exporeact-native-setup)
4. [Development Setup](#development-setup)
5. [Deployment Setup](#deployment-setup)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

**For Development:**
- Node.js 18+ ([Download](https://nodejs.org/))
- Yarn package manager (`npm install -g yarn`)
- Git
- Code editor (VS Code recommended)

**For Mobile Testing:**
- Expo Go app on smartphone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- OR Android Studio / Xcode for emulators

**For Deployment:**
- Vercel/Netlify account (for web)
- Expo account (for mobile builds)

---

## Firebase Setup

### Step 1: Firebase Console Access

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **parokitomang-4f136**
3. Or create new project if needed

### Step 2: Enable Authentication

1. Go to **Authentication** section
2. Click **Get Started** (if first time)
3. Go to **Sign-in method** tab
4. Enable **Email/Password** provider
5. Click **Save**

### Step 3: Create Firestore Database

1. Go to **Firestore Database**
2. Click **Create database**
3. Select mode: **Start in production mode**
4. Choose location: **asia-southeast1 (Singapore)**
5. Click **Enable**

### Step 4: Configure Firestore Security Rules

1. Go to **Firestore Database** > **Rules** tab
2. Replace with the following rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'superadmin'];
    }
    
    function isSuperAdmin() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'superadmin';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isAdmin() || request.auth.uid == userId;
      allow delete: if isSuperAdmin();
    }
    
    // Settings collection
    match /settings/{settingId} {
      allow read: if true;  // Public read
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isSuperAdmin();
    }
    
    // Pages collection
    match /pages/{pageId} {
      allow read: if true;  // Public read
      allow write: if isAdmin();
    }
  }
}
```

3. Click **Publish**
4. Wait for confirmation

### Step 5: Create Superadmin Account

**IMPORTANT:** Create manually via Firebase Console

1. Go to **Authentication** > **Users** tab
2. Click **Add user** button
3. Enter:
   - **Email:** `joni@email.com`
   - **Password:** `joni2#Marjoni`
4. Click **Add user**
5. Note the UID (will be used for profile)

**First Login:** Saat superadmin login pertama kali, profile akan auto-created di Firestore dengan role 'superadmin'.

### Step 6: Verify Firebase Config

Check `/app/frontend/config/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyDgLPrzXq7uHNSv5KdBXRRWVQgRWDiKsrU",
  authDomain: "parokitomang-4f136.firebaseapp.com",
  projectId: "parokitomang-4f136",
  storageBucket: "parokitomang-4f136.firebasestorage.app",
  messagingSenderId: "717277110880",
  appId: "1:717277110880:web:01b6c2c687901071d79905"
};
```

✅ Config already set in code, no need to change.

---

## Expo/React Native Setup

### Step 1: Install Dependencies

```bash
cd /app/frontend
yarn install
```

### Step 2: Environment Variables

Untuk setup standar, file `/app/frontend/.env` **tidak wajib**.  
Jika Anda menambah `.env`, cukup gunakan variabel yang memang dipakai di kode (misalnya untuk konfigurasi Expo/Firebase tambahan), dan **tidak perlu** `EXPO_PUBLIC_BACKEND_URL` karena backend sudah murni Firebase.

### Step 3: Verify Expo Configuration

Check `/app/frontend/app.json`:

```json
{
  "expo": {
    "name": "Paroki Tomang",
    "slug": "paroki-tomang",
    "version": "1.0.0",
    "platforms": ["ios", "android", "web"],
    ...
  }
}
```

### Step 4: Start Development Server

```bash
cd /app/frontend
expo start

# Or with tunnel (for remote testing)
expo start --tunnel
```

**Access URLs:**
- Web: http://localhost:3000
- Mobile: Scan QR code with Expo Go
- Android Emulator: Press `a`
- iOS Simulator: Press `i`

---

## Development Setup

### Project Structure

```
/app/
├── frontend/           # Expo app
│   ├── app/           # Routes (Expo Router)
│   ├── components/    # Reusable components
│   ├── contexts/      # React contexts
│   ├── services/      # Firebase services
│   ├── config/        # Firebase config
│   └── assets/        # Images, fonts
│
├── docs/              # Documentation
│   ├── arsitektur.md
│   ├── setup.md
│   └── code.md
```

### Development Workflow

**1. Start Development:**
```bash
cd /app/frontend
expo start
```

**2. Make Changes:**
- Edit files in `app/`, `components/`, `services/`
- Hot reload automatically refreshes

**3. Test:**
- Web: Open http://localhost:3000
- Mobile: Scan QR with Expo Go
- Check browser console for errors

**4. Debug:**
- Browser DevTools (F12) for web
- React Native Debugger for mobile
- Check Expo console for errors

### Key Commands

```bash
# Start dev server
yarn start

# Start web only
yarn web

# Clear cache
yarn start --clear

# Build for production
yarn build:web

# Lint code
yarn lint
```

---

## Deployment Setup

### Web Deployment (Vercel)

**Step 1: Build Web App**
```bash
cd /app/frontend
expo export --platform web
```

This creates `dist/` folder with static files.

**Step 2: Deploy to Vercel**

**Option A: Vercel CLI**
```bash
npm install -g vercel
vercel login
cd /app/frontend
vercel --prod ./dist
```

**Option B: Vercel Dashboard**
1. Push code to GitHub
2. Import repo in [Vercel](https://vercel.com)
3. Build settings:
   - Framework: None
   - Build Command: `cd frontend && expo export --platform web`
   - Output Directory: `frontend/dist`
4. Deploy!

### Web Deployment (Netlify)

**Option A: Netlify CLI**
```bash
npm install -g netlify-cli
netlify login
cd /app/frontend
expo export --platform web
netlify deploy --prod --dir=dist
```

**Option B: Netlify Dashboard**
1. Push code to GitHub
2. Import repo in [Netlify](https://netlify.com)
3. Build settings:
   - Build Command: `cd frontend && expo export --platform web`
   - Publish Directory: `frontend/dist`
4. Deploy!

File `netlify.toml` already configured.

### Mobile Deployment (Expo EAS)

**Step 1: Install EAS CLI**
```bash
npm install -g eas-cli
eas login
```

**Step 2: Configure EAS**
```bash
cd /app/frontend
eas build:configure
```

**Step 3: Build APK/IPA**

**Android:**
```bash
eas build --platform android --profile production
```

**iOS:**
```bash
eas build --platform ios --profile production
```

⚠️ iOS build requires Apple Developer account ($99/year)

**Step 4: Download & Distribute**

1. Wait for build to complete
2. Download APK/IPA from EAS dashboard
3. Distribute via:
   - Google Play Store (Android)
   - Apple App Store (iOS)
   - Direct APK download (Android)

### PWA Setup

Already configured in `app.json`:

```json
"web": {
  "favicon": "./assets/images/favicon.png",
  "name": "Paroki Tomang",
  "shortName": "Tomang",
  "themeColor": "#8B4513",
  "backgroundColor": "#FFF8F0",
  "display": "standalone"
}
```

Users can install PWA:
1. Open web app in Chrome/Safari
2. Menu → "Add to Home Screen"
3. App installs like native app

---

## Troubleshooting

### Common Issues

#### Issue 1: "Cannot find module 'firebase'"

**Solution:**
```bash
cd /app/frontend
yarn install
rm -rf node_modules/.cache
yarn start --clear
```

#### Issue 2: "Permission denied" in Firestore

**Solution:**
1. Check Firestore rules are published
2. Verify user is authenticated
3. Check user role in Firestore
4. See `docs/code.md` for correct rules

#### Issue 3: Login works but dashboard blank

**Solution:**
1. Check browser console for errors
2. Verify user profile exists in Firestore
3. Clear browser cache
4. Logout and login again

#### Issue 4: "Expo Go app can't connect"

**Solution:**
1. Make sure phone and computer on same WiFi
2. Use tunnel mode: `expo start --tunnel`
3. Scan QR code again

#### Issue 5: Web build fails

**Solution:**
```bash
cd /app/frontend
rm -rf dist .expo node_modules/.cache
yarn install
expo export --platform web
```

### Debug Checklist

✅ Firebase Authentication enabled?  
✅ Firestore rules published?  
✅ Superadmin account created?  
✅ Environment variables set?  
✅ Dependencies installed?  
✅ Expo dev server running?  
✅ Internet connection working?  

### Getting Help

**Check Logs:**
```bash
# Expo logs
cd /app/frontend
expo start
# Watch terminal for errors

# Browser console
F12 → Console tab

# Firebase console
Firebase Console → Error logs
```

**Common Log Patterns:**
```
[Auth] Attempting login for: ... ✅
[Auth] Login successful, UID: ... ✅
[Auth] Profile created successfully ✅
[Dashboard] User: ... ✅
[Dashboard] Profile: {...} ✅
```

---

## Quick Start Summary

**Minimal Steps to Get Running:**

```bash
# 1. Firebase Console
- Enable Authentication (Email/Password)
- Create Firestore database
- Set security rules (see above)
- Create superadmin user

# 2. Install & Run
cd /app/frontend
yarn install
expo start

# 3. Test
- Open http://localhost:3000
- Login: joni@email.com / joni2#Marjoni
- Access admin dashboard
```

**That's it!** 🎉

---

## Configuration Files Reference

### Important Files (DO NOT DELETE)

```
frontend/
├── app.json              # Expo configuration
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── metro.config.js       # Metro bundler
├── .env                  # Environment variables ⚠️
├── config/firebase.ts    # Firebase init
└── app/_layout.tsx       # Root layout
```

### Files You Can Modify

```
frontend/
├── app/                 # Add routes
├── components/          # Add components
├── services/            # Add services
└── assets/              # Add images/fonts
```

### Files to Ignore

```
frontend/
├── .expo/               # Build cache
├── node_modules/        # Dependencies
├── dist/                # Build output
└── .metro-cache/        # Metro cache
```

Add to `.gitignore`:
```
node_modules/
.expo/
dist/
.metro-cache/
*.log
```

---

**Setup Complete!** 🚀  
**Next:** See `code.md` for code snippets and examples.  
**Support:** Check `arsitektur.md` for system architecture.
