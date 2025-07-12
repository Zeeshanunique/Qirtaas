// Community Links Configuration
// 
// These links are used in:
//    - JoinUsButton component (main dropdown)
//    - Navbar component (mobile menu)
//    - Homepage CTA section
//
// Currently includes:
// 1. Book Club Urdu (Instagram)
// 2. Book Club English (Instagram)

export const COMMUNITY_LINKS = {
  bookClubUrdu: {
    url: 'https://ig.me/j/AbbQNDzbKVQoJ3wv/',
    label: 'Book Club Urdu',
    description: 'اردو کتابی کلب',
    icon: '📚'
  },
  bookClubEnglish: {
    url: 'https://ig.me/j/AbaVhidrfJXm9mx2/',
    label: 'Book Club English',
    description: 'English Reading Community',
    icon: '📖'
  }
} as const

// Helper function to get all community links as an array
export const getCommunityLinksArray = () => {
  return Object.values(COMMUNITY_LINKS)
} 