import * as React from "react"

import { cn } from "@/lib/utils"

interface TextareaProps extends Omit<React.ComponentProps<"textarea">, "maxLength"> {
  /** Maximum character length (use this instead of native maxLength for better UX) */
  maxLength?: number;
  /** Show character count */
  showCount?: boolean;
  /** Custom count display */
  countDisplay?: (current: number, max: number) => React.ReactNode;
}

function Textarea({
  className,
  maxLength,
  showCount = false,
  countDisplay,
  value,
  onChange,
  ...props
}: TextareaProps) {
  const internalValue = typeof value === "string" ? value : "";
  const currentLength = internalValue.length;

  // Handle maxLength validation
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    // Enforce maxLength if set
    if (maxLength && newValue.length > maxLength) {
      e.target.value = newValue.slice(0, maxLength);
    }

    onChange?.(e);
  };

  return (
    <div className="relative">
      <textarea
        data-slot="textarea"
        className={cn(
          "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          maxLength && "pr-12", // Add padding for character count
          className
        )}
        value={value}
        onChange={handleChange}
        maxLength={maxLength}
        {...props}
      />
      {(showCount || maxLength) && (
        <span
          className={cn(
            "absolute bottom-2 right-3 text-xs pointer-events-none tabular-nums",
            currentLength > (maxLength || 0) * 0.9
              ? "text-amber-600 dark:text-amber-400"
              : "text-muted-foreground"
          )}
        >
          {countDisplay
            ? countDisplay(currentLength, maxLength || 0)
            : maxLength
              ? `${currentLength}/${maxLength}`
              : `${currentLength}`}
        </span>
      )}
    </div>
  )
}

export { Textarea }
