import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getCurrentProfile, updateProfile, uploadAvatar } from "@/lib/profile-api";
import { getAddresses, createAddress, updateAddress, deleteAddress } from "@/lib/customer/api";
import { queryKeys } from "./query-keys";
import type { Address } from "@/types/customer";

// PROFILE QUERIES
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.all,
    queryFn: getCurrentProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAddresses() {
  return useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const data = await getAddresses();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// PROFILE MUTATIONS
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(queryKeys.profile.all, updatedUser);
      window.dispatchEvent(new CustomEvent("profile-updated"));
      toast.success("Profile updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update profile");
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (avatarData) => {
      queryClient.setQueryData(queryKeys.profile.all, (old: any) => ({
        ...old,
        avatar: avatarData.url,
      }));
      window.dispatchEvent(new CustomEvent("profile-updated"));
      toast.success("Avatar updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to upload avatar");
    },
  });
}

// ADDRESS MUTATIONS
export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address added successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add address");
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ addressId, updates }: { addressId: number; updates: Partial<Address> }) =>
      updateAddress(addressId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update address");
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId: number) => deleteAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete address");
    },
  });
}
