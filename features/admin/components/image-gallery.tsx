"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Plus, X, Upload, Camera, Play } from "lucide-react"
import { uploadToCloudinary, transformImageUrl, isVideoUrl, getVideoPosterUrl, getOptimizedVideoUrl } from "@/lib/cloudinary"

interface ImageGalleryProps {
  images: string[]
  selectedImageIndex: number
  onSelectImage: (index: number) => void
  onUpdateImage: (index: number, value: string) => void
}

export default function ImageGallery({ images, selectedImageIndex, onSelectImage, onUpdateImage }: ImageGalleryProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  const [showUploadOptions, setShowUploadOptions] = useState<number | null>(null)
  const [showMultipleUpload, setShowMultipleUpload] = useState(false)
  const singleFileRef = useRef<HTMLInputElement>(null)
  const multipleFileRef = useRef<HTMLInputElement>(null)
  const pendingSourceIndex = useRef<number | null>(null)

  /**
   * Image preloader: starts downloading the adjacent images in the
   * background as soon as any upload completes, so the next click on
   * a thumbnail swaps instantly instead of waiting 1-2 seconds.
   */
  const preloadImage = (url: string) => {
    if (!url) return
    const img = new window.Image()
    // Use the resized version so the preload is as fast as possible
    img.src = transformImageUrl(url, "w_800", "f_auto", "q_auto")
  }

  const preloadAllImages = (imgs: string[], skipIndex: number) => {
    imgs.forEach((url, i) => {
      if (i !== skipIndex && url) preloadImage(url)
    })
  }

  const handleFileUpload = async (files: FileList | null, sourceIndex: number | null, isMultiple: boolean = false) => {
    if (!files || files.length === 0) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxMultiple = 4

    setUploadError(null)

    let filesArray = Array.from(files)
    let truncatedNotice: string | null = null
    if (isMultiple && filesArray.length > maxMultiple) {
      filesArray = filesArray.slice(0, maxMultiple)
      truncatedNotice = `Only the first ${maxMultiple} images were used — up to ${maxMultiple} images can be added at once.`
    }

    for (const file of filesArray) {
      const isImageFile = allowedTypes.includes(file.type) || file.type.startsWith("image/")
      const isVideoFile = file.type.startsWith("video/")

      if (isVideoFile || !isImageFile) {
        setUploadError('Invalid file type. Please upload JPG, PNG, or WebP images only.')
        return
      }
    }

    try {
      setUploading(true)
      setShowUploadOptions(null)
      setShowMultipleUpload(false)
      setUploadProgress({ current: 0, total: filesArray.length })

      // Upload ALL files in parallel — much faster than one-at-a-time
      const uploadedUrls: string[] = await Promise.all(
        filesArray.map(async (file, i) => {
          setUploadProgress({ current: i + 1, total: filesArray.length })
          return uploadToCloudinary(file)
        })
      )

      if (isMultiple) {
        let uploadIndex = 1
        for (const url of uploadedUrls) {
          if (uploadIndex < images.length) {
            onUpdateImage(uploadIndex, url)
            uploadIndex++
          }
        }
        if (!images[0] && uploadedUrls[0]) {
          onUpdateImage(0, uploadedUrls[0])
        }
      } else {
        if (sourceIndex === 0) {
          onUpdateImage(0, uploadedUrls[0])
        } else if (sourceIndex !== null && sourceIndex > 0) {
          onUpdateImage(sourceIndex, uploadedUrls[0])
          if (!images[0]) {
            onUpdateImage(0, uploadedUrls[0])
          }
        }
      }

      // Preload all images so thumbnail switching is instant
      const allImages = [...images]
      uploadedUrls.forEach((url, i) => {
        if (isMultiple) {
          const slot = i + 1
          if (slot < allImages.length) allImages[slot] = url
        } else if (sourceIndex !== null) {
          allImages[sourceIndex] = url
          if (sourceIndex === 0 && !images[0] && uploadedUrls[0]) {
            // already set above
          }
        }
      })
      if (!isMultiple && sourceIndex !== null) {
        allImages[sourceIndex] = uploadedUrls[0]
        if (sourceIndex !== 0 && !allImages[0] && uploadedUrls[0]) {
          allImages[0] = uploadedUrls[0]
        }
      }
      preloadAllImages(allImages, selectedImageIndex)

      setUploadProgress(null)
      setUploadError(truncatedNotice)
      if (singleFileRef.current) singleFileRef.current.value = ''
      if (multipleFileRef.current) multipleFileRef.current.value = ''
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image')
      setUploadProgress(null)
    } finally {
      setUploading(false)
    }
  }

  const handleThumbnailClick = (index: number) => {
    setShowUploadOptions(index)
  }

  const handleDelete = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    onUpdateImage(index, "")
  }

  const additionalImages = images.slice(1)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-6 lg:gap-8 items-stretch">
        {/* Main Image */}
        <div className="flex flex-col gap-3 flex-1">
          <div
            className="relative w-full h-full rounded-3xl overflow-hidden bg-card boty-shadow flex items-center justify-center cursor-pointer"
            onClick={() => setShowUploadOptions(0)}
          >
            {images[0] ? (
              isVideoUrl(images[0]) ? (
                <>
                  {/* Video preview — show poster frame + play icon */}
                  <Image
                    src={getVideoPosterUrl(images[0])}
                    alt="Product video preview"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 text-foreground ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                    VIDEO
                  </div>
                  <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 boty-transition flex items-center justify-center">
                    <span className="text-white text-sm font-medium">Change Video</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(0, e)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500/80 flex items-center justify-center text-white hover:bg-red-500 boty-transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <Image
                    src={transformImageUrl(images[0], "w_800", "f_auto", "q_auto")}
                    alt="Product preview"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 boty-transition flex items-center justify-center">
                    <span className="text-white text-sm font-medium">Change Image</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(0, e)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500/80 flex items-center justify-center text-white hover:bg-red-500 boty-transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground p-8 hover:text-foreground boty-transition">
                <Plus className="w-10 h-10" />
                <span className="text-sm">Click to add image or video</span>
              </div>
            )}
          </div>

          {uploadProgress && (
            <div className="w-full">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress.current} of {uploadProgress.total}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 boty-transition"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Thumbnails */}
        <div className="flex flex-col gap-4 shrink-0">
          {/* Thumbnail #1 — mirror of the main image */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setShowUploadOptions(0)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                setShowUploadOptions(0)
              }
            }}
            className={`relative w-16 h-16 md:w-[76px] md:h-[76px] rounded-xl overflow-hidden boty-transition flex items-center justify-center cursor-pointer ${
              selectedImageIndex === 0
                ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                : "opacity-60 hover:opacity-100"
            } ${images[0] ? "bg-transparent" : "bg-card border border-dashed border-border"}`}
          >
            {images[0] ? (
              <>
                {isVideoUrl(images[0]) ? (
                  <Image
                    src={getVideoPosterUrl(images[0])}
                    alt="Thumbnail 1 (main image)"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <Image
                    src={transformImageUrl(images[0], "w_150", "f_auto", "q_auto")}
                    alt="Thumbnail 1 (main image)"
                    fill
                    className="object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={(e) => handleDelete(0, e)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center text-white hover:bg-red-500 boty-transition cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : (
              <Plus className="w-5 h-5 text-muted-foreground" />
            )}
          </div>

          {/* Thumbnails #2-5 */}
          {additionalImages.map((img, index) => (
            <div
              key={index + 1}
              role="button"
              tabIndex={0}
              onClick={() => handleThumbnailClick(index + 1)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  handleThumbnailClick(index + 1)
                }
              }}
              className={`relative w-16 h-16 md:w-[76px] md:h-[76px] rounded-xl overflow-hidden boty-transition flex items-center justify-center cursor-pointer ${
                selectedImageIndex === index + 1
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "opacity-60 hover:opacity-100"
              } ${img ? "bg-transparent" : "bg-card border border-dashed border-border"}`}
            >
              {img ? (
                <>
                  <Image
                    src={transformImageUrl(img, "w_150", "f_auto", "q_auto")}
                    alt={`Thumbnail ${index + 2}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => handleDelete(index + 1, e)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center text-white hover:bg-red-500 boty-transition cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <Plus className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Multiple Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowMultipleUpload(true)}
          disabled={uploading}
          className="relative w-16 h-16 md:w-[76px] md:h-[76px] rounded-xl overflow-hidden boty-transition flex items-center justify-center bg-primary/10 hover:bg-primary/20 border-2 border-dashed border-primary/50 hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {uploading ? (
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <div className="flex flex-col items-center gap-0.5">
              <Plus className="w-4 h-4 text-primary" />
              <span className="text-[8px] text-primary font-medium leading-none">Add</span>
              <span className="text-[8px] text-primary font-medium leading-none">Multiple</span>
            </div>
          )}
        </button>
      </div>

      {uploadError && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
          {uploadError}
        </div>
      )}

      {showUploadOptions !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowUploadOptions(null)}>
          <div className="bg-card p-6 rounded-2xl boty-shadow max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-lg text-foreground mb-4">
              {showUploadOptions === 0 ? "Add Product Image" : "Add Image"}
            </h3>
            <p className="text-xs text-muted-foreground mb-4 -mt-2">
              {showUploadOptions === 0 ? "Slot 1 accepts product images only" : "Slots 2-5 accept images only"}
            </p>
            <div className="flex flex-col gap-3">
              {showUploadOptions === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const sourceIdx = showUploadOptions
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.capture = 'environment'
                    input.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files, sourceIdx, false)
                    input.click()
                    setShowUploadOptions(null)
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm tracking-wide boty-transition hover:bg-primary/90 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  Take Photo
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  pendingSourceIndex.current = showUploadOptions
                  setShowUploadOptions(null)
                  singleFileRef.current?.click()
                }}
                className="w-full inline-flex items-center justify-center gap-2 bg-background border border-border text-foreground px-6 py-3 rounded-full text-sm tracking-wide boty-transition hover:bg-foreground/5 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Choose from Gallery
              </button>
              <button
                type="button"
                onClick={() => setShowUploadOptions(null)}
                className="w-full inline-flex items-center justify-center gap-2 bg-transparent text-muted-foreground px-6 py-3 rounded-full text-sm tracking-wide boty-transition hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showMultipleUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowMultipleUpload(false)}>
          <div className="bg-card p-6 rounded-2xl boty-shadow max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-lg text-foreground mb-2">Add Multiple Images</h3>
            <p className="text-sm text-muted-foreground mb-4">Select up to 4 images to add as thumbnails (videos not supported for multiple upload)</p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = 'image/*'
                  input.multiple = true
                  input.capture = 'environment'
                  input.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files, null, true)
                  input.click()
                  setShowMultipleUpload(false)
                }}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm tracking-wide boty-transition hover:bg-primary/90 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                Take Photos
              </button>
              <button
                type="button"
                onClick={() => {
                  multipleFileRef.current?.click()
                  setShowMultipleUpload(false)
                }}
                className="w-full inline-flex items-center justify-center gap-2 bg-background border border-border text-foreground px-6 py-3 rounded-full text-sm tracking-wide boty-transition hover:bg-foreground/5 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Choose from Gallery
              </button>
              <button
                type="button"
                onClick={() => setShowMultipleUpload(false)}
                className="w-full inline-flex items-center justify-center gap-2 bg-transparent text-muted-foreground px-6 py-3 rounded-full text-sm tracking-wide boty-transition hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={singleFileRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={(e) => {
          const sourceIdx = pendingSourceIndex.current ?? 0
          handleFileUpload(e.target.files, sourceIdx, false)
          pendingSourceIndex.current = null
        }}
        className="hidden"
      />
      <input
        ref={multipleFileRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        onChange={(e) => handleFileUpload(e.target.files, null, true)}
        className="hidden"
      />
    </div>
  )
}
