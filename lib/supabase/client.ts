import type { SupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import type { Product, ProductInsert } from './index'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Singleton Supabase browser client instance.
 * 
 * Uses @supabase/ssr createBrowserClient for proper Next.js App Router
 * cookie-based session handling. Cached on window to survive Fast Refresh.
 * 
 * @example
 * import { supabase } from '@/lib/supabase/client'
 * const { data } = await supabase.from('products').select('*')
 */

const GLOBAL_KEY = '__ammie_supabase_client__'

function getOrCreateBrowserClient(): SupabaseClient {
  if (typeof window !== 'undefined' && (window as any)[GLOBAL_KEY]) {
    return (window as any)[GLOBAL_KEY]
  }

  const client = createBrowserClient(supabaseUrl, supabaseAnonKey)

  if (typeof window !== 'undefined') {
    (window as any)[GLOBAL_KEY] = client
  }

  return client
}

/** Singleton browser client — use this everywhere in client components. */
export const supabase: SupabaseClient = getOrCreateBrowserClient()

// Re-export types for convenience
export type { Product, ProductInsert }

/**
 * Returns the singleton browser client.
 * Prefer importing `supabase` directly.
 */
export const createClientBrowser = (): SupabaseClient => supabase
