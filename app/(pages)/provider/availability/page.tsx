"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Plus, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { SlotDialog } from "@/components/provider/availability/SlotDialog";
import { AvailabilitySkeleton } from "@/components/provider/skeletons/AvailabilitySkeleton";
import { useProviderSlots, useCreateSlot, useDeleteSlot } from "@/lib/queries";
import { useProviderBusinessProfile } from "@/lib/queries/use-provider-business-profile";
import { getUserData } from "@/lib/auth-utils";
import type { Slot } from "@/lib/queries/use-provider-slots";

export default function ProviderAvailabilityPage() {
  const router = useRouter();
  const userData = getUserData();

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch business profile
  const { business, isLoading: isLoadingBusiness } = useProviderBusinessProfile(
    userData?.id,
  );

  // Fetch slots using cached hook
  const slotsQuery = useProviderSlots(business?.id);
  const slots = slotsQuery.data || [];
  const isLoadingSlots = slotsQuery.isLoading;
  const refetchSlots = slotsQuery.refetch;

  // Mutations
  const createSlotMutation = useCreateSlot();
  const deleteSlotMutation = useDeleteSlot();

  const isLoading = isLoadingBusiness || (business?.id && isLoadingSlots);

  // Redirect if no business
  if (!isLoadingBusiness && !business) {
    router.push("/onboarding");
    return null;
  }

  const handleRefresh = async () => {
    await refetchSlots();
    toast.success("Slots refreshed");
  };

  const handleCreateSlot = async (slotData: { startTime: string }) => {
    if (!business?.id) return;

    createSlotMutation.mutate(
      { businessId: business.id, slotData },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
        },
      },
    );
  };

  const handleDeleteSlot = async (slotId: number) => {
    if (!business?.id) return;
    if (!confirm("Are you sure you want to delete this time slot?")) {
      return;
    }

    deleteSlotMutation.mutate(
      { businessId: business.id, slotId },
      {
        onSuccess: () => {
          // Slot deleted, cache will be invalidated automatically
        },
      },
    );
  };

  const handleOpenCreateDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  if (isLoading) {
    return <AvailabilitySkeleton />;
  }

  // Sort slots by start time (ensure slots and sortedSlots are always arrays)
  const safeSlots = Array.isArray(slots) ? slots : [];
  const sortedSlots = safeSlots.slice().sort((a, b) => {
    try {
      return (a.startTime || "").localeCompare(b.startTime || "");
    } catch (e) {
      return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Availability
          </h1>
          <p className="text-muted-foreground">
            Manage your booking time slots
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="icon"
            disabled={
              createSlotMutation.isPending || deleteSlotMutation.isPending
            }
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleOpenCreateDialog}
            className="whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add Time Slot</span>
            <span className="sm:hidden">Add Slot</span>
          </Button>
        </div>
      </div>

      {/* Time Slots Grid */}
      {sortedSlots.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Clock className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              No time slots configured
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              You haven't created any time slots yet. Click "Add Time Slot" to
              get started.
            </p>
            <Button onClick={handleOpenCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Time Slot
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {sortedSlots.map((slot) => (
            <SlotCard key={slot.id} slot={slot} onDelete={handleDeleteSlot} />
          ))}
        </div>
      )}

      {/* Create Slot Dialog */}
      <SlotDialog
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
        onSubmit={handleCreateSlot}
        businessId={business?.id}
      />
    </div>
  );
}

// Simple Slot Card Component
function SlotCard({
  slot,
  onDelete,
}: {
  slot: Slot;
  onDelete: (slotId: number) => void;
}) {
  return (
    <Card className="rounded-sm">
      <div className="p-0">
        <div className="flex items-center justify-around gap-0">
          <span className="text-base font-semibold">
            {formatTime12Hour(slot.startTime)}
          </span>
          <button
            onClick={() => onDelete(slot.id)}
            className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}

// Convert 24-hour time to 12-hour AM/PM format
function formatTime12Hour(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12; // Convert 0 to 12
  const displayMinutes = minutes.toString().padStart(2, "0");
  return `${displayHours}:${displayMinutes} ${period}`;
}
