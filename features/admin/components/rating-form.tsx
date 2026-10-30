"use client"

import { Star, ChevronDown } from "lucide-react"

interface RatingFormProps {
  rating: string
  onChange: (field: string, value: string) => void
}

export default function RatingForm({ rating, onChange }: RatingFormProps) {
  const ratingValue = parseInt(rating) || 0
  
  return (
    <div className="flex flex-col gap-4">
      {/* Rating Dropdown */}
      <div className="pt-4 pb-1">
        <label className="text-sm font-medium text-foreground mb-1.5 block">Rating</label>
        <div className="relative">
          <select
            value={rating}
            onChange={(e) => onChange("rating", e.target.value)}
            className="min-h-10 w-full cursor-pointer appearance-none rounded-sm border border-border bg-background px-3 py-2 pr-8 text-sm text-foreground focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
          >
            <option value="0">None</option>
            <option value="1">1 Star</option>
            <option value="2">2 Stars</option>
            <option value="3">3 Stars</option>
            <option value="4">4 Stars</option>
            <option value="5">5 Stars</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        </div>
        
        {/* Star Display */}
        {ratingValue > 0 && (
          <div className="flex items-center gap-1 mt-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < ratingValue
                    ? "fill-primary text-primary"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
            <span className="text-sm text-muted-foreground ml-2">
              ({ratingValue}/5)
            </span>
          </div>
        )}
      </div>

    </div>
  )
}
