const express = require('express');
const router = express.Router();
const FoodItem = require('../models/FoodItem');
const auth = require('../middleware/auth');
const { foldName } = require('../lib/meal/norm');
const axios = require('axios');

/**
 * Search food items by name (legacy GET endpoint)
 * GET /api/food/search?q=query&includeProvenance=true
 */
router.get('/search', auth, async (req, res) => {
  try {
    const { q, limit = 20, includeProvenance = false } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Search query is required',
        foods: []
      });
    }

    const searchQuery = foldName(q.trim());
    
    let foods = [];
    try {
      // Text search on nameFold (requires text index)
      foods = await FoodItem.find(
        { $text: { $search: searchQuery } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(parseInt(limit))
        .select('name portionGramsDefault portionUnits nutrients tags gi fodmap novaClass provenance qualityFlags');
    } catch (e) {
      // If text index is missing, fall back to fuzzy search path below
      console.warn('⚠️ Text search failed, falling back to fuzzy search:', e.message);
      foods = [];
    }

    // If no results from text search, try fuzzy matching
    if (foods.length === 0) {
      const fuzzyFoods = await FoodItem.find({
        $or: [
          { nameFold: { $regex: searchQuery, $options: 'i' } },
          { aliases: { $regex: searchQuery, $options: 'i' } }
        ]
      })
      .limit(parseInt(limit))
      .select('name portionGramsDefault nutrients tags gi fodmap novaClass provenance qualityFlags');
      
      return res.json({
        message: 'Foods found',
        foods: includeProvenance ? fuzzyFoods : fuzzyFoods.map(food => ({
          ...food.toObject(),
          provenance: {
            source: food.provenance?.source || food.source,
            measured: food.provenance?.measured || false,
            confidence: food.provenance?.confidence || 0.5,
            giOrigin: food.provenance?.giOrigin || 'unknown',
            novaOrigin: food.provenance?.novaOrigin || 'unknown',
            fodmapOrigin: food.provenance?.fodmapOrigin || 'unknown'
          }
        })),
        searchType: 'fuzzy'
      });
    }

    res.json({
      message: 'Foods found',
      foods: includeProvenance ? foods : foods.map(food => ({
        ...food.toObject(),
        provenance: {
          source: food.provenance?.source || food.source,
          measured: food.provenance?.measured || false,
          confidence: food.provenance?.confidence || 0.5,
          giOrigin: food.provenance?.giOrigin || 'unknown',
          novaOrigin: food.provenance?.novaOrigin || 'unknown',
          fodmapOrigin: food.provenance?.fodmapOrigin || 'unknown'
        }
      })),
      searchType: 'text'
    });

  } catch (error) {
    console.error('Error searching foods:', error);
    res.status(500).json({ 
      message: 'Error searching foods',
      error: error.message 
    });
  }
});

/**
 * Enhanced search with multiple sources (requires auth)
 * POST /api/food/search
 */
router.post('/search', auth, async (req, res) => {
  try {
    const { query, source = 'combined', limit = 20 } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Search query is required',
        results: []
      });
    }

    const searchQuery = query.trim();
    let results = [];

    // Search local database
    if (source === 'combined' || source === 'local') {
      const localResults = await searchLocalDatabase(searchQuery, limit);
      results.push(...localResults);
    }

    // Search USDA database
    if (source === 'combined' || source === 'usda') {
      try {
        console.log('🔍 Searching USDA database for:', searchQuery);
        const usdaResults = await searchUSDADatabase(searchQuery, limit);
        console.log('📊 USDA search returned:', usdaResults.length, 'results');
        if (usdaResults.length > 0) {
          console.log('USDA sample results:', usdaResults.slice(0, 2).map(r => ({ name: r.name, score: r.relevanceScore })));
        }
        results.push(...usdaResults);
      } catch (error) {
        console.error('USDA search error:', error);
        // Continue with other sources
      }
    }

    // Search Open Food Facts
    if (source === 'combined' || source === 'off') {
      try {
        console.log('🔍 Searching OpenFoodFacts for:', searchQuery);
        const offResults = await searchOpenFoodFacts(searchQuery, limit);
        console.log('📊 OpenFoodFacts search returned:', offResults.length, 'results');
        if (offResults.length > 0) {
          console.log('OpenFoodFacts sample results:', offResults.slice(0, 2).map(r => ({ name: r.name, score: r.relevanceScore })));
        }
        results.push(...offResults);
      } catch (error) {
        console.error('OpenFoodFacts search error:', error);
        // Continue with other sources
      }
    }

    // Deduplicate results based on name similarity and source
    results = deduplicateResults(results);
    
    // Filter out low-relevance results (minimum threshold)
    results = results.filter(result => (result.relevanceScore || 0) >= 0.4);
    
    // Sort results by relevance and limit
    results = results
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, limit);
    
    console.log('🎯 Final search results:', {
      total: results.length,
      bySource: results.reduce((acc, r) => {
        acc[r.source] = (acc[r.source] || 0) + 1;
        return acc;
      }, {}),
      topResults: results.slice(0, 3).map(r => ({ name: r.name, source: r.source, score: r.relevanceScore }))
    });

    res.json({
      message: 'Search completed',
      results,
      totalFound: results.length,
      sources: source === 'combined' ? ['local', 'usda', 'off'] : [source]
    });

  } catch (error) {
    console.error('Error in enhanced search:', error);
    res.status(500).json({ 
      message: 'Error searching foods',
      error: error.message 
    });
  }
});

