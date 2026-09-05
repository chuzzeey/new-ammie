import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { normalizeReview, normalizeReviewComment } from "@/components/sections/reviews-data"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { id } = await params

    console.log("Fetching review with ID:", id)

    // Fetch the review (no is_approved filter so admins can view any review)
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", id)
      .single()

    console.log("Review query result:", { review, error: reviewError })

    if (reviewError) {
      console.error("Error fetching review:", reviewError)
      return NextResponse.json({ 
        error: "Review not found",
        details: reviewError.message 
      }, { status: 404 })
    }

    if (!review) {
      console.log("No review found with ID:", id)
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    // Fetch comments for this review
    const { data: comments, error: commentsError } = await supabase
      .from("review_comments")
      .select("*")
      .eq("review_id", id)
      .order("created_at", { ascending: false })

    if (commentsError) {
      console.error("Error fetching comments:", commentsError)
    }

    return NextResponse.json({
      ...normalizeReview(review),
      comments: (comments || []).map((comment) => normalizeReviewComment(comment)),
    })
  } catch (error) {
    console.error("Error in GET /api/reviews/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Verify authentication (admin only)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const {
      customer_name,
      customer_avatar,
      location,
      rating,
      comment,
      product_name,
      product_id,
      product_image,
      media,
      is_approved,
      is_featured,
      likes,
    } = body

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    // Build update object with only provided fields
    const updateData: any = {}
    if (customer_name !== undefined) updateData.customer_name = customer_name
    if (customer_avatar !== undefined) updateData.customer_avatar = customer_avatar
    if (location !== undefined) updateData.location = location
    if (rating !== undefined) updateData.rating = rating
    if (comment !== undefined) updateData.comment = comment
    if (product_name !== undefined) updateData.product_name = product_name
    if (product_id !== undefined) updateData.product_id = product_id
    if (product_image !== undefined) updateData.product_image = product_image
    if (media !== undefined) updateData.media = media
    if (is_approved !== undefined) updateData.is_approved = is_approved
    if (is_featured !== undefined) updateData.is_featured = is_featured
    if (likes !== undefined) updateData.likes = likes

    const { data: review, error } = await supabase
      .from("reviews")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating review:", error)
      return NextResponse.json({ error: "Failed to update review" }, { status: 500 })
    }

    return NextResponse.json(review)
  } catch (error) {
    console.error("Error in PUT /api/reviews/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Verify authentication (admin only)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting review:", error)
      return NextResponse.json({ error: "Failed to delete review" }, { status: 500 })
    }

    return NextResponse.json({ message: "Review deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/reviews/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}