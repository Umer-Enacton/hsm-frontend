# Image Upload Test Checklist

## Expected Behavior

### ✅ When User Selects an Image:
- [ ] File is validated (type, size)
- [ ] File is stored in component state (`pendingImageFile` or `pendingAvatarFile`)
- [ ] Local preview is shown (via FileReader in ImageUpload component)
- [ ] "Pending" badge appears on the image
- [ ] **NO API call is made to `/category-image` or `/avatar-image`**
- [ ] **NO network request in browser DevTools Network tab**

### ✅ When User Clicks Submit (Save Changes / Add / Update):
- [ ] If there's a pending file:
  - [ ] First, upload the file to Cloudinary (API call to `/category-image` or `/avatar-image`)
  - [ ] Get the image URL
  - [ ] If upload fails: Show error, stop, don't submit form
- [ ] Then submit form data with image URL to backend
- [ ] Clear pending file state

## How to Test

### 1. Open Browser DevTools
- Press `F12` or right-click → Inspect
- Go to **Network** tab
- Filter by "category-image" or "avatar" or "upload"

### 2. Select an Image
- Click the upload area
- Select any image file
- **CHECK**: Network tab should show **NO requests** to upload endpoints
- **CHECK**: Image preview should appear with "Pending" badge

### 3. Click Submit Button
- Click "Save Changes" or "Add Category" or "Update Category"
- **CHECK**: Network tab should NOW show one request to upload endpoint
- **CHECK**: After upload succeeds, form data is submitted

## Current Implementation (Verified)

### AddCategoryDialog.tsx
```typescript
// ✅ CORRECT: NO upload in handleImageSelect
const handleImageSelect = async (file: File | null) => {
  // ... validation ...
  setPendingImageFile(file);  // Just store file, NO API call
};

// ✅ CORRECT: Upload ONLY in handleSubmit
const handleSubmit = async (e: React.FormEvent) => {
  // ... validation ...
  if (pendingImageFile) {
    const result = await uploadCategoryImage(pendingImageFile);  // Upload here
    imageUrl = result.url;
  }
  await onAdd({ ...formData, image: imageUrl });
};
```

### EditCategoryDialog.tsx
```typescript
// ✅ CORRECT: NO upload in handleImageSelect
const handleImageSelect = async (file: File | null) => {
  // ... validation ...
  setPendingImageFile(file);  // Just store file, NO API call
};

// ✅ CORRECT: Upload ONLY in handleSubmit
const handleSubmit = async (e: React.FormEvent) => {
  // ... validation ...
  if (pendingImageFile) {
    const result = await uploadCategoryImage(pendingImageFile);  // Upload here
    imageUrl = result.url;
  }
  await onUpdate(category.id, { ...formData, image: imageUrl });
};
```

### ProfileEditForm.tsx
```typescript
// ✅ CORRECT: NO upload in handleAvatarSelect
const handleAvatarSelect = async (file: File | null) => {
  // ... validation ...
  setPendingAvatarFile(file);  // Just store file, NO API call
};

// ✅ CORRECT: Upload ONLY in handleSubmit
const handleSubmit = async (e: React.FormEvent) => {
  // ... validation ...
  if (pendingAvatarFile) {
    const result = await uploadAvatar(pendingAvatarFile);  // Upload here
    avatarUrl = result.url;
  }
  await updateProfile({ ...formData, avatar: avatarUrl });
};
```

## If Still Not Working

### 1. Browser Cache Issue
- Close all browser tabs
- Clear browser cache
- Open Incognito/Private window and test

### 2. Next.js Cache Issue
```bash
# Stop dev server (Ctrl+C)
rm -rf .next
npm run dev
```

### 3. Hard Refresh
- Chrome/Edge: `Ctrl + Shift + R`
- Firefox: `Ctrl + F5`

### 4. Check for Multiple File Versions
```bash
# Search for any other files that might be calling upload
grep -r "uploadCategoryImage\|uploadAvatar" --include="*.tsx" --include="*.ts" app/ components/
```

## Debug Logging

Add console.log to verify:

```typescript
const handleImageSelect = async (file: File | null) => {
  console.log("🔍 handleImageSelect called", file?.name);
  // ... rest of code
  console.log("✅ File stored locally, NO upload yet");
};

const handleSubmit = async (e: React.FormEvent) => {
  console.log("🚀 handleSubmit called");
  if (pendingImageFile) {
    console.log("⬆️ Uploading image now...", pendingImageFile.name);
    const result = await uploadCategoryImage(pendingImageFile);
  }
  // ... rest of code
};
```

## What You Should See in Console

```
✅ CORRECT FLOW:
User selects image → 🔍 handleImageSelect called photo.jpg
                   → ✅ File stored locally, NO upload yet

User clicks submit → 🚀 handleSubmit called
                   → ⬆️ Uploading image now... photo.jpg
                   → ✅ Upload complete, URL received
                   → 📤 Submitting form data
```

```
❌ WRONG FLOW (if bug exists):
User selects image → 🔍 handleImageSelect called photo.jpg
                   → ⬆️ Uploading image now... photo.jpg  ← SHOULD NOT HAPPEN!
```