/**
 * Test search endpoint (no auth required)
 * POST /api/food/test-search
 */
router.post('/test-search', async (req, res) => {
  try {
    const { query, source = 'combined', limit = 20 } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Search query is required',
        results: []
      });
    }

    const searchQuery = query.trim();
    let results = [];

    // Search local database
    if (source === 'combined' || source === 'local') {
      const localResults = await searchLocalDatabase(searchQuery, limit);
      results.push(...localResults);
    }

    // Search Open Food Facts
    if (source === 'combined' || source === 'off') {
      try {
        const offResults = await searchOpenFoodFacts(searchQuery, limit);
        results.push(...offResults);
      } catch (error) {
        console.error('Open Food Facts search error:', error);
        // Continue with other sources
      }
    }

    // Deduplicate results based on name similarity and source
    results = deduplicateResults(results);
    
    // Filter out low-relevance results (minimum threshold)
    results = results.filter(result => (result.relevanceScore || 0) >= 0.4);
    
    // Sort results by relevance and limit
    results = results
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, limit);

    res.json({
      message: 'Test search completed',
      results,
      totalFound: results.length,
      sources: source === 'combined' ? ['local', 'off'] : [source]
    });

  } catch (error) {
    console.error('Error in test search:', error);
    res.status(500).json({ 
      message: 'Error searching foods',
      error: error.message 
    });
  }
});

/**
 * Get food categories
 * GET /api/food/categories
 */
router.get('/categories', auth, async (req, res) => {
  try {
    const categories = await FoodItem.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      message: 'Categories found',
      categories
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      message: 'Error fetching categories',
      error: error.message 
    });
  }
});

/**
 * Get popular foods
 * GET /api/food/popular
 */
router.get('/popular', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // For now, return foods with high protein or fiber
    // In the future, this could be based on user preferences or usage
    const popularFoods = await FoodItem.find({
      $or: [
        { 'nutrients.protein': { $gte: 15 } },
        { 'nutrients.fiber': { $gte: 5 } },
        { tags: { $in: ['veg', 'protein'] } }
      ]
    })
    .sort({ 'nutrients.protein': -1 })
    .limit(parseInt(limit))
    .select('name portionGramsDefault portionUnits nutrients tags gi fodmap novaClass provenance qualityFlags');

    res.json({
      message: 'Popular foods found',
      foods: popularFoods
    });

  } catch (error) {
    console.error('Error fetching popular foods:', error);
    res.status(500).json({ 
      message: 'Error fetching popular foods',
      error: error.message 
    });
  }
});

/**
 * Get food suggestions based on current meal
 * GET /api/food/suggestions
 */
