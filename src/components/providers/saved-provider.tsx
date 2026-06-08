'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createClient, supabaseEnabled } from '@/lib/supabase/client'

const KEY = 'estata:saved'

interface SavedContextValue {
  ids: Set<string>
  ready: boolean
  count: number
  isSaved: (id: string) => boolean
  toggle: (id: string) => void
}

const SavedContext = createContext<SavedContextValue | null>(null)

function readLocal(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? new Set<string>(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}
function writeLocal(ids: Set<string>) {
  try { localStorage.setItem(KEY, JSON.stringify([...ids])) } catch {}
}

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set())
  const [ready, setReady] = useState(false)
  const userId = useRef<string | null>(null)

  const loadForUser = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    userId.current = user?.id ?? null

    if (!user) {
      setIds(readLocal())
      setReady(true)
      return
    }

    // Migrate any guest favourites saved before sign-in.
    const local = readLocal()
    if (local.size) {
      await supabase.from('saved_properties').upsert(
        [...local].map((property_id) => ({ user_id: user.id, property_id })),
        { onConflict: 'user_id,property_id' },
      )
      writeLocal(new Set())
    }

    const { data } = await supabase.from('saved_properties').select('property_id').eq('user_id', user.id)
    setIds(new Set((data ?? []).map((r) => r.property_id)))
    setReady(true)
  }, [])

  useEffect(() => {
    if (!supabaseEnabled) { setIds(readLocal()); setReady(true); return }
    loadForUser()
    const supabase = createClient()
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') loadForUser()
    })
    return () => sub.subscription.unsubscribe()
  }, [loadForUser])

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = new Set(prev)
      const saving = !next.has(id)
      saving ? next.add(id) : next.delete(id)

      if (supabaseEnabled && userId.current) {
        const supabase = createClient()
        const uid = userId.current
        if (saving) {
          supabase.from('saved_properties').insert({ user_id: uid, property_id: id }).then(({ error }) => {
            if (error) setIds((c) => { const r = new Set(c); r.delete(id); return r })
          })
        } else {
          supabase.from('saved_properties').delete().eq('user_id', uid).eq('property_id', id).then(({ error }) => {
            if (error) setIds((c) => { const r = new Set(c); r.add(id); return r })
          })
        }
      } else {
        writeLocal(next)
      }
      return next
    })
  }, [])

  const value: SavedContextValue = {
    ids, ready, count: ids.size,
    isSaved: (id) => ids.has(id),
    toggle,
  }
  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>
}

export function useSavedProperties(): SavedContextValue {
  const ctx = useContext(SavedContext)
  if (!ctx) throw new Error('useSavedProperties must be used within <SavedProvider>')
  return ctx
}
