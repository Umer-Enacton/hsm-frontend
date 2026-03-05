# Controlled Image Upload Implementation Guide

## Overview

This guide explains the controlled image upload flow implemented in the HSM frontend. Images are now stored locally on the client side when selected and only uploaded to Cloudinary when the user clicks the submit button.

## Architecture

### Key Components

1. **ImageUpload Component** (`components/common/ImageUpload.tsx`)
   - Handles file selection and validation
   - Creates local preview using `FileReader` (no server call)
   - Shows "Pending" badge when an image is selected but not yet uploaded
   - Supports both `isLoading` (uploading) and `isPending` (waiting to upload) states

2. **Form Components** (ProfileEditForm, AddCategoryDialog, EditCategoryDialog)
   - Store selected file in `pendingImageFile` or `pendingAvatarFile` state
   - Upload happens only in `handleSubmit` function
   - Two-step process: Upload first, then submit form data

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER SELECTS IMAGE                        │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Validate file (type, size)                                   │
│  2. Store File object in state (pendingXxxFile)                  │
│  3. Create local preview via FileReader (in ImageUpload)         │
│  4. Show "Pending" badge                                         │
│  ❌ NO API CALL - NO CLOUDINARY UPLOAD                           │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    USER CLICKS SUBMIT BUTTON                     │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  handleSubmit():                                                 │
│                                                                  │
│  if (pendingFile exists) {                                       │
│    1. Show loading state (isLoading=true)                        │
│    2. Upload to Cloudinary → get URL                             │
│    3. On error: Show error, stop here                            │
│  }                                                               │
│                                                                  │
│  4. Submit form data with image URL to backend API               │
│  5. On success: Show success, clear pending file                 │
│  6. On error: Show error                                         │
│  7. Reset loading state                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Pattern

### 1. Component State

```typescript
// Store the selected file locally - NOT uploaded yet
const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
```

### 2. Image Selection Handler

```typescript
const handleAvatarSelect = async (file: File | null) => {
  if (!file) {
    setPendingAvatarFile(null);
    setFormData((prev) => ({ ...prev, avatar: null }));
    return;
  }

  // Validate the file
  const validation = profileValidators.avatar(file);
  if (!validation.valid) {
    setErrors((prev) => ({ ...prev, avatar: validation.error }));
    return;
  }

  setErrors((prev) => ({ ...prev, avatar: undefined }));

  // Store file locally - NO upload yet
  setPendingAvatarFile(file);
  // ImageUpload component shows preview via FileReader
};
```

### 3. Submit Handler

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validate form fields
  // ...

  setIsSubmitting(true);
  setIsUploadingAvatar(true);

  try {
    // Step 1: Upload image if pending
    let avatarUrl = formData.avatar;
    if (pendingAvatarFile) {
      try {
        const result = await uploadAvatar(pendingAvatarFile);
        avatarUrl = result.url;
      } catch (error: any) {
        // Upload failed - stop here
        setErrors((prev) => ({
          ...prev,
          avatar: error.message || "Failed to upload avatar",
        }));
        setIsUploadingAvatar(false);
        setIsSubmitting(false);
        return;
      }
    }

    // Step 2: Submit form with image URL
    const updatedUser = await updateProfile({
      ...formData,
      avatar: avatarUrl,
    });

    toast.success("Profile updated successfully");
    onUpdate(updatedUser);
  } catch (error: any) {
    toast.error(error.message || "Failed to update profile");
  } finally {
    setIsSubmitting(false);
    setIsUploadingAvatar(false);
    setPendingAvatarFile(null); // Clear pending file
  }
};
```

### 4. ImageUpload Component Props

```typescript
<ImageUpload
  currentImage={formData.avatar}        // Current URL (from DB)
  onImageSelect={handleAvatarSelect}     // File selection handler
  disabled={isSubmitting}                // Disable during submit
  isLoading={isUploadingAvatar}          // Show loading spinner
  isPending={pendingAvatarFile !== null} // Show "Pending" badge
/>
```

## Benefits

1. **No premature uploads** - Images only uploaded when user confirms
2. **Better UX** - User can change their mind without wasting uploads
3. **Clear feedback** - "Pending" badge shows image waiting to be uploaded
4. **Error handling** - Upload errors caught before form submission
5. **Bandwidth efficient** - No unnecessary uploads

## State Transitions

```
No Image
   │
   │ User selects file
   ▼
Pending Image (shows "Pending" badge)
   │
   │ User clicks submit
   ▼
Uploading (shows loading spinner)
   │
   ├─► Success → Form submitted → Clear state
   │
   └─► Error → Show error → Back to Pending
```

## Visual Indicators

- **Pending Badge**: Blue badge with pulsing dot, shows "Pending"
- **Loading Spinner**: Appears over image during upload
- **Remove Button**: X button appears on hover to cancel selection

## Files Modified

1. `components/common/ImageUpload.tsx` - Added `isPending` prop and badge
2. `components/profile/ProfileEditForm.tsx` - Implemented controlled upload
3. `app/(pages)/admin/categories/components/AddCategoryDialog.tsx` - Implemented controlled upload
4. `app/(pages)/admin/categories/components/EditCategoryDialog.tsx` - Implemented controlled upload

## Testing Checklist

- [ ] Select image → shows preview with "Pending" badge
- [ ] Remove image → clears preview and pending state
- [ ] Click submit → image uploads first, then form submits
- [ ] Upload error → shows error message, doesn't submit form
- [ ] Form validation error → pending file preserved
- [ ] Cancel dialog → pending file cleared
- [ ] Multiple image changes → only last image uploaded on submit

## Troubleshooting

**Issue**: Image uploads immediately on selection
- **Cause**: Using old implementation
- **Fix**: Ensure `handleImageSelect` only stores file, doesn't call upload API

**Issue**: Form submits but image not uploaded
- **Cause**: Missing upload step in `handleSubmit`
- **Fix**: Check for pending file and upload before form submission

**Issue**: "Pending" badge not showing
- **Cause**: `isPending` prop not passed to ImageUpload
- **Fix**: Add `isPending={pendingFile !== null}` prop
