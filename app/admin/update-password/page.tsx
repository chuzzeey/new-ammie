"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { AuthCard } from "@/features/admin/components/auth-card"
import { friendlyAuthError } from "@/lib/utils/auth-errors"

export default function AdminUpdatePasswordPage() {
  const router = useRouter()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.")
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (!updateError) {
      // Sign out so the user goes back to login and uses their new password.
      await supabase.auth.signOut()
    }
    setLoading(false)

    if (updateError) {
      setError(
        friendlyAuthError(updateError, "We couldn't update your password. Please try again.")
      )
      return
    }

    router.push("/admin/login?reset=success")
    router.refresh()
  }

  return (
    <AuthCard
      title="Set a New Password"
      subtitle="Enter a new password for your account"
      footer={
        <Link
          href="/admin/login"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="text-primary font-medium">Back to sign in</span>
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm rounded-full px-4 py-3 text-center">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="newPassword" className="text-sm font-medium text-foreground">
            New Password
          </label>
          <div className="relative">
            <input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              className="w-full bg-background border border-border rounded-full pl-4 pr-12 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat your new password"
            required
            className="w-full bg-background border border-border rounded-full pl-4 pr-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-full text-sm tracking-wide boty-transition hover:bg-primary/90 boty-shadow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Updating…
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4" /> Update Password
            </>
          )}
        </button>
      </form>
    </AuthCard>
  )
}