"use client"

import { useState } from "react"
import Link from "next/link"
import { KeyRound, Loader2, MailCheck } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { AuthCard } from "@/features/admin/components/auth-card"
import { friendlyAuthError, isValidEmail } from "@/lib/utils/auth-errors"
import { getSiteOrigin } from "@/lib/utils/site-url"

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const normalizedEmail = email.trim().toLowerCase()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.")
      return
    }

    setLoading(true)
    // Supabase sends a password-reset LINK to the email. Clicking it returns the
    // user to the app (auth callback) where they can set a new password.
    // getSiteOrigin() pins production builds to https://ammien.shop so links
    // can never fall back to localhost.
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${getSiteOrigin()}/api/auth/confirm?next=/admin/update-password`,
    })
    setLoading(false)

    if (resetError) {
      setError(
        friendlyAuthError(resetError, "We couldn't send a reset link. Please try again.")
      )
      return
    }

    setSent(true)
  }

  return (
    <AuthCard
      title="Reset Your Password"
      subtitle={
        sent ? "Check your inbox" : "We'll email you a link to reset your password"
      }
      footer={
        <Link
          href="/admin/login"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Remembered your password? <span className="text-primary font-medium">Sign in</span>
        </Link>
      }
    >
      {sent ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground">
            <MailCheck className="w-7 h-7" />
          </div>
          <p className="text-sm text-muted-foreground">
            If an account exists for
            <span className="block font-medium text-foreground mt-1 break-all">
              {normalizedEmail}
            </span>
            we&apos;ve emailed you a password reset link. Click it and you&apos;ll be able
            to choose a new password.
          </p>
          <Link
            href="/admin/login"
            className="text-sm text-primary font-medium hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="rounded-sm border border-destructive/20 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="min-h-12 w-full rounded-sm border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground sm:text-base"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Sending link…
              </>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>
      )}
    </AuthCard>
  )
}