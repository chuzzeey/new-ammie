"use client"

import { ChangeEvent, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, BadgeCheck, Camera, Loader2, Save, UserRound } from "lucide-react"
import type { User } from "@supabase/supabase-js"
import { Header } from "@/components/layout/header"
import { supabase } from "@/lib/supabase"

export default function AdminProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [country, setCountry] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    let active = true

    const loadProfile = async () => {
      const { data, error: authError } = await supabase.auth.getUser()
      if (!active) return

      if (authError) {
        setError("Unable to load your profile. Please refresh and try again.")
      } else if (!data.user) {
        router.replace("/admin/login")
      } else {
        setUser(data.user)
        const metadata = data.user.user_metadata
        setName(typeof metadata.full_name === "string" ? metadata.full_name : "")
        setPhone(typeof metadata.phone === "string" ? metadata.phone : "")
        setCountry(typeof metadata.country === "string" ? metadata.country : "")
        setAvatarUrl(typeof metadata.avatar_url === "string" ? metadata.avatar_url : "")
      }
      setLoading(false)
    }

    void loadProfile()
    return () => {
      active = false
    }
  }, [router])

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!user) {
      setError("Your admin account is not ready. Refresh and try again.")
      return
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      setError("Choose a JPG, PNG, WebP, or GIF image.")
      event.target.value = ""
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Choose an image smaller than 5 MB.")
      event.target.value = ""
      return
    }
    setError("")
    setMessage("")
    setAvatarUploading(true)

    const extensionByType: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    }
    const filePath = `${user.id}/${crypto.randomUUID()}.${extensionByType[file.type]}`
    const { error: uploadError } = await supabase.storage
      .from("admin-avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      setAvatarUploading(false)
      setError(`Unable to upload profile photo: ${uploadError.message}`)
      event.target.value = ""
      return
    }

    const { data: publicUrlData } = supabase.storage
      .from("admin-avatars")
      .getPublicUrl(filePath)
    const nextAvatarUrl = publicUrlData.publicUrl
    const { data, error: updateError } = await supabase.auth.updateUser({
      data: { ...user.user_metadata, avatar_url: nextAvatarUrl },
    })

    if (updateError) {
      const { error: cleanupError } = await supabase.storage
        .from("admin-avatars")
        .remove([filePath])
      setAvatarUploading(false)
      setError(
        cleanupError
          ? `Unable to save profile photo: ${updateError.message}. Uploaded file cleanup also failed: ${cleanupError.message}`
          : `Unable to save profile photo: ${updateError.message}`
      )
      event.target.value = ""
      return
    }

    if (data.user) setUser(data.user)
    setAvatarUrl(nextAvatarUrl)
    setAvatarUploading(false)
    setMessage("Profile photo updated.")
    event.target.value = ""
  }

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setMessage("")
    setSaving(true)

    const { data, error: updateError } = await supabase.auth.updateUser({
      data: {
        ...user?.user_metadata,
        full_name: name.trim(),
        phone: phone.trim(),
        country: country.trim(),
      },
    })
    setSaving(false)

    if (updateError) {
      setError("Unable to save profile details. Please try again.")
      return
    }

    if (data.user) setUser(data.user)
    setMessage("Profile details saved.")
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
            <h1 className="mt-1 text-2xl font-semibold text-foreground">Profile</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Update your public admin details. Your sign-in email stays read-only.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading profile…
            </div>
          ) : error && !user ? (
            <p role="alert" className="rounded-sm border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : user ? (
            <form onSubmit={handleSave} className="space-y-7">
              <div className="flex flex-col items-center gap-4 rounded-md p-6 sm:flex-row">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full text-[#6d5137]">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Admin profile" className="h-full w-full object-cover" />
                  ) : (
                    <UserRound className="h-10 w-10" />
                  )}
                </div>
                <div className="text-center sm:text-left">
                  <div className="flex items-center justify-center gap-2 sm:justify-start">
                    <h2 className="text-lg font-semibold text-foreground">{name.trim() || "Store Admin"}</h2>
                    <span title="Verified admin" aria-label="Verified admin">
                      <BadgeCheck className="h-5 w-5 text-sky-600" />
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">Verified administrator</p>
                  <label className={`mt-3 inline-flex min-h-9 items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium text-foreground transition-colors ${
                    avatarUploading ? "cursor-wait opacity-60" : "cursor-pointer hover:bg-muted"
                  }`}>
                    {avatarUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    {avatarUploading ? "Uploading…" : avatarUrl ? "Change picture" : "Add a picture"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleAvatarChange}
                      disabled={avatarUploading}
                      className="sr-only"
                    />
                  </label>
                  <p className="mt-2 text-xs text-muted-foreground">JPG, PNG, WebP, or GIF. Maximum 5 MB.</p>
                </div>
              </div>

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

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="admin-name" className="mb-1.5 block text-sm font-medium text-foreground">Display name</label>
                  <input
                    id="admin-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    maxLength={80}
                    className="min-h-11 w-full rounded-none border-0 border-b border-border bg-transparent px-0 py-3 text-sm text-foreground focus:border-foreground focus:outline-none focus:ring-0"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="admin-email" className="mb-1.5 block text-sm font-medium text-foreground">Email address</label>
                  <input
                    id="admin-email"
                    type="email"
                    value={user.email || ""}
                    readOnly
                    className="min-h-11 w-full cursor-not-allowed rounded-none border-0 border-b border-border bg-transparent px-0 py-3 text-sm text-muted-foreground"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">Email changes are disabled for this account.</p>
                </div>
                <div>
                  <label htmlFor="admin-phone" className="mb-1.5 block text-sm font-medium text-foreground">Phone number</label>
                  <input
                    id="admin-phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="Add your phone number"
                    className="min-h-11 w-full rounded-none border-0 border-b border-border bg-transparent px-0 py-3 text-sm text-foreground focus:border-foreground focus:outline-none focus:ring-0"
                  />
                </div>
                <div>
                  <label htmlFor="admin-country" className="mb-1.5 block text-sm font-medium text-foreground">Country</label>
                  <input
                    id="admin-country"
                    autoComplete="country-name"
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                    placeholder="Add your country"
                    className="min-h-11 w-full rounded-none border-0 border-b border-border bg-transparent px-0 py-3 text-sm text-foreground focus:border-foreground focus:outline-none focus:ring-0"
                  />
                </div>
              </div>

              <div className="flex justify-end border-t border-border pt-5">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Saving…" : "Save profile"}
                </button>
              </div>
            </form>
          ) : null}
        </section>
      </div>
    </main>
  )
}
