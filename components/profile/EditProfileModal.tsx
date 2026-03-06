"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/types/auth";
import type { ProfileUpdateData } from "@/types/profile";
import type { UseMutationResult } from "@tanstack/react-query";
import { ImageUpload } from "@/components/common";
import { profileValidators } from "@/lib/profile-api";

interface EditProfileModalProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updatedUser: User) => void;
  updateProfileMutation: UseMutationResult<User, Error, ProfileUpdateData>;
  uploadAvatarMutation: UseMutationResult<{ url: string; publicId: string }, Error, File>;
}

export function EditProfileModal({
  user,
  open,
  onOpenChange,
  onUpdate,
  updateProfileMutation,
  uploadAvatarMutation,
}: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    name: user.name || "",
    phone: user.phone || "",
  });
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(user.avatar || null);

  const isLoading = updateProfileMutation.isPending || uploadAvatarMutation.isPending;

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
      });
      setPendingAvatarFile(null);
      setCurrentAvatarUrl(user.avatar || null);
    }
  }, [open, user]);

  const handleAvatarSelect = async (file: File | null) => {
    console.log("🔍 [Profile] handleAvatarSelect called", file?.name || "null");
    if (!file) {
      setPendingAvatarFile(null);
      setCurrentAvatarUrl(null);
      return;
    }

    // Validate file
    const validation = profileValidators.avatar(file);
    if (!validation.valid) {
      toast.error(validation.error || "Invalid file");
      return;
    }

    // Store the file locally - DON'T upload yet
    console.log("✅ [Profile] File stored locally in pendingAvatarFile state - NO API CALL");
    setPendingAvatarFile(file);
    // ImageUpload component will show preview via FileReader
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("🚀 [Profile] handleSubmit - Save Changes clicked");

    try {
      let avatarUrl = currentAvatarUrl;

      // Step 1: Upload avatar if there's a pending file
      if (pendingAvatarFile) {
        console.log("⬆️ [Profile] Pending file found - Uploading to Cloudinary NOW:", pendingAvatarFile.name);
        const result = await uploadAvatarMutation.mutateAsync(pendingAvatarFile);
        avatarUrl = result.url;
        console.log("✅ [Profile] Upload successful, URL:", avatarUrl);
      } else {
        console.log("ℹ️ [Profile] No pending file - skipping upload");
      }

      // Step 2: Update profile with the avatar URL
      console.log("📤 [Profile] Submitting profile data with avatar URL");
      const updatedUser = await updateProfileMutation.mutateAsync({
        name: formData.name,
        phone: formData.phone,
        email: user.email,
        avatar: avatarUrl,
      });

      console.log("✅ [Profile] Profile updated successfully");
      setPendingAvatarFile(null);
      onUpdate(updatedUser);
      onOpenChange(false);
    } catch (error) {
      console.error("❌ [Profile] Update failed:", error);
      // Error is handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information and avatar
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Avatar Upload */}
            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <ImageUpload
                currentImage={currentAvatarUrl}
                onImageSelect={handleAvatarSelect}
                disabled={isLoading}
                isLoading={uploadAvatarMutation.isPending}
                isPending={pendingAvatarFile !== null}
                className="w-full max-w-xs mx-auto"
              />
              {pendingAvatarFile !== null && (
                <p className="text-xs text-muted-foreground text-center">
                  Image will be uploaded when you save changes
                </p>
              )}
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter your full name"
                required
                disabled={isLoading}
              />
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Enter your phone number"
                required
                disabled={isLoading}
              />
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
