import { z } from 'zod'

export const inquiryInput = z.object({
  property_id: z.string().uuid(),
  name: z.string().min(2, 'Please enter your name').max(120),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(40).optional().or(z.literal('')),
  message: z.string().min(8, 'Message is too short').max(2000),
  // Honeypot: real users never fill this; bots often do.
  company: z.string().max(0).optional().or(z.literal('')),
})

export type InquiryInput = z.infer<typeof inquiryInput>
