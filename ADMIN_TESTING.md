# Admin Panel Testing Guide

## 🔐 Setup Superadmin Account

**IMPORTANT**: Sebelum bisa login, Anda HARUS membuat akun superadmin di Firebase Console:

### Step 1: Create Superadmin in Firebase Console

1. Go to: https://console.firebase.google.com/project/parokitomang-4f136/authentication/users
2. Click **"Add user"** button
3. Fill in:
   - **Email**: `joni@email.com`
   - **Password**: `joni2#Marjoni`
4. Click **"Add user"**

### Step 2: Verify Firestore Rules

Make sure you have set up the Firestore security rules. Go to:
https://console.firebase.google.com/project/parokitomang-4f136/firestore/rules

The rules should be:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'superadmin'];
    }
    
    function isSuperAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'superadmin';
    }
    
    match /users/{userId} {
      allow read: if isAdmin();
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if isSuperAdmin();
    }
    
    match /settings/{settingId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    match /pages/{pageId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

---

## 🧪 Testing Steps

### Test 1: Login to Admin Panel

1. Open app in browser or mobile
2. Navigate to `/adm`
3. Enter credentials:
   - Email: `joni@email.com`
   - Password: `joni2#Marjoni`
4. Click "Masuk"
5. Should redirect to `/adm/dashboard`

**Expected**: Login successful, profile auto-created in Firestore

**Check Firestore**: 
- Go to Firestore Database
- Collection: `users`
- Should see document with UID of superadmin
- Contains: email, displayName, role='superadmin'

---

### Test 2: Dashboard Navigation

After login, you should see:
- ✅ Sidebar with 4 menu items
- ✅ Dashboard Overview (default page)
- ✅ Profile card showing email and "Super Admin" badge
- ✅ Stats cards (Pages, Users, Views)

**Test Navigation:**
1. Click "Settings Umum" → Should show settings form
2. Click "Kelola Halaman" → Should show placeholder
3. Click "Kelola User" → Should show placeholder
4. Click "Dashboard Overview" → Back to overview

---

### Test 3: Settings Umum Page

1. Click "Settings Umum" in sidebar
2. Should see form with:
   - ✅ Nama Aplikasi input
   - ✅ Nama Paroki input
   - ✅ Text Header input
   - ✅ Text Footer textarea
   - ✅ Logo upload area
   - ✅ Icon PWA upload area
   - ✅ Favicon upload area
   - ✅ Primary color preview + input
   - ✅ Secondary color preview + input
   - ✅ "Simpan Perubahan" button

**Test Form:**
1. Fill in all text fields
2. (Optional) Upload images via image picker
3. Change color codes
4. Click "Simpan Perubahan"
5. Should see success alert
6. Refresh page → values should persist

**Check Firestore**:
- Collection: `settings`
- Document: `app_settings`
- Should contain all saved values

---

### Test 4: Image Upload (Mobile/Web)

**On Mobile:**
1. Click any image upload area
2. Grant photo library permission (first time only)
3. Select image from gallery
4. Image should preview in upload area
5. Save → Image stored as base64 in Firestore

**On Web:**
1. Click any image upload area
2. File picker opens
3. Select JPG/PNG image (max 2MB recommended)
4. Image previews
5. Save → Stored as base64

---

## 🐛 Common Issues & Solutions

### Issue 1: "Login failed"
**Cause**: Superadmin account not created in Firebase
**Solution**: Create account in Firebase Console (see Step 1)

### Issue 2: "Permission denied" error
**Cause**: Firestore rules not set up
**Solution**: Add security rules in Firestore Console

### Issue 3: Settings not loading
**Cause**: No default settings in Firestore
**Solution**: Settings auto-initialize on first app load. Refresh page.

### Issue 4: Image upload not working on web
**Cause**: expo-image-picker requires permissions
**Solution**: This is expected behavior. On web, use file input directly.

### Issue 5: Can't see uploaded images
**Cause**: Base64 conversion issue
**Solution**: Check console logs, ensure image size < 2MB

---

## 📊 What to Check in Firestore

After testing, you should see these collections:

### 1. `users` collection
```
Document ID: (Firebase Auth UID)
{
  uid: "xxx",
  email: "joni@email.com",
  displayName: "Super Admin",
  role: "superadmin",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 2. `settings` collection
```
Document ID: app_settings
{
  appName: "Paroki Tomang",
  parokiName: "Paroki Santa Maria Bunda Karmel (MBK)",
  headerText: "Paroki Tomang",
  footerText: "...",
  logoBase64: "data:image/jpeg;base64,...",  // if uploaded
  iconBase64: "data:image/jpeg;base64,...",  // if uploaded
  faviconBase64: "data:image/jpeg;base64,...",  // if uploaded
  primaryColor: "#8B4513",
  secondaryColor: "#D2691E",
  updatedAt: timestamp
}
```

### 3. `pages` collection
(Empty for now - will be populated in Phase 3)

---

## ✅ Success Criteria

Phase 1 & 2 are complete if:
- ✅ Can login with superadmin credentials
- ✅ Dashboard loads with sidebar navigation
- ✅ Settings page displays correctly
- ✅ Can fill and save settings form
- ✅ Can upload and preview images
- ✅ Settings persist in Firestore
- ✅ No console errors (check browser DevTools)

---

## 🚀 Next Steps

Once Phase 1 & 2 testing is complete:
- **Phase 3**: Implement Page Management (CRUD for pages)
- **Phase 4**: Implement User Management (add/delete admins)
- **Phase 5**: Rich text editor for static pages
- **Phase 6**: YouTube integration for video pages

---

## 📞 Debug Checklist

If something doesn't work:

1. ✅ Check browser console for errors (F12)
2. ✅ Check Firestore rules are published
3. ✅ Check superadmin account exists in Authentication
4. ✅ Check network tab for Firebase API calls
5. ✅ Check Firestore data is being written
6. ✅ Clear browser cache and reload
7. ✅ Try in incognito/private mode

---

**Last Updated**: Phase 1 & 2 Complete
**Status**: Ready for Testing