router.get('/suggestions', auth, async (req, res) => {
  try {
    const { currentFoods, mealType, limit = 5 } = req.query;
    
    let suggestions = [];
    
    if (currentFoods && currentFoods.length > 0) {
      // Analyze current foods and suggest complementary items
      const currentFoodIds = currentFoods.split(',').map(id => id.trim());
      
      // Get current foods to analyze
      const foods = await FoodItem.find({ _id: { $in: currentFoodIds } });
      
      // Check if we need protein, vegetables, or fiber
      let needsProtein = true;
      let needsVeg = true;
      let needsFiber = true;
      
      foods.forEach(food => {
        if (food.nutrients.protein >= 20) needsProtein = false;
        if (food.tags && food.tags.includes('veg')) needsVeg = false;
        if (food.nutrients.fiber >= 5) needsFiber = false;
      });
      
      // Build suggestion query
      const suggestionQuery = {};
      
      if (needsProtein) {
        suggestionQuery.$or = [
          { 'nutrients.protein': { $gte: 15 } },
          { tags: { $in: ['protein'] } }
        ];
      }
      
      if (needsVeg || needsFiber) {
        suggestionQuery.$or = suggestionQuery.$or || [];
        suggestionQuery.$or.push(
          { tags: { $in: ['veg', 'leafy'] } },
          { 'nutrients.fiber': { $gte: 3 } }
        );
      }
      
      if (Object.keys(suggestionQuery).length > 0) {
        suggestions = await FoodItem.find(suggestionQuery)
          .limit(parseInt(limit))
          .select('name portionGramsDefault portionUnits nutrients tags gi fodmap novaClass provenance qualityFlags');
      }
    }
    
    // If no specific suggestions, return some healthy defaults
    if (suggestions.length === 0) {
      suggestions = await FoodItem.find({
        tags: { $in: ['veg', 'protein'] },
        'nutrients.fiber': { $gte: 3 }
      })
      .limit(parseInt(limit))
      .select('name portionGramsDefault portionUnits nutrients tags gi fodmap novaClass provenance qualityFlags');
    }

    res.json({
      message: 'Food suggestions found',
      suggestions
    });

  } catch (error) {
    console.error('Error fetching food suggestions:', error);
    res.status(500).json({ 
      message: 'Error fetching food suggestions',
      error: error.message 
    });
  }
});

