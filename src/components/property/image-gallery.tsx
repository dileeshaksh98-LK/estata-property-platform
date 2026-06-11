'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react'
import type { PropertyImage } from '@/types/property'

const FALLBACK = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1600&q=75'

export function ImageGallery({ images, title }: { images?: PropertyImage[]; title: string }) {
  const urls = images?.length ? images.map((i) => i.url) : [FALLBACK]
  const count = urls.length
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)

  const next = () => setActive((a) => (a + 1) % urls.length)
  const prev = () => setActive((a) => (a - 1 + urls.length) % urls.length)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      {/* Single photo: full-width hero. The mosaic needs side tiles to size its
          rows, so with <5 photos the hero keeps a fixed aspect ratio instead. */}
      {count === 1 ? (
        <button
          onClick={() => setOpen(true)}
          className="group relative block aspect-[4/3] w-full overflow-hidden rounded-3xl sm:aspect-[2/1]"
        >
          <Image src={urls[0]} alt={title} fill priority sizes="100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
          <span className="glass absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium">
            <Expand className="size-3.5" /> View photo
          </span>
        </button>
      ) : (
        <div className="grid gap-2 sm:grid-cols-4 sm:grid-rows-2">
          <button
            onClick={() => setOpen(true)}
            className={`group relative col-span-2 row-span-2 aspect-[4/3] overflow-hidden rounded-3xl ${count >= 5 ? 'sm:aspect-auto' : ''}`}
          >
            <Image src={urls[0]} alt={title} fill priority sizes="(max-width:640px) 100vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
            <span className="glass absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium">
              <Expand className="size-3.5" /> View all {urls.length}
            </span>
          </button>
          {urls.slice(1, 5).map((url, i) => (
            <button
              key={i}
              onClick={() => { setActive(i + 1); setOpen(true) }}
              className="group relative hidden aspect-[4/3] overflow-hidden rounded-2xl sm:block"
            >
              <Image src={url} alt={`${title} photo ${i + 2}`} fill sizes="25vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
            </button>
          ))}
        </div>
      )}

      {/* mobile thumbnails */}
      {urls.length > 1 && (
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto sm:hidden">
          {urls.map((url, i) => (
            <button key={i} onClick={() => { setActive(i); setOpen(true) }} className="relative size-16 shrink-0 overflow-hidden rounded-xl">
              <Image src={url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <button className="absolute right-4 top-4 z-10 grid size-11 place-items-center rounded-full glass text-white" aria-label="Close" onClick={() => setOpen(false)}>
              <X />
            </button>
            <button className="absolute left-3 z-10 grid size-12 place-items-center rounded-full glass text-white" aria-label="Previous" onClick={(e) => { e.stopPropagation(); prev() }}>
              <ChevronLeft />
            </button>
            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="relative h-[78vh] w-[92vw] max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={urls[active]} alt={title} fill sizes="92vw" className="object-contain" />
            </motion.div>
            <button className="absolute right-3 z-10 grid size-12 place-items-center rounded-full glass text-white" aria-label="Next" onClick={(e) => { e.stopPropagation(); next() }}>
              <ChevronRight />
            </button>
            <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full glass px-3 py-1 text-sm text-white">
              {active + 1} / {urls.length}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
