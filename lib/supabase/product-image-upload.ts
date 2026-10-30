import { supabase } from "@/lib/supabase"

const PRODUCT_IMAGE_BUCKET = "product-images"
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

export async function uploadProductImageToSupabase(file: File): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Please upload a JPG, PNG, or WebP image.")
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Product images must be 10 MB or smaller.")
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError) {
    throw new Error(`Unable to verify your admin session: ${userError.message}`)
  }
  if (!user) {
    throw new Error("Sign in as an admin before uploading product images.")
  }

  const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1]
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`
  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Unable to upload product image: ${uploadError.message}`)
  }

  return supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl
}