/**
 * Get food item by ID
 * GET /api/food/:id
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const food = await FoodItem.findById(id);
    
    if (!food) {
      return res.status(404).json({ 
        message: 'Food item not found' 
      });
    }

    res.json({
      message: 'Food item found',
      food
    });

  } catch (error) {
    console.error('Error fetching food item:', error);
    res.status(500).json({ 
      message: 'Error fetching food item',
      error: error.message 
    });
  }
});

// Helper function to search local database
async function searchLocalDatabase(query, limit) {
  const searchQuery = foldName(query);
  const searchWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
  
  // Try exact name match first (highest relevance)
  let foods = await FoodItem.find({
    nameFold: { $regex: `^${searchQuery}$`, $options: 'i' }
  })
    .limit(limit)
    .select('name portionGramsDefault portionUnits nutrients tags gi fodmap novaClass provenance qualityFlags');

  // If no exact matches, try partial name matches
  if (foods.length === 0) {
    foods = await FoodItem.find({
      nameFold: { $regex: searchQuery, $options: 'i' }
    })
      .limit(limit)
      .select('name portionGramsDefault portionUnits nutrients tags gi fodmap novaClass provenance qualityFlags');
  }

  // If still no results, try word-based search
  if (foods.length === 0) {
    const wordQueries = searchWords.map(word => ({ nameFold: { $regex: word, $options: 'i' } }));
    foods = await FoodItem.find({
      $or: wordQueries
    })
      .limit(limit * 2) // Get more results for better filtering
      .select('name portionGramsDefault portionUnits nutrients tags gi fodmap novaClass provenance qualityFlags');
  }

  // Calculate relevance scores and filter results
  const scoredFoods = foods.map(food => {
    const name = food.name.toLowerCase();
    let score = 0;
    
    // Exact match gets highest score
    if (name === query.toLowerCase()) {
      score = 1.0;
    }
    // Starts with query gets high score
    else if (name.startsWith(query.toLowerCase())) {
      score = 0.9;
    }
    // Contains query gets medium score
    else if (name.includes(query.toLowerCase())) {
      score = 0.8;
    }
    // Word-based matching gets lower score
    else {
      const matchingWords = searchWords.filter(word => name.includes(word));
      score = Math.min(0.7, matchingWords.length / searchWords.length * 0.7);
    }
    
    return {
      ...food.toObject(),
      source: 'IFCT', // Use IFCT instead of 'local' to match frontend expectations
      relevanceScore: score,
      provenance: {
        source: food.provenance?.source || food.source || 'Local Database',
        measured: food.provenance?.measured || false,
        confidence: food.provenance?.confidence || 0.5
      }
    };
  });

  // Filter out low-relevance results and sort by score
  return scoredFoods
    .filter(food => food.relevanceScore >= 0.3)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
}

// Helper function to search USDA database
async function searchUSDADatabase(query, limit) {
  try {
    // Check if USDA API key is configured
    const usdaApiKey = process.env.USDA_API_KEY;
    if (!usdaApiKey) {
      console.log('USDA API key not configured, skipping USDA search');
      return [];
    }

    const response = await axios.get(
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${usdaApiKey}&query=${encodeURIComponent(query)}&pageSize=${limit}`,
      { timeout: 10000 }
    );

    if (!response.data || !response.data.foods) {
      return [];
    }

    // Calculate relevance scores for USDA results
    const searchWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    const scoredFoods = response.data.foods.map(food => {
      const name = food.description.toLowerCase();
      let score = 0;
      
      // Exact name match gets highest score
      if (name === query.toLowerCase()) {
        score = 1.0;
      }
      // Starts with query gets high score
      else if (name.startsWith(query.toLowerCase())) {
        score = 0.9;
      }
      // Contains query gets medium score
      else if (name.includes(query.toLowerCase())) {
        score = 0.8;
      }
      // Word-based matching gets lower score
      else {
        const matchingWords = searchWords.filter(word => name.includes(word));
        score = Math.min(0.7, matchingWords.length / searchWords.length * 0.7);
      }
      
      // Boost score for foods with complete nutrition data
      if (food.foodNutrients && food.foodNutrients.length > 0) {
        score += 0.1;
      }
      
      return {
        id: `usda_${food.fdcId}`,
        name: food.description,
        brand: food.brandOwner || null,
        source: 'usda',
        relevanceScore: score,
        nutriments100g: {
          kcal: food.foodNutrients?.find(n => n.nutrientName === 'Energy')?.value || null,
          protein: food.foodNutrients?.find(n => n.nutrientName === 'Protein')?.value || null,
          fat: food.foodNutrients?.find(n => n.nutrientName === 'Total lipid (fat)')?.value || null,
          carbs: food.foodNutrients?.find(n => n.nutrientName === 'Carbohydrate, by difference')?.value || null,
          fiber: food.foodNutrients?.find(n => n.nutrientName === 'Fiber, total dietary')?.value || null,
          sugar: food.foodNutrients?.find(n => n.nutrientName === 'Sugars, total including NLEA')?.value || null
        },
        provenance: {
          source: 'USDA Database',
          measured: true,
          confidence: 0.9,
          lastUpdated: new Date().toISOString()
        }
      };
    });

    // Filter out low-relevance results and sort by score
    return scoredFoods
      .filter(food => food.relevanceScore >= 0.5)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  } catch (error) {
    console.error('USDA search error:', error);
    return [];
  }
}

// Helper function to deduplicate search results
function deduplicateResults(results) {
  const deduplicated = [];
  const seenKeys = new Set();
  
  // Sort by source priority and relevance score first
  const sortedResults = results.sort((a, b) => {
    // Priority: IFCT > usda > off (higher priority = lower number)
    const sourcePriority = { IFCT: 1, usda: 2, off: 3 };
    const aPriority = sourcePriority[a.source] || 4;
    const bPriority = sourcePriority[b.source] || 4;
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // If same source, sort by relevance score
    return (b.relevanceScore || 0) - (a.relevanceScore || 0);
  });
  
  for (const result of sortedResults) {
    // Generate a unique key for this result
    const dedupKey = generateDeduplicationKey(result);
    
    // Check if we've already seen this key
    if (!seenKeys.has(dedupKey)) {
      seenKeys.add(dedupKey);
      deduplicated.push(result);
    } else {
      // Check if this result is better than the existing one
      const existingIndex = deduplicated.findIndex(item => 
        generateDeduplicationKey(item) === dedupKey
      );
      
      if (existingIndex !== -1) {
        const existing = deduplicated[existingIndex];
        // Replace if this result has higher relevance or better source priority
        if (result.relevanceScore > existing.relevanceScore || 
            getSourcePriority(result.source) < getSourcePriority(existing.source)) {
          deduplicated[existingIndex] = result;
        }
      }
    }
  }
  
  return deduplicated;
}

// Helper function to get source priority (lower number = higher priority)
function getSourcePriority(source) {
  const priorities = { IFCT: 1, usda: 2, off: 3 };
  return priorities[source] || 4;
}

// Helper function to generate deduplication key
function generateDeduplicationKey(food) {
  // Normalize the name for comparison
  const normalizedName = food.name.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
  
  // For cross-source deduplication, use just the normalized name
  // This will help identify same foods from different sources
  return normalizedName;
}

// Helper function to check if two foods are similar enough to be considered duplicates
function areFoodsSimilar(food1, food2) {
  const name1 = food1.name.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  const name2 = food2.name.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  
  // Check for exact name match
  if (name1 === name2) return true;
  
  // Check for very similar names (e.g., "rice" vs "rice (cooked)")
  const words1 = name1.split(' ');
  const words2 = name2.split(' ');
  
  // If both have the same core words, they might be similar
  const coreWords1 = words1.filter(word => word.length > 2);
  const coreWords2 = words2.filter(word => word.length > 2);
  
  const commonWords = coreWords1.filter(word => coreWords2.includes(word));
  
  // If they share most core words, consider them similar
  return commonWords.length >= Math.min(coreWords1.length, coreWords2.length) * 0.7;
}

// Helper function to search Open Food Facts
async function searchOpenFoodFacts(query, limit) {
  try {
    const UA = "UntangleApp/1.0 (support@untangle.example)";
    const BASE = "https://world.openfoodfacts.org/cgi/search.pl";
    
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: 1,
      action: 'process',
      json: 1,
      page_size: limit * 2 // Get more results for better filtering
    });

    const response = await axios.get(`${BASE}?${params}`, {
      headers: { "User-Agent": UA },
      timeout: 10000
    });

    if (!response.data || !response.data.products) {
      return [];
    }

    // Calculate relevance scores and filter results
    const searchWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    const scoredProducts = response.data.products.map(product => {
      const name = (product.product_name || product.brands || 'Unknown').toLowerCase();
      let score = 0;
      
      // Exact name match gets highest score
      if (name === query.toLowerCase()) {
        score = 1.0;
      }
      // Starts with query gets high score
      else if (name.startsWith(query.toLowerCase())) {
        score = 0.9;
      }
      // Contains query gets medium score
      else if (name.includes(query.toLowerCase())) {
        score = 0.8;
      }
      // Word-based matching gets lower score
      else {
        const matchingWords = searchWords.filter(word => name.includes(word));
        score = Math.min(0.6, matchingWords.length / searchWords.length * 0.6);
      }
      
      // Boost score for products with complete nutrition data
      if (product.nutriments && product.nutriments['energy-kcal_100g']) {
        score += 0.1;
      }
      
      return {
        id: `off_${product.code}`,
        barcode: product.code,
        name: product.product_name || product.brands || 'Unknown',
        brand: product.brands || null,
        source: 'off',
        relevanceScore: score,
        nutriments100g: {
          kcal: product.nutriments?.['energy-kcal_100g'] || null,
          protein: product.nutriments?.proteins_100g || null,
          fat: product.nutriments?.fat_100g || null,
          carbs: product.nutriments?.carbohydrates_100g || null,
          fiber: product.nutriments?.fiber_100g || null,
          sugar: product.nutriments?.sugars_100g || null
        },
        novaClass: product.nova_group || null,
        tags: product.categories_tags?.map(tag => tag.replace('en:', '')) || [],
        provenance: {
          source: 'Open Food Facts',
          measured: false,
          confidence: 0.7,
          lastUpdated: product.last_modified_t ? new Date(product.last_modified_t * 1000).toISOString() : null
        }
      };
    });

    // Filter out low-relevance results and sort by score
    return scoredProducts
      .filter(product => product.relevanceScore >= 0.4)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  } catch (error) {
    console.error('Open Food Facts search error:', error);
    return [];
  }
}

/**
 * Create a custom food item
 * POST /api/food/custom
 */
