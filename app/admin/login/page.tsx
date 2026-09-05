"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { AuthCard } from "@/features/admin/components/auth-card"
import { friendlyAuthError } from "@/lib/utils/auth-errors"

export default function AdminLoginPage() {
  const router = useRouter()

  const [resetBanner, setResetBanner] = useState(false)
  const [confirmErrorBanner, setConfirmErrorBanner] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Show a small banner after a successful password reset (?reset=success),
  // or after a failed/invalid email link (?error=confirm).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("reset") === "success") setResetBanner(true)
    if (params.get("error") === "confirm") setConfirmErrorBanner(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    setLoading(false)
    if (signInError) {
      setError(friendlyAuthError(signInError, "Incorrect email or password. Please try again."))
      return
    }

    router.push("/admin")
    router.refresh()
  }

  return (
    <AuthCard
      title="Admin Login"
      subtitle="Sign in with your email and password to manage products"
    >
      {resetBanner && (
        <div className="bg-primary/10 text-primary text-sm rounded-full px-4 py-3 text-center mb-5">
          Your password has been reset. Sign in with your new password.
        </div>
      )}

      {confirmErrorBanner && (
        <div className="bg-destructive/10 text-destructive text-sm rounded-full px-4 py-3 text-center mb-5">
          That confirmation link is invalid or has expired. Please try again.
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm rounded-full px-4 py-3 text-center mb-5">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
            className="w-full bg-background border border-border rounded-full pl-4 pr-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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

        <div className="flex items-center justify-between text-sm">
          <Link
            href="/admin/forgot-password"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            Forgot your password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-full text-sm tracking-wide boty-transition hover:bg-primary/90 boty-shadow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Signing in…
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" /> Sign In
            </>
          )}
        </button>
      </form>
    </AuthCard>
  )
}