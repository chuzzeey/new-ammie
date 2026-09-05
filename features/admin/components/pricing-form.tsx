"use client"

import { useState } from "react"
import { X, Plus } from "lucide-react"

interface PricingFormProps {
  price: string
  sizes: string[]
  onSizesChange: (sizes: string[]) => void
  onChange: (field: string, value: string) => void
}

const availableSizes = [
  "8", "10", "12", "14", "16", "18", "20", "22", "24", "26", "28", "30"
]

const formatUsdPrice = (value: number | string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)

export default function PricingForm({ price, sizes, onSizesChange, onChange }: PricingFormProps) {
  const [customSize, setCustomSize] = useState("")
  const [editingSize, setEditingSize] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")

  const handleSizeToggle = (size: string) => {
    if (sizes.includes(size)) {
      onSizesChange(sizes.filter(s => s !== size))
    } else {
      onSizesChange([...sizes, size])
    }
  }

  const handleAddCustomSize = () => {
    const trimmed = customSize.trim()
    if (trimmed && !sizes.includes(trimmed)) {
      onSizesChange([...sizes, trimmed])
    }
    setCustomSize("")
  }

  const handleRemoveSize = (size: string) => {
    onSizesChange(sizes.filter(s => s !== size))
  }

  // Editing a size renames it in place, keeping its original position in
  // the array, instead of forcing a remove-then-re-add (which would also
  // move it to the end of the list).
  const startEditingSize = (size: string) => {
    setEditingSize(size)
    setEditValue(size)
  }

  const cancelEditingSize = () => {
    setEditingSize(null)
    setEditValue("")
  }

  const commitEditingSize = () => {
    if (editingSize === null) return
    const trimmed = editValue.trim()

    // Empty input removes the size instead of leaving a blank chip.
    if (!trimmed) {
      onSizesChange(sizes.filter(s => s !== editingSize))
      cancelEditingSize()
      return
    }

    // No real change, or renaming to a value that already exists elsewhere
    // in the list: just exit edit mode without altering the array.
    if (trimmed === editingSize || sizes.includes(trimmed)) {
      cancelEditingSize()
      return
    }

    onSizesChange(sizes.map(s => (s === editingSize ? trimmed : s)))
    cancelEditingSize()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Price */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Price (USD)</label>
        <input
          type="text"
          inputMode="numeric"
          value={price ? Number(price).toLocaleString("en-US") : ""}
          onChange={(e) => onChange("price", e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="220.00"
          required
          className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

    

      {/* Selected Sizes */}
      {sizes.length > 0 && (
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Selected Sizes <span className="text-muted-foreground font-normal">(tap to edit)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {[...sizes].sort((a, b) => {
              const numA = parseInt(a)
              const numB = parseInt(b)
              if (isNaN(numA) || isNaN(numB)) return a.localeCompare(b)
              return numA - numB
            }).map((size) => (
              editingSize === size ? (
                <span
                  key={size}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                >
                  <input
                    type="text"
                    value={editValue}
                    autoFocus
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitEditingSize}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        commitEditingSize()
                      } else if (e.key === "Escape") {
                        e.preventDefault()
                        cancelEditingSize()
                      }
                    }}
                    className="w-16 bg-transparent border-b border-primary/40 focus:outline-none text-sm font-medium text-primary"
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleRemoveSize(size)}
                    className="w-4 h-4 rounded-full inline-flex items-center justify-center hover:bg-primary/20 boty-transition cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ) : (
                <span
                  key={size}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
                >
                  <button
                    type="button"
                    onClick={() => startEditingSize(size)}
                    className="hover:underline"
                  >
                    {size}"
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveSize(size)}
                    className="w-4 h-4 rounded-full inline-flex items-center justify-center hover:bg-primary/20 boty-transition cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )
            ))}
          </div>
        </div>
      )}

      {/* Quick Select */}
      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">
          Quick Select <span className="text-muted-foreground font-normal">(tap to toggle)</span>
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {availableSizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => handleSizeToggle(size)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium boty-transition boty-shadow ${
                sizes.includes(size)
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground hover:bg-card/80"
              }`}
            >
              {size}"
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
