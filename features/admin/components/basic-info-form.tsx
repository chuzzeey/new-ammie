"use client"

import { ChevronDown, RefreshCw } from "lucide-react"

interface BasicInfoFormProps {
  name: string
  badge: string
  description: string
  category: string
  onChange: (field: string, value: string) => void
  onRegenerateDescription: () => void
}

export default function BasicInfoForm({ name, badge, description, category, onChange, onRegenerateDescription }: BasicInfoFormProps) {
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
          className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Category */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Category</label>
        <div className="relative">
          <select
            value={category}
            onChange={(e) => onChange("category", e.target.value)}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer pr-8"
          >
            <option value="ready_to_ship_braided_wigs">Ready to ship braided wigs</option>
            <option value="preorder_wigs">Preorder wigs</option>
            <option value="human_hair_wigs">Human hair wigs</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Description - Auto-generated from product name */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-foreground">Description</label>
          <button
            type="button"
            onClick={onRegenerateDescription}
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 boty-transition cursor-pointer"
            title="Regenerate description based on product name"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerate
          </button>
        </div>
        <div
          className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground/80 text-sm leading-relaxed"
          style={{ minHeight: '6rem' }}
        >
          {description || 'Enter a product name to generate a description...'}
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          Description is automatically generated from the product name. Click Regenerate for a different version.
        </p>
      </div>

      {/* Badge */}
      <div className="pb-1">
        <label className="text-sm font-medium text-foreground mb-1.5 block">Badge</label>
        <div className="relative">
          <select
            value={badge}
            onChange={(e) => onChange("badge", e.target.value)}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer pr-8"
          >
            <option value="">None</option>
            <option value="New">New</option>
            <option value="Bestseller">Bestseller</option>
            <option value="Popular">Popular</option>
            <option value="Hot Sale">Hot Sale</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        </div>
      </div>
    </div>
  )
}
