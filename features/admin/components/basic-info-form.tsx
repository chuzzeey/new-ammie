"use client"

import { ChevronDown } from "lucide-react"

interface BasicInfoFormProps {
  name: string
  description: string
  category: string
  onChange: (field: string, value: string) => void
}

export default function BasicInfoForm({ name, description, category, onChange }: BasicInfoFormProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Product Name */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Product Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="e.g. HD Transparent Wig"
          required
          className="min-h-11 w-full rounded-sm border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
        />
      </div>

      {/* Category */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Category</label>
        <div className="relative">
          <select
            value={category}
            onChange={(e) => onChange("category", e.target.value)}
            className="min-h-10 w-full cursor-pointer appearance-none rounded-sm border border-border bg-background px-3 py-2 pr-8 text-sm text-foreground focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
          >
            <option value="ready_to_ship_braided_wigs">Ready to ship braided wigs</option>
            <option value="preorder_wigs">Preorder wigs</option>
            <option value="human_hair_wigs">Human hair wigs</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="product-description" className="text-sm font-medium text-foreground mb-1.5 block">
          Description <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="product-description"
          value={description}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="Write a product description..."
          rows={5}
          className="w-full resize-y rounded-sm border border-border bg-background px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
        />
      </div>

    </div>
  )
}
