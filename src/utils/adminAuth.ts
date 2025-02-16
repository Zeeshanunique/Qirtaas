export const ADMIN_EMAILS = [
  'admin@qirtaas.com',
  // Add other admin emails here
]

export const isAdmin = (email: string | null): boolean => {
  if (!email) return false
  try {
    return ADMIN_EMAILS.includes(email.toLowerCase())
  } catch {
    return false
  }
}