router.post('/custom', auth, async (req, res) => {
  try {
    const {
      name,
      nutrients,
      portionGramsDefault = 100,
      portionUnits = [],
      tags = [],
      gi = null,
      fodmap = 'Unknown',
      novaClass = 1,
      aliases = []
    } = req.body;

    // Validate required fields
    if (!name || !nutrients) {
      return res.status(400).json({
        message: 'Name and nutrients are required'
      });
    }

    // Validate nutrients structure
    const requiredNutrients = ['kcal', 'protein', 'fat', 'carbs'];
    for (const nutrient of requiredNutrients) {
      if (nutrients[nutrient] === undefined || nutrients[nutrient] === null) {
        return res.status(400).json({
          message: `Missing required nutrient: ${nutrient}`
        });
      }
    }

    // Validate nutrient values are reasonable
    const nutrientValidation = {
      kcal: { min: 0, max: 1000, name: 'Calories' },
      protein: { min: 0, max: 100, name: 'Protein' },
      fat: { min: 0, max: 100, name: 'Fat' },
      carbs: { min: 0, max: 100, name: 'Carbohydrates' },
      fiber: { min: 0, max: 100, name: 'Fiber' },
      sugar: { min: 0, max: 100, name: 'Sugar' },
      vitaminC: { min: 0, max: 1000, name: 'Vitamin C' },
      zinc: { min: 0, max: 100, name: 'Zinc' },
      selenium: { min: 0, max: 1000, name: 'Selenium' },
      iron: { min: 0, max: 100, name: 'Iron' },
      omega3: { min: 0, max: 50, name: 'Omega-3' }
    };

    for (const [nutrient, value] of Object.entries(nutrients)) {
      if (value !== undefined && value !== null) {
        const validation = nutrientValidation[nutrient];
        if (validation) {
          const numValue = parseFloat(value);
          if (numValue < validation.min || numValue > validation.max) {
            return res.status(400).json({
              message: `${validation.name} must be between ${validation.min} and ${validation.max}`
            });
          }
        }
      }
    }

    // Validate portion size is reasonable
    if (portionGramsDefault < 1 || portionGramsDefault > 10000) {
      return res.status(400).json({
        message: 'Portion size must be between 1 and 10,000 grams'
      });
    }

    // Validate GI if provided
    if (gi !== null && gi !== undefined) {
      const giValue = parseFloat(gi);
      if (giValue < 0 || giValue > 110) {
        return res.status(400).json({
          message: 'Glycemic Index must be between 0 and 110'
        });
      }
    }

    // Validate NOVA class
    if (novaClass < 1 || novaClass > 4) {
      return res.status(400).json({
        message: 'NOVA classification must be between 1 and 4'
      });
    }

    // Create nameFold for search
    const nameFold = name.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Check if food already exists
    const existingFood = await FoodItem.findOne({
      nameFold: nameFold,
      source: 'CUSTOM'
    });

    if (existingFood) {
      return res.status(409).json({
        message: 'A food item with this name already exists',
        food: existingFood
      });
    }

    // Parse nutrients
    const parsedNutrients = {
      kcal: parseFloat(nutrients.kcal) || 0,
      protein: parseFloat(nutrients.protein) || 0,
      fat: parseFloat(nutrients.fat) || 0,
      carbs: parseFloat(nutrients.carbs) || 0,
      fiber: parseFloat(nutrients.fiber) || 0,
      sugar: parseFloat(nutrients.sugar) || 0,
      vitaminC: parseFloat(nutrients.vitaminC) || 0,
      zinc: parseFloat(nutrients.zinc) || 0,
      selenium: parseFloat(nutrients.selenium) || 0,
      iron: parseFloat(nutrients.iron) || 0,
      omega3: parseFloat(nutrients.omega3) || 0
    };

    // Generate quality flags
    const qualityFlags = [];
    
    // Check for unrealistic nutrient combinations
    const totalMacros = parsedNutrients.protein + parsedNutrients.fat + parsedNutrients.carbs;
    if (totalMacros > 100) {
      qualityFlags.push({
        flag: 'MACRO_OVER_100',
        level: 'warn',
        message: 'Total macronutrients exceed 100g per 100g (impossible)',
        value: totalMacros,
        threshold: 100
      });
    }

    // Check for very high calorie density
    if (parsedNutrients.kcal > 600) {
      qualityFlags.push({
        flag: 'HIGH_CALORIE_DENSITY',
        level: 'info',
        message: 'Very high calorie density (>600 kcal/100g)',
        value: parsedNutrients.kcal,
        threshold: 600
      });
    }

    // Check for missing fiber in carb-rich foods
    if (parsedNutrients.carbs > 20 && parsedNutrients.fiber === 0) {
      qualityFlags.push({
        flag: 'MISSING_FIBER',
        level: 'info',
        message: 'High carbohydrate content but no fiber reported',
        value: parsedNutrients.carbs,
        threshold: 20
      });
    }

    // Check for protein content vs NOVA class
    if (parsedNutrients.protein > 20 && novaClass === 4) {
      qualityFlags.push({
        flag: 'HIGH_PROTEIN_ULTRA_PROCESSED',
        level: 'warn',
        message: 'High protein content in ultra-processed food (unusual)',
        value: parsedNutrients.protein,
        threshold: 20
      });
    }

    // Create custom food item
    const customFood = new FoodItem({
      source: 'CUSTOM',
      name: name.trim(),
      nameFold: nameFold,
      aliases: aliases,
      portionGramsDefault: portionGramsDefault,
      portionUnits: portionUnits.length > 0 ? portionUnits : [{
        unit: 'piece',
        grams: portionGramsDefault,
        description: 'Standard piece',
        isDefault: true
      }],
      nutrients: parsedNutrients,
      gi: gi ? parseFloat(gi) : null,
      gl: null, // Will be calculated if needed
      fodmap: fodmap,
      novaClass: parseInt(novaClass) || 1,
      tags: tags,
      provenance: {
        source: 'User Created',
        origin: 'estimated',
        confidence: 0.5,
        lastVerifiedAt: new Date(),
        notes: 'Custom food item created by user'
      },
      qualityFlags: qualityFlags
    });

    // Save to database
    await customFood.save();

    console.log(`✅ Custom food created: ${name} by user ${req.user.userId}`);

    res.status(201).json({
      message: 'Custom food item created successfully',
      food: customFood
    });

  } catch (error) {
    console.error('Error creating custom food:', error);
    res.status(500).json({
      message: 'Error creating custom food item',
      error: error.message
    });
  }
});

