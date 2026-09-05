"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { SearchOverlay } from "@/components/layout/search-overlay"

interface SearchBlurContextType {
  isSearchOpen: boolean
  setSearchOpen: (open: boolean) => void
}

const SearchBlurContext = createContext<SearchBlurContextType>({
  isSearchOpen: false,
  setSearchOpen: () => {},
})

export function SearchBlurProvider({ children }: { children: ReactNode }) {
  const [isSearchOpen, setSearchOpen] = useState(false)

  return (
    <SearchBlurContext.Provider value={{ isSearchOpen, setSearchOpen }}>
      <div className={isSearchOpen ? "search-blur" : ""}>
        {children}
      </div>
      {/* SearchOverlay rendered outside the blurred wrapper so it stays sharp */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setSearchOpen(false)} />
    </SearchBlurContext.Provider>
  )
}

export function useSearchBlur() {
  return useContext(SearchBlurContext)
}
