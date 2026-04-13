import * as React from "react"

import { cn } from "@/lib/utils"

interface InputProps extends Omit<React.ComponentProps<"input">, "maxLength"> {
  /** Maximum character length */
  maxLength?: number;
  /** Show character count */
  showCount?: boolean;
  /** Validation type for auto-formatting */
  validateAs?: "email" | "phone" | "number" | "name" | "text";
  /** Sanitize input to prevent XSS */
  sanitize?: boolean;
}

function Input({
  className,
  type,
  maxLength,
  showCount = false,
  validateAs,
  sanitize = true,
  value,
  onChange,
  ...props
}: InputProps) {
  // Use a ref to track the actual input value for character count
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [displayValue, setDisplayValue] = React.useState(typeof value === "string" ? value : "");

  // Update displayValue when value prop changes (for controlled inputs)
  React.useEffect(() => {
    if (typeof value === "string") {
      setDisplayValue(value);
    }
  }, [value]);

  // Auto-set maxLength for phone (exactly 10 digits)
  const effectiveMaxLength = validateAs === "phone" ? 10 : maxLength;
  const currentLength = displayValue.length;

  // Handle input changes with validation and sanitization
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    // Apply validation formatting
    switch (validateAs) {
      case "email":
        // Email: lowercase and trim spaces
        newValue = newValue.toLowerCase().trim();
        break;
      case "phone":
        // Phone: keep only digits (no +, exactly 10 digits)
        newValue = newValue.replace(/[^\d]/g, "");
        break;
      case "number":
        // Number: keep only digits and decimal point
        newValue = newValue.replace(/[^\d.]/g, "");
        break;
      case "name":
        // Name: remove special characters (except letters, spaces, hyphens, apostrophes)
        newValue = newValue.replace(/[^a-zA-Z\s\u00C0-\u00FF\-'.]/g, "");
        break;
      case "text":
      default:
        // Basic sanitization - strip HTML tags
        if (sanitize) {
          newValue = newValue.replace(/<[^>]*>/g, "");
        }
        break;
    }

    // Enforce maxLength
    if (effectiveMaxLength && newValue.length > effectiveMaxLength) {
      newValue = newValue.slice(0, effectiveMaxLength);
    }

    // Update local state for character count
    setDisplayValue(newValue);

    // Update the input value
    e.target.value = newValue;
    onChange?.(e);
  };

  // Determine if character count should be shown
  const shouldShowCount = showCount || effectiveMaxLength;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type={type}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          shouldShowCount && "pr-12", // Add padding for character count
          className
        )}
        value={value}
        onChange={handleChange}
        maxLength={effectiveMaxLength}
        {...props}
      />
      {shouldShowCount && type !== "password" && (
        <span
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none tabular-nums",
            effectiveMaxLength && currentLength >= effectiveMaxLength
              ? "text-red-500 dark:text-red-400"
              : effectiveMaxLength && currentLength > effectiveMaxLength * 0.9
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground"
          )}
        >
          {effectiveMaxLength ? `${currentLength}/${effectiveMaxLength}` : `${currentLength}`}
        </span>
      )}
    </div>
  )
}

export { Input }
