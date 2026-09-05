"use client"

import { ChevronDown, ChevronUp } from "lucide-react"

interface AccordionFieldsProps {
  delivery: string
  expandedSection: string | null
  onToggle: (section: string) => void
  onChange: (field: string, value: string) => void
}

interface AccordionItemProps {
  label: string
  field: string
  value: string
  placeholder: string
  isOpen: boolean
  onToggle: () => void
  onChange: (field: string, value: string) => void
}

function AccordionItem({ label, field, value, placeholder, isOpen, onToggle, onChange }: AccordionItemProps) {
  return (
    <div className="border-b border-border/50">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="font-medium text-foreground">{label}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      <div className={`overflow-hidden boty-transition ${isOpen ? "max-h-96 pb-4" : "max-h-0"}`}>
        <textarea
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>
    </div>
  )
}

export default function AccordionFields({ delivery, expandedSection, onToggle, onChange }: AccordionFieldsProps) {
  const items = [
    { label: "Delivery & Returns", field: "delivery", value: delivery, placeholder: "Delivery and returns policy..." },
  ]

  return (
    <div className="border-t border-border/50 pt-4">
      {items.map((item) => (
        <AccordionItem
          key={item.field}
          label={item.label}
          field={item.field}
          value={item.value}
          placeholder={item.placeholder}
          isOpen={expandedSection === item.field}
          onToggle={() => onToggle(item.field)}
          onChange={(field, val) => onChange(field, val)}
        />
      ))}
    </div>
  )
}
