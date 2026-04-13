"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  Percent,
  IndianRupee,
  AlertCircle,
  Info,
  Check,
  Briefcase,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api, API_ENDPOINTS } from "@/lib/api";
import { cn } from "@/lib/utils";

interface StaffMember {
  id: number;
  userId: number;
  name: string;
  email: string;
  phone: string;
  avatar?: string | null;
  employeeId?: string;
  todayBookingCount?: number;
}

interface AssignStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: number | null;
  bookingDate?: string;
  slotId?: number;
  servicePrice?: number;
  providerEarning?: number;
  onSuccess?: () => void;
}

type EarningType = "commission" | "fixed";

export function AssignStaffDialog({
  open,
  onOpenChange,
  bookingId,
  bookingDate,
  slotId,
  servicePrice = 0,
  providerEarning = 0,
  onSuccess,
}: AssignStaffDialogProps) {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [isStaffPopoverOpen, setIsStaffPopoverOpen] = useState(false);
  const [earningType, setEarningType] = useState<EarningType>("commission");
  const [commissionPercent, setCommissionPercent] = useState("10");
  const [fixedAmount, setFixedAmount] = useState("");

  // Convert providerEarning from paise to rupees for calculation
  const providerEarningInRupees = providerEarning / 100;

  // Calculate staff earning for preview
  const calculatedStaffEarning =
    earningType === "commission"
      ? (providerEarningInRupees * parseFloat(commissionPercent || "0")) / 100
      : parseFloat(fixedAmount || "0");

  // Calculate provider's final share
  const providerFinalShare = providerEarningInRupees - calculatedStaffEarning;

  // Validation errors
  const commissionError =
    earningType === "commission" &&
    (parseFloat(commissionPercent) < 1 || parseFloat(commissionPercent) > 100)
      ? "Commission must be between 1% and 100%"
      : null;

  const fixedError =
    earningType === "fixed" && parseFloat(fixedAmount || "0") > 0
      ? parseFloat(fixedAmount || "0") > providerEarningInRupees
        ? `Maximum allowed: ₹${providerEarningInRupees.toFixed(2)}`
        : null
      : null;

  const minimumProviderShare = servicePrice * 0.1; // 10% of service price
  const isEarningTooHigh =
    providerFinalShare < minimumProviderShare && calculatedStaffEarning > 0;

  // Fetch available staff when dialog opens
  useEffect(() => {
    if (open && bookingDate && slotId) {
      fetchAvailableStaff();
    }
    // Reset selection when dialog opens
    if (!open) {
      setSelectedStaffId(null);
      setIsStaffPopoverOpen(false);
    }
  }, [open, bookingDate, slotId]);

  const fetchAvailableStaff = async () => {
    if (!bookingDate || !slotId) return;

    setIsLoading(true);
    try {
      // Construct query string manually since api.get doesn't handle params option
      const queryParams = new URLSearchParams();
      queryParams.append("slotId", slotId.toString());
      queryParams.append("date", bookingDate);
      const queryString = queryParams.toString();

      const response = await api.get<{ message: string; data: StaffMember[] }>(
        `${API_ENDPOINTS.BOOKING_AVAILABLE_STAFF}?${queryString}`,
      );
      if (response.data) {
        setStaffList(response.data);
      }
    } catch (error) {
      console.error("Error fetching available staff:", error);
      toast.error("Failed to load available staff");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!bookingId || !selectedStaffId) {
      toast.error("Please select a staff member");
      return;
    }

    // Check for validation errors
    if (commissionError) {
      toast.error(commissionError);
      return;
    }

    if (fixedError) {
      toast.error(fixedError);
      return;
    }

    if (isEarningTooHigh) {
      toast.error(
        `Staff earning is too high. You must keep at least ₹${minimumProviderShare.toFixed(2)} (10% of service price)`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        staffId: selectedStaffId,
        earningType,
      };

      if (earningType === "commission") {
        payload.commissionPercent = parseFloat(commissionPercent);
      } else {
        // Convert rupees to paise
        payload.fixedAmount = Math.round(parseFloat(fixedAmount) * 100);
      }

      await api.post(API_ENDPOINTS.BOOKING_ASSIGN_STAFF(bookingId), payload);

      toast.success("Staff assigned successfully");
      onOpenChange(false);
      onSuccess?.();

      // Reset form
      setSelectedStaffId(null);
      setIsStaffPopoverOpen(false);
      setEarningType("commission");
      setCommissionPercent("10");
      setFixedAmount("");
    } catch (error: any) {
      console.error("Error assigning staff:", error);
      toast.error(error.message || "Failed to assign staff");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedStaffName = () => {
    const staff = staffList.find((s) => s.id === selectedStaffId);
    return staff?.name || "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Assign Staff to Booking
          </DialogTitle>
          <DialogDescription>
            Select an available staff member and set their earning type for this
            booking.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : staffList.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No staff available for this time slot.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Staff may be on leave or already assigned to other bookings.
            </p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Provider Earning Summary */}
            {providerEarning > 0 && (
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                      Your Earning Breakdown
                    </p>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Service Price:
                        </span>
                        <span className="font-medium">
                          ₹{servicePrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Your Earning:
                        </span>
                        <span className="font-medium text-emerald-700 dark:text-emerald-400">
                          ₹{(providerEarning / 100).toFixed(2)}
                        </span>
                      </div>
                      {selectedStaffId && calculatedStaffEarning > 0 && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Staff Earning:
                            </span>
                            <span className="font-medium text-blue-700 dark:text-blue-400">
                              -₹{calculatedStaffEarning.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-emerald-200 dark:border-emerald-800">
                            <span className="text-muted-foreground">
                              Your Final Share:
                            </span>
                            <span
                              className={`font-bold ${isEarningTooHigh ? "text-red-600" : "text-emerald-700"}`}
                            >
                              ₹{providerFinalShare.toFixed(2)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Staff Selection */}
            <div className="space-y-2">
              <Label htmlFor="staff-select" className="text-base font-semibold">
                Select Staff Member
              </Label>
              <Popover
                open={isStaffPopoverOpen}
                onOpenChange={setIsStaffPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    id="staff-select"
                    variant="outline"
                    role="combobox"
                    aria-expanded={isStaffPopoverOpen}
                    className="w-full justify-between h-auto py-3 px-4"
                  >
                    <div className="flex items-center gap-3">
                      {selectedStaffId ? (
                        <>
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={
                                staffList.find((s) => s.id === selectedStaffId)
                                  ?.avatar || undefined
                              }
                            />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white text-sm font-medium">
                              {staffList
                                .find((s) => s.id === selectedStaffId)
                                ?.name?.charAt(0)
                                .toUpperCase() || "S"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">
                              {
                                staffList.find((s) => s.id === selectedStaffId)
                                  ?.name
                              }
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {staffList.find((s) => s.id === selectedStaffId)
                                ?.employeeId || "No ID"}
                            </span>
                          </div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">
                          Search staff member...
                        </span>
                      )}
                    </div>
                    <Search className="h-4 w-4 text-muted-foreground opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="min-w-md p-0" align="center">
                  <Command>
                    <CommandInput placeholder="Search by name or employee ID..." />
                    <CommandList>
                      <CommandEmpty>No staff found.</CommandEmpty>
                      <CommandGroup>
                        {staffList.map((staff) => (
                          <CommandItem
                            key={staff.id}
                            value={`${staff.name} ${staff.employeeId || ""} ${staff.email || ""}`}
                            onSelect={() => {
                              setSelectedStaffId(
                                staff.id === selectedStaffId ? null : staff.id,
                              );
                              setIsStaffPopoverOpen(false);
                            }}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={staff.avatar || undefined} />
                                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white text-sm font-medium">
                                  {staff.name?.charAt(0).toUpperCase() || "S"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col items-start flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {staff.name}
                                  </span>
                                  {staff.todayBookingCount !== undefined &&
                                    staff.todayBookingCount > 0 && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs h-5"
                                      >
                                        {staff.todayBookingCount} today
                                      </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  {staff.employeeId && (
                                    <span className="font-mono">
                                      {staff.employeeId}
                                    </span>
                                  )}
                                  {staff.employeeId && staff.phone && (
                                    <span>•</span>
                                  )}
                                  {staff.phone && <span>{staff.phone}</span>}
                                </div>
                              </div>
                              {selectedStaffId === staff.id && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Earning Type Selection */}
            {selectedStaffId && (
              <div className="space-y-4 border-t pt-4">
                <div>
                  <Label className="text-base font-semibold">
                    Earning Type
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose how {getSelectedStaffName()} will be paid for this
                    booking
                  </p>
                </div>

                <RadioGroup
                  value={earningType}
                  onValueChange={(value) =>
                    setEarningType(value as EarningType)
                  }
                  className="grid grid-cols-2 gap-4"
                >
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all",
                      earningType === "commission"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                    )}
                    onClick={() => setEarningType("commission")}
                  >
                    <RadioGroupItem
                      value="commission"
                      id="commission"
                      className="sr-only"
                    />
                    <Percent className="h-8 w-8 mb-2 text-primary" />
                    <Label
                      htmlFor="commission"
                      className="font-semibold cursor-pointer text-center"
                    >
                      Commission
                    </Label>
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      Percentage of your earning
                    </p>
                  </div>

                  <div
                    className={cn(
                      "flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all",
                      earningType === "fixed"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                    )}
                    onClick={() => setEarningType("fixed")}
                  >
                    <RadioGroupItem
                      value="fixed"
                      id="fixed"
                      className="sr-only"
                    />
                    <IndianRupee className="h-8 w-8 mb-2 text-primary" />
                    <Label
                      htmlFor="fixed"
                      className="font-semibold cursor-pointer text-center"
                    >
                      Fixed Amount
                    </Label>
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      Set amount in rupees
                    </p>
                  </div>
                </RadioGroup>

                {/* Commission Input */}
                {earningType === "commission" && (
                  <div className="space-y-2">
                    <Label htmlFor="commissionPercent">
                      Commission Percentage
                    </Label>
                    <div className="relative">
                      <Input
                        id="commissionPercent"
                        type="number"
                        min="1"
                        max="100"
                        value={commissionPercent}
                        onChange={(e) => setCommissionPercent(e.target.value)}
                        className={cn(
                          "w-full pr-8",
                          commissionError &&
                            "border-red-500 focus:border-red-500",
                        )}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                        %
                      </span>
                    </div>
                    {commissionError && (
                      <p className="text-xs text-red-500">{commissionError}</p>
                    )}
                    {!commissionError && (
                      <p className="text-xs text-muted-foreground">
                        Staff will receive {commissionPercent}% of your earning
                        (₹{calculatedStaffEarning.toFixed(2)})
                      </p>
                    )}
                  </div>
                )}

                {/* Fixed Amount Input */}
                {earningType === "fixed" && (
                  <div className="space-y-2">
                    <Label htmlFor="fixedAmount" className="flex items-center justify-between">
                      <span>Fixed Amount</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        Max: ₹{(providerEarning / 100).toFixed(2)}
                      </span>
                    </Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="fixedAmount"
                        type="number"
                        min="1"
                        max={providerEarning / 100}
                        step="0.01"
                        value={fixedAmount}
                        onChange={(e) => setFixedAmount(e.target.value)}
                        placeholder="e.g. 100"
                        className={cn(
                          "w-full pl-8",
                          fixedError && "border-red-500 focus:border-red-500",
                        )}
                      />
                    </div>
                    {fixedError && (
                      <p className="text-xs text-red-500">{fixedError}</p>
                    )}
                    {isEarningTooHigh && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        You must keep at least ₹
                        {minimumProviderShare.toFixed(2)} (10% of service price)
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !selectedStaffId ||
              isSubmitting ||
              staffList.length === 0 ||
              !!commissionError ||
              !!fixedError ||
              isEarningTooHigh
            }
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Assign Staff
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
