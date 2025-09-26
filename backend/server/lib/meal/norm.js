/**
 * Utility functions for meal analysis
 */

/**
 * Normalize a food name for searching and comparison
 * @param {string} str - The food name to normalize
 * @returns {string} - Normalized name (lowercase, no punctuation, single spaces)
 */
function foldName(str) {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .replace(/\s+/g, ' ')     // Replace multiple spaces with single space
    .trim();
}

/**
 * Find the best matching key from aliases map
 * @param {string} name - The name to match
 * @param {Object} aliasesMap - Map of canonical names to aliases arrays
 * @returns {string|null} - Best matching canonical name or null
 */
function aliasMatch(name, aliasesMap) {
  if (!name || !aliasesMap) return null;
  
  const normalizedName = foldName(name);
  
  // First try exact match
  if (aliasesMap[normalizedName]) {
    return normalizedName;
  }
  
  // Then try partial matches
  for (const [canonical, aliases] of Object.entries(aliasesMap)) {
    // Check if the name matches any alias
    if (aliases.some(alias => foldName(alias) === normalizedName)) {
      return canonical;
    }
    
    // Check if the name contains the canonical or vice versa
    if (normalizedName.includes(foldName(canonical)) || 
        foldName(canonical).includes(normalizedName)) {
      return canonical;
    }
  }
  
  return null;
}

/**
 * Calculate similarity between two strings (0-1)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity score (0-1)
 */
function stringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const s1 = foldName(str1);
  const s2 = foldName(str2);
  
  if (s1 === s2) return 1;
  
  // Simple Levenshtein-like similarity
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Edit distance
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Extract tags from a pipe-delimited string
 * @param {string} tagsString - Tags separated by pipes
 * @returns {string[]} - Array of tags
 */
function parseTags(tagsString) {
  if (!tagsString) return [];
  return tagsString.split('|').map(tag => tag.trim()).filter(tag => tag);
}

/**
 * Check if a string contains any of the given keywords
 * @param {string} text - Text to search in
 * @param {string[]} keywords - Keywords to search for
 * @returns {boolean} - True if any keyword is found
 */
function containsKeywords(text, keywords) {
  if (!text || !keywords || !Array.isArray(keywords)) return false;
  
  const normalizedText = foldName(text);
  return keywords.some(keyword => 
    normalizedText.includes(foldName(keyword))
  );
}

module.exports = {
  foldName,
  aliasMatch,
  stringSimilarity,
  levenshteinDistance,
  parseTags,
  containsKeywords
};// Force rebuild - Sat Sep 20 05:04:40 IST 2025
// Another force rebuild - Sat Sep 20 05:05:05 IST 2025
