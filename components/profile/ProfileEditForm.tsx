"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  updateProfile,
  uploadAvatar,
  profileValidators,
} from "@/lib/profile-api";
import { ImageUpload } from "@/components/common";
import type { User } from "@/types/auth";
import type { ProfileUpdateData, ProfileFormErrors } from "@/types/profile";

interface ProfileEditFormProps {
  user: User;
  onUpdate: (user: User) => void;
  onCancel: () => void;
  className?: string;
}

export function ProfileEditForm({
  user,
  onUpdate,
  onCancel,
  className,
}: ProfileEditFormProps) {
  const [formData, setFormData] = useState<ProfileUpdateData>({
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar || null,
  });
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const validateField = (name: string, value: string) => {
    const validator =
      name === "name"
        ? profileValidators.name
        : name === "email"
          ? profileValidators.email
          : profileValidators.phone;
    const result = validator(value);

    setErrors((prev) => ({
      ...prev,
      [name]: result.valid ? undefined : result.error,
    }));

    return result.valid;
  };

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleFieldBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, formData[name as keyof ProfileUpdateData] as string);
  };

  const handleAvatarSelect = async (file: File | null) => {
    console.log("🔍 [Profile] handleAvatarSelect called", file?.name || "null");
    if (!file) {
      setPendingAvatarFile(null);
      setFormData((prev) => ({ ...prev, avatar: null }));
      return;
    }

    const validation = profileValidators.avatar(file);
    if (!validation.valid) {
      setErrors((prev) => ({ ...prev, avatar: validation.error }));
      return;
    }

    setErrors((prev) => ({ ...prev, avatar: undefined }));
    // Store the file locally - don't upload yet
    console.log("✅ [Profile] File stored locally in pendingAvatarFile state - NO API CALL");
    setPendingAvatarFile(file);
    // The ImageUpload component will show the preview via FileReader
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("🚀 [Profile] handleSubmit - Save Changes clicked");

    setTouched({ name: true, email: true, phone: true });

    const isNameValid = validateField("name", formData.name);
    const isEmailValid = validateField("email", formData.email);
    const isPhoneValid = validateField("phone", formData.phone);

    if (!isNameValid || !isEmailValid || !isPhoneValid) {
      return;
    }

    setIsSubmitting(true);
    setIsUploadingAvatar(true);

    try {
      // Step 1: Upload avatar if there's a pending file
      let avatarUrl = formData.avatar;
      if (pendingAvatarFile) {
        console.log("⬆️ [Profile] Pending file found - Uploading to Cloudinary NOW:", pendingAvatarFile.name);
        try {
          const result = await uploadAvatar(pendingAvatarFile);
          avatarUrl = result.url;
          console.log("✅ [Profile] Upload successful, URL:", avatarUrl);
        } catch (error: any) {
          console.error("❌ [Profile] Upload failed:", error);
          setErrors((prev) => ({
            ...prev,
            avatar: error.message || "Failed to upload avatar",
          }));
          toast.error(error.message || "Failed to upload avatar");
          setIsUploadingAvatar(false);
          setIsSubmitting(false);
          return;
        }
      } else {
        console.log("ℹ️ [Profile] No pending file - skipping upload");
      }

      // Step 2: Update profile with the avatar URL
      console.log("📤 [Profile] Submitting profile data with avatar URL");
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
      setPendingAvatarFile(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="space-y-6">
        {/* Avatar Upload */}
        <div className="space-y-2">
          <Label>Profile Picture</Label>
          <div className="flex justify-center">
            <ImageUpload
              currentImage={formData.avatar}
              onImageSelect={handleAvatarSelect}
              disabled={isSubmitting}
              isLoading={isUploadingAvatar}
              isPending={pendingAvatarFile !== null}
              className="w-full max-w-xs"
            />
          </div>
          {errors.avatar && (
            <p className="text-sm text-destructive text-center">{errors.avatar}</p>
          )}
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
            disabled={isSubmitting}
            className={
              touched.name && errors.name
                ? "border-destructive"
                : ""
            }
          />
          {touched.name && errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        {/* Email (Disabled) */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            value={formData.email}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Email cannot be changed. Contact support if you need to update your email.
          </p>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">
            Phone <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
            disabled={isSubmitting}
            className={
              touched.phone && errors.phone
                ? "border-destructive"
                : ""
            }
          />
          {touched.phone && errors.phone && (
            <p className="text-sm text-destructive">{errors.phone}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting || isUploadingAvatar}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isUploadingAvatar}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default ProfileEditForm;