/**
 * Get custom food items created by user
 * GET /api/food/custom
 */
router.get('/custom', auth, async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const customFoods = await FoodItem.find({ source: 'CUSTOM' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('name portionGramsDefault portionUnits nutrients tags gi fodmap novaClass provenance createdAt');

    const total = await FoodItem.countDocuments({ source: 'CUSTOM' });

    res.json({
      message: 'Custom foods retrieved',
      foods: customFoods,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching custom foods:', error);
    res.status(500).json({
      message: 'Error fetching custom foods',
      error: error.message
    });
  }
});

/**
 * Update a custom food item
 * PUT /api/food/custom/:id
 */
router.put('/custom/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find the custom food item
    const customFood = await FoodItem.findOne({
      _id: id,
      source: 'CUSTOM'
    });

    if (!customFood) {
      return res.status(404).json({
        message: 'Custom food item not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'nutrients', 'portionGramsDefault', 'portionUnits', 'tags', 'gi', 'fodmap', 'novaClass', 'aliases'];
    const updates = {};
    
    for (const field of allowedUpdates) {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    }

    // Update nameFold if name is being updated
    if (updates.name) {
      updates.nameFold = updates.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    // Update the food item
    const updatedFood = await FoodItem.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    console.log(`✅ Custom food updated: ${updatedFood.name} by user ${req.user.userId}`);

    res.json({
      message: 'Custom food item updated successfully',
      food: updatedFood
    });

  } catch (error) {
    console.error('Error updating custom food:', error);
    res.status(500).json({
      message: 'Error updating custom food item',
      error: error.message
    });
  }
});

/**
 * Delete a custom food item
 * DELETE /api/food/custom/:id
 */
router.delete('/custom/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the custom food item
    const customFood = await FoodItem.findOneAndDelete({
      _id: id,
      source: 'CUSTOM'
    });

    if (!customFood) {
      return res.status(404).json({
        message: 'Custom food item not found'
      });
    }

    console.log(`✅ Custom food deleted: ${customFood.name} by user ${req.user.userId}`);

    res.json({
      message: 'Custom food item deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting custom food:', error);
    res.status(500).json({
      message: 'Error deleting custom food item',
      error: error.message
    });
  }
});

module.exports = router;
