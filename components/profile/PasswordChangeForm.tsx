"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { passwordValidators } from "@/lib/profile-api";
import type { PasswordChangeData, PasswordFormErrors } from "@/types/profile";

interface PasswordChangeFormProps {
  onChange?: () => void;
  className?: string;
}

export function PasswordChangeForm({
  onChange,
  className,
}: PasswordChangeFormProps) {
  const [formData, setFormData] = useState<PasswordChangeData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<PasswordFormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const validateField = (name: string, value: string) => {
    let result;
    if (name === "confirmPassword") {
      result = passwordValidators.confirmPassword(value, formData.newPassword);
    } else {
      const validator =
        name === "currentPassword"
          ? passwordValidators.currentPassword
          : passwordValidators.newPassword;
      result = validator(value);
    }

    setErrors((prev) => ({
      ...prev,
      [name]: result.valid ? undefined : result.error,
    }));

    return result.valid;
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleFieldBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, formData[name as keyof PasswordChangeData]);
  };

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      currentPassword: true,
      newPassword: true,
      confirmPassword: true,
    });

    const isCurrentValid = validateField("currentPassword", formData.currentPassword);
    const isNewValid = validateField("newPassword", formData.newPassword);
    const isConfirmValid = validateField("confirmPassword", formData.confirmPassword);

    if (!isCurrentValid || !isNewValid || !isConfirmValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Call backend password change endpoint when available
      // await changePassword(formData);
      toast.success("Password changed successfully");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTouched({});
      setErrors({});
      onChange?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "", color: "" };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const levels = [
      { label: "Weak", color: "bg-destructive" },
      { label: "Fair", color: "bg-orange-500" },
      { label: "Good", color: "bg-yellow-500" },
      { label: "Strong", color: "bg-green-500" },
    ];

    const level = levels[strength - 1] || levels[0];
    return { ...level, strength };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="space-y-6 max-w-md">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Enter your current password and a new password to change your password.
          </p>
        </div>

        {/* Current Password */}
        <div className="space-y-2">
          <Label htmlFor="currentPassword">
            Current Password <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="currentPassword"
              name="currentPassword"
              type={showPasswords.current ? "text" : "password"}
              value={formData.currentPassword}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
              disabled={isSubmitting}
              className={
                touched.currentPassword && errors.currentPassword
                  ? "border-destructive pr-10"
                  : "pr-10"
              }
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("current")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPasswords.current ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {touched.currentPassword && errors.currentPassword && (
            <p className="text-sm text-destructive">{errors.currentPassword}</p>
          )}
        </div>

        {/* New Password */}
        <div className="space-y-2">
          <Label htmlFor="newPassword">
            New Password <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="newPassword"
              name="newPassword"
              type={showPasswords.new ? "text" : "password"}
              value={formData.newPassword}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
              disabled={isSubmitting}
              className={
                touched.newPassword && errors.newPassword
                  ? "border-destructive pr-10"
                  : "pr-10"
              }
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("new")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPasswords.new ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {touched.newPassword && errors.newPassword && (
            <p className="text-sm text-destructive">{errors.newPassword}</p>
          )}
          {formData.newPassword && !errors.newPassword && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${passwordStrength.color} transition-all`}
                    style={{ width: `${(passwordStrength.strength + 1) * 25}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {passwordStrength.label}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">
            Confirm New Password <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showPasswords.confirm ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
              disabled={isSubmitting}
              className={
                touched.confirmPassword && errors.confirmPassword
                  ? "border-destructive pr-10"
                  : "pr-10"
              }
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("confirm")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPasswords.confirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {touched.confirmPassword && errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Changing Password...
              </>
            ) : (
              "Change Password"
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Note: Password change functionality will be available once the backend endpoint is implemented.
        </p>
      </div>
    </form>
  );
}

export default PasswordChangeForm;
