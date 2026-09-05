"use client"

import { useState } from "react"
import Image from "next/image"
import { Play } from "lucide-react"
import { getVideoPosterUrl } from "@/lib/cloudinary"

/**
 * Small self-contained thumbnail for video.
 *
 * Uses Cloudinary's video poster frame (generated from the video at 1s)
 * instead of downloading video metadata to canvas-capture a frame.
 * This saves ~500KB-2MB of video metadata download on mobile just to
 * show a thumbnail preview.
 *
 * The poster URL is derived from the video URL with so_1.0,f_auto,q_auto
 * transforms — zero additional storage cost, consistent thumbnail across
 * the entire application.
 */
export function ThumbnailVideo({ videoUrl, posterUrl }: { videoUrl: string; posterUrl?: string }) {
  const [error, setError] = useState(false)
  const effectivePoster = posterUrl || getVideoPosterUrl(videoUrl)

  if (error || !effectivePoster) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <Play className="w-6 h-6 text-muted-foreground" fill="currentColor" />
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <Image
        src={effectivePoster}
        alt="Video thumbnail"
        fill
        sizes="76px"
        className="object-cover"
        onError={() => setError(true)}
      />
      {/* Play icon overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/15 pointer-events-none">
        <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
          <Play className="w-3 h-3 md:w-3.5 md:h-3.5 text-foreground ml-0.5" fill="currentColor" />
        </div>
      </div>
    </div>
  )
}
