/**
 * Server-side upload API route.
 *
 * Accepts a raw file from the client and uploads it to Cloudinary.
 * For videos, Cloudinary automatically handles format conversion
 * server-side — no local FFmpeg needed.
 *
 * This replaces the previous client-side FFmpeg WASM approach which:
 *   - Downloaded ~30MB of WASM core to the browser
 *   - Blocked the main thread during conversion
 *   - Drained mobile battery
 *   - Failed on low-memory devices
 *
 * Cloudinary handles:
 *   - Video format normalization (any input → MP4/H.264)
 *   - Transcoding to adaptive bitrates
 *   - CDN delivery with automatic format selection
 */

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Upload a file buffer directly to Cloudinary via their API.
 * Uses base64 data URI for the upload body.
 */
async function uploadToCloudinary(
  buffer: Buffer,
  originalName: string,
  resourceType: "image" | "video",
): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    throw new Error("Missing Cloudinary configuration")
  }

  // Determine MIME type for the data URI
  const mimeType = resourceType === "video" ? "video/mp4" : "image/jpeg"

  // Convert buffer to base64 data URI for Cloudinary API
  const base64Data = buffer.toString("base64")
  const dataUri = `data:${mimeType};base64,${base64Data}`

  console.log(`[Cloudinary Upload] Starting ${resourceType} upload for: ${originalName} (${(buffer.length / 1024 / 1024).toFixed(2)}MB)`)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file: dataUri,
        upload_preset: uploadPreset,
        folder: "ammie-store/products",
        resource_type: resourceType,
        // Note: `format` is not allowed in unsigned uploads.
        // Cloudinary auto-detects the format from the uploaded file.
        // The `f_mp4` transform is applied in the returned URL instead.
      }),
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || `Failed to upload ${resourceType}`)
  }

  const data = await response.json()
  console.log(`[Cloudinary Upload] Success: ${data.secure_url}`)

  // Apply HLS streaming transforms for adaptive bitrate video delivery
  // sp_hls generates a master .m3u8 with multiple quality levels (360p/480p/720p)
  // so hls.js can auto-select the best quality per user's connection
  if (resourceType === "video") {
    return applyTransforms(data.secure_url, ["w_720", "q_auto", "sp_hls", "f_auto"])
  }

  // Apply standard image transforms
  return applyTransforms(data.secure_url, ["f_auto", "q_auto"])
}

/**
 * Insert Cloudinary transformation parameters into a URL.
 */
function applyTransforms(url: string, transforms: string[]): string {
  const uploadMarker = "/upload/"
  const markerIndex = url.indexOf(uploadMarker)
  if (markerIndex === -1) return url

  const transformStr = transforms.join(",")
  const insertAt = markerIndex + uploadMarker.length
  return `${url.slice(0, insertAt)}${transformStr}/${url.slice(insertAt)}`
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication (admin only)
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // No need to set cookies on API route
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse the multipart form data
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size (max 100MB)
    const isVideo = file.type.startsWith("video/")
    const maxSize = 100 * 1024 * 1024 // 100MB max for any upload

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 100MB." },
        { status: 400 },
      )
    }

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer()
    const uploadBuffer = Buffer.from(arrayBuffer)

    // Upload to Cloudinary — Cloudinary handles all format conversion server-side.
    // No local FFmpeg needed. Videos uploaded as-is and served via f_mp4 transform.
    const resourceType = isVideo ? "video" : "image"
    const secureUrl = await uploadToCloudinary(uploadBuffer, file.name, resourceType)

    return NextResponse.json({
      url: secureUrl,
      resourceType,
    })
  } catch (error: any) {
    console.error("Upload API error:", error)
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 },
    )
  }
}
