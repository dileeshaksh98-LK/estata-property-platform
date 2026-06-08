import { z } from 'zod'

export const profileInput = z.object({
  full_name: z.string().min(2).max(120),
  phone: z.string().max(40).optional().or(z.literal('')),
  whatsapp: z.string().max(40).optional().or(z.literal('')),
  bio: z.string().max(500).optional().or(z.literal('')),
})
export type ProfileInput = z.infer<typeof profileInput>
