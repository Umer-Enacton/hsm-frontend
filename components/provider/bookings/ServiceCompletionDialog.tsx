"use client";

import { useState, useEffect } from "react";
import { Clock, Upload, Image as ImageIcon, CheckCircle, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { api, getApiBaseUrl } from "@/lib/api";
import {
  useInitiateCompletion,
  useVerifyCompletionOTP,
  useResendCompletionOTP,
  useUploadCompletionPhotos,
} from "@/lib/queries/use-provider-bookings";

interface ServiceCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: number;
    serviceName: string;
    customerName: string;
    date: string;
    startTime: string;
  } | null;
  onSuccess?: () => void;
}

type CompletionState = "idle" | "uploading" | "sending" | "otp_sent" | "verifying" | "completed" | "error";

export function ServiceCompletionDialog({
  open,
  onOpenChange,
  booking,
  onSuccess,
}: ServiceCompletionDialogProps) {
  const [state, setState] = useState<CompletionState>("idle");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [notes, setNotes] = useState("");
  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);
  const [otpExpiry, setOtpExpiry] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState("");

  const initiateCompletion = useInitiateCompletion();
  const verifyOTP = useVerifyCompletionOTP();
  const resendOTP = useResendCompletionOTP();
  const uploadPhotos = useUploadCompletionPhotos();

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (!otpExpiry || state !== "otp_sent") return;

    const updateTimer = () => {
      const now = new Date();
      const diff = otpExpiry.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("Expired");
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [otpExpiry, state]);

  const handleImageUpload = async (file: File, type: "before" | "after") => {
    try {
      setState("uploading");
      const formData = new FormData();
      formData.append("image", file);

      const apiUrl = getApiBaseUrl();
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      const response = await fetch(`${apiUrl}/upload/image`, {
        method: "POST",
        credentials: "include",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      const url = data.data?.url || data.url;

      if (type === "before") {
        setBeforePhoto(url);
      } else {
        setAfterPhoto(url);
      }
      setState(state === "uploading" ? "idle" : state);
      const photoType = type === "before" ? "Before" : "After";
      toast.success(`${photoType} photo uploaded`);
    } catch (error) {
      setState("idle");
      toast.error("Failed to upload photo");
    }
  };

  const handleSendOTP = async () => {
    if (!booking) return;

    setState("sending");
    setErrorMessage("");

    try {
      // First upload photos if any
      if (beforePhoto || afterPhoto) {
        await uploadPhotos.mutateAsync({
          bookingId: booking.id,
          beforePhotoUrl: beforePhoto || undefined,
          afterPhotoUrl: afterPhoto || undefined,
        });
      }

      // Then initiate completion with notes
      const result = await initiateCompletion.mutateAsync({
        bookingId: booking.id,
        data: {
          beforePhotoUrl: beforePhoto || undefined,
          afterPhotoUrl: afterPhoto || undefined,
          completionNotes: notes || undefined,
        },
      });

      setOtpExpiry(new Date(result.otpExpiry));
      setState("otp_sent");
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to send OTP");
      setState("error");
    }
  };

  const handleVerifyOTP = async () => {
    if (!booking) return;

    setState("verifying");
    setErrorMessage("");

    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit OTP");
      setState("otp_sent");
      return;
    }

    try {
      const result = await verifyOTP.mutateAsync({
        bookingId: booking.id,
        otp: otpValue,
      });

      if (result.success) {
        setState("completed");
        setTimeout(() => {
          onOpenChange(false);
          onSuccess?.();
          // Reset state
          resetState();
        }, 2000);
      } else {
        setErrorMessage(result.message || "Invalid OTP");
        setState("otp_sent");
        // Clear OTP on error
        setOtp(["", "", "", "", "", ""]);
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to verify OTP");
      setState("otp_sent");
    }
  };

  const handleResendOTP = async () => {
    if (!booking) return;

    try {
      const result = await resendOTP.mutateAsync(booking.id);
      setOtpExpiry(new Date(result.otpExpiry));
      setOtp(["", "", "", "", "", ""]);
      setErrorMessage("");
      toast.success("New OTP sent");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend OTP");
    }
  };

  const resetState = () => {
    setState("idle");
    setOtp(["", "", "", "", "", ""]);
    setNotes("");
    setBeforePhoto(null);
    setAfterPhoto(null);
    setOtpExpiry(null);
    setTimeRemaining("");
    setErrorMessage("");
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const isLoading = state === "uploading" || state === "sending" || state === "verifying";

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetState();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {state === "completed" ? "Service Completed! 🎉" : "Complete Service"}
          </DialogTitle>
          <DialogDescription>
            {state === "completed"
              ? "The service has been successfully completed and verified."
              : booking
              ? `Complete the ${booking.serviceName} service for ${booking.customerName}`
              : "Loading booking details..."}
          </DialogDescription>
        </DialogHeader>

        {state === "completed" ? (
          <div className="py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-lg font-semibold">Booking Completed Successfully</p>
            <p className="text-sm text-muted-foreground mt-2">
              The customer has been notified.
            </p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Photo Upload Section */}
            {state === "idle" && (
              <>
                <div>
                  <label className="text-sm font-medium mb-3 block">
                    📸 Service Photos (Optional)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Before Photo */}
                    <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                      {beforePhoto ? (
                        <div className="relative">
                          <img
                            src={beforePhoto}
                            alt="Before"
                            className="w-full h-24 object-cover rounded"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => setBeforePhoto(null)}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file, "before");
                            }}
                          />
                          <div className="flex flex-col items-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                            <span className="text-xs text-muted-foreground">Before</span>
                            <span className="text-xs text-primary">Upload</span>
                          </div>
                        </label>
                      )}
                    </div>

                    {/* After Photo */}
                    <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                      {afterPhoto ? (
                        <div className="relative">
                          <img
                            src={afterPhoto}
                            alt="After"
                            className="w-full h-24 object-cover rounded"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => setAfterPhoto(null)}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file, "after");
                            }}
                          />
                          <div className="flex flex-col items-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                            <span className="text-xs text-muted-foreground">After</span>
                            <span className="text-xs text-primary">Upload</span>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    📝 Completion Notes (Optional)
                  </label>
                  <Textarea
                    placeholder="Any additional details about the service..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Send OTP Button */}
                <Button
                  onClick={handleSendOTP}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 mr-2" />
                      Send Verification OTP
                    </>
                  )}
                </Button>
              </>
            )}

            {/* OTP Input Section */}
            {state === "otp_sent" && (
              <div className="space-y-6">
                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    A 6-digit verification code has been sent to the customer's email.
                    Please enter the code provided by the customer.
                  </p>
                </div>

                {/* OTP Input */}
                <div className="space-y-3">
                  <label className="text-sm font-medium block text-center">
                    Enter Verification Code
                  </label>
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-14 text-center text-2xl font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    ))}
                  </div>
                </div>

                {/* Timer */}
                {timeRemaining && (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span className={timeRemaining === "Expired" ? "text-red-500" : ""}>
                      Expires in: {timeRemaining}
                    </span>
                  </div>
                )}

                {/* Error Message */}
                {errorMessage && (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-red-800 dark:text-red-300">
                      {errorMessage}
                    </span>
                  </div>
                )}

                {/* Resend Link */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    className="text-sm text-primary hover:underline"
                  >
                    Didn't receive code? Resend OTP
                  </button>
                </div>

                {/* Verify Button */}
                <Button
                  onClick={handleVerifyOTP}
                  disabled={isLoading || otp.join("").length !== 6}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Complete Service"
                  )}
                </Button>
              </div>
            )}

            {/* Error State */}
            {state === "error" && (
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-300">Error</p>
                    <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                      {errorMessage}
                    </p>
                  </div>
                </div>
                <Button onClick={() => setState("idle")} variant="outline" className="w-full">
                  Try Again
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
