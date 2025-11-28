module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY || '',
  PEXELS_API_KEY: process.env.PEXELS_API_KEY || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5500',
  
  // Tag categories for validation
  TAG_CATEGORIES: {
    reference_type: ['full-body', 'portrait', 'expression', 'hands'],
    lighting: ['natural', 'studio', 'dramatic', 'backlit'],
    gender: ['male', 'female', 'neutral'],
    body_type: ['slim', 'average', 'muscular', 'plus-size'],
    action: ['standing', 'sitting', 'running', 'jumping', 'lying', 'stationary'],
    camera_angle: ['front', 'side', 'back', '3/4', 'high-angle', 'low-angle']
  },

  REPORT_REASONS: ['inappropriate', 'copyright', 'broken_link', 'wrong_tags', 'other']
};
