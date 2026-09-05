/**
 * Friendly, human-readable messages for common Supabase Auth errors.
 * Used across the admin login / forgot-password pages.
 */

const COMMON_ERRORS: Record<string, string> = {
  "Invalid login credentials": "Email or password is incorrect. Please try again.",
  "Email not confirmed": "Please confirm your email first — check your inbox for the confirmation link.",
  "User already registered": "An account with this email already exists. Try signing in instead.",
  "Token has expired or is invalid": "That code is invalid or has expired. Please request a new one.",
  "Email rate limit exceeded": "Too many attempts — please wait a minute and try again.",
  "For security purposes, you can only request this once every 60 seconds.":
    "Please wait a minute before requesting another code.",
  "For security purposes, you can only request this after 60 seconds.":
    "Please wait a minute before requesting another code.",
  "Password should be at least 6 characters.":
    "Password should be at least 6 characters.",
  "New password should be different from the old password.":
    "New password should be different from your current one.",
  "User not found": "No account was found with that email.",
}

/**
 * Maps a Supabase Auth error to a readable message.
 * Falls back to the raw error message, then to `fallback`.
 */
export function friendlyAuthError(
  error: { message?: string; code?: string } | null,
  fallback = "Something went wrong. Please try again."
): string {
  if (!error) return fallback
  if (error.message && COMMON_ERRORS[error.message]) return COMMON_ERRORS[error.message]
  return error.message || fallback
}

/** Basic email format check. */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}