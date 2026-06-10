'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'success' | 'error' | 'info'
interface Toast { id: string; title: string; description?: string; variant: Variant }
interface ToastContextValue { toast: (t: { title: string; description?: string; variant?: Variant }) => void }

const ToastContext = createContext<ToastContextValue | null>(null)
const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info } as const

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const toast = useCallback(({ title, description, variant = 'info' }: { title: string; description?: string; variant?: Variant }) => {
    const id = crypto.randomUUID()
    setToasts((t) => [...t.slice(-3), { id, title, description, variant }])
    setTimeout(() => dismiss(id), 4500)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[120] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:px-6">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = ICONS[t.variant]
            return (
              <motion.div
                key={t.id} layout role="status"
                initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-lift"
              >
                <Icon className={cn('mt-0.5 size-5 shrink-0', t.variant === 'success' && 'text-primary', t.variant === 'error' && 'text-destructive', t.variant === 'info' && 'text-muted-foreground')} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{t.title}</p>
                  {t.description && <p className="mt-0.5 text-sm text-muted-foreground">{t.description}</p>}
                </div>
                <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="grid size-6 shrink-0 place-items-center rounded-full hover:bg-secondary"><X className="size-4" /></button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}
