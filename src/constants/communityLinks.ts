// Community Links Configuration
// 
// TO UPDATE LINKS:
// 1. Replace the '#' placeholder URLs with actual community links
// 2. The links are used in:
//    - JoinUsButton component (main dropdown)
//    - Navbar component (mobile menu)
//    - Homepage CTA section
//
// Example:
// bookClubUrdu: {
//   url: 'https://whatsapp.com/channel/YOUR_URDU_BOOK_CLUB_LINK',
//   label: 'Book Club Urdu',
//   description: 'اردو کتابی کلب',
//   icon: '📚'
// }

export const COMMUNITY_LINKS = {
  bookClubUrdu: {
    url: '#', // Replace with actual link
    label: 'Book Club Urdu',
    description: 'اردو کتابی کلب',
    icon: '📚'
  },
  bookClubEnglish: {
    url: '#', // Replace with actual link
    label: 'Book Club English',
    description: 'English Reading Community',
    icon: '📖'
  },
  writersCommunity: {
    url: '#', // Replace with actual link
    label: "Writer's Community",
    description: 'Connect with fellow writers',
    icon: '✍️'
  }
} as const

// Helper function to get all community links as an array
export const getCommunityLinksArray = () => {
  return Object.values(COMMUNITY_LINKS)
} 