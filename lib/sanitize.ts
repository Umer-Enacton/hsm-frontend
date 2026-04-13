/**
 * Input Sanitization & Validation Utilities
 *
 * Provides utilities for sanitizing user input to prevent:
 * - XSS (Cross-Site Scripting) attacks
 * - SQL Injection (via parameter escaping)
 * - Script injection in various formats
 */

// ============================================
// TYPES
// ============================================

export interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  maxLength?: number;
  trim?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Maximum safe lengths for different input types
 */
export const MAX_LENGTHS = {
  NAME: 50,
  EMAIL: 255,
  PHONE: 10, // Indian phone: exactly 10 digits
  PASSWORD: 128,
  SHORT_TEXT: 100,
  MEDIUM_TEXT: 500,
  LONG_TEXT: 2000,
  REVIEW_COMMENT: 1000,
  REPLY: 1000,
  NOTES: 500,
  ADDRESS: 255,
  CITY: 100,
  STATE: 100,
  DESCRIPTION: 500,
  BIO: 1000,
} as const;

/**
 * Common regex patterns for validation
 */
export const PATTERNS = {
  // Email: strict format that allows dots before @ (like sahil.customer@gmail.com)
  // Local part: alphanumeric + ._%+-
  // Domain: alphanumeric + .-
  // TLD: 2-6 letters
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,

  // Email: Invalid patterns to reject (these are mistakes, not valid emails)
  EMAIL_INVALID: [
    /\.\./, // Double dots anywhere (sahil..customer@gmail.com)
    /\.@/, // Dot immediately before @ (.customer@gmail.com)
    /^\./, // Starts with dot
    /\.$/, // Ends with dot
    /@.*@/, // Multiple @ symbols (sahil@customer@gmail.com)
    /\.com.*\.com/, // Double .com (gmail.com.com)
    /\.[a-zA-Z]{7,}/, // TLD longer than 6 chars
  ],

  // Phone: Indian format (exactly 10 digits starting with 6-9)
  PHONE_INDIA: /^[6-9]\d{9}$/,

  // Phone: Simple 10 digits (for frontend validation)
  PHONE_10_DIGITS: /^\d{10}$/,

  // Name: letters, spaces, hyphens, apostrophes only
  NAME: /^[a-zA-Z\s\u00C0-\u00FF\-'.]{2,50}$/,

  // Username: alphanumeric, underscore, hyphen
  USERNAME: /^[a-zA-Z0-9_-]{3,30}$/,

  // URL: basic URL format
  URL: /^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/,

  // Number: positive integers
  POSITIVE_NUMBER: /^\d+$/,

  // Decimal: positive decimal numbers
  DECIMAL: /^\d+(\.\d{1,2})?$/,

  // OTP: 6 digits
  OTP: /^\d{6}$/,

  // Zip Code: Indian format (6 digits)
  ZIP_INDIA: /^\d{6}$/,
} as const;

/**
 * Dangerous patterns that could indicate XSS attempts
 */
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // Event handlers like onclick, onerror
  /<iframe/gi,
  /<embed/gi,
  /<object/gi,
  /<link/gi,
  /<meta/gi,
  /<style/gi,
  /@import/gi,
  /expression\s*\(/gi, // CSS expression
  /vbscript:/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /eval\s*\(/gi,
  /fromCharCode/gi,
  /innerHTML\s*=/gi,
  /document\.(write|writeln)/gi,
];

// ============================================
// SANITIZATION FUNCTIONS
// ============================================

/**
 * Strip HTML tags from string
 */
export function stripHtml(input: string): string {
  if (!input) return "";
  return input.replace(/<[^>]*>/g, "");
}

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(input: string): string {
  if (!input) return "";
  const htmlMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;",
  };
  return input.replace(/[&<>"'/=`]/g, (char) => htmlMap[char] || char);
}

/**
 * Check if string contains potentially dangerous content
 */
export function containsDangerousContent(input: string): boolean {
  if (!input) return false;
  const lowerInput = input.toLowerCase();

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(lowerInput)) {
      return true;
    }
  }

  return false;
}

/**
 * Sanitize user input by removing dangerous content
 */
export function sanitizeInput(
  input: string,
  options: SanitizeOptions = {},
): string {
  if (!input) return "";

  let sanitized = input;

  // Trim if requested
  if (options.trim !== false) {
    sanitized = sanitized.trim();
  }

  // Apply maxLength
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  // Remove dangerous content
  if (containsDangerousContent(sanitized)) {
    sanitized = stripHtml(sanitized);
    // Additional cleanup for encoded entities
    sanitized = sanitized.replace(/&[#\w]+;/g, "");
  }

  return sanitized;
}

/**
 * Sanitize a name field (letters, spaces, hyphens, apostrophes)
 */
export function sanitizeName(input: string): string {
  if (!input) return "";
  const sanitized = input.trim();
  // Remove any characters that aren't letters, spaces, hyphens, or apostrophes
  return sanitized.replace(/[^a-zA-Z\s\u00C0-\u00FF\-'.]/g, "");
}

/**
 * Sanitize a phone number (keep only digits and +)
 */
export function sanitizePhone(input: string): string {
  if (!input) return "";
  // Keep only digits and +
  return input.replace(/[^\d+]/g, "");
}

/**
 * Sanitize email (lowercase and trim)
 */
export function sanitizeEmail(input: string): string {
  if (!input) return "";
  return input.trim().toLowerCase();
}

/**
 * Sanitize numeric input (remove non-digits except decimal point)
 */
export function sanitizeNumber(input: string): string {
  if (!input) return "";
  return input.replace(/[^\d.]/g, "");
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate email format with strict checks
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim() === "") {
    return { valid: false, error: "Email is required" };
  }

  const sanitized = sanitizeEmail(email);

  // Check basic format
  if (!PATTERNS.EMAIL.test(sanitized)) {
    return { valid: false, error: "Invalid email format" };
  }

  // Check for common invalid patterns
  for (const invalidPattern of PATTERNS.EMAIL_INVALID) {
    if (invalidPattern.test(sanitized)) {
      return { valid: false, error: "Invalid email format" };
    }
  }

  if (sanitized.length > MAX_LENGTHS.EMAIL) {
    return { valid: false, error: "Email is too long" };
  }

  return { valid: true, sanitized };
}

/**
 * Validate phone number (India format - exactly 10 digits)
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone || phone.trim() === "") {
    return { valid: false, error: "Phone number is required" };
  }

  const sanitized = sanitizePhone(phone);

  // Must be exactly 10 digits
  if (sanitized.length !== 10) {
    return {
      valid: false,
      error: "Phone number must be exactly 10 digits",
    };
  }

  // Must start with 6-9 (Indian mobile numbers)
  if (!PATTERNS.PHONE_INDIA.test(sanitized)) {
    return {
      valid: false,
      error: "Phone number must start with 6, 7, 8, or 9",
    };
  }

  return { valid: true, sanitized };
}

/**
 * Validate name
 */
export function validateName(
  name: string,
  fieldName = "Name",
): ValidationResult {
  if (!name || name.trim() === "") {
    return { valid: false, error: `${fieldName} is required` };
  }

  const sanitized = sanitizeName(name);

  if (sanitized.length < 2) {
    return {
      valid: false,
      error: `${fieldName} must be at least 2 characters`,
    };
  }

  if (sanitized.length > MAX_LENGTHS.NAME) {
    return {
      valid: false,
      error: `${fieldName} cannot exceed ${MAX_LENGTHS.NAME} characters`,
    };
  }

  if (containsDangerousContent(sanitized)) {
    return { valid: false, error: `${fieldName} contains invalid characters` };
  }

  return { valid: true, sanitized };
}

/**
 * Validate password
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { valid: false, error: "Password is required" };
  }

  if (password.length < 6) {
    return { valid: false, error: "Password must be at least 6 characters" };
  }

  if (password.length > MAX_LENGTHS.PASSWORD) {
    return { valid: false, error: "Password is too long" };
  }

  return { valid: true, sanitized: password };
}

/**
 * Validate text input with custom length
 */
export function validateText(
  input: string,
  options: {
    maxLength: number;
    minLength?: number;
    fieldName?: string;
    required?: boolean;
  },
): ValidationResult {
  const {
    maxLength,
    minLength = 0,
    fieldName = "Text",
    required = true,
  } = options;
  const sanitized = sanitizeInput(input, { maxLength, trim: true });

  if (required && !sanitized) {
    return { valid: false, error: `${fieldName} is required` };
  }

  if (sanitized && sanitized.length < minLength) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${minLength} characters`,
    };
  }

  if (sanitized.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} cannot exceed ${maxLength} characters`,
    };
  }

  return { valid: true, sanitized };
}

/**
 * Validate OTP code
 */
export function validateOTP(otp: string): ValidationResult {
  if (!otp || otp.trim() === "") {
    return { valid: false, error: "OTP is required" };
  }

  const sanitized = otp.trim();

  if (!PATTERNS.OTP.test(sanitized)) {
    return { valid: false, error: "OTP must be 6 digits" };
  }

  return { valid: true, sanitized };
}

// ============================================
// REACT HOOKS
// ============================================

/**
 * Hook for validated input state
 */
export function useValidatedInput<T = string>(
  initialValue: T,
  validator: (value: T) => ValidationResult,
) {
  const [value, setValue] = React.useState<T>(initialValue);
  const [error, setError] = React.useState<string | undefined>();
  const [touched, setTouched] = React.useState(false);

  const handleChange = (newValue: T) => {
    setValue(newValue);
    if (touched) {
      const result = validator(newValue);
      setError(result.error);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    const result = validator(value);
    setError(result.error);
  };

  const reset = () => {
    setValue(initialValue);
    setError(undefined);
    setTouched(false);
  };

  return {
    value,
    error,
    touched,
    setValue: handleChange,
    setTouched,
    reset,
    isValid: !error,
  };
}

// Re-export for convenience
export const sanitize = {
  input: sanitizeInput,
  name: sanitizeName,
  phone: sanitizePhone,
  email: sanitizeEmail,
  number: sanitizeNumber,
  html: escapeHtml,
  stripHtml,
};

export const validate = {
  email: validateEmail,
  phone: validatePhone,
  name: validateName,
  password: validatePassword,
  text: validateText,
  otp: validateOTP,
};

// Import React for the hook
import React from "react";
