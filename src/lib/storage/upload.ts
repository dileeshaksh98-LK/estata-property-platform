'use client'

import { createClient } from '@/lib/supabase/client'

export const BUCKET = 'property-images'
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

export interface UploadedImage {
  url: string
  storage_path: string
}

export function validateImage(file: File): string | null {
  if (!ACCEPTED.includes(file.type)) return 'Only JPG, PNG, WebP or AVIF images are allowed.'
  if (file.size > MAX_BYTES) return 'Each image must be 10 MB or smaller.'
  return null
}

function extOf(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]{1,5}$/.test(fromName)) return fromName
  return file.type.split('/')[1] ?? 'jpg'
}

/**
 * Uploads one image to Supabase Storage with true byte-level progress.
 * Uses a signed upload URL + XHR so we can report onProgress, then falls back
 * to the standard SDK upload if the signed-URL flow is unavailable.
 */
export async function uploadPropertyImage(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadedImage> {
  const err = validateImage(file)
  if (err) throw new Error(err)

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be signed in to upload images.')

  const path = `${user.id}/${crypto.randomUUID()}.${extOf(file)}`

  // Preferred path: signed URL + XHR for progress.
  const { data: signed } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path)
  if (signed?.signedUrl) {
    await xhrPut(absoluteUrl(signed.signedUrl), file, onProgress)
  } else {
    // Fallback: standard upload (progress jumps to 100% on completion).
    onProgress?.(15)
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600', upsert: false, contentType: file.type,
    })
    if (error) throw new Error(error.message)
    onProgress?.(100)
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: pub.publicUrl, storage_path: path }
}

function absoluteUrl(signedUrl: string): string {
  if (signedUrl.startsWith('http')) return signedUrl
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1${signedUrl.startsWith('/') ? '' : '/'}${signedUrl}`
}

function xhrPut(url: string, file: File, onProgress?: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url, true)
    xhr.setRequestHeader('content-type', file.type)
    xhr.setRequestHeader('x-upsert', 'false')
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)))
    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(file)
  })
}

/** Remove objects from storage (used when a user deletes a draft image). */
export async function removePropertyImages(paths: string[]): Promise<void> {
  if (!paths.length) return
  const supabase = createClient()
  await supabase.storage.from(BUCKET).remove(paths)
}
