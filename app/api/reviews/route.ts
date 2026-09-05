import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { normalizeReview, normalizeReviewComment } from "@/components/sections/reviews-data"

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "12")
    const productId = searchParams.get("product_id")
    const featured = searchParams.get("featured")
    const all = searchParams.get("all") // Admin parameter to fetch all reviews

    const offset = (page - 1) * limit

    let query = supabase
      .from("reviews")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Only filter by is_approved for public requests
    if (all !== "true") {
      query = query.eq("is_approved", true)
    }

    if (productId) {
      query = query.eq("product_id", productId)
    }

    if (featured === "true") {
      query = query.eq("is_featured", true)
    }

    const { data: reviews, error, count } = await query

    if (error) {
      console.error("Error fetching reviews:", error)
      return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
    }

    // Fetch comments for each review
    if (reviews && reviews.length > 0) {
      const reviewIds = reviews.map((r) => r.id)
      const { data: comments, error: commentsError } = await supabase
        .from("review_comments")
        .select("*")
        .in("review_id", reviewIds)
        .order("created_at", { ascending: false })

      if (!commentsError && comments) {
        // Attach comments to their respective reviews
        reviews.forEach((review) => {
          review.comments = comments.filter((c) => c.review_id === review.id)
        })
      }
    }

    const normalizedReviews = (reviews || []).map((review) => normalizeReview(review))

    return NextResponse.json({
      reviews: normalizedReviews,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error("Error in GET /api/reviews:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    // Verify authentication (admin only for creating reviews)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
      is_approved = true,
      is_featured = false,
    } = body

    // Validate required fields
    if (!customer_name || !location || !rating || !comment || !product_name) {
      return NextResponse.json(
        { error: "Missing required fields: customer_name, location, rating, comment, product_name" },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    const { data: review, error } = await supabase
      .from("reviews")
      .insert({
        customer_name,
        customer_avatar: customer_avatar || null,
        location,
        rating,
        comment,
        product_name,
        product_id: product_id || null,
        product_image: product_image || null,
        media: media || [],
        is_approved,
        is_featured,
      })
      .select()
      .single()

    if (error) {
        console.error("Error creating review:", error)
      return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
    }

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/reviews:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}