/**
 * Avatar utility functions for generating placeholder profile pictures
 * 
 * Generates consistent colors and initials for student avatars
 */

/**
 * Generate initials from a student name
 * @param {string} name - Student name
 * @param {string} fallback - Fallback text if name is empty
 * @returns {string} - Initials (up to 2 characters)
 */
export function getInitials(name, fallback = 'LT') {
  if (!name || typeof name !== 'string') return fallback
  
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  
  if (parts.length === 0) return fallback
  
  // Get first letter of first name and first letter of last name (if exists)
  const initials = parts
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase()
  
  return initials || fallback
}

/**
 * Generate a consistent color for a student based on their name/id
 * Uses a simple hash function to ensure same student always gets same color
 * @param {string} identifier - Student name or ID
 * @returns {string} - Hex color code
 */
export function getAvatarColor(identifier) {
  if (!identifier) identifier = 'default'
  
  // Color palette - soft, accessible colors
  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#6366f1', // indigo
    '#14b8a6', // teal
    '#a855f7', // purple
  ]
  
  // Simple hash function
  let hash = 0
  const str = String(identifier)
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // Ensure positive index
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

/**
 * Generate background gradient for avatar
 * @param {string} identifier - Student name or ID
 * @returns {string} - CSS gradient string
 */
export function getAvatarGradient(identifier) {
  const color = getAvatarColor(identifier)
  
  // Create a lighter version for gradient
  const hex = color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Lighten by 20%
  const lightR = Math.min(255, Math.round(r + (255 - r) * 0.2))
  const lightG = Math.min(255, Math.round(g + (255 - g) * 0.2))
  const lightB = Math.min(255, Math.round(b + (255 - b) * 0.2))
  
  const lightColor = `rgb(${lightR}, ${lightG}, ${lightB})`
  
  return `linear-gradient(135deg, ${color} 0%, ${lightColor} 100%)`
}
