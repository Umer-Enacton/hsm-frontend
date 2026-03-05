/**
 * Service Dialog Component
 * Create/Edit service dialog with form
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import type { Service } from "@/types/provider";

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  onSubmit: (data: Partial<Service> & { imageFile?: File | null }) => void | Promise<void>;
}

export function ServiceDialog({
  open,
  onOpenChange,
  service,
  onSubmit,
}: ServiceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("30");
  const [durationUnit, setDurationUnit] = useState("minutes");
  const [isActive, setIsActive] = useState(true);

  // Validation error states
  const [nameError, setNameError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [priceError, setPriceError] = useState("");
  const [durationError, setDurationError] = useState("");

  // Track which fields have been touched (blurred)
  const [nameTouched, setNameTouched] = useState(false);
  const [descriptionTouched, setDescriptionTouched] = useState(false);
  const [priceTouched, setPriceTouched] = useState(false);
  const [durationTouched, setDurationTouched] = useState(false);

  // Validation functions
  const validateName = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return "Service name is required";
    if (trimmed.length < 3) return "Service name must be at least 3 characters";
    return "";
  };

  const validateDescription = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return "Service description is required";
    if (trimmed.length < 10) return "Service description must be at least 10 characters";
    return "";
  };

  const validatePrice = (value: string): string => {
    const priceNum = Number(value);
    if (!value || isNaN(priceNum)) return "Price is required";
    if (priceNum <= 0) return "Price must be greater than 0";
    if (priceNum > 100000) return "Price seems unrealistic (max ₹100,000)";
    return "";
  };

  const validateDuration = (value: string, unit: string): string => {
    const durationNum = Number(value);
    if (!value || isNaN(durationNum)) return "Duration is required";
    if (durationNum <= 0) return "Duration must be positive";

    // Convert to minutes for validation
    let durationInMinutes = durationNum;
    if (unit === "hours") durationInMinutes *= 60;
    else if (unit === "days") durationInMinutes *= 1440;

    if (durationInMinutes > 1440) return "Duration cannot exceed 24 hours (1440 minutes)";
    return "";
  };

  // Reset form when dialog opens or service changes
  useEffect(() => {
    if (service) {
      setName(service.name);
      setDescription(service.description || "");
      setPrice(service.price.toString());

      // Handle duration safely - use duration or EstimateDuration
      const serviceDuration = service.duration || service.EstimateDuration || 30;
      setDuration(serviceDuration.toString());
      setDurationUnit("minutes"); // Always default to minutes for editing

      setIsActive(service.isActive ?? true);
      setImagePreview(service.image || null);
      setImageFile(null);

      // Clear errors and touched states
      setNameError("");
      setDescriptionError("");
      setPriceError("");
      setDurationError("");
      setNameTouched(false);
      setDescriptionTouched(false);
      setPriceTouched(false);
      setDurationTouched(false);
    } else {
      setName("");
      setDescription("");
      setPrice("");
      setDuration("30");
      setDurationUnit("minutes");
      setIsActive(true);
      setImagePreview(null);
      setImageFile(null);

      // Clear errors and touched states
      setNameError("");
      setDescriptionError("");
      setPriceError("");
      setDurationError("");
      setNameTouched(false);
      setDescriptionTouched(false);
      setPriceTouched(false);
      setDurationTouched(false);
    }
  }, [service, open]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched on submit
    setNameTouched(true);
    setDescriptionTouched(true);
    setPriceTouched(true);
    setDurationTouched(true);

    // Validate all fields
    const nameErr = validateName(name);
    const descErr = validateDescription(description);
    const priceErr = validatePrice(price);
    const durationErr = validateDuration(duration, durationUnit);

    // Set all errors
    setNameError(nameErr);
    setDescriptionError(descErr);
    setPriceError(priceErr);
    setDurationError(durationErr);

    // Check if any errors exist
    if (nameErr || descErr || priceErr || durationErr) {
      toast.error("Please fix the validation errors");
      return;
    }

    // Convert duration to minutes for submission
    let durationInMinutes = Number(duration);
    if (durationUnit === "hours") {
      durationInMinutes *= 60;
    } else if (durationUnit === "days") {
      durationInMinutes *= 1440;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        duration: durationInMinutes,
        isActive,
        imageFile,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {service ? "Edit Service" : "Add New Service"}
          </DialogTitle>
          <DialogDescription>
            {service
              ? "Update the service details below"
              : "Fill in the details to create a new service"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Service Image */}
            <div className="space-y-2">
              <Label>Service Image</Label>
              <div className="flex items-start gap-4">
                {imagePreview ? (
                  <div className="relative h-24 w-24 flex-shrink-0 rounded-lg overflow-hidden border">
                    <img
                      src={imagePreview}
                      alt="Service preview"
                      className="h-full w-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-24 w-24 flex-shrink-0 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isSubmitting}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Service Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Service Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Basic Plumbing Check"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  // Clear error on input, but re-validate if already touched
                  if (nameTouched) {
                    setNameError(validateName(e.target.value));
                  }
                }}
                onBlur={() => {
                  setNameTouched(true);
                  setNameError(validateName(name));
                }}
                disabled={isSubmitting}
                required
                className={nameError ? "border-destructive" : ""}
              />
              {nameError && nameTouched && (
                <p className="text-xs text-destructive">{nameError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Minimum 3 characters
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe what this service includes..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  // Clear error on input, but re-validate if already touched
                  if (descriptionTouched) {
                    setDescriptionError(validateDescription(e.target.value));
                  }
                }}
                onBlur={() => {
                  setDescriptionTouched(true);
                  setDescriptionError(validateDescription(description));
                }}
                disabled={isSubmitting}
                rows={3}
                className={descriptionError ? "border-destructive" : ""}
              />
              {descriptionError && descriptionTouched && (
                <p className="text-xs text-destructive">{descriptionError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Minimum 10 characters
              </p>
            </div>

            {/* Price and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">
                  Price (₹) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="500"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    // Clear error on input, but re-validate if already touched
                    if (priceTouched) {
                      setPriceError(validatePrice(e.target.value));
                    }
                  }}
                  onBlur={() => {
                    setPriceTouched(true);
                    setPriceError(validatePrice(price));
                  }}
                  disabled={isSubmitting}
                  required
                  className={priceError ? "border-destructive" : ""}
                />
                {priceError && priceTouched && (
                  <p className="text-xs text-destructive">{priceError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Duration <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    placeholder="30"
                    value={duration}
                    onChange={(e) => {
                      setDuration(e.target.value);
                      // Clear error on input, but re-validate if already touched
                      if (durationTouched) {
                        setDurationError(validateDuration(e.target.value, durationUnit));
                      }
                    }}
                    onBlur={() => {
                      setDurationTouched(true);
                      setDurationError(validateDuration(duration, durationUnit));
                    }}
                    disabled={isSubmitting}
                    required
                    className={durationError ? "border-destructive flex-1" : "flex-1"}
                  />
                  <Select
                    value={durationUnit}
                    onValueChange={(value: any) => {
                      setDurationUnit(value);
                      // Re-validate duration when unit changes
                      if (durationTouched) {
                        setDurationError(validateDuration(duration, value));
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {durationError && durationTouched && (
                  <p className="text-xs text-destructive">{durationError}</p>
                )}
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Active Status</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive services won't be visible to customers
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {service ? "Updating..." : "Creating..."}
                </>
              ) : service ? (
                "Save Changes"
              ) : (
                "Create Service"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
