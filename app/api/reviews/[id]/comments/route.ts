import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

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

    const { data: comments, error } = await supabase
      .from("review_comments")
      .select("*")
      .eq("review_id", id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching comments:", error)
      return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
    }

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Error in GET /api/reviews/[id]/comments:", error)
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
    const body = await request.json()
    const { comment_id } = body

    if (!comment_id) {
      return NextResponse.json({ error: "Missing comment_id" }, { status: 400 })
    }

    const { error } = await supabase
      .from("review_comments")
      .delete()
      .eq("id", comment_id)
      .eq("review_id", id)

    if (error) {
      console.error("Error deleting comment:", error)
      return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 })
    }

    return NextResponse.json({ message: "Comment deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/reviews/[id]/comments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
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
    const body = await request.json()

    const { author_name, author_avatar, text } = body

    // Validate required fields
    if (!author_name || !text) {
      return NextResponse.json(
        { error: "Missing required fields: author_name, text" },
        { status: 400 }
      )
    }

    // Verify the review exists
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("id")
      .eq("id", id)
      .single()

    if (reviewError || !review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    const { data: comment, error } = await supabase
      .from("review_comments")
      .insert({
        review_id: id,
        author_name,
        author_avatar: author_avatar || null,
        text,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating comment:", error)
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
    }

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/reviews/[id]/comments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}