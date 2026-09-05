"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Play } from "lucide-react"
import { getSafeVideoUrl, getHlsVideoUrl, getConnectionQuality, isDataSaverMode } from "@/lib/cloudinary"

/**
 * HLS Video Player with Adaptive Bitrate Streaming.
 *
 * Uses hls.js to play HLS streams from Cloudinary with automatic
 * quality switching based on real-time network bandwidth.
 *
 * Behavior by connection type:
 *   - 2G / Data Saver: Shows poster only, no video (saves data)
 *   - 3G: HLS with ABR, starts at low quality
 *   - 4G/WiFi: HLS with ABR, starts at high quality
 *   - Fallback: MP4 if HLS fails (e.g. very old browser)
 */
export function VideoPlayer({ videoUrl, posterUrl, alt }: { videoUrl: string; posterUrl: string; alt: string }) {
  const [playing, setPlaying] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [error, setError] = useState(false)
  const vidRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<any>(null)
  const safeVideoUrl = getSafeVideoUrl(videoUrl)
  const hlsVideoUrl = getHlsVideoUrl(videoUrl)
  const quality = getConnectionQuality()
  const saveData = isDataSaverMode()

  // Determine if we should skip video due to slow connection or data saver
  const shouldSkipVideo = quality === 'slow' || saveData

  // Initialize hls.js when user clicks play
  const initHls = async () => {
    if (hlsRef.current) return

    try {
      const Hls = (await import('hls.js')).default

      if (!Hls.isSupported()) {
        // HLS not supported — fall back to native MP4
        const vid = vidRef.current
        if (!vid) return
        vid.src = safeVideoUrl
        try { await vid.play(); setPlaying(true) } catch { setError(true) }
        return
      }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        // Start at lowest quality for slow connections, highest for fast
        startLevel: quality === 'fast' ? -1 : 0, // -1 = auto, 0 = lowest
        // ABR settings — more aggressive for slow connections
        abrEwmaDefaultEstimate: quality === 'medium' ? 500000 : 2000000, // 500kbps / 2mbps
        abrBandWidthFactor: quality === 'medium' ? 0.8 : 0.9,
        abrBandWidthUpFactor: quality === 'medium' ? 0.7 : 0.8,
      })

      hls.loadSource(hlsVideoUrl)
      hls.attachMedia(vidRef.current!)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        hlsRef.current = hls
        const vid = vidRef.current
        if (vid) {
          vid.play().then(() => setPlaying(true)).catch(() => setError(true))
        }
      })

      hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
        // Non-fatal errors (e.g. temporary network blips) are normal for HLS
        // and hls.js recovers automatically. Only handle fatal failures.
        if (data.fatal) {
          console.warn('HLS fatal error, falling back to MP4:', data.type, data.details)
          hls.destroy()
          hlsRef.current = null
          const vid = vidRef.current
          if (vid) {
            vid.src = safeVideoUrl
            vid.play().then(() => setPlaying(true)).catch(() => setError(true))
          }
        }
      })

    } catch {
      // hls.js failed to load — fall back to native MP4
      const vid = vidRef.current
      if (!vid) return
      vid.src = safeVideoUrl
      try { await vid.play(); setPlaying(true) } catch { setError(true) }
    }
  }

  const handlePlay = () => {
    setHasInteracted(true)
    setError(false)
    initHls()
  }

  const handlePause = () => {
    const vid = vidRef.current
    if (vid) vid.pause()
    setPlaying(false)
  }

  // Clean up hls.js on unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [])

  // On slow connection or data saver, show poster only with appropriate message
  if (shouldSkipVideo && !hasInteracted) {
    return (
      <div className="relative w-full h-full">
        <Image src={posterUrl} alt={alt} fill sizes="50vw" className="object-cover" priority />
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/30">
          <button
            onClick={handlePlay}
            className="mb-3 w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white transition"
          >
            <Play className="w-7 h-7 text-foreground ml-0.5" fill="currentColor" />
          </button>
          <p className="text-white text-xs text-center px-4 max-w-[200px]">
            {saveData
              ? "Data Saver mode — tap to play (may use ~50MB)"
              : "Slow connection detected — tap for lower quality video"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* Thumbnail overlay before interaction */}
      {!hasInteracted && !error && (
        <Image src={posterUrl} alt={alt} fill sizes="50vw" className="object-cover" priority />
      )}
      
      {/* Error state */}
      {error && (
        <div className="absolute inset-0 z-20 bg-black/40 flex items-center justify-center">
          <p className="text-white text-sm">Video unavailable</p>
        </div>
      )}
      
      {/* Play button */}
      {!hasInteracted && !error && !shouldSkipVideo && (
        <button
          onClick={handlePlay}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/10 hover:bg-black/20 transition"
        >
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="w-7 h-7 text-foreground ml-0.5" fill="currentColor" />
          </div>
        </button>
      )}
      
      {/* Video element — hls.js attaches to this */}
      <video
        ref={vidRef}
        className={`w-full h-full object-cover ${hasInteracted && !error && !shouldSkipVideo ? 'opacity-100' : 'opacity-0'}`}
        preload="metadata"
        playsInline
        loop={false}
        muted={false}
        controls={hasInteracted && !error}
        crossOrigin="anonymous"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => { console.error('Video error for:', safeVideoUrl); setError(true); setPlaying(false) }}
      />
    </div>
  )
}