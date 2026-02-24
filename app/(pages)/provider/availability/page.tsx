"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Plus, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { getBusinessSlots, createSlot, deleteSlot } from "@/lib/provider/slots";
import { getProviderBusiness } from "@/lib/provider/api";
import type { Slot } from "@/lib/provider/slots";
import { SlotDialog } from "@/components/provider/availability/SlotDialog";

export default function ProviderAvailabilityPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [businessId, setBusinessId] = useState<number | null>(null);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Load business and slots on mount
  useEffect(() => {
    loadBusinessAndSlots();
  }, []);

  const loadBusinessAndSlots = async () => {
    setIsLoading(true);
    try {
      // Get business ID from user data
      const { getUserData } = await import("@/lib/auth-utils");
      const userData = getUserData();

      if (!userData || !userData.id) {
        toast.error("Please login to continue");
        router.push("/login");
        return;
      }

      const business = await getProviderBusiness(userData.id);
      if (!business) {
        toast.error("Business profile not found");
        router.push("/onboarding");
        return;
      }

      setBusinessId(business.id);
      await loadSlots(business.id);
    } catch (error: any) {
      console.error("Error loading business:", error);
      toast.error("Failed to load business information");
    } finally {
      setIsLoading(false);
    }
  };

  const loadSlots = async (bizId: number) => {
    try {
      const slotsList = await getBusinessSlots(bizId);
      // Sort slots by start time
      const sortedSlots = slotsList.sort((a, b) =>
        a.startTime.localeCompare(b.startTime),
      );
      setSlots(sortedSlots);
    } catch (error: any) {
      console.error("Error loading slots:", error);
      toast.error("Failed to load slots");
    }
  };

  const handleRefresh = async () => {
    if (!businessId) return;
    setIsRefreshing(true);
    await loadSlots(businessId);
    setIsRefreshing(false);
    toast.success("Slots refreshed");
  };

  const handleCreateSlot = async (slotData: { startTime: string }) => {
    if (!businessId) return;

    try {
      await createSlot(businessId, slotData);
      toast.success("Time slot added successfully");

      // Reload slots
      await loadSlots(businessId);
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error creating slot:", error);
      toast.error("Failed to add time slot", {
        description: error.message || "Please try again",
      });
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    if (!businessId) return;

    if (!confirm("Are you sure you want to delete this time slot?")) {
      return;
    }

    try {
      await deleteSlot(businessId, slotId);
      toast.success("Time slot deleted successfully");

      // Reload slots
      await loadSlots(businessId);
    } catch (error: any) {
      console.error("Error deleting slot:", error);
      toast.error("Failed to delete time slot", {
        description: error.message || "Please try again",
      });
    }
  };

  const handleOpenCreateDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading availability...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Availability</h1>
          <p className="text-muted-foreground">
            Manage your booking time slots
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="icon"
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
          <Button onClick={handleOpenCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Time Slot
          </Button>
        </div>
      </div>

      {/* Time Slots Grid */}
      {slots.length === 0 ? (
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
          {slots.map((slot) => (
            <SlotCard key={slot.id} slot={slot} onDelete={handleDeleteSlot} />
          ))}
        </div>
      )}

      {/* Create Slot Dialog */}
      <SlotDialog
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
        onSubmit={handleCreateSlot}
        businessId={businessId}
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
    <Card className="rounded-lg">
      <div className="p-0">
        <div className="flex items-center justify-around gap-3">
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
