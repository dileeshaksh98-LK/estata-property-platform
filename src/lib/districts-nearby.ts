/** Curated "nearby districts" used for suggestions when a search comes up empty.
 *  Approximate neighbour relationships — UX guidance, not survey data. */
export const NEARBY_DISTRICTS: Record<string, string[]> = {
  Colombo: ['Gampaha', 'Kalutara'],
  Gampaha: ['Colombo', 'Kurunegala', 'Puttalam', 'Kegalle'],
  Kalutara: ['Colombo', 'Galle', 'Ratnapura'],
  Kandy: ['Matale', 'Kegalle', 'Nuwara Eliya', 'Kurunegala'],
  Matale: ['Kandy', 'Kurunegala', 'Anuradhapura', 'Polonnaruwa'],
  'Nuwara Eliya': ['Kandy', 'Badulla', 'Ratnapura'],
  Galle: ['Kalutara', 'Matara', 'Ratnapura'],
  Matara: ['Galle', 'Hambantota', 'Ratnapura'],
  Hambantota: ['Matara', 'Moneragala', 'Ratnapura'],
  Jaffna: ['Kilinochchi'],
  Kilinochchi: ['Jaffna', 'Mullaitivu', 'Mannar'],
  Mannar: ['Kilinochchi', 'Vavuniya', 'Puttalam', 'Anuradhapura'],
  Vavuniya: ['Mannar', 'Mullaitivu', 'Anuradhapura', 'Trincomalee'],
  Mullaitivu: ['Kilinochchi', 'Vavuniya', 'Trincomalee'],
  Batticaloa: ['Ampara', 'Polonnaruwa', 'Trincomalee'],
  Ampara: ['Batticaloa', 'Moneragala', 'Badulla'],
  Trincomalee: ['Anuradhapura', 'Polonnaruwa', 'Vavuniya'],
  Kurunegala: ['Gampaha', 'Puttalam', 'Anuradhapura', 'Matale', 'Kandy', 'Kegalle'],
  Puttalam: ['Gampaha', 'Kurunegala', 'Anuradhapura', 'Mannar'],
  Anuradhapura: ['Puttalam', 'Kurunegala', 'Matale', 'Polonnaruwa', 'Trincomalee', 'Vavuniya'],
  Polonnaruwa: ['Anuradhapura', 'Matale', 'Batticaloa', 'Trincomalee'],
  Badulla: ['Nuwara Eliya', 'Moneragala', 'Ampara'],
  Moneragala: ['Badulla', 'Ampara', 'Hambantota', 'Ratnapura'],
  Ratnapura: ['Kegalle', 'Kalutara', 'Galle', 'Matara', 'Hambantota', 'Moneragala', 'Nuwara Eliya'],
  Kegalle: ['Colombo', 'Gampaha', 'Kurunegala', 'Kandy', 'Ratnapura'],
}

export function nearbyDistricts(district: string | undefined, max = 4): string[] {
  if (!district) return []
  return (NEARBY_DISTRICTS[district] ?? []).slice(0, max)
}
