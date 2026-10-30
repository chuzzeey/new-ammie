"use client"

import { FormEvent, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Bell, Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from "lucide-react"
import { Header } from "@/components/layout/header"
import { supabase } from "@/lib/supabase"

const notificationPreferenceKey = "ammie-admin-email-notifications"

export default function AdminSettingsPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savingPassword, setSavingPassword] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    let active = true
    const loadSettings = async () => {
      const [{ data, error: userError }] = await Promise.all([supabase.auth.getUser()])
      if (!active) return

      if (userError) {
        setError("Unable to load account settings. Please refresh and try again.")
      } else if (!data.user) {
        router.replace("/admin/login")
      } else {
        setEmail(data.user.email || "")
      }
      setEmailNotifications(window.localStorage.getItem(notificationPreferenceKey) === "true")
      setLoading(false)
    }

    void loadSettings()
    return () => {
      active = false
    }
  }, [router])

  const handleNotificationChange = (enabled: boolean) => {
    setEmailNotifications(enabled)
    window.localStorage.setItem(notificationPreferenceKey, String(enabled))
    setMessage("Notification preference saved on this device. Email delivery is not connected yet.")
    setError("")
  }

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setMessage("")

    if (!email) {
      setError("Your account email could not be loaded. Refresh and try again.")
      return
    }
    if (!currentPassword) {
      setError("Enter your current password to continue.")
      return
    }
    if (newPassword.length < 6) {
      setError("Your new password must be at least 6 characters.")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.")
      return
    }

    setSavingPassword(true)
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    })
    if (verifyError) {
      setSavingPassword(false)
      setError("Your current password is incorrect.")
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPassword(false)
    if (updateError) {
      setError("Unable to update your password. Please try again.")
      return
    }

    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setMessage("Your password has been updated.")
  }

  const handleLogout = async () => {
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      setError("Unable to log out. Please try again.")
      return
    }
    router.replace("/admin/login")
  }

  return (
    <main className="min-h-screen bg-muted/40">
      <Header variant="admin" onLogoutClick={handleLogout} />
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-32 sm:px-6">
        <nav aria-label="Breadcrumb" className="mb-8">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </nav>

        <section className="rounded-lg border border-border bg-background p-6 shadow-sm sm:p-8">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Admin account</p>
            <h1 className="mt-1 text-2xl font-semibold text-foreground">Settings</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Manage email notification preferences and protect your account.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading settings…
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <p role="alert" className="rounded-sm border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </p>
              )}
              {message && (
                <p role="status" className="rounded-sm border border-emerald-600/20 bg-emerald-600/10 px-4 py-3 text-sm text-emerald-800">
                  {message}
                </p>
              )}

              <section id="notifications" className="scroll-mt-24 rounded-md p-4 sm:p-5">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 rounded-full bg-muted p-2 text-foreground">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-sm font-semibold text-foreground">Email notifications</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Save your preference for future store updates. Sending notifications is not connected yet.
                    </p>
                    <label className="mt-4 inline-flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(event) => handleNotificationChange(event.target.checked)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="text-sm font-medium text-foreground">Receive admin email notifications</span>
                    </label>
                  </div>
                </div>
              </section>

              <section className="rounded-md p-4 sm:p-5">
                <div className="mb-5 flex items-start gap-4">
                  <div className="mt-0.5 rounded-full bg-muted p-2 text-foreground">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Change password</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Verify your current password before choosing a new one.
                    </p>
                  </div>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {[
                    { id: "current-password", label: "Current password", value: currentPassword, setValue: setCurrentPassword, autoComplete: "current-password" },
                    { id: "new-password", label: "New password", value: newPassword, setValue: setNewPassword, autoComplete: "new-password" },
                    { id: "confirm-password", label: "Confirm new password", value: confirmPassword, setValue: setConfirmPassword, autoComplete: "new-password" },
                  ].map((field) => (
                    <div key={field.id}>
                      <label htmlFor={field.id} className="mb-1.5 block text-sm font-medium text-foreground">{field.label}</label>
                      <div className="relative">
                        <input
                          id={field.id}
                          type={showPasswords ? "text" : "password"}
                          autoComplete={field.autoComplete}
                          value={field.value}
                          onChange={(event) => field.setValue(event.target.value)}
                          required
                          minLength={field.id === "current-password" ? undefined : 6}
                          className="min-h-11 w-full rounded-none border-0 border-b border-border bg-transparent py-3 pl-0 pr-12 text-sm text-foreground focus:border-foreground focus:outline-none focus:ring-0"
                        />
                        {field.id === "current-password" && (
                          <button
                            type="button"
                            onClick={() => setShowPasswords((visible) => !visible)}
                            aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                          >
                            {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
                    {savingPassword ? "Updating password…" : "Update password"}
                  </button>
                </form>
              </section>

              <section className="flex items-start gap-4 rounded-md p-4 sm:p-5">
                <div className="mt-0.5 rounded-full bg-background p-2 text-foreground">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Account security</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Admin access is restricted to authorized accounts. Never share your password, and log out on shared devices.
                  </p>
                </div>
              </section>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
