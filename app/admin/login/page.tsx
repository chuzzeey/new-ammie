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
  const [email, setEmail] = useState("adminn@gmail.com")
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
      variant="login"
      title="Admin Login"
      subtitle="Sign in with your email and password to manage products"
    >
      {resetBanner && (
        <div className="mb-5 rounded-sm border border-border bg-muted px-4 py-3 text-center text-sm text-foreground">
          Your password has been reset. Sign in with your new password.
        </div>
      )}

      {confirmErrorBanner && (
        <div className="mb-5 rounded-sm border border-destructive/20 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
          That confirmation link is invalid or has expired. Please try again.
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-sm border border-destructive/20 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
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
            className="min-h-12 w-full rounded-lg border border-[#e7e0d7] bg-[#fffdfa] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-[#927451] focus:outline-none focus:ring-2 focus:ring-[#927451]/15 sm:text-base"
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
              className="min-h-12 w-full rounded-lg border border-[#e7e0d7] bg-[#fffdfa] py-3 pl-4 pr-12 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-[#927451] focus:outline-none focus:ring-2 focus:ring-[#927451]/15 sm:text-base"
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
            className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Forgot your password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#211b17] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#3a3028] disabled:cursor-not-allowed disabled:opacity-50"
